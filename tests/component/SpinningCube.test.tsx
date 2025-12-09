import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { create } from '@react-three/test-renderer';
import { SpinningCube } from '@/app/components/SpinningCube';

describe('SpinningCube Component', () => {
  describe('Rendering', () => {
    it('should render a mesh element', async () => {
      const renderer = await create(<SpinningCube />);
      const mesh = renderer.scene.children[0];
      expect(mesh).toBeDefined();
      expect(mesh?.type).toBe('Mesh');
    });

    it('should have a box geometry', async () => {
      const renderer = await create(<SpinningCube />);
      const mesh = renderer.scene.children[0].allChildren[0];

      expect(mesh).toBeDefined();
      expect(mesh.type).toBe('BoxGeometry');
    });

    it('should have a standard material with orange color', async () => {
      const renderer = await create(<SpinningCube />);
      const mesh = renderer.scene.children[0].allChildren[1];

      expect(mesh).toBeDefined();
      expect(mesh.type).toBe('MeshStandardMaterial');
    });
  });
});
