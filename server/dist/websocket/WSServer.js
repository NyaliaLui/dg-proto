'use strict';
// ---------------------------------------------------------------------------
// WSServer.ts — WebSocket server wrapper.
//
// Responsibilities:
//  • Accept a single game client connection (one browser tab = one game).
//  • Route raw JSON messages to MessageHandler.
//  • Expose broadcast() so the decision loop can push messages back.
//  • Log connect / disconnect / errors with timestamps.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, '__esModule', { value: true });
exports.WSServer = void 0;
const ws_1 = require('ws');
const MessageHandler_1 = require('./MessageHandler');
const logger_1 = require('../utils/logger');
class WSServer {
  constructor(port, gsm, respawn) {
    /** We only support one active game client at a time. */
    this.activeClient = null;
    this.handler = new MessageHandler_1.MessageHandler(gsm, respawn);
    this.wss = new ws_1.WebSocketServer({ port });
    this.wss.on('listening', () => {
      logger_1.logger.info(`WSServer listening on ws://localhost:${port}`);
    });
    this.wss.on('connection', (ws, req) => {
      const clientAddr = req.socket.remoteAddress ?? 'unknown';
      logger_1.logger.info(`Client connected: ${clientAddr}`);
      // Disconnect any pre-existing client gracefully before accepting new one.
      if (
        this.activeClient &&
        this.activeClient.readyState === ws_1.WebSocket.OPEN
      ) {
        logger_1.logger.warn('Replacing existing client connection.');
        this.activeClient.close(1001, 'Replaced by new connection');
      }
      this.activeClient = ws;
      ws.on('message', (raw) => {
        try {
          const text = raw.toString('utf8');
          const msg = JSON.parse(text);
          this.handler.handle(msg);
        } catch (err) {
          logger_1.logger.error('Failed to parse client message', err);
        }
      });
      ws.on('close', (code, reason) => {
        logger_1.logger.info(
          `Client disconnected — code: ${code}, reason: ${reason.toString()}`,
        );
        if (this.activeClient === ws) {
          this.activeClient = null;
        }
      });
      ws.on('error', (err) => {
        logger_1.logger.error('WebSocket client error', err);
      });
    });
    this.wss.on('error', (err) => {
      logger_1.logger.error('WebSocketServer error', err);
    });
  }
  /**
   * Send a message to the active game client.
   * Silently drops the message if no client is connected or socket is not open.
   */
  broadcast(message) {
    if (
      !this.activeClient ||
      this.activeClient.readyState !== ws_1.WebSocket.OPEN
    ) {
      return;
    }
    try {
      this.activeClient.send(JSON.stringify(message));
    } catch (err) {
      logger_1.logger.error('Failed to send message to client', err);
    }
  }
  /** True when a game client is actively connected. */
  get hasClient() {
    return (
      this.activeClient !== null &&
      this.activeClient.readyState === ws_1.WebSocket.OPEN
    );
  }
  close() {
    this.wss.close();
  }
}
exports.WSServer = WSServer;
//# sourceMappingURL=WSServer.js.map
