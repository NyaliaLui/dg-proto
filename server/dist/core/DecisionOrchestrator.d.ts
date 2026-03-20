import type { DecisionsMessage } from '../types/decisions';
import { GameStateManager } from './GameStateManager';
export declare class DecisionOrchestrator {
  private readonly coordination;
  private readonly utility;
  /** One BaitPunishSM per barbarian id, keyed by id. */
  private baitMachines;
  constructor();
  run(gsm: GameStateManager): DecisionsMessage | null;
  /**
   * Ensure every live barbarian id has a BaitPunishSM entry, and remove
   * entries for barbarians that are no longer in the world.
   */
  private syncBaitMachines;
}
//# sourceMappingURL=DecisionOrchestrator.d.ts.map
