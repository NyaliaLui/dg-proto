'use client';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  CuboidCollider,
  RigidBody,
  interactionGroups,
} from '@react-three/rapier';
import * as THREE from 'three';

export { Crate };
export type { CrateHandle };

// Half-extents of the crate: 0.6 m each side → full size 1.2 × 1.2 × 1.2 m.
// Top sits at 1.2 m, below the player's jump clearance (~1.88 m).
const HALF = 0.6;

// Group 4 — same as the player's solid body so the crate physically blocks movement.
const CRATE_GROUPS = interactionGroups([4], [4]);

const INITIAL_HP = 3;

interface CrateHandle {
  takeDamage: () => void;
}

interface CrateProps {
  id: string;
  position: [number, number, number];
  onRegister: (id: string, obj: THREE.Object3D) => void;
  onUnregister: (id: string) => void;
}

const Crate = forwardRef<CrateHandle, CrateProps>(function Crate(
  { id, position, onRegister, onUnregister },
  ref,
) {
  const [hp, setHp] = useState(INITIAL_HP);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData.crateId = id;
      onRegister(id, groupRef.current);
    }
    return () => onUnregister(id);
  }, [id, onRegister, onUnregister]);

  useImperativeHandle(ref, () => ({
    takeDamage: () => setHp((prev) => Math.max(0, prev - 1)),
  }));

  if (hp === 0) return null;

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider
        args={[HALF, HALF, HALF]}
        collisionGroups={CRATE_GROUPS}
      />
      <group ref={groupRef}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[HALF * 2, HALF * 2, HALF * 2]} />
          <meshStandardMaterial color={0x7a5c2e} flatShading />
        </mesh>
      </group>
    </RigidBody>
  );
});
