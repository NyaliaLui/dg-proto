'use strict';
// ---------------------------------------------------------------------------
// DecisionOrchestrator.ts — Main per-tick decision pipeline.
//
// Called every 100 ms by the main loop in index.ts.
// Execution order within each tick:
//
//   1. CoordinationLayer  — assign roles to all live barbarians.
//   2. BaitPunishSM       — state machine runs first; overrides UtilityAI for
//                           barbarians in an active bait/punish sequence.
//   3. UtilityAI          — scores all actions for barbarians not controlled
//                           by the bait state machine.
//   4. Role diff          — compute which roles changed since last tick so the
//                           client can update debug overlays without noise.
//   5. Emit DecisionsMessage.
//
// Lifecycle of BaitPunishSM instances:
//   • Created lazily when a barbarian is first seen.
//   • Removed when the barbarian disappears from the state (died / despawned).
//   • Force-reset when a barbarian respawns with the same slot but a new id.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, '__esModule', { value: true });
exports.DecisionOrchestrator = void 0;
const BaitPunishSM_1 = require('../ai/BaitPunishSM');
const UtilityAI_1 = require('../ai/UtilityAI');
const CoordinationLayer_1 = require('./CoordinationLayer');
const logger_1 = require('../utils/logger');
class DecisionOrchestrator {
  constructor() {
    /** One BaitPunishSM per barbarian id, keyed by id. */
    this.baitMachines = new Map();
    this.coordination = new CoordinationLayer_1.CoordinationLayer();
    this.utility = new UtilityAI_1.UtilityAI(this.coordination);
  }
  // ---------------------------------------------------------------------------
  // Public: run one decision tick
  // ---------------------------------------------------------------------------
  run(gsm) {
    const state = gsm.getCurrentState();
    if (!state || state.barbarians.length === 0) return null;
    const strategy = gsm.getSquadStrategy();
    const insights = gsm.getClaudeInsights();
    const claudeSuggestsBait = insights?.claudeSuggestsBait ?? false;
    // ── 1. Role assignment ──────────────────────────────────────────────────
    const roles = this.coordination.assignRoles(state, strategy);
    // Attach roles to barbarian objects so UtilityAI and BaitSM can read them.
    const barbariansWithRoles = state.barbarians.map((b) => ({
      ...b,
      role: roles[b.id] ?? null,
    }));
    // ── 2. Sync bait machine registry ──────────────────────────────────────
    this.syncBaitMachines(barbariansWithRoles.map((b) => b.id));
    // ── 3. Per-barbarian decision ───────────────────────────────────────────
    const decisions = [];
    for (const barb of barbariansWithRoles) {
      const role = roles[barb.id] ?? 'SUPPORT';
      const baitSM = this.baitMachines.get(barb.id);
      // Bait state machine has veto power over UtilityAI.
      const baitDecision = baitSM.tick(
        barb,
        state.player,
        role,
        claudeSuggestsBait,
      );
      if (baitDecision) {
        decisions.push({ barbarianId: barb.id, ...baitDecision });
        continue;
      }
      // Utility AI for everyone else.
      const utilityResult = this.utility.score(barb, state, role, strategy);
      decisions.push({
        barbarianId: barb.id,
        strategyTag: 'utility',
        ...utilityResult,
      });
    }
    // ── 4. Role diff ────────────────────────────────────────────────────────
    const lastRoles = gsm.getLastRoleMap();
    const roleUpdates = {};
    for (const [id, role] of Object.entries(roles)) {
      if (lastRoles[id] !== role) {
        roleUpdates[id] = role;
      }
    }
    if (Object.keys(roleUpdates).length > 0) {
      logger_1.logger.debug('Role updates:', roleUpdates);
    }
    // Persist roles for next tick's diff.
    gsm.setLastRoleMap(roles);
    // ── 5. Build and return message ─────────────────────────────────────────
    return {
      type: 'DECISIONS',
      tickId: state.tickId,
      decisions,
      roleUpdates,
    };
  }
  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------
  /**
   * Ensure every live barbarian id has a BaitPunishSM entry, and remove
   * entries for barbarians that are no longer in the world.
   */
  syncBaitMachines(liveIds) {
    const liveSet = new Set(liveIds);
    // Create missing entries.
    for (const id of liveIds) {
      if (!this.baitMachines.has(id)) {
        this.baitMachines.set(id, new BaitPunishSM_1.BaitPunishSM());
      }
    }
    // Remove stale entries.
    for (const id of this.baitMachines.keys()) {
      if (!liveSet.has(id)) {
        this.baitMachines.delete(id);
      }
    }
  }
}
exports.DecisionOrchestrator = DecisionOrchestrator;
//# sourceMappingURL=DecisionOrchestrator.js.map
