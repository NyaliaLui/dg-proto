'use strict';
// ---------------------------------------------------------------------------
// logger.ts — Minimal structured logger.
//
// Outputs timestamped, levelled lines to stdout/stderr.
// Replace with a proper library (pino, winston) if log volume grows.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, '__esModule', { value: true });
exports.logger = void 0;
function ts() {
  return new Date().toISOString();
}
function format(level, msg, extra) {
  const suffix =
    extra !== undefined ? ` ${JSON.stringify(extra, null, 0)}` : '';
  return `[${ts()}] [${level.toUpperCase().padEnd(5)}] ${msg}${suffix}`;
}
exports.logger = {
  debug(msg, extra) {
    if (process.env['LOG_LEVEL'] === 'debug') {
      process.stdout.write(format('debug', msg, extra) + '\n');
    }
  },
  info(msg, extra) {
    process.stdout.write(format('info', msg, extra) + '\n');
  },
  warn(msg, extra) {
    process.stderr.write(format('warn', msg, extra) + '\n');
  },
  error(msg, extra) {
    process.stderr.write(format('error', msg, extra) + '\n');
  },
};
//# sourceMappingURL=logger.js.map
