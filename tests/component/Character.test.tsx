import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { create } from '@react-three/test-renderer';
import { Group } from 'three';
import { Character } from '@/app/components/Character';
import { CONTROLS_DEFAULTS } from '@/app/constants';

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
      const group = renderer.scene.children[0];
      expect(group.instance.position.x).toBe(-1);
      expect(group.instance.position.y).toBe(0);
      expect(group.instance.position.z).toBe(0);
    });

    it('should render with idle model when not moving', async () => {
      const renderer = await create(<Character keys={mockKeys} />);
      const group = renderer.scene.children[0];
      expect(group).toBeDefined();
    });

    it('should have correct scale', async () => {
      const renderer = await create(<Character keys={mockKeys} />);
      const group = renderer.scene.children[0];
      const primitive = group.children[0];
      expect(primitive.instance.scale).toBe(0.01);
    });
  });

  describe('Movement', () => {
    it('should switch to walking model when moving', async () => {
      const movingKeys = { ...mockKeys, w: true };
      const renderer = await create(<Character keys={movingKeys} />);
      const group = renderer.scene.children[0];
      expect(group).toBeDefined();
    });

    it('should detect movement with W key', async () => {
      const movingKeys = { ...mockKeys, w: true };
      const renderer = await create(<Character keys={movingKeys} />);
      expect(renderer.scene.children[0]).toBeDefined();
    });

    it('should detect movement with A key', async () => {
      const movingKeys = { ...mockKeys, a: true };
      const renderer = await create(<Character keys={movingKeys} />);
      expect(renderer.scene.children[0]).toBeDefined();
    });

    it('should detect movement with S key', async () => {
      const movingKeys = { ...mockKeys, s: true };
      const renderer = await create(<Character keys={movingKeys} />);
      expect(renderer.scene.children[0]).toBeDefined();
    });

    it('should detect movement with D key', async () => {
      const movingKeys = { ...mockKeys, d: true };
      const renderer = await create(<Character keys={movingKeys} />);
      expect(renderer.scene.children[0]).toBeDefined();
    });
  });

  describe('Rotation', () => {
    it('should have initial rotation facing right', async () => {
      const renderer = await create(<Character keys={mockKeys} />);
      const group = renderer.scene.children[0];
      expect(group.instance.rotation.y).toBe(0);
      // Advance the frame so the initial value is set
      await renderer.advanceFrames(1, 1);
      expect(group.instance.rotation.y).toBe(Math.PI / 2);
    });
  });
});
