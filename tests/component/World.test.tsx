import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { create } from '@react-three/test-renderer';
import { Texture, RepeatWrapping } from 'three';
import { World } from '@/app/components/World';
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

describe('World Component', () => {
  it('Renders ground and sky', async () => {
    const renderer = await create(<World />);
    const mesh = renderer.scene.children[0];
    expect(mesh?.type).toBe('Mesh');
    expect(mesh.props['rotation-x']).toEqual(
      ENVIRONMENT_DEFAULTS.groundRotation,
    );
    expect(mesh.props.receiveShadow).toBe(true);

    const plane = mesh.allChildren[0];
    expect(plane.type).toBe('PlaneGeometry');
    expect(plane.props.args).toEqual([
      ENVIRONMENT_DEFAULTS.groundDim,
      ENVIRONMENT_DEFAULTS.groundDim,
    ]);

    const material = mesh.allChildren[1];
    expect(material.type).toBe('MeshStandardMaterial');
    expect(material.props.map).toEqual(testTexture);
  });
});
