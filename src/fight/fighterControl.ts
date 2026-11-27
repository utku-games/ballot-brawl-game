/**
 * Per-fighter rules of one tick: action timers, guard regeneration, facing, starting attacks or defending, and walking.
 * A fighter can only act from Idle or Defend; attacks and taunts lock facing and movement until they finish, and Punch or Kick become the kit's charge or evasive move when the stick points toward or away from the opponent.
 * The SPECIAL button fires the Finisher when the meter is full (emptying it), otherwise the fighter's signature special when it has recharged; moves with a dash (charge moves, evasive moves, the Rush finisher) carry the fighter along its facing.
 */
import {
  BASE_WALK_SPEED, DEFEND_SPEED_SCALE, GETUP_INVULNERABLE_TICKS, GUARD_MAX, GUARD_REGEN_PER_TICK, METER_MAX,
  TAUNT_METER, TAUNT_TICKS, TICK_SECONDS,
} from './fightConstants';
import { ActionKind, type FightEvent, type FighterInput, type FighterState } from './fightTypes';
import { nearestEnemy } from './matchQueries';
import { AttackButton, attackFor, stickDirection } from './moveKits';
import { isActiveFrame, isDashFrame, MoveKind, moveData, moveDuration, SPECIAL_COOLDOWN_TICKS } from './moves';

/** Facing changes only when the enemy is farther than this, so stacked bodies do not spin. */
const FACING_MIN_DISTANCE = 0.05;

function setIdle(f: FighterState): void {
  f.action = { kind: ActionKind.Idle, frame: 0, duration: 0, move: null, hitIds: [] };
}

/** Advances the current action and ends it when its duration runs out; a finished taunt earns meter. */
export function advanceTimers(f: FighterState, events: FightEvent[]): void {
  if (f.invulnerable > 0) f.invulnerable -= 1;
  if (f.specialCooldown > 0) f.specialCooldown -= 1;
  if (f.action.kind === ActionKind.KnockedOut) return;
  if (f.action.kind !== ActionKind.Defend) f.guard = Math.min(GUARD_MAX, f.guard + GUARD_REGEN_PER_TICK);
  f.action.frame += 1;
  if (f.action.duration <= 0 || f.action.frame < f.action.duration) return;
  const ended = f.action.kind;
  setIdle(f);
  if (ended === ActionKind.Taunt) {
    const before = f.meter;
    f.meter = Math.min(METER_MAX, f.meter + TAUNT_METER);
    events.push({ kind: 'tauntDone', fighter: f.slotId, meter: f.meter - before });
  }
  if (ended === ActionKind.Hitstun || ended === ActionKind.GuardBroken) f.combo = 0;
  if (ended === ActionKind.Knockdown) f.invulnerable = GETUP_INVULNERABLE_TICKS;
}

function canAct(f: Readonly<FighterState>): boolean {
  return f.action.kind === ActionKind.Idle || f.action.kind === ActionKind.Defend;
}

function faceNearestEnemy(f: FighterState, fighters: readonly FighterState[]): void {
  const enemy = nearestEnemy(fighters, f);
  if (!enemy) return;
  const dx = enemy.x - f.x;
  const dz = enemy.z - f.z;
  const dist = Math.hypot(dx, dz);
  if (dist < FACING_MIN_DISTANCE) return;
  f.facingX = dx / dist;
  f.facingZ = dz / dist;
}

function startAttack(f: FighterState, move: MoveKind, events: FightEvent[]): void {
  f.action = { kind: ActionKind.Attack, frame: 0, duration: moveDuration(moveData(move, f.profile.finisher)), move, hitIds: [] };
  events.push({ kind: 'swing', attacker: f.slotId, move });
}

/** The kit's move for this button and the stick's direction relative to the fighter's facing. */
function variant(f: Readonly<FighterState>, input: Readonly<FighterInput>, button: AttackButton): MoveKind {
  return attackFor(button, stickDirection(input.moveX, input.moveZ, f.facingX, f.facingZ), f.profile.kit);
}

function chooseAction(f: FighterState, input: Readonly<FighterInput>, events: FightEvent[]): void {
  if (input.special && f.meter >= METER_MAX) {
    f.meter = 0;
    startAttack(f, MoveKind.Finisher, events);
  } else if (input.special && f.specialCooldown === 0) {
    f.specialCooldown = SPECIAL_COOLDOWN_TICKS;
    startAttack(f, f.profile.special, events);
  } else if (input.punch) {
    startAttack(f, f.holding ? MoveKind.Item : variant(f, input, AttackButton.Punch), events);
  } else if (input.kick) {
    startAttack(f, variant(f, input, AttackButton.Kick), events);
  } else if (input.defend && f.guard > 0) {
    if (f.action.kind !== ActionKind.Defend) {
      f.action = { kind: ActionKind.Defend, frame: 0, duration: 0, move: null, hitIds: [] };
    }
  } else if (input.taunt) {
    f.action = { kind: ActionKind.Taunt, frame: 0, duration: TAUNT_TICKS, move: null, hitIds: [] };
    events.push({ kind: 'taunt', fighter: f.slotId });
  } else if (f.action.kind === ActionKind.Defend) {
    setIdle(f);
  }
}

function walk(f: FighterState, input: Readonly<FighterInput>): void {
  f.moving = false;
  if (!canAct(f)) return;
  const length = Math.hypot(input.moveX, input.moveZ);
  if (length <= 0) return;
  const scale = Math.min(1, length) / length;
  const defendScale = f.action.kind === ActionKind.Defend ? DEFEND_SPEED_SCALE : 1;
  const step = BASE_WALK_SPEED * f.profile.speedScale * defendScale * TICK_SECONDS;
  f.x += input.moveX * scale * step;
  f.z += input.moveZ * scale * step;
  f.moving = true;
}

/** Carries an attacking fighter along its facing while the move's dash is on (negative dashes back away). */
function dash(f: FighterState): void {
  if (f.action.kind !== ActionKind.Attack || f.action.move === null) return;
  const data = moveData(f.action.move, f.profile.finisher);
  if (!isDashFrame(data, f.action.frame)) return;
  f.x += f.facingX * data.dash * TICK_SECONDS;
  f.z += f.facingZ * data.dash * TICK_SECONDS;
}

/** Lets a multi-hit move (the Tornado) hit the same targets again every `rehitEvery` active ticks. */
function rehit(f: FighterState): void {
  if (f.action.kind !== ActionKind.Attack || f.action.move === null) return;
  const data = moveData(f.action.move, f.profile.finisher);
  if (data.rehitEvery <= 0 || !isActiveFrame(data, f.action.frame)) return;
  if ((f.action.frame - data.startup) % data.rehitEvery === 0) f.action.hitIds = [];
}

/** Applies one tick of input to a living fighter; mutates the (cloned) fighter. */
export function controlFighter(
  f: FighterState,
  input: Readonly<FighterInput>,
  fighters: readonly FighterState[],
  events: FightEvent[],
): void {
  if (canAct(f)) {
    faceNearestEnemy(f, fighters);
    chooseAction(f, input, events);
  }
  dash(f);
  rehit(f);
  walk(f, input);
}
