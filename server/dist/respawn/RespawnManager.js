'use strict';
// ---------------------------------------------------------------------------
// RespawnManager.ts — Reinforcement spawn system.
//
// Design:
//  • When a barbarian dies, it enters a dead queue with a computed delay.
//  • Delay formula: max(3 s, 3 s + aliveCount × 3 s)
//      aliveCount = 0 → 3 s   (immediate pressure, squad wiped)
//      aliveCount = 1 → 6 s
//      aliveCount = 2 → 9 s
//      aliveCount = 3 → 12 s  (plenty of allies — reinforcements slower)
//  • tick() is called every 100 ms; it emits SpawnMessage[] for any entries
//    whose timer has fired.
//  • Spawn positions are always offscreen (beyond world boundary) and chosen
//    to maximise the walk-in distance from the player — cinematic entrance.
//  • Each spawn gets a fresh unique ID so it is treated as a new component
//    on the client.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, '__esModule', { value: true });
exports.RespawnManager = void 0;
const logger_1 = require('../utils/logger');
/** Minimum spawn delay regardless of alive count. */
const MIN_DELAY_MS = 3000;
/** Additional delay added per living barbarian at the time of death. */
const PER_ALIVE_DELAY_MS = 3000;
/** How many units beyond the world boundary the barbarian spawns. */
const SPAWN_MARGIN = 2;
class RespawnManager {
  constructor() {
    this.queue = [];
    this.counter = 0;
  }
  // ---------------------------------------------------------------------------
  // Called by MessageHandler when a BARBARIAN_DIED message arrives.
  // ---------------------------------------------------------------------------
  onBarbarianDied(barbarianId, aliveCount) {
    const delay = this.calculateDelay(aliveCount);
    const now = Date.now();
    const entry = {
      originalId: barbarianId,
      respawnId: `barbarian-r${++this.counter}`,
      diedAt: now,
      respawnAt: now + delay,
    };
    this.queue.push(entry);
    logger_1.logger.info(
      `RespawnManager: ${barbarianId} queued — will spawn as ${entry.respawnId} in ${delay / 1000} s (${aliveCount} alive)`,
    );
  }
  // ---------------------------------------------------------------------------
  // Called every 100 ms from the main decision loop.
  // Returns any SpawnMessages that are ready to be sent to the client.
  // ---------------------------------------------------------------------------
  tick(environment, playerPosition) {
    const now = Date.now();
    const ready = [];
    const remaining = [];
    for (const entry of this.queue) {
      if (now >= entry.respawnAt) {
        ready.push(entry);
      } else {
        remaining.push(entry);
      }
    }
    this.queue = remaining;
    return ready.map((entry) => {
      const spawnPos = this.getSpawnPosition(environment, playerPosition);
      const entryDir = this.getEntryDirection(spawnPos, playerPosition);
      logger_1.logger.info(
        `RespawnManager: spawning ${entry.respawnId} at x=${spawnPos.x.toFixed(1)} (entry dir ${entryDir > 0 ? '+X' : '-X'})`,
      );
      return {
        type: 'SPAWN',
        spawn: {
          barbarianId: entry.respawnId,
          spawnPosition: spawnPos,
          entryDirection: entryDir,
          delayMs: now - entry.diedAt,
        },
      };
    });
  }
  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  calculateDelay(aliveCount) {
    return Math.max(
      MIN_DELAY_MS,
      MIN_DELAY_MS + aliveCount * PER_ALIVE_DELAY_MS,
    );
  }
  /**
   * Choose the world edge farthest from the player so the barbarian has the
   * longest possible walk-in distance — more cinematic and gives the player
   * time to notice the reinforcement.
   */
  getSpawnPosition(env, playerPos) {
    const leftEdge = env.worldBounds.minX - SPAWN_MARGIN;
    const rightEdge = env.worldBounds.maxX + SPAWN_MARGIN;
    const distLeft = Math.abs(playerPos.x - leftEdge);
    const distRight = Math.abs(playerPos.x - rightEdge);
    const spawnX = distLeft > distRight ? leftEdge : rightEdge;
    return {
      x: spawnX,
      y: env.groundY + 0.9, // standard character body offset above ground
      z: 0, // game movement is primarily on the X axis
    };
  }
  /**
   * The barbarian should walk toward the center/player side of the arena.
   * Returns 1 (move right) or -1 (move left).
   */
  getEntryDirection(spawnPos, playerPos) {
    return Math.sign(playerPos.x - spawnPos.x) || 1;
  }
}
exports.RespawnManager = RespawnManager;
//# sourceMappingURL=RespawnManager.js.map
