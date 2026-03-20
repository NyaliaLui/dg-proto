'use strict';
// ---------------------------------------------------------------------------
// MessageHandler.ts — Routes raw parsed JSON from the client to the correct
// server module and validates message structure before processing.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, '__esModule', { value: true });
exports.MessageHandler = void 0;
const logger_1 = require('../utils/logger');
class MessageHandler {
  constructor(gsm, respawn) {
    this.gsm = gsm;
    this.respawn = respawn;
  }
  handle(raw) {
    if (!isClientMessage(raw)) {
      logger_1.logger.warn('Received unknown message type', raw);
      return;
    }
    switch (raw.type) {
      case 'GAME_STATE':
        this.handleGameState(raw);
        break;
      case 'BARBARIAN_DIED':
        this.handleBarbarianDied(raw);
        break;
    }
  }
  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  handleGameState(msg) {
    // GameStateManager enriches the barbarian states with spatial fields
    // (distanceToPlayer, angleToPlayer, isInPlayerFOV) then stores it.
    this.gsm.update(msg);
  }
  handleBarbarianDied(msg) {
    logger_1.logger.info(
      `Barbarian died: ${msg.barbarianId} — ${msg.aliveCount} still alive`,
    );
    this.respawn.onBarbarianDied(msg.barbarianId, msg.aliveCount);
  }
}
exports.MessageHandler = MessageHandler;
// ---------------------------------------------------------------------------
// Type guard — narrow `unknown` to a known client message union.
// ---------------------------------------------------------------------------
function isClientMessage(v) {
  if (typeof v !== 'object' || v === null) return false;
  const type = v['type'];
  return type === 'GAME_STATE' || type === 'BARBARIAN_DIED';
}
//# sourceMappingURL=MessageHandler.js.map
