/**
 * Ballot Brawl's domain errors, built on the engine's GameError hierarchy.
 * Code throws these instead of generic Error so every failure carries a clear category.
 * Engine errors (PlatformError, UnknownEntityError, InvalidStateError) are re-exported for convenience.
 */
import { GameError } from '@utku/engine';

export { GameError, InvalidStateError, PlatformError, UnknownEntityError } from '@utku/engine';

/** A match setup is malformed (empty team, too many fighters, unknown fighter id). */
export class MatchSetupError extends GameError {}

/** Roster or credits data is inconsistent (duplicate id, missing face credit, bad stats). */
export class RosterDataError extends GameError {}

/** A fighter model cannot be assembled (a costume part names a rig point that does not exist). */
export class RigBuildError extends GameError {}

/** A network message is malformed, from another game version, or arrives when it makes no sense. */
export class NetProtocolError extends GameError {}
