import type {
  BarbarianState,
  GameState,
  PlayerState,
} from '../types/gameState';
import type { BarbarianRole, SquadStrategy } from '../types/actions';
export declare class CoordinationLayer {
  /**
   * Derive a role for every live barbarian given the current world state and
   * the squad strategy set by Claude AI.
   *
   * Returns a map of barbarianId → BarbarianRole.
   */
  assignRoles(
    state: GameState,
    strategy: SquadStrategy,
  ): Record<string, BarbarianRole>;
  /**
   * The ideal target X position for a FLANKER.
   *
   * The flanker should approach from the player's blind side — the direction
   * opposite to where the player is currently facing. We add an offset so the
   * flanker ends up beside (not behind) the player.
   */
  getFlankTargetX(
    barb: BarbarianState,
    player: PlayerState,
    worldBounds: GameState['environment']['worldBounds'],
  ): number;
  /**
   * The movement direction a FLANKER should take to reach its target position.
   * Returns -1 (move left) or 1 (move right).
   */
  getFlankDirection(barb: BarbarianState, flankTargetX: number): number;
  /**
   * Returns true when the FLANKER has reached its target position within
   * a tolerance of 0.4 m (roughly one character width).
   */
  isFlankPositionReached(barb: BarbarianState, flankTargetX: number): boolean;
}
//# sourceMappingURL=CoordinationLayer.d.ts.map
