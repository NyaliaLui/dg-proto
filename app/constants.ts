import { Vector3 } from 'three';

export const SHARED_DEFAULTS = {
  ANIMATIONS: {
    IDLE: '/models/IdleWithoutSkin.fbx',
    WALK: '/models/WalkingWithoutSkin.fbx',
  },
  MOVE_SPEED: 3,
  SCALE: 0.01,
  COLLIDERS: {
    BODY: { halfHeight: 0.4, radius: 0.5, position: [0, 0, 0] as const },
    TORSO: {
      halfHeight: 0.19,
      radius: 0.1,
      position: [0, 0.24, 0] as const,
      offset: { y: -0.85, z: -0.02 },
    },
    HEAD: {
      halfHeight: 0.05,
      radius: 0.1,
      position: [0, 0.7, 0] as const,
      offset: { y: -0.84, z: 0.02 },
    },
  },
};

export const PLAYER_DEFAULTS = {
  MODEL: '/models/Player/Paladin.fbx',
  ANIMATIONS: {
    NORMAL: '/models/Player/SlashWithoutSkin.fbx',
  },
  COLLIDERS: {
    SWORD: {
      innerRadius: 0.05,
      outerRadius: 1.4,
      halfAngle: Math.PI / 4,
      halfThickness: 0.05,
      segments: 10,
      position: [0, 1.6, 0] as const,
      offset: { y: -0.89, z: 0 },
    },
  },
};

export const CONTROLS_DEFAULTS = {
  // It takes approx 32 frames to execute attack animation
  MECHANICS_TIMEOUT: 320,
  KEYBOARD: {
    w: false,
    a: false,
    s: false,
    d: false,
    q: false,
    e: false,
    p: false,
    space: false,
  },
  ANALOG_STICK: {
    INIT_POS: { x: 0, y: 0 },
    STICK_RADIUS: 40,
    KNOB_RADIUS: 12,
    DEAD_ZONE: 0.1,
  },
};

export const BARBARIAN_DEFAULTS = {
  MODEL: '/models/Barbarian/XBot.fbx',
  ANIMATIONS: {
    NORMAL: '/models/Barbarian/PunchingWithoutSkin2.fbx',
  },
  COLLIDERS: {
    HAND: {
      halfHeight: 0.01,
      radius: 0.08,
      position: [0, 0.4, 0.75] as const,
      offset: { y: -0.89, z: 0 },
    },
  },
  enableBarbarianWalk: false,
  barbarianWalkDurationMS: 500,
  enableBarbarianAttack: false,
  attackSpeed: CONTROLS_DEFAULTS.MECHANICS_TIMEOUT,
};

export const GAME_DEFAULTS = {
  INITIAL_BARBARIAN_COUNT: 1,
  INITIAL_BARBARIAN_HP: 3,
  PLAYER_MAX_HP: 100,
};

export const DEFAULT_COLORS = {
  HP_RED: '#f05252',
};

export const ENVIRONMENT_DEFAULTS = {
  enableShadows: true,
  ambientLight: {
    intensity: 0.5,
  },
  directionalLight: {
    position: new Vector3(5, 5, 5),
    intensity: 1,
  },
  camera: {
    position: new Vector3(0, 2, 5),
    fov: 75,
  },
  orbitControls: {
    enablePan: true,
    enableZoom: true,
    enableRotate: true,
  },
  groundDim: 100,
  groundRotation: -Math.PI / 2,
  texture: {
    ground: '/textures/grass.jpg',
    sky: '/textures/sky.jpg',
  },
};

export const LEVA_THEMES = {
  mobile: {
    sizes: {
      rootWidth: '210px',
      controlWidth: '48px',
      titleBarHeight: '24px',
      rowHeight: '24px',
    },
    fontSizes: {
      root: '9px',
    },
  },
  tablet: {
    sizes: {
      rootWidth: '300px',
      controlWidth: '72px',
      titleBarHeight: '36px',
      rowHeight: '30px',
    },
    fontSizes: {
      root: '12px',
    },
  },
  desktop: {
    sizes: {
      rootWidth: '360px',
      controlWidth: '160px',
      titleBarHeight: '40px',
      rowHeight: '32px',
    },
    fontSizes: {
      root: '12px',
    },
  },
};
