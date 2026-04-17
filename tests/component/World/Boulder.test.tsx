import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { create } from '@react-three/test-renderer';
import { Boulder } from '@/app/components/World/Obstacles/Boulder';
import { ENVIRONMENT_DEFAULTS } from '@/app/constants';

jest.mock('@react-three/rapier', () => {
  const React = jest.requireActual('react');
  return {
    interactionGroups: jest.fn(() => 0),
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
      return <group position={position}>{children}</group>;
    }),
    BallCollider: () => null,
  };
});

describe('Boulder Component', () => {
  it('renders an icosahedron mesh', async () => {
    const renderer = await create(
      <Boulder position={ENVIRONMENT_DEFAULTS.boulder.position} />,
    );

    const rigidBody = renderer.scene.children[0];
    expect(rigidBody.type).toBe('Group');

    const mesh = rigidBody.children[0];
    expect(mesh.type).toBe('Mesh');
    expect(mesh.allChildren[0].type).toBe('IcosahedronGeometry');
  });

  it('applies ENVIRONMENT_DEFAULTS.boulder.position to the RigidBody', async () => {
    const renderer = await create(
      <Boulder position={ENVIRONMENT_DEFAULTS.boulder.position} />,
    );
    const rigidBody = renderer.scene.children[0];
    expect(rigidBody.props.position).toEqual(
      ENVIRONMENT_DEFAULTS.boulder.position,
    );
  });

  it('uses gray stone color', async () => {
    const renderer = await create(
      <Boulder position={ENVIRONMENT_DEFAULTS.boulder.position} />,
    );
    const mesh = renderer.scene.children[0].children[0];
    const material = mesh.allChildren[1];
    expect(material.type).toBe('MeshStandardMaterial');
    expect(material.props.color).toBe(0x7a7a7a);
  });
});
