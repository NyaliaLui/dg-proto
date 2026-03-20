/**
 * Every discrete action a Barbarian can execute in a given decision tick.
 * The client maps these to the matching animation + physics state in Barbarian.tsx.
 */
export type BarbarianAction =
  | 'IDLE'
  | 'CHASE'
  | 'RETREAT'
  | 'FLANK'
  | 'ATTACK'
  | 'KICK'
  | 'JUMP'
  | 'LEFT_BLOCK'
  | 'RIGHT_BLOCK'
  | 'DUCK'
  | 'BAIT'
  | 'PUNISH';
/**
 * Squad role assigned each tick by CoordinationLayer.
 * Roles influence UtilityAI score weights and BaitPunishSM activation.
 */
export type BarbarianRole = 'ATTACKER' | 'FLANKER' | 'BAITER' | 'SUPPORT';
/**
 * High-level squad strategy set by Claude AI every ~2 seconds.
 * Shapes how CoordinationLayer assigns roles and how UtilityAI weights scores.
 */
export type SquadStrategy =
  | 'AGGRESSIVE'
  | 'COORDINATED'
  | 'BAIT_HEAVY'
  | 'DEFENSIVE'
  | 'OVERWHELM';
//# sourceMappingURL=actions.d.ts.map
