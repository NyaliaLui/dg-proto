'use strict';
// ---------------------------------------------------------------------------
// ClaudeAI.ts — Async Claude AI integration for high-level squad strategy.
//
// Design:
//  • Runs every STRATEGY_INTERVAL_MS (2 s), self-throttled via timestamp.
//  • Non-blocking: the 100 ms decision loop is never awaited.
//  • On response, updates GameStateManager with the new SquadStrategy and
//    ClaudeInsights. The next decision tick picks these up automatically.
//  • On API error or malformed response, the existing strategy is preserved.
//  • API key is injected at construction — no environment variables needed.
// ---------------------------------------------------------------------------
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.ClaudeAI = void 0;
const sdk_1 = __importDefault(require('@anthropic-ai/sdk'));
const strategyPrompt_1 = require('./prompts/strategyPrompt');
const logger_1 = require('../utils/logger');
/** Time between successive Claude API calls (ms). */
const STRATEGY_INTERVAL_MS = 2000;
/** Valid strategy names the model may return. */
const VALID_STRATEGIES = new Set([
  'AGGRESSIVE',
  'COORDINATED',
  'BAIT_HEAVY',
  'DEFENSIVE',
  'OVERWHELM',
]);
class ClaudeAI {
  constructor(apiKey) {
    this.lastCallAt = 0;
    this.pending = false;
    this.client = new sdk_1.default({ apiKey });
  }
  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  /**
   * Called every 100 ms from the main decision loop.
   * Fires an async Claude call when the throttle interval has elapsed.
   * Never blocks — the promise is intentionally not awaited by the caller.
   */
  maybeRun(gsm) {
    const now = Date.now();
    if (this.pending || now - this.lastCallAt < STRATEGY_INTERVAL_MS) return;
    const state = gsm.getCurrentState();
    if (!state) return;
    this.pending = true;
    this.lastCallAt = now;
    const ctx = {
      state,
      playerAttackPattern: gsm.getPlayerAttackPattern(),
      playerHPTrend: gsm.getPlayerHPTrend(),
      currentStrategy: gsm.getSquadStrategy(),
    };
    this.callClaude(ctx, gsm).finally(() => {
      this.pending = false;
    });
  }
  // ---------------------------------------------------------------------------
  // Private: API call + parsing
  // ---------------------------------------------------------------------------
  async callClaude(ctx, gsm) {
    const userPrompt = (0, strategyPrompt_1.buildStrategyPrompt)(ctx);
    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 128,
        system: strategyPrompt_1.SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        logger_1.logger.warn('ClaudeAI: response contained no text block');
        return;
      }
      const parsed = this.parseResponse(textBlock.text);
      if (!parsed) return;
      const strategy = this.validateStrategy(parsed.strategy);
      if (!strategy) return;
      const insights = {
        claudeSuggestsBait: Boolean(parsed.claudeSuggestsBait),
        reasoning: parsed.reasoning ?? '',
        generatedAt: Date.now(),
      };
      gsm.setSquadStrategy(strategy);
      gsm.setClaudeInsights(insights);
      logger_1.logger.info(
        `ClaudeAI → strategy: ${strategy}, bait: ${insights.claudeSuggestsBait} — "${insights.reasoning}"`,
      );
    } catch (err) {
      // Network errors, rate limits, etc. Log and preserve current strategy.
      logger_1.logger.error('ClaudeAI API call failed', err);
    }
  }
  parseResponse(text) {
    // The model is instructed to return only JSON, but defensively strip any
    // accidental markdown fences that wrap the object.
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    try {
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch {
      logger_1.logger.warn(
        `ClaudeAI: failed to parse response JSON — raw: "${text.slice(0, 120)}"`,
      );
      return null;
    }
  }
  validateStrategy(raw) {
    const upper = raw?.toUpperCase?.();
    if (VALID_STRATEGIES.has(upper)) return upper;
    logger_1.logger.warn(
      `ClaudeAI: unknown strategy value "${raw}" — ignoring`,
    );
    return null;
  }
}
exports.ClaudeAI = ClaudeAI;
//# sourceMappingURL=ClaudeAI.js.map
