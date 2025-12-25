import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { create } from '@react-three/test-renderer';
import { Group } from 'three';
import { NPC } from '@/app/components/NPC';

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
}));

jest.mock('three-stdlib', () => ({
  SkeletonUtils: {
    clone: jest.fn((obj) => obj),
  },
}));

jest.mock('@react-three/rapier', () => ({
  RigidBody: ({
    children,
    position,
  }: {
    children: React.ReactNode;
    position?: [number, number, number];
  }) => <group position={position}>{children}</group>,
  CapsuleCollider: () => null,
}));

describe('NPC Component', () => {
  describe('Rendering', () => {
    it('should render a group element', async () => {
      const renderer = await create(<NPC />);
      const group = renderer.scene.children[0];
      expect(group).toBeDefined();
      expect(group?.type).toBe('Group');
    });

    it('should have correct initial position', async () => {
      const renderer = await create(<NPC />);
      const rigidBody = renderer.scene.children[0];
      expect(rigidBody.instance.position.x).toBe(1);
      expect(rigidBody.instance.position.y).toBe(0.9);
      expect(rigidBody.instance.position.z).toBe(0);
    });

    it('should render with idle model', async () => {
      const renderer = await create(<NPC />);
      const group = renderer.scene.children[0];
      expect(group).toBeDefined();
    });

    it('should have correct scale', async () => {
      const renderer = await create(<NPC />);
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
      const renderer = await create(<NPC />);
      const rigidBody = renderer.scene.children[0];
      // The rotation is applied to the inner group via useEffect
      const innerGroup = rigidBody.children[0];
      expect(innerGroup.instance.rotation.y).toBe(-Math.PI / 2);
    });
  });
});
