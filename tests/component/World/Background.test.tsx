import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { create } from '@react-three/test-renderer';
import { Texture, RepeatWrapping } from 'three';
import { Tree, Mountain, Background } from '@/app/components/World/Background';
import { ENVIRONMENT_DEFAULTS } from '@/app/constants';

const testTexture = new Texture();
testTexture.wrapS = testTexture.wrapT = RepeatWrapping;

jest.mock('@react-three/drei', () => {
  const original = jest.requireActual('@react-three/drei');
  return {
    ...original,
    useTexture: jest.fn(() => {
      return testTexture;
    }),
  };
});

describe('Tree Component', () => {
  it('renders a trunk and foliage', async () => {
    const renderer = await create(<Tree position={[0, 0, 0]} />);
    const group = renderer.scene.children[0];
    expect(group.type).toBe('Group');

    const trunk = group.allChildren[0];
    expect(trunk.type).toBe('Mesh');
    expect(trunk.allChildren[0].type).toBe('CylinderGeometry');

    const foliage = group.allChildren[1];
    expect(foliage.type).toBe('Mesh');
    expect(foliage.allChildren[0].type).toBe('ConeGeometry');
  });

  it('applies the given position', async () => {
    const renderer = await create(<Tree position={[3, 0, -5]} />);
    const group = renderer.scene.children[0];
    expect(group.props.position).toEqual([3, 0, -5]);
  });
});

describe('Mountain Component', () => {
  it('renders a cone mesh', async () => {
    const renderer = await create(
      <Mountain position={[0, 8, -25]} width={14} height={16} />,
    );
    const mesh = renderer.scene.children[0];
    expect(mesh.type).toBe('Mesh');

    const cone = mesh.allChildren[0];
    expect(cone.type).toBe('ConeGeometry');
    expect(cone.props.args[0]).toBe(14);
    expect(cone.props.args[1]).toBe(16);
  });

  it('applies the given position', async () => {
    const renderer = await create(
      <Mountain position={[10, 6, -30]} width={12} height={12} />,
    );
    const mesh = renderer.scene.children[0];
    expect(mesh.props.position).toEqual([10, 6, -30]);
  });
});

describe('Background Component', () => {
  it('renders the ground plane', async () => {
    const renderer = await create(<Background />);
    const ground = renderer.scene.children[0];
    expect(ground?.type).toBe('Mesh');
    expect(ground.props['rotation-x']).toEqual(
      ENVIRONMENT_DEFAULTS.groundRotation,
    );
    expect(ground.props.receiveShadow).toBe(true);

    const plane = ground.allChildren[0];
    expect(plane.type).toBe('PlaneGeometry');
    expect(plane.props.args).toEqual([
      ENVIRONMENT_DEFAULTS.groundDim,
      ENVIRONMENT_DEFAULTS.groundDim,
    ]);

    const material = ground.allChildren[1];
    expect(material.type).toBe('MeshStandardMaterial');
    expect(material.props.map).toEqual(testTexture);
  });

  it('renders three mountains behind the trees', async () => {
    const renderer = await create(<Background />);
    // children order: ground(0), mountain(1), mountain(2), mountain(3), tree(4), tree(5), tree(6)
    const mountains = renderer.scene.children.slice(1, 4);
    expect(mountains).toHaveLength(3);
    mountains.forEach((m) => {
      expect(m.type).toBe('Mesh');
      expect(m.allChildren[0].type).toBe('ConeGeometry');
    });
  });

  it('renders three trees in front of the mountains', async () => {
    const renderer = await create(<Background />);
    const trees = renderer.scene.children.slice(4);
    expect(trees).toHaveLength(3);
    trees.forEach((t) => expect(t.type).toBe('Group'));
  });
});
