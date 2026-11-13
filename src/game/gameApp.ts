/**
 * The game's top-level state machine: title, story (category, fighter, ladder, fights, ending), rivalry battles, brawl
 * and party setup and matches, pause and credits.
 * It owns the current screen or match session, the menu backdrop and the save data, and routes each frame to whichever is active.
 * Menus are navigable by mouse, touch, keyboard arrows and gamepad; touch fight buttons appear only during matches.
 */
import { createRng, MusicIntensity, type GameRenderer, type Rng } from '@utku/engine';
import type { GameAudio } from '../audio/gameAudio';
import { Sfx } from '../audio/sfxTable';
import { MENU_TRACK } from '../audio/songs';
import { PlayerId, type ControlFrame } from '../input/controlFrame';
import type { InputHub } from '../input/inputHub';
import { Difficulty } from '../ai/aiProfile';
import type { Rivalry } from '../rivalry/rivalryTypes';
import { BRAWL_ORDER, fighterById, fightersIn } from '../roster/roster';
import type { Category } from '../roster/rosterTypes';
import { buildLadder } from '../story/ladder';
import { recordFight, RunStatus, runScore, startRun, type StoryRun } from '../story/storyRun';
import { activateFocus, moveFocus } from '../ui/menuFocus';
import type { Screen } from '../ui/screenKit';
import { brawlSetupScreen } from '../ui/screens/brawlSetupScreen';
import { brawlResultScreen, creditsScreen, pauseScreen } from '../ui/screens/miscScreens';
import { partySetupScreen } from '../ui/screens/partyScreens';
import { trophiesScreen } from '../ui/screens/trophiesScreen';
import { categoryScreen, fighterPickScreen } from '../ui/screens/pickScreens';
import { rivalryListScreen, rivalryResultScreen, rivalrySideScreen } from '../ui/screens/rivalryScreens';
import { fightResultScreen, ladderScreen, storyEndScreen } from '../ui/screens/storyScreens';
import { titleScreen } from '../ui/screens/titleScreen';
import type { TouchControls } from '../ui/touchControls';
import { ARENA_FOR_CATEGORY, ArenaKind } from '../view/arenaKinds';
import { MenuBackdrop } from '../view/menuBackdrop';
import { defaultBrawl, defaultParty, RANDOM_FIGHTER, setFighter, toMatchPlan, type BrawlConfig } from './brawlConfig';
import type { MatchPlan } from './matchPlan';
import { MatchSession, type MatchOutcome } from './matchSession';
import { rivalryMatchPlan, type RivalrySide } from './rivalryPlan';
import { loadSave, recordBest, recordLeagueWin, recordRivalryWin, storeSave } from './saveData';
import { lockReason, newlyUnlocked } from './unlocks';
import { storyMatchPlan } from './storyPlan';

/** Stick deflection that counts as a menu step, and the delay before it repeats. */
const NAV_THRESHOLD = 0.6;
const NAV_REPEAT_SECONDS = 0.25;
/** Media query that is true on phones and tablets, where the keyboard hint is pointless. */
const COARSE_POINTER = '(pointer: coarse)';
/** Seconds after a menu appears during which confirm presses are ignored, so mashing at a knockout does not skip it. */
const MENU_CONFIRM_LOCK_SECONDS = 0.7;
const NAV_KEYS: Readonly<Record<string, number>> = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };
/** Keys that click the focused menu button (the key tracker suppresses their default action). */
const CONFIRM_KEYS: ReadonlySet<string> = new Set(['Enter', ' ']);
/** Range of random seeds for rivalry fights. */
const RIVALRY_SEED_RANGE = 1_000_000;

export interface AppDeps {
  container: HTMLElement;
  renderer: GameRenderer;
  hub: InputHub;
  audio: GameAudio;
  touch: TouchControls | null;
}

