import { Vector3 } from 'three';

export const CHARACTER_DEFAULTS = {
  MOVE_SPEED: 3,
  MODELS: {
    IDLE: '/models/Idle.fbx',
    WALK: '/models/Walking.fbx',
  },
};

export const CONTROLS_DEFAULTS = {
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
};
