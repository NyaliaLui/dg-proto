'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { CHARACTER_DEFAULTS } from '@/app/constants';
import { KeyState } from '@/app/components/hooks/useKeyboardControls';

interface CharacterProps {
  keys: KeyState;
}

export function Character({ keys }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      const moveSpeed = CHARACTER_DEFAULTS.MOVE_SPEED * delta; // Movement speed

      // WASD movement
      if (keys.w) {
        groupRef.current.position.z -= moveSpeed; // Move forward
      }
      if (keys.s) {
        groupRef.current.position.z += moveSpeed; // Move backward
      }
      if (keys.a) {
        groupRef.current.position.x -= moveSpeed; // Move left
      }
      if (keys.d) {
        groupRef.current.position.x += moveSpeed; // Move right
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>

      {/* Body */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.6, 0.8, 0.4]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.45, 0.6, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.45, 0.6, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>

      {/* Left Leg */}
      <mesh position={[-0.2, -0.1, 0]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>

      {/* Right Leg */}
      <mesh position={[0.2, -0.1, 0]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
    </group>
  );
}