export class GameApp {
  private screen: Screen | null = null;
  private overlay: Screen | null = null;
  private session: MatchSession | null = null;
  private readonly backdrop: MenuBackdrop;
  private readonly save = loadSave();
  private readonly rng: Rng = createRng(Date.now());
  private brawl: BrawlConfig = defaultBrawl(ArenaKind.Parliament);
  private party: BrawlConfig = defaultParty(ArenaKind.Rooftop);
  private run: StoryRun | null = null;
  private rivalryDifficulty = Difficulty.Normal;
  private attempt = 0;
  private navCooldown = 0;
  private confirmLock = 0;

  constructor(private readonly deps: AppDeps) {
    this.backdrop = new MenuBackdrop(deps.renderer);
    deps.audio.muted = this.save.muted;
    this.setTouchVisible(false);
    window.addEventListener('keydown', (e) => this.onMenuKey(e));
  }

  start(): void {
    this.showTitle();
  }

  // ---- frame routing ----

  frame(dt: number): void {
    const frames = this.deps.hub.poll();
    if (this.session && !this.overlay) this.session.frame(dt, frames);
    else if (this.session) this.session.frame(0, frames);
    else this.backdrop.render(dt);
    this.padMenu(dt, frames[PlayerId.One]);
    this.deps.audio.update();
  }

  private menuRoot(): HTMLElement | null {
    return this.overlay?.root ?? (this.session ? null : this.screen?.root ?? null);
  }

  private onMenuKey(e: KeyboardEvent): void {
    const root = this.menuRoot();
    if (!root) return;
    if (CONFIRM_KEYS.has(e.key)) {
      if (!e.repeat && this.confirmLock === 0) activateFocus(root);
      return;
    }
    const step = NAV_KEYS[e.key];
    if (step === undefined) return;
    moveFocus(root, step);
    this.deps.audio.play(Sfx.MenuMove);
  }

  private padMenu(dt: number, f: Readonly<ControlFrame>): void {
    const root = this.menuRoot();
    if (!root) return;
    this.navCooldown = Math.max(0, this.navCooldown - dt);
    const axis = Math.abs(f.moveY) > Math.abs(f.moveX) ? -f.moveY : f.moveX;
    if (Math.abs(axis) >= NAV_THRESHOLD && this.navCooldown === 0) {
      moveFocus(root, Math.sign(axis));
      this.navCooldown = NAV_REPEAT_SECONDS;
    } else if (Math.abs(axis) < NAV_THRESHOLD) {
      this.navCooldown = 0;
    }
    this.confirmLock = Math.max(0, this.confirmLock - dt);
    if ((f.kick || f.punch) && this.confirmLock === 0) activateFocus(root);
  }

  // ---- screen plumbing ----

  private show(make: (parent: HTMLElement) => Screen, arena: ArenaKind | null): void {
    this.closeOverlay();
    this.screen?.root.remove();
    this.endSession();
    if (arena) this.backdrop.show(arena);
    this.screen = make(this.deps.container);
    this.confirmLock = MENU_CONFIRM_LOCK_SECONDS;
    this.deps.audio.play(Sfx.MenuSelect);
    this.deps.audio.playTrack(MENU_TRACK);
    this.deps.audio.setIntensity(MusicIntensity.Drive);
  }

  private showOverlay(make: (parent: HTMLElement) => Screen): void {
    this.closeOverlay();
    this.overlay = make(this.deps.container);
    this.confirmLock = MENU_CONFIRM_LOCK_SECONDS;
  }

  private closeOverlay(): void {
    this.overlay?.root.remove();
    this.overlay = null;
  }

  private endSession(): void {
    this.session?.dispose();
    this.session = null;
    this.setTouchVisible(false);
  }

  private setTouchVisible(visible: boolean): void {
    if (this.deps.touch) this.deps.touch.root.style.display = visible ? '' : 'none';
  }

