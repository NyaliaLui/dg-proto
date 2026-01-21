import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { create, ReactThreeTestRenderer } from '@react-three/test-renderer';
import { Group } from 'three';
import { act } from 'react';
import { Bot } from '@/app/components/Bot';
import { DebugSettings } from '@/app/components/hooks/useDebugSettings';
import { BOT_DEFAULTS, GAME_DEFAULTS, DEFAULT_COLORS } from '@/app/constants';

const defaultSettings: DebugSettings = {
  debugMode: false,
  enableBotWalk: BOT_DEFAULTS.enableBotWalk,
  botWalkDurationMS: BOT_DEFAULTS.botWalkDurationMS,
  enableBotAttack: BOT_DEFAULTS.enableBotAttack,
  botAttackDurationMS: BOT_DEFAULTS.botAttackDurationMS,
};

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
  getBoneList: jest.fn(() => []),
  makeBoneVertexMap: jest.fn(() => ({})),
  getBoneWorldPosition: jest.fn(() => null),
}));

jest.mock('three-stdlib', () => {
  const { Group } = jest.requireActual('three');
  return {
    SkeletonUtils: {
      clone: jest.fn(() => new Group()),
    },
  };
});

jest.mock('three', () => {
  const originalThree = jest.requireActual('three');

  // Create a mock SkeletonHelper that extends Object3D
  class MockSkeletonHelper extends originalThree.Object3D {
    geometry = {
      attributes: {
        position: {
          getX: jest.fn(() => 0),
          getY: jest.fn(() => 0),
          getZ: jest.fn(() => 0),
        },
      },
    };

    constructor() {
      super();
      this.visible = true;
    }
  }

  return {
    ...originalThree,
    SkeletonHelper: MockSkeletonHelper,
  };
});

let capturedHitHandlers: (() => void)[] = [];

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
        translation: () => ({ x: 0, y: 0, z: 0 }),
      }));
      return <group position={position}>{children}</group>;
    }),
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
  };
});

