import type { SpawnMessage } from '../types/decisions';
import type { EnvironmentState, Vector3 } from '../types/gameState';
export declare class RespawnManager {
  private queue;
  private counter;
  onBarbarianDied(barbarianId: string, aliveCount: number): void;
  tick(environment: EnvironmentState, playerPosition: Vector3): SpawnMessage[];
  private calculateDelay;
  /**
   * Choose the world edge farthest from the player so the barbarian has the
   * longest possible walk-in distance — more cinematic and gives the player
   * time to notice the reinforcement.
   */
  private getSpawnPosition;
  /**
   * The barbarian should walk toward the center/player side of the arena.
   * Returns 1 (move right) or -1 (move left).
   */
  private getEntryDirection;
}
//# sourceMappingURL=RespawnManager.d.ts.map
