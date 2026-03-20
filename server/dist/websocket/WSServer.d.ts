import type { ServerMessage } from '../types/decisions';
import type { GameStateManager } from '../core/GameStateManager';
import type { RespawnManager } from '../respawn/RespawnManager';
export declare class WSServer {
  private readonly wss;
  private readonly handler;
  /** We only support one active game client at a time. */
  private activeClient;
  constructor(port: number, gsm: GameStateManager, respawn: RespawnManager);
  /**
   * Send a message to the active game client.
   * Silently drops the message if no client is connected or socket is not open.
   */
  broadcast(message: ServerMessage): void;
  /** True when a game client is actively connected. */
  get hasClient(): boolean;
  close(): void;
}
//# sourceMappingURL=WSServer.d.ts.map
