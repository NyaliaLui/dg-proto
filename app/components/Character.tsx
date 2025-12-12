'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { CHARACTER_DEFAULTS } from '@/app/constants';
import { KeyState } from '@/app/components/hooks/useKeyboardControls';

interface CharacterProps {
  keys: KeyState;
}

export function Character({ keys }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lastRotationRef = useRef<number>(Math.PI / 2);

  // Determine if character is moving
  const moving = useMemo(() => {
    return keys.w || keys.s || keys.a || keys.d;
  }, [keys.w, keys.s, keys.a, keys.d]);

  // Load all models
  const idleFbx = useFBX(CHARACTER_DEFAULTS.MODELS.IDLE);
  const walkFbx = useFBX(CHARACTER_DEFAULTS.MODELS.WALK);
  const normalFbx = useFBX(CHARACTER_DEFAULTS.MODELS.NORMAL);

  // Clone models so they can be used independently
  const idleClone = useMemo(() => SkeletonUtils.clone(idleFbx), [idleFbx]);
  const walkClone = useMemo(() => SkeletonUtils.clone(walkFbx), [walkFbx]);
  const normalClone = useMemo(
    () => SkeletonUtils.clone(normalFbx),
    [normalFbx],
  );

  const mixer = useRef<THREE.AnimationMixer | null>(null);

  // Switch between animations based on state
  const currentFbx = keys.q ? normalClone : moving ? walkClone : idleClone;

  useEffect(() => {
    // Clean up previous mixer
    if (mixer.current) {
      mixer.current.stopAllAction();
      mixer.current = null;
    }

    // Set up new mixer with current model
    if (currentFbx && currentFbx.animations.length > 0) {
      mixer.current = new THREE.AnimationMixer(currentFbx);
      const action = mixer.current.clipAction(currentFbx.animations[0]);
      action.play();
    }

    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
      }
    };
  }, [currentFbx]);

  useFrame((_state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }

    if (groupRef.current) {
      const moveSpeed = CHARACTER_DEFAULTS.MOVE_SPEED * delta;

      // WASD movement with rotation to face direction (right-handed coordinate system)
      if (keys.w) {
        groupRef.current.position.z -= moveSpeed; // Move forward (toward -Z)
        groupRef.current.rotation.y = Math.PI; // Face forward (-Z direction)
      }
      if (keys.s) {
        groupRef.current.position.z += moveSpeed; // Move backward (toward +Z)
        groupRef.current.rotation.y = 0; // Face backward (+Z direction, toward camera)
      }
      if (keys.a) {
        groupRef.current.position.x -= moveSpeed; // Move left (toward -X)
        groupRef.current.rotation.y = -Math.PI / 2; // Face left (-X direction)
        lastRotationRef.current = -Math.PI / 2;
      }
      if (keys.d) {
        groupRef.current.position.x += moveSpeed; // Move right (toward +X)
        groupRef.current.rotation.y = Math.PI / 2; // Face right (+X direction)
        lastRotationRef.current = Math.PI / 2;
      }

      // When idle, maintain last rotation
      if (!moving) {
        groupRef.current.rotation.y = lastRotationRef.current;
      }
    }
  });

  return (
    <group ref={groupRef} position={[-1, 0, 0]}>
      <primitive object={currentFbx} scale={CHARACTER_DEFAULTS.SCALE} />
    </group>
  );
}
