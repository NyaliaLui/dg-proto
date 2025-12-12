import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { create } from '@react-three/test-renderer';
import { Group } from 'three';
import { NPC } from '@/app/components/NPC';

const testScene = new Group();

jest.mock('@react-three/drei', () => {
  const original = jest.requireActual('@react-three/drei');
  return {
    ...original,
    useFBX: jest.fn(() => ({
      scene: testScene,
      animations: [],
    })),
  };
});

jest.mock('three-stdlib', () => ({
  SkeletonUtils: {
    clone: jest.fn((obj) => obj),
  },
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
      const group = renderer.scene.children[0];
      expect(group.instance.position.x).toBe(1);
      expect(group.instance.position.y).toBe(0);
      expect(group.instance.position.z).toBe(0);
    });

    it('should render with idle model', async () => {
      const renderer = await create(<NPC />);
      const group = renderer.scene.children[0];
      expect(group).toBeDefined();
    });

    it('should have correct scale', async () => {
      const renderer = await create(<NPC />);
      const group = renderer.scene.children[0];
      const primitive = group.children[0];
      expect(primitive.instance.scale).toBe(0.01);
    });
  });

  describe('Rotation', () => {
    it('should have initial rotation facing left', async () => {
      const renderer = await create(<NPC />);
      const group = renderer.scene.children[0];
      expect(group.instance.rotation.y).toBe(-Math.PI / 2);
    });
  });
});
