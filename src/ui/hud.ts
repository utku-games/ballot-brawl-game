/**
 * The in-match HUD: a portrait and health bar per fighter on each team, the timer, the controlled fighter's power and
 * guard bars with a "FINISHER READY" cue, and a centre banner for announcements.
 * It reads match state every frame and only touches the DOM when a displayed value actually changes.
 * Team colours match the floor rings of the 3D view.
 */
import { make, restartAnimation } from '@utku/engine';
import { faceUrl } from '../core/assets';
import { GUARD_MAX, METER_MAX, TICK_RATE } from '../fight/fightConstants';
import type { FighterState, MatchState } from '../fight/fightTypes';
import { isAlive } from '../fight/matchQueries';
import { fighterById } from '../roster/roster';
import { injectStyle } from './injectStyle';
import { HUD_CSS } from './hudStyles';
import { THEME } from './theme';

const LOW_HEALTH = 0.3;
const TEAM_CSS = [THEME.teamA, THEME.teamB, THEME.teamC, THEME.teamD] as const;
/** More rows than this in one column switch the HUD to its compact size. */
const COMPACT_ROWS = 2;

interface Row {
  root: HTMLElement;
  fill: HTMLElement;
  shown: number;
}

export class Hud {
  readonly root: HTMLElement;
  private readonly rows = new Map<string, Row>();
  private readonly timer: HTMLElement;
  private readonly meterFill: HTMLElement;
  private readonly guardFill: HTMLElement;
  private readonly ready: HTMLElement;
  private readonly banner: HTMLElement;
  private shownSeconds = -1;
  private readonly top: HTMLElement;

  constructor(parent: HTMLElement, state: Readonly<MatchState>) {
    injectStyle('hud', HUD_CSS);
    this.root = make('div', 'hud', null, parent);
    const top = make('div', 'hud-top', null, this.root);
    this.top = top;
    const left = make('div', 'hud-team', null, top);
    this.timer = make('div', 'hud-timer', '', top);
    const right = make('div', 'hud-team right', null, top);
    for (const f of state.fighters) this.rows.set(f.slotId, this.buildRow(f.team % 2 === 0 ? left : right, f));
    if (Math.max(left.childElementCount, right.childElementCount) > COMPACT_ROWS) this.root.classList.add('compact');
    const power = make('div', 'hud-power', null, this.root);
    this.ready = make('div', 'hud-ready', 'FINISHER READY', power);
    this.meterFill = make('div', 'hud-fill', null, make('div', 'hud-bar meter', null, power));
    this.guardFill = make('div', 'hud-fill', null, make('div', 'hud-bar guard', null, power));
    this.banner = make('div', 'hud-banner', '', this.root);
  }

  private buildRow(parent: HTMLElement, f: Readonly<FighterState>): Row {
    const def = fighterById(f.fighterId);
    const root = make('div', 'hud-row', null, parent);
    root.style.setProperty('--team', TEAM_CSS[f.team]);
    const img = make('img', 'hud-face', null, root);
    img.src = faceUrl(def.id);
    img.alt = def.name;
    const info = make('div', 'hud-info', null, root);
    make('div', 'hud-name', def.name, info);
    const fill = make('div', 'hud-fill', null, make('div', 'hud-bar', null, info));
    return { root, fill, shown: -1 };
  }

  /** Highlights the fighters players control; `players` maps slot id to the player's CSS colour. */
  setPlayers(players: ReadonlyMap<string, string>): void {
    for (const [slot, row] of this.rows) {
      const color = players.get(slot);
      row.root.classList.toggle('player', color !== undefined);
      if (color) row.root.style.setProperty('--player', color);
    }
  }

  update(state: Readonly<MatchState>, focusSlot: string | null): void {
    for (const f of state.fighters) {
      const row = this.rows.get(f.slotId);
      if (!row) continue;
      const fraction = f.health / f.profile.maxHealth;
      if (fraction !== row.shown) {
        row.shown = fraction;
        row.fill.style.transform = `scaleX(${fraction})`;
        row.fill.classList.toggle('low', fraction < LOW_HEALTH);
        row.root.classList.toggle('down', !isAlive(f));
      }
    }
    const seconds = Math.ceil(state.ticksLeft / TICK_RATE);
    if (seconds !== this.shownSeconds) {
      this.shownSeconds = seconds;
      this.timer.textContent = String(seconds);
    }
    const focus = state.fighters.find((f) => f.slotId === focusSlot);
    this.meterFill.style.transform = `scaleX(${focus ? focus.meter / METER_MAX : 0})`;
    this.guardFill.style.transform = `scaleX(${focus ? focus.guard / GUARD_MAX : 0})`;
    this.ready.classList.toggle('on', !!focus && focus.meter >= METER_MAX && isAlive(focus));
  }

  /** How far down the screen the health panels reach, in CSS pixels. */
  bottomEdge(): number {
    return this.top.getBoundingClientRect().bottom;
  }

  /** Shows a banner; `hold` keeps it on screen until the next call. */
  announce(text: string, small: boolean, hold: boolean): void {
    this.banner.textContent = text;
    this.banner.classList.toggle('small', small);
    this.banner.classList.toggle('hold', hold);
    if (!hold) restartAnimation(this.banner, 'show');
    else this.banner.classList.remove('show');
  }

  dispose(): void {
    this.root.remove();
  }
}
