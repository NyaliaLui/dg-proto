import type { GameStateManager } from '../core/GameStateManager';
export declare class ClaudeAI {
  private readonly client;
  private lastCallAt;
  private pending;
  constructor(apiKey: string);
  /**
   * Called every 100 ms from the main decision loop.
   * Fires an async Claude call when the throttle interval has elapsed.
   * Never blocks — the promise is intentionally not awaited by the caller.
   */
  maybeRun(gsm: GameStateManager): void;
  private callClaude;
  private parseResponse;
  private validateStrategy;
}
//# sourceMappingURL=ClaudeAI.d.ts.map