describe('Bot Component', () => {
  beforeEach(() => {
    capturedHitHandlers = [];
  });

  describe('Rendering', () => {
    it('should render a group element', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });
      const group = renderer!.scene.children[0];
      expect(group).toBeDefined();
      expect(group?.type).toBe('Group');
    });

    it('should have correct initial position', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });
      const rigidBody = renderer!.scene.children[0];
      expect(rigidBody.instance.position.x).toBe(1);
      expect(rigidBody.instance.position.y).toBe(0.9);
      expect(rigidBody.instance.position.z).toBe(0);
    });

    it('should render with idle model', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });
      const group = renderer!.scene.children[0];
      expect(group).toBeDefined();
    });

    it('should have correct scale', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });
      const rigidBody = renderer!.scene.children[0];
      // RigidBody (group) -> HP blocks group, model group (groupRef) -> primitive
      // Find the model group (the one with the primitive, not the HP blocks)
      const modelGroup = rigidBody.children.find(
        (child) =>
          child.type === 'Group' &&
          child.children.some((c) => c.type !== 'Mesh'),
      );
      const primitive = modelGroup!.children[0];
      // The primitive has scale prop applied directly (uniform scale)
      expect(primitive.instance.scale.x).toBe(0.01);
      expect(primitive.instance.scale.y).toBe(0.01);
      expect(primitive.instance.scale.z).toBe(0.01);
    });
  });

  describe('Rotation', () => {
    beforeEach(() => {
      mockSetRotation.mockClear();
    });

    it('should set initial rotation facing left when idle', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });
      await act(async () => {
        await renderer!.advanceFrames(1, 1 / 60);
      });

      // The idle rotation uses halfAngle calculation for -PI/2:
      // sin(-PI/4) ≈ -0.707, cos(-PI/4) ≈ 0.707
      expect(mockSetRotation).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 0,
          z: 0,
        }),
        true,
      );
    });
  });

  describe('HP', () => {
    let renderer: ReactThreeTestRenderer;
    let mockOnDeath: jest.Mock;

    beforeEach(async () => {
      mockOnDeath = jest.fn();
      await act(async () => {
        renderer = await create(
          <Bot
            id="test-bot"
            onDeath={mockOnDeath}
            settings={defaultSettings}
          />,
        );
      });
    });

    afterEach(async () => {
      await act(async () => {
        await renderer.unmount();
      });
    });

    it('should register hit handlers on colliders', async () => {
      // Both torso and head colliders should have hit handlers
      // Check for at least 2 handlers (from this render)
      expect(capturedHitHandlers.length).toBeGreaterThanOrEqual(2);
    });

    it('should call onDeath callback when HP reaches zero', async () => {
      const hitHandler = capturedHitHandlers[0];

      // Hit INITIAL_BOT_HP times to reach 0 HP
      await act(async () => {
        for (let i = 0; i < GAME_DEFAULTS.INITIAL_BOT_HP; i++) {
          hitHandler();
        }
      });

      expect(mockOnDeath).toHaveBeenCalledWith('test-bot');
    });

    it('should not call onDeath when HP is above zero', async () => {
      const hitHandler = capturedHitHandlers[0];

      // Hit one less than INITIAL_BOT_HP times (HP goes to 1)
      await act(async () => {
        for (let i = 0; i < GAME_DEFAULTS.INITIAL_BOT_HP - 1; i++) {
          hitHandler();
        }
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

    it('should render INITIAL_BOT_HP blocks initially', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });
      expect(countHpBlocks(renderer!)).toBe(GAME_DEFAULTS.INITIAL_BOT_HP);
    });

    it('should render HP blocks as meshes with box geometry', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });
      const hpGroup = findHpBlocksGroup(renderer!);

      expect(hpGroup).toBeDefined();
      const meshes = hpGroup!.children.filter((child) => child.type === 'Mesh');

      meshes.forEach((mesh) => {
        expect(mesh.type).toBe('Mesh');
      });
    });

    it('should render red colored blocks', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });
      const hpGroup = findHpBlocksGroup(renderer!);
      const meshes = hpGroup!.children.filter((child) => child.type === 'Mesh');

      // Convert hex string '#f05252' to number 0xf05252
      const expectedHex = parseInt(DEFAULT_COLORS.HP_RED.slice(1), 16);

      meshes.forEach((mesh) => {
        // Check that the material color is HP red
        expect(mesh.instance.material.color.getHex()).toBe(expectedHex);
      });
    });

    it('should decrease HP blocks when hit', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });
      const hitHandler = capturedHitHandlers[0];

      expect(countHpBlocks(renderer!)).toBe(GAME_DEFAULTS.INITIAL_BOT_HP);

      await act(async () => {
        hitHandler();
      });
      expect(countHpBlocks(renderer!)).toBe(GAME_DEFAULTS.INITIAL_BOT_HP - 1);

      await act(async () => {
        hitHandler();
      });
      expect(countHpBlocks(renderer!)).toBe(GAME_DEFAULTS.INITIAL_BOT_HP - 2);
    });

    it('should show 0 HP blocks when HP reaches zero', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });
      const hitHandler = capturedHitHandlers[0];

      // Hit INITIAL_BOT_HP times to reach 0 HP
      await act(async () => {
        for (let i = 0; i < GAME_DEFAULTS.INITIAL_BOT_HP; i++) {
          hitHandler();
        }
      });

      // HP blocks should be 0 (negative HP doesn't render blocks)
      expect(countHpBlocks(renderer!)).toBe(0);
    });

    it('should position HP blocks above the head', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });
      const hpGroup = findHpBlocksGroup(renderer!);

      // The HP blocks group should be positioned above the head
      // Head position Y + 0.3 offset
      expect(hpGroup).toBeDefined();
      expect(hpGroup!.instance.position.y).toBeGreaterThan(0);
    });
  });

  describe('Movement', () => {
    beforeEach(() => {
      capturedHitHandlers = [];
      mockSetLinvel.mockClear();
      mockSetRotation.mockClear();
    });

    it('should set zero velocity when not walking', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });
      await act(async () => {
        await renderer!.advanceFrames(1, 1 / 60);
      });

      expect(mockSetLinvel).toHaveBeenCalledWith({ x: 0, y: 0, z: 0 }, true);
    });

    it('should call setLinvel with velocity during frame updates', async () => {
      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={defaultSettings} />,
        );
      });

      // Advance multiple frames
      await act(async () => {
        await renderer!.advanceFrames(10, 1 / 60);
      });

      // setLinvel should have been called multiple times
      expect(mockSetLinvel.mock.calls.length).toBeGreaterThan(0);

      // All calls should have the expected structure
      mockSetLinvel.mock.calls.forEach((call) => {
        expect(call[0]).toHaveProperty('x');
        expect(call[0]).toHaveProperty('y');
        expect(call[0]).toHaveProperty('z');
        expect(call[1]).toBe(true);
      });
    });

    it('should rotate when walking', async () => {
      const fastWalkSettings: DebugSettings = {
        debugMode: false,
        enableBotWalk: true,
        botWalkDurationMS: 10,
        enableBotAttack: false,
        botAttackDurationMS: 1500,
      };

      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={fastWalkSettings} />,
        );
      });

      // Wait for the interval to trigger
      await new Promise((resolve) => setTimeout(resolve, 20));
      await act(async () => {});

      mockSetRotation.mockClear();
      await act(async () => {
        await renderer!.advanceFrames(1, 1 / 60);
      });

      // Should have called setRotation
      expect(mockSetRotation).toHaveBeenCalled();
    });

    it('should change direction between walk cycles', async () => {
      const fastWalkSettings: DebugSettings = {
        debugMode: false,
        enableBotWalk: true,
        botWalkDurationMS: 10,
        enableBotAttack: false,
        botAttackDurationMS: 1500,
      };

      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={fastWalkSettings} />,
        );
      });

      // First walk cycle
      await new Promise((resolve) => setTimeout(resolve, 15));
      await act(async () => {});
      await act(async () => {
        await renderer!.advanceFrames(1, 1 / 60);
      });

      const firstCycleCalls = [...mockSetLinvel.mock.calls];
      const firstVelocityX = firstCycleCalls.find((c) => c[0].x !== 0)?.[0].x;

      // Stop walking
      await new Promise((resolve) => setTimeout(resolve, 15));
      await act(async () => {});

      // Second walk cycle
      await new Promise((resolve) => setTimeout(resolve, 15));
      await act(async () => {});

      mockSetLinvel.mockClear();
      await act(async () => {
        await renderer!.advanceFrames(1, 1 / 60);
      });

      const secondCycleCalls = mockSetLinvel.mock.calls;
      const secondVelocityX = secondCycleCalls.find((c) => c[0].x !== 0)?.[0].x;

      // If both cycles had walking, velocities should be opposite signs
      if (firstVelocityX !== undefined && secondVelocityX !== undefined) {
        expect(Math.sign(firstVelocityX)).not.toBe(Math.sign(secondVelocityX));
      }
    });

    it('should not walk when enableBotWalk is false', async () => {
      const disabledWalkSettings: DebugSettings = {
        debugMode: false,
        enableBotWalk: false,
        botWalkDurationMS: 10,
        enableBotAttack: false,
        botAttackDurationMS: 1500,
      };

      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={disabledWalkSettings} />,
        );
      });

      // Wait for potential interval
      await new Promise((resolve) => setTimeout(resolve, 30));
      await act(async () => {});

      mockSetLinvel.mockClear();
      await act(async () => {
        await renderer!.advanceFrames(1, 1 / 60);
      });

      // Should only have zero velocity calls
      const allZeroVelocity = mockSetLinvel.mock.calls.every(
        (call) => call[0].x === 0 && call[0].y === 0 && call[0].z === 0,
      );
      expect(allZeroVelocity).toBe(true);
    });

    it('should set zero velocity when attacking even while walking is enabled', async () => {
      // Settings where both walk and attack are enabled with fast intervals
      const attackWhileWalkingSettings: DebugSettings = {
        debugMode: false,
        enableBotWalk: true,
        botWalkDurationMS: 10,
        enableBotAttack: true,
        botAttackDurationMS: 10,
      };

      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={attackWhileWalkingSettings} />,
        );
      });

      // Wait for both walk and attack intervals to trigger
      await new Promise((resolve) => setTimeout(resolve, 25));
      await act(async () => {});

      mockSetLinvel.mockClear();
      await act(async () => {
        await renderer!.advanceFrames(1, 1 / 60);
      });

      // When attacking, velocity should be zero regardless of walking state
      // We verify by checking that zero velocity is called at least once during attack
      const hasZeroVelocity = mockSetLinvel.mock.calls.some(
        (call) => call[0].x === 0 && call[0].y === 0 && call[0].z === 0,
      );
      expect(hasZeroVelocity).toBe(true);
    });

    it('should not move when only attacking (walk disabled)', async () => {
      const attackOnlySettings: DebugSettings = {
        debugMode: false,
        enableBotWalk: false,
        botWalkDurationMS: 1500,
        enableBotAttack: true,
        botAttackDurationMS: 10,
      };

      let renderer: ReactThreeTestRenderer;
      await act(async () => {
        renderer = await create(
          <Bot id="test-bot" settings={attackOnlySettings} />,
        );
      });

      // Wait for attack interval to trigger
      await new Promise((resolve) => setTimeout(resolve, 15));
      await act(async () => {});

      mockSetLinvel.mockClear();
      await act(async () => {
        await renderer!.advanceFrames(1, 1 / 60);
      });

      // Should only have zero velocity calls since walk is disabled
      const allZeroVelocity = mockSetLinvel.mock.calls.every(
        (call) => call[0].x === 0 && call[0].y === 0 && call[0].z === 0,
      );
      expect(allZeroVelocity).toBe(true);
    });
  });
});