  private startMatch(plan: MatchPlan, onEnd: (o: MatchOutcome) => void): void {
    this.closeOverlay();
    this.screen?.root.remove();
    this.screen = null;
    this.endSession();
    this.backdrop.hide();
    this.deps.hub.flush();
    this.setTouchVisible(true);
    const deps = { renderer: this.deps.renderer, hudParent: this.deps.container, audio: this.deps.audio, touch: this.deps.touch };
    this.session = new MatchSession(plan, deps, (o) => {
      this.setTouchVisible(false);
      onEnd(o);
    }, () => this.showOverlay((p) => pauseScreen(p, () => this.resume(), () => this.showTitle())));
  }

  private resume(): void {
    this.closeOverlay();
    this.deps.hub.flush();
    this.session?.resume();
  }

  // ---- title and credits ----

  private showTitle(): void {
    this.run = null;
    this.show((p) => titleScreen(p, {
      onStory: () => this.showCategories(),
      onRivalry: () => this.showRivalries(),
      onBrawl: () => this.showBrawlSetup(),
      onParty: () => this.showPartySetup(),
      onCredits: () => this.show((q) => creditsScreen(q, () => this.showTitle()), null),
      onTrophies: () => this.show((q) => trophiesScreen(q, this.save, () => this.showTitle()), ArenaKind.Museum),
      onToggleMute: () => this.toggleMute(),
    }, this.save.muted, window.matchMedia(COARSE_POINTER).matches), ArenaKind.Parliament);
  }

  private toggleMute(): boolean {
    this.save.muted = !this.save.muted;
    this.deps.audio.muted = this.save.muted;
    storeSave(this.save);
    return this.save.muted;
  }

  // ---- story ----

  private showCategories(): void {
    this.show((p) => categoryScreen(p, this.save.best, (c) => this.showStoryPick(c), () => this.showTitle()), ArenaKind.Museum);
  }

  private showStoryPick(category: Category): void {
    const fighters = fightersIn(category).filter((f) => !f.boss);
    this.show((p) => fighterPickScreen(p, { title: 'Pick your fighter', fighters, allowRandom: true, lockReason: () => null }, (id) => {
      const pick = id ?? fighters[Math.floor(this.rng() * fighters.length)].id;
      this.run = startRun(category, pick, buildLadder(category, pick, this.rng));
      this.attempt = 0;
      this.showLadder();
    }, () => this.showCategories()), ARENA_FOR_CATEGORY[category]);
  }

  private showLadder(): void {
    const run = this.run;
    if (!run) return this.showTitle();
    this.show((p) => ladderScreen(p, run, () => this.playStoryFight(), () => this.showTitle()), ARENA_FOR_CATEGORY[run.category]);
  }

  private playStoryFight(): void {
    const run = this.run;
    if (!run) return;
    this.startMatch(storyMatchPlan(run, this.attempt), (o) => this.onStoryFightEnd(o));
  }

  private onStoryFightEnd(outcome: MatchOutcome): void {
    const run = this.run;
    if (!run) return;
    const won = outcome.winner === 0;
    this.run = recordFight(run, { won, damageTaken: outcome.playerTeamDamage });
    this.attempt = won ? 0 : this.attempt + 1;
    const next = this.run;
    if (next.status !== RunStatus.Fighting) return this.showStoryEnd(next);
    this.showOverlay((p) => fightResultScreen(p, won, outcome.playerTeamDamage, next.continuesLeft,
      () => (won ? this.showLadder() : this.playStoryFight()), () => this.showTitle()));
  }

  private showStoryEnd(run: StoryRun): void {
    const won = run.status === RunStatus.Won;
    const unlocked = won ? newlyUnlocked(run.category, this.save) : null;
    if (won) recordLeagueWin(this.save, run.category);
    const newBest = recordBest(this.save, run.category, run.fighterId, runScore(run));
    if (won) this.deps.audio.play(Sfx.Victory);
    this.show((p) => storyEndScreen(p, run, won, newBest, unlocked?.name ?? null, () => this.showTitle()), ARENA_FOR_CATEGORY[run.category]);
  }

  // ---- rivalry battles ----

  private showRivalries(): void {
    this.show((p) => rivalryListScreen(p, this.save.rivalriesWon, (r) => this.showRivalrySides(r), () => this.showTitle()), ArenaKind.Studio);
  }

