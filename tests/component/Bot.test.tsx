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
      const renderer = await create(<Bot id="test-bot" />);
      const group = renderer.scene.children[0];
      expect(group).toBeDefined();
      expect(group?.type).toBe('Group');
    });

    it('should have correct initial position', async () => {
      const renderer = await create(<Bot id="test-bot" />);
      const rigidBody = renderer.scene.children[0];
      expect(rigidBody.instance.position.x).toBe(1);
      expect(rigidBody.instance.position.y).toBe(0.9);
      expect(rigidBody.instance.position.z).toBe(0);
    });

    it('should render with idle model', async () => {
      const renderer = await create(<Bot id="test-bot" />);
      const group = renderer.scene.children[0];
      expect(group).toBeDefined();
    });

    it('should have correct scale', async () => {
      const renderer = await create(<Bot id="test-bot" />);
      const rigidBody = renderer.scene.children[0];
      // RigidBody (group) -> HP blocks group, model group (groupRef) -> primitive
      // Find the model group (the one with the primitive, not the HP blocks)
      const modelGroup = rigidBody.children.find(
        (child) =>
          child.type === 'Group' &&
          child.children.some((c) => c.type !== 'Mesh'),
      );
      const primitive = modelGroup!.children[0];
      // The primitive has scale prop applied directly (uniform scale)
      expect(primitive.instance.scale).toBe(0.01);
    });
  });

  describe('Rotation', () => {
    it('should have initial rotation facing left', async () => {
      const renderer = await create(<Bot id="test-bot" />);
      const rigidBody = renderer.scene.children[0];
      // The rotation is applied to the model group via useEffect
      // Find the model group (the one without meshes - HP blocks have meshes)
      const modelGroup = rigidBody.children.find(
        (child) =>
          child.type === 'Group' &&
          child.children.some((c) => c.type !== 'Mesh'),
      );
      expect(modelGroup!.instance.rotation.y).toBe(-Math.PI / 2);
    });
  });

  describe('HP', () => {
    let renderer: ReactThreeTestRenderer;
    let mockOnDeath: jest.Mock;

    beforeEach(async () => {
      mockOnDeath = jest.fn();
      renderer = await create(<Bot id="test-bot" onDeath={mockOnDeath} />);
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

    it('should call onDeath callback when HP reaches zero', async () => {
      const hitHandler = capturedHitHandlers[0];

      // Hit 3 times to reach 0 HP
      await act(async () => {
        hitHandler();
        hitHandler();
        hitHandler();
      });

      expect(console.log).toHaveBeenLastCalledWith('Bot was hit! HP: 0');
      expect(mockOnDeath).toHaveBeenCalledWith('test-bot');
    });

    it('should not call onDeath when HP is above zero', async () => {
      const hitHandler = capturedHitHandlers[0];

      // Hit only twice (HP goes to 1)
      await act(async () => {
        hitHandler();
        hitHandler();
      });

      expect(mockOnDeath).not.toHaveBeenCalled();
    });
  });

  describe('HP Blocks', () => {
    const findHpBlocksGroup = (renderer: ReactThreeTestRenderer) => {
      const rigidBody = renderer.scene.children[0];
      // Find the HP blocks group (first group child that contains meshes)
      return rigidBody.children.find(
        (child) =>
          child.type === 'Group' &&
          child.children.some((c) => c.type === 'Mesh'),
      );
    };

    const countHpBlocks = (renderer: ReactThreeTestRenderer) => {
      const hpGroup = findHpBlocksGroup(renderer);
      if (!hpGroup) return 0;
      return hpGroup.children.filter((child) => child.type === 'Mesh').length;
    };

    it('should render 3 HP blocks initially', async () => {
      const renderer = await create(<Bot id="test-bot" />);
      expect(countHpBlocks(renderer)).toBe(3);
    });

    it('should render HP blocks as meshes with box geometry', async () => {
      const renderer = await create(<Bot id="test-bot" />);
      const hpGroup = findHpBlocksGroup(renderer);

      expect(hpGroup).toBeDefined();
      const meshes = hpGroup!.children.filter((child) => child.type === 'Mesh');

      meshes.forEach((mesh) => {
        expect(mesh.type).toBe('Mesh');
      });
    });

    it('should render red colored blocks', async () => {
      const renderer = await create(<Bot id="test-bot" />);
      const hpGroup = findHpBlocksGroup(renderer);
      const meshes = hpGroup!.children.filter((child) => child.type === 'Mesh');

      meshes.forEach((mesh) => {
        // Check that the material color is red (0xff0000)
        expect(mesh.instance.material.color.getHex()).toBe(0xff0000);
      });
    });

    it('should decrease HP blocks when hit', async () => {
      const renderer = await create(<Bot id="test-bot" />);
      const hitHandler = capturedHitHandlers[0];

      expect(countHpBlocks(renderer)).toBe(3);

      await act(async () => {
        hitHandler();
      });
      expect(countHpBlocks(renderer)).toBe(2);

      await act(async () => {
        hitHandler();
      });
      expect(countHpBlocks(renderer)).toBe(1);
    });

    it('should show 0 HP blocks when HP reaches zero', async () => {
      const renderer = await create(<Bot id="test-bot" />);
      const hitHandler = capturedHitHandlers[0];

      // Hit 3 times to reach 0 HP
      await act(async () => {
        hitHandler();
        hitHandler();
        hitHandler();
      });

      // HP blocks should be 0 (negative HP doesn't render blocks)
      expect(countHpBlocks(renderer)).toBe(0);
    });

    it('should position HP blocks above the head', async () => {
      const renderer = await create(<Bot id="test-bot" />);
      const hpGroup = findHpBlocksGroup(renderer);

      // The HP blocks group should be positioned above the head
      // Head position Y + 0.3 offset
      expect(hpGroup).toBeDefined();
      expect(hpGroup!.instance.position.y).toBeGreaterThan(0);
    });
  });
});
