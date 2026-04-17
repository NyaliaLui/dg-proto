import '@testing-library/jest-dom';
import { expect } from '@jest/globals';
import { create, act } from '@react-three/test-renderer';
import { createRef } from 'react';
import { Crate, CrateHandle } from '@/app/components/World/Obstacles/Crate';
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

const noop = () => {};

describe('Crate Component', () => {
  it('renders a box mesh when at full HP', async () => {
    const renderer = await create(
      <Crate
        id="crate-0"
        position={ENVIRONMENT_DEFAULTS.crate.position}
        onRegister={noop}
        onUnregister={noop}
      />,
    );

    // RigidBody (mocked as group) → inner group → mesh
    const rigidBody = renderer.scene.children[0];
    expect(rigidBody.type).toBe('Group');

    const innerGroup = rigidBody.children[0];
    expect(innerGroup.type).toBe('Group');

    const mesh = innerGroup.children[0];
    expect(mesh.type).toBe('Mesh');
    expect(mesh.allChildren[0].type).toBe('BoxGeometry');
  });

  it('applies ENVIRONMENT_DEFAULTS.crate.position to the RigidBody', async () => {
    const renderer = await create(
      <Crate
        id="crate-0"
        position={ENVIRONMENT_DEFAULTS.crate.position}
        onRegister={noop}
        onUnregister={noop}
      />,
    );
    const rigidBody = renderer.scene.children[0];
    expect(rigidBody.props.position).toEqual(
      ENVIRONMENT_DEFAULTS.crate.position,
    );
  });

  it('calls onRegister with id on mount', async () => {
    const onRegister = jest.fn();
    await create(
      <Crate
        id="crate-0"
        position={ENVIRONMENT_DEFAULTS.crate.position}
        onRegister={onRegister}
        onUnregister={noop}
      />,
    );
    expect(onRegister).toHaveBeenCalledWith('crate-0', expect.anything());
  });

  it('is destroyed (renders nothing) after 3 takeDamage calls', async () => {
    const ref = createRef<CrateHandle>();
    const renderer = await create(
      <Crate
        id="crate-0"
        position={ENVIRONMENT_DEFAULTS.crate.position}
        onRegister={noop}
        onUnregister={noop}
        ref={ref}
      />,
    );

    await act(async () => ref.current?.takeDamage());
    await act(async () => ref.current?.takeDamage());
    await act(async () => ref.current?.takeDamage());

    expect(renderer.scene.children).toHaveLength(0);
  });

  it('survives two hits but is still visible', async () => {
    const ref = createRef<CrateHandle>();
    const renderer = await create(
      <Crate
        id="crate-0"
        position={ENVIRONMENT_DEFAULTS.crate.position}
        onRegister={noop}
        onUnregister={noop}
        ref={ref}
      />,
    );

    await act(async () => ref.current?.takeDamage());
    await act(async () => ref.current?.takeDamage());

    expect(renderer.scene.children).toHaveLength(1);
  });
});