  private showRivalrySides(r: Rivalry): void {
    this.show((p) => rivalrySideScreen(p, r, this.rivalryDifficulty, {
      onFight: (side) => this.playRivalry(r, side),
      onDifficulty: (d) => {
        this.rivalryDifficulty = d;
        this.showRivalrySides(r);
      },
      onBack: () => this.showRivalries(),
    }), r.arena);
  }

  private playRivalry(r: Rivalry, side: RivalrySide): void {
    const plan = rivalryMatchPlan(r, side, this.rivalryDifficulty, Math.floor(this.rng() * RIVALRY_SEED_RANGE));
    this.startMatch(plan, (o) => {
      const won = o.winner === 0;
      if (won) {
        recordRivalryWin(this.save, r.id);
        this.deps.audio.play(Sfx.Victory);
      }
      this.showOverlay((p) => rivalryResultScreen(p, won, () => this.playRivalry(r, side), () => this.showRivalries(), () => this.showTitle()));
    });
  }

  // ---- brawl ----

  private showBrawlSetup(): void {
    this.show((p) => brawlSetupScreen(p, this.brawl, {
      onChange: (c) => {
        this.brawl = c;
        this.showBrawlSetup();
      },
      onPickFighter: (team, index) => this.pickBrawlFighter(team, index),
      onStart: () => this.startBrawl(toMatchPlan(this.brawl, this.rng)),
      onBack: () => this.showTitle(),
    }), this.brawl.arena);
  }

  private pickBrawlFighter(team: 0 | 1, index: number): void {
    const fighters = BRAWL_ORDER.flatMap((c) => fightersIn(c));
    this.show((p) => fighterPickScreen(p, { title: 'Choose a fighter', fighters, allowRandom: true, lockReason: (def) => lockReason(def, this.save) }, (id) => {
      this.brawl = setFighter(this.brawl, team, index, id ?? RANDOM_FIGHTER);
      this.showBrawlSetup();
    }, () => this.showBrawlSetup()), this.brawl.arena);
  }

  private startBrawl(plan: MatchPlan): void {
    this.startMatch(plan, (o) => {
      const title = o.winner === null ? 'DRAW!' : o.winner === 0 ? 'LEFT TEAM WINS!' : 'RIGHT TEAM WINS!';
      this.showOverlay((p) => brawlResultScreen(p, title, () => this.startBrawl({ ...plan, seed: plan.seed + 1 }),
        () => this.showBrawlSetup(), () => this.showTitle()));
    });
  }

  // ---- party ----

  private showPartySetup(): void {
    this.show((p) => partySetupScreen(p, this.party, {
      onChange: (c) => {
        this.party = c;
        this.showPartySetup();
      },
      onPickFighter: (side) => this.pickPartyFighter(side),
      onStart: () => this.startParty(toMatchPlan(this.party, this.rng)),
      onBack: () => this.showTitle(),
    }), this.party.arena);
  }

  private pickPartyFighter(side: number): void {
    const fighters = BRAWL_ORDER.flatMap((c) => fightersIn(c));
    this.show((p) => fighterPickScreen(p, { title: 'Choose a fighter', fighters, allowRandom: true, lockReason: (def) => lockReason(def, this.save) }, (id) => {
      this.party = setFighter(this.party, side, 0, id ?? RANDOM_FIGHTER);
      this.showPartySetup();
    }, () => this.showPartySetup()), this.party.arena);
  }

  private startParty(plan: MatchPlan): void {
    this.startMatch(plan, (o) => {
      const winner = o.winner === null ? null : o.final.fighters.find((f) => f.team === o.winner);
      const title = winner ? `${fighterById(winner.fighterId).name.toUpperCase()} WINS!` : 'DRAW!';
      this.showOverlay((p) => brawlResultScreen(p, title, () => this.startParty({ ...plan, seed: plan.seed + 1 }),
        () => this.showPartySetup(), () => this.showTitle()));
    });
  }
}
