import type { GameStateManager } from '../core/GameStateManager';
import type { RespawnManager } from '../respawn/RespawnManager';
export declare class MessageHandler {
  private readonly gsm;
  private readonly respawn;
  constructor(gsm: GameStateManager, respawn: RespawnManager);
  handle(raw: unknown): void;
  private handleGameState;
  private handleBarbarianDied;
}
//# sourceMappingURL=MessageHandler.d.ts.map
