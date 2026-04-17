import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { create } from '@react-three/test-renderer';
import { Platform } from '@/app/components/World/Obstacles/Platform';
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
    CuboidCollider: () => null,
  };
});

describe('Platform Component', () => {
  it('renders a box mesh', async () => {
    const renderer = await create(
      <Platform
        position={ENVIRONMENT_DEFAULTS.platform.position}
        scale={ENVIRONMENT_DEFAULTS.platform.scale}
      />,
    );

    // RigidBody (mocked as group) → mesh
    const rigidBody = renderer.scene.children[0];
    expect(rigidBody.type).toBe('Group');

    const mesh = rigidBody.children[0];
    expect(mesh.type).toBe('Mesh');
    expect(mesh.allChildren[0].type).toBe('BoxGeometry');
  });

  it('applies ENVIRONMENT_DEFAULTS.platform.position to the RigidBody', async () => {
    const renderer = await create(
      <Platform
        position={ENVIRONMENT_DEFAULTS.platform.position}
        scale={ENVIRONMENT_DEFAULTS.platform.scale}
      />,
    );
    const rigidBody = renderer.scene.children[0];
    expect(rigidBody.props.position).toEqual(
      ENVIRONMENT_DEFAULTS.platform.position,
    );
  });

  it('sizes the box geometry from the scale prop', async () => {
    const renderer = await create(
      <Platform
        position={ENVIRONMENT_DEFAULTS.platform.position}
        scale={ENVIRONMENT_DEFAULTS.platform.scale}
      />,
    );
    const mesh = renderer.scene.children[0].children[0];
    const geometry = mesh.allChildren[0];
    expect(geometry.type).toBe('BoxGeometry');
    expect(geometry.props.args).toEqual(ENVIRONMENT_DEFAULTS.platform.scale);
  });

  it('uses crate brown color', async () => {
    const renderer = await create(
      <Platform
        position={ENVIRONMENT_DEFAULTS.platform.position}
        scale={ENVIRONMENT_DEFAULTS.platform.scale}
      />,
    );
    const mesh = renderer.scene.children[0].children[0];
    const material = mesh.allChildren[1];
    expect(material.type).toBe('MeshStandardMaterial');
    expect(material.props.color).toBe(0x7a5c2e);
  });
});
