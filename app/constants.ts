import { Vector3 } from 'three';

export const CHARACTER_DEFAULTS = {
  MOVE_SPEED: 3,
  MODELS: {
    XBOT: '/models/XBot.fbx',
  },
  ANIMATIONS: {
    IDLE: '/models/IdleWithoutSkin.fbx',
    WALK: '/models/WalkingWithoutSkin.fbx',
    NORMAL: '/models/PunchingWithoutSkin.fbx',
  },
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
    HAND: {
      halfHeight: 0.01,
      radius: 0.08,
      position: [0, 0.4, 0.75] as const,
      offset: { y: -0.89, z: 0 },
    },
  },
};

export const BOT_DEFAULTS = {
  walkEnabled: false,
  walkDurationMS: 500,
  attackEnabled: false,
  attackDurationMS: 1500,
};

export const CONTROLS_DEFAULTS = {
  MECHANICS_TIMEOUT: 1300,
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

export const GAME_DEFAULTS = {
  INITIAL_BOT_COUNT: 1,
  INITIAL_BOT_HP: 3,
  PLAYER_MAX_HP: 100,
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
