import type { BarbarianDecision } from '../types/decisions';
import type { BarbarianState, PlayerState } from '../types/gameState';
import type { BarbarianRole } from '../types/actions';
export declare class BaitPunishSM {
  private state;
  private baitStartedAt;
  private playerAttackedAt;
  /**
   * Run one tick of the state machine.
   *
   * Returns a BarbarianDecision if the SM is controlling this barbarian,
   * or null if UtilityAI should decide instead.
   */
  tick(
    barb: BarbarianState,
    player: PlayerState,
    role: BarbarianRole,
    claudeSuggestsBait: boolean,
  ): Omit<BarbarianDecision, 'barbarianId'> | null;
  /** Whether this SM is currently controlling the barbarian. */
  isActive(): boolean;
  /** Force-reset to INACTIVE (e.g., barbarian died and was respawned). */
  forceReset(): void;
  private reset;
  private decision;
}
//# sourceMappingURL=BaitPunishSM.d.ts.map
