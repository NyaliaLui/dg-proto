'use client';
import {
  CuboidCollider,
  RigidBody,
  interactionGroups,
} from '@react-three/rapier';

export { Platform };

// Group 4 — same as the player's solid body so the player can stand on the platform.
const PLATFORM_GROUPS = interactionGroups([4], [4]);

interface PlatformProps {
  position: [number, number, number];
  scale: [number, number, number];
}

function Platform({ position, scale }: PlatformProps) {
  const [w, h, d] = scale;
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider
        args={[w / 2, h / 2, d / 2]}
        collisionGroups={PLATFORM_GROUPS}
      />
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={0x7a5c2e} />
      </mesh>
    </RigidBody>
  );
}
