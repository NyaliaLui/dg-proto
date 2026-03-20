import type { BarbarianDecision } from '../types/decisions';
import type { BarbarianState, GameState } from '../types/gameState';
import type { BarbarianRole, SquadStrategy } from '../types/actions';
import type { CoordinationLayer } from '../core/CoordinationLayer';
export declare class UtilityAI {
  private readonly coordination;
  constructor(coordination: CoordinationLayer);
  /**
   * Returns the single best action for this barbarian given its role,
   * the current squad strategy, and the full game state.
   */
  score(
    barb: BarbarianState,
    state: GameState,
    role: BarbarianRole,
    strategy: SquadStrategy,
  ): Omit<BarbarianDecision, 'barbarianId' | 'strategyTag'>;
  private scoreAttack;
  private scoreKick;
  private scoreChase;
  private scoreFlank;
  private scoreJump;
  private scoreBlock;
  private scoreDuck;
  private scoreRetreat;
  private scoreIdle;
}
//# sourceMappingURL=UtilityAI.d.ts.map
