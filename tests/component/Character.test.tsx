import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { create } from '@react-three/test-renderer';
import { Group } from 'three';
import { Character } from '@/app/components/Character';
import { CONTROLS_DEFAULTS, CHARACTER_DEFAULTS } from '@/app/constants';

const testScene = new Group();

// Mock velocity tracking - must be defined before jest.mock
const mockSetLinvel = jest.fn();
const mockSetRotation = jest.fn();

// Store mocks in a module-level object that can be accessed inside jest.mock
const mocks = { mockSetLinvel, mockSetRotation };

// Create a mock animation clip
const mockAnimationClip = {
  name: 'TestAnimation',
  duration: 1,
  tracks: [],
  blendMode: 0,
};

jest.mock('@react-three/drei', () => {
  const original = jest.requireActual('@react-three/drei');
  return {
    ...original,
    useFBX: jest.fn(() => ({
      scene: testScene,
      animations: [mockAnimationClip],
    })),
  };
});

jest.mock('../../app/utils', () => ({
  getAnimation: jest.fn((model) => model.animations[0]),
}));

jest.mock('three-stdlib', () => ({
  SkeletonUtils: {
    clone: jest.fn((obj) => obj),
  },
}));

jest.mock('@react-three/rapier', () => {
  const React = jest.requireActual('react');
  return {
    RigidBody: React.forwardRef(function MockRigidBody(
      {
        children,
        position,
      }: {
        children: React.ReactNode;
        position?: [number, number, number];
      },
      ref: React.Ref<unknown>,
    ) {
      React.useImperativeHandle(ref, () => ({
        setLinvel: mocks.mockSetLinvel,
        setRotation: mocks.mockSetRotation,
      }));
      return <group position={position}>{children}</group>;
    }),
    CapsuleCollider: () => null,
  };
});

describe('Character Component', () => {
  const mockKeys = CONTROLS_DEFAULTS.KEYBOARD;

  describe('Rendering', () => {
    it('should render a group element', async () => {
      const renderer = await create(<Character keys={mockKeys} />);
      const group = renderer.scene.children[0];
      expect(group).toBeDefined();
      expect(group?.type).toBe('Group');
    });

    it('should have correct initial position', async () => {
      const renderer = await create(<Character keys={mockKeys} />);
      const rigidBody = renderer.scene.children[0];
      expect(rigidBody.instance.position.x).toBe(-1);
      expect(rigidBody.instance.position.y).toBe(0.9);
      expect(rigidBody.instance.position.z).toBe(0);
    });

    it('should render with idle model', async () => {
      const renderer = await create(<Character keys={mockKeys} />);
      const group = renderer.scene.children[0];
      expect(group).toBeDefined();
    });

    it('should have correct scale', async () => {
      const renderer = await create(<Character keys={mockKeys} />);
      const rigidBody = renderer.scene.children[0];
      // RigidBody (group) -> inner group (modelRef) -> primitive
      const innerGroup = rigidBody.children[0];
      const primitive = innerGroup.children[0];
      // The primitive has scale prop applied directly (uniform scale)
      expect(primitive.instance.scale).toBe(0.01);
    });
  });

  describe('Movement', () => {
    beforeEach(() => {
      mockSetLinvel.mockClear();
      mockSetRotation.mockClear();
    });

    it('should set negative Z velocity when W key is pressed', async () => {
      const movingKeys = { ...mockKeys, w: true };
      const renderer = await create(<Character keys={movingKeys} />);
      await renderer.advanceFrames(1, 1 / 60);

      expect(mockSetLinvel).toHaveBeenCalledWith(
        { x: 0, y: 0, z: -CHARACTER_DEFAULTS.MOVE_SPEED },
        true,
      );
    });

    it('should set positive Z velocity when S key is pressed', async () => {
      const movingKeys = { ...mockKeys, s: true };
      const renderer = await create(<Character keys={movingKeys} />);
      await renderer.advanceFrames(1, 1 / 60);

      expect(mockSetLinvel).toHaveBeenCalledWith(
        { x: 0, y: 0, z: CHARACTER_DEFAULTS.MOVE_SPEED },
        true,
      );
    });

    it('should set negative X velocity when A key is pressed', async () => {
      const movingKeys = { ...mockKeys, a: true };
      const renderer = await create(<Character keys={movingKeys} />);
      await renderer.advanceFrames(1, 1 / 60);

      expect(mockSetLinvel).toHaveBeenCalledWith(
        { x: -CHARACTER_DEFAULTS.MOVE_SPEED, y: 0, z: 0 },
        true,
      );
    });

    it('should set positive X velocity when D key is pressed', async () => {
      const movingKeys = { ...mockKeys, d: true };
      const renderer = await create(<Character keys={movingKeys} />);
      await renderer.advanceFrames(1, 1 / 60);

      expect(mockSetLinvel).toHaveBeenCalledWith(
        { x: CHARACTER_DEFAULTS.MOVE_SPEED, y: 0, z: 0 },
        true,
      );
    });

    it('should set zero velocity when no movement keys are pressed', async () => {
      const renderer = await create(<Character keys={mockKeys} />);
      await renderer.advanceFrames(1, 1 / 60);

      expect(mockSetLinvel).toHaveBeenCalledWith({ x: 0, y: 0, z: 0 }, true);
    });

    it('should rotate character to face movement direction', async () => {
      const movingKeys = { ...mockKeys, w: true };
      const renderer = await create(<Character keys={movingKeys} />);
      await renderer.advanceFrames(1, 1 / 60);

      // W key should rotate to face -Z direction
      expect(mockSetRotation).toHaveBeenCalledWith(
        { x: 0, y: 1, z: 0, w: 0 },
        true,
      );
    });
  });
});
