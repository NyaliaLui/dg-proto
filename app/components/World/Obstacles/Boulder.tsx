'use client';
import {
  BallCollider,
  RigidBody,
  interactionGroups,
} from '@react-three/rapier';

export { Boulder };

// Group 4 matches the player's solid body group so the boulder physically blocks movement.
const BOULDER_GROUPS = interactionGroups([4], [4]);

// Radius chosen so the boulder top (~1.3 m) is below the player's jump clearance (~1.88 m),
// making it large enough to block walking but small enough to jump over.
const RADIUS = 0.65;

function Boulder({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <BallCollider args={[RADIUS]} collisionGroups={BOULDER_GROUPS} />
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[RADIUS, 0]} />
        <meshStandardMaterial color={0x7a7a7a} flatShading />
      </mesh>
    </RigidBody>
  );
}
