import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { create, ReactThreeTestRenderer } from '@react-three/test-renderer';
import { Group } from 'three';
import { act } from 'react';
import { Bot } from '@/app/components/Bot';

const testScene = new Group();

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
  getBoneList: jest.fn(() => []),
  makeBoneVertexMap: jest.fn(() => ({})),
  getBoneWorldPosition: jest.fn(() => null),
}));

jest.mock('three-stdlib', () => ({
  SkeletonUtils: {
    clone: jest.fn((obj) => obj),
  },
}));

jest.mock('three', () => {
  const originalThree = jest.requireActual('three');
  return {
    ...originalThree,
    SkeletonHelper: jest.fn().mockImplementation(() => ({
      visible: true,
      update: jest.fn(),
      updateMatrixWorld: jest.fn(),
      geometry: {
        attributes: {
          position: {
            getX: jest.fn(() => 0),
            getY: jest.fn(() => 0),
            getZ: jest.fn(() => 0),
          },
        },
      },
    })),
  };
});

let capturedHitHandlers: (() => void)[] = [];

jest.mock('@react-three/rapier', () => ({
  RigidBody: ({
    children,
    position,
  }: {
    children: React.ReactNode;
    position?: [number, number, number];
  }) => <group position={position}>{children}</group>,
  CapsuleCollider: ({
    onIntersectionEnter,
  }: {
    onIntersectionEnter?: () => void;
  }) => {
    if (onIntersectionEnter) {
      capturedHitHandlers.push(onIntersectionEnter);
    }
    return null;
  },
}));

describe('Bot Component', () => {
  beforeEach(() => {
    capturedHitHandlers = [];
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render a group element', async () => {
      const renderer = await create(<Bot />);
      const group = renderer.scene.children[0];
      expect(group).toBeDefined();
      expect(group?.type).toBe('Group');
    });

    it('should have correct initial position', async () => {
      const renderer = await create(<Bot />);
      const rigidBody = renderer.scene.children[0];
      expect(rigidBody.instance.position.x).toBe(1);
      expect(rigidBody.instance.position.y).toBe(0.9);
      expect(rigidBody.instance.position.z).toBe(0);
    });

    it('should render with idle model', async () => {
      const renderer = await create(<Bot />);
      const group = renderer.scene.children[0];
      expect(group).toBeDefined();
    });

    it('should have correct scale', async () => {
      const renderer = await create(<Bot />);
      const rigidBody = renderer.scene.children[0];
      // RigidBody (group) -> inner group (groupRef) -> primitive
      const innerGroup = rigidBody.children[0];
      const primitive = innerGroup.children[0];
      // The primitive has scale prop applied directly (uniform scale)
      expect(primitive.instance.scale).toBe(0.01);
    });
  });

  describe('Rotation', () => {
    it('should have initial rotation facing left', async () => {
      const renderer = await create(<Bot />);
      const rigidBody = renderer.scene.children[0];
      // The rotation is applied to the inner group via useEffect
      const innerGroup = rigidBody.children[0];
      expect(innerGroup.instance.rotation.y).toBe(-Math.PI / 2);
    });
  });

  describe('HP', () => {
    let renderer: ReactThreeTestRenderer;

    beforeEach(async () => {
      renderer = await create(<Bot />);
    });

    afterEach(async () => {
      await renderer.unmount();
    });

    it('should register hit handlers on colliders', async () => {
      // Both torso and head colliders should have hit handlers
      // Check for at least 2 handlers (from this render)
      expect(capturedHitHandlers.length).toBeGreaterThanOrEqual(2);
    });

    it('should log message when hit', async () => {
      const hitHandler = capturedHitHandlers[0];

      await act(async () => {
        hitHandler();
      });

      expect(console.log).toHaveBeenCalledWith('Bot was hit! HP: 2');
    });

    it('should decrease HP on each hit', async () => {
      const hitHandler = capturedHitHandlers[0];

      await act(async () => {
        hitHandler();
      });
      expect(console.log).toHaveBeenCalledWith('Bot was hit! HP: 2');

      await act(async () => {
        hitHandler();
      });
      expect(console.log).toHaveBeenCalledWith('Bot was hit! HP: 1');

      await act(async () => {
        hitHandler();
      });
      expect(console.log).toHaveBeenCalledWith('Bot was hit! HP: 0');
    });

    it('should allow HP to go negative', async () => {
      const hitHandler = capturedHitHandlers[0];

      // Hit 4 times (starting from 3 HP)
      await act(async () => {
        hitHandler();
        hitHandler();
        hitHandler();
        hitHandler();
      });

      expect(console.log).toHaveBeenLastCalledWith('Bot was hit! HP: -1');
    });
  });
});
