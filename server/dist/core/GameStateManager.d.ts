import type { GameStateMessage } from '../types/decisions';
import type {
  ClaudeInsights,
  GameState,
  GameStateHistory,
} from '../types/gameState';
import type { BarbarianRole, SquadStrategy } from '../types/actions';
export declare class GameStateManager {
  private current;
  private history;
  private squadStrategy;
  private claudeInsights;
  private lastRoleMap;
  update(msg: GameStateMessage): void;
  getCurrentState(): GameState | null;
  getHistory(): GameStateHistory;
  getSquadStrategy(): SquadStrategy;
  setSquadStrategy(strategy: SquadStrategy): void;
  getClaudeInsights(): ClaudeInsights | null;
  setClaudeInsights(insights: ClaudeInsights): void;
  getLastRoleMap(): Record<string, BarbarianRole>;
  setLastRoleMap(roles: Record<string, BarbarianRole>): void;
  /**
   * Analyse how often the player was attacking in the recent history window.
   * Returns 'aggressive' when the player attacks more than AGGRESSION_THRESHOLD
   * of frames, 'reactive' when rarely, 'unknown' when history is too short.
   */
  getPlayerAttackPattern(): 'aggressive' | 'reactive' | 'unknown';
  /**
   * Returns the direction of player HP change over the recent window.
   * Useful for Claude to judge urgency.
   */
  getPlayerHPTrend(): 'falling' | 'stable' | 'rising';
  /**
   * Average number of live barbarians across the full history window.
   * Gives Claude context on whether reinforcements are urgently needed.
   */
  getAverageBarbariansAlive(): number;
  /**
   * Enrich a raw client message into a full GameState by:
   *  1. Computing spatial fields for each barbarian (distance, angle, FOV).
   *  2. Preserving the last known role assignment from lastRoleMap.
   */
  private enrich;
  private enrichBarbarian;
  private pushHistory;
}
//# sourceMappingURL=GameStateManager.d.ts.map
