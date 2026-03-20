'use strict';
// ---------------------------------------------------------------------------
// index.ts — MCP Barbarian Decision Server entry point.
//
// Start:  npm run dev          (ts-node-dev, auto-restarts on file change)
//         npm run build && npm start  (compiled JS, production)
//
// Paste your Anthropic API key directly into CLAUDE_API_KEY below.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, '__esModule', { value: true });
const WSServer_1 = require('./websocket/WSServer');
const GameStateManager_1 = require('./core/GameStateManager');
const DecisionOrchestrator_1 = require('./core/DecisionOrchestrator');
const ClaudeAI_1 = require('./ai/ClaudeAI');
const RespawnManager_1 = require('./respawn/RespawnManager');
const logger_1 = require('./utils/logger');
// ─────────────────────────────────────────────────────────────────────────────
// Configuration — edit these values directly.
// ─────────────────────────────────────────────────────────────────────────────
/** Paste your Anthropic API key here. */
const CLAUDE_API_KEY = 'YOUR_API_KEY_HERE';
/** WebSocket port the game client connects to. */
const WS_PORT = 8765;
/** How often the decision loop runs (ms). Lower = more responsive AI. */
const DECISION_TICK_MS = 100;
// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
function main() {
  logger_1.logger.info('─'.repeat(60));
  logger_1.logger.info('MCP Barbarian Decision Server starting...');
  logger_1.logger.info(`  WS port     : ${WS_PORT}`);
  logger_1.logger.info(`  Tick rate   : ${DECISION_TICK_MS} ms`);
  logger_1.logger.info(`  Claude model: claude-opus-4-6`);
  logger_1.logger.info('─'.repeat(60));
  // Core modules
  const gsm = new GameStateManager_1.GameStateManager();
  const orchestrator = new DecisionOrchestrator_1.DecisionOrchestrator();
  const claude = new ClaudeAI_1.ClaudeAI(CLAUDE_API_KEY);
  const respawn = new RespawnManager_1.RespawnManager();
  // WebSocket server — starts accepting connections immediately.
  const wss = new WSServer_1.WSServer(WS_PORT, gsm, respawn);
  // ── Main decision loop ────────────────────────────────────────────────────
  const loopHandle = setInterval(() => {
    // No client connected or no state yet — skip this tick.
    if (!wss.hasClient) return;
    const state = gsm.getCurrentState();
    if (!state) return;
    // 1. Fire Claude async call if the 2 s interval has elapsed.
    //    Non-blocking — the promise is not awaited.
    claude.maybeRun(gsm);
    // 2. Run the synchronous decision pipeline (~0 ms).
    const decisionsMsg = orchestrator.run(gsm);
    if (decisionsMsg) {
      wss.broadcast(decisionsMsg);
    }
    // 3. Check respawn queue and emit any ready SPAWN messages.
    const spawns = respawn.tick(state.environment, state.player.position);
    for (const spawnMsg of spawns) {
      wss.broadcast(spawnMsg);
    }
  }, DECISION_TICK_MS);
  // ── Graceful shutdown ─────────────────────────────────────────────────────
  function shutdown(signal) {
    logger_1.logger.info(`Received ${signal} — shutting down...`);
    clearInterval(loopHandle);
    wss.close();
    process.exit(0);
  }
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  logger_1.logger.info('Server ready. Waiting for game client...');
}
main();
//# sourceMappingURL=index.js.map
