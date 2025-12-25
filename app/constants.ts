import { Vector3 } from 'three';

export const CHARACTER_DEFAULTS = {
  MOVE_SPEED: 3,
  MODELS: {
    IDLE: '/models/Idle.fbx',
    WALK: '/models/Walking.fbx',
    NORMAL: '/models/Jab.fbx',
  },
  SCALE: 0.01,
  COLLIDERS: {
    BODY: { halfHeight: 0.4, radius: 0.5, position: [0, 0, 0] as const },
    TORSO: { halfHeight: 0.17, radius: 0.15, position: [0, 0.24, 0] as const },
    HEAD: { halfHeight: 0.05, radius: 0.13, position: [0, 0.7, 0] as const },
  },
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
  physics: {
    debug: process.env.NEXT_PUBLIC_PHYSICS_DEBUG === 'true',
  },
};
