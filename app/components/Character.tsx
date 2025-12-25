'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import {
  CapsuleCollider,
  RigidBody,
  RapierRigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { CHARACTER_DEFAULTS } from '@/app/constants';
import { KeyState } from '@/app/components/hooks/useKeyboardControls';

interface CharacterProps {
  keys: KeyState;
}

export function Character({ keys }: CharacterProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
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

    if (rigidBodyRef.current) {
      const moveSpeed = CHARACTER_DEFAULTS.MOVE_SPEED;
      const velocity = { x: 0, y: 0, z: 0 };

      // WASD movement with rotation to face direction
      if (keys.w) {
        velocity.z = -moveSpeed;
        rigidBodyRef.current.setRotation({ x: 0, y: 1, z: 0, w: 0 }, true); // Face -Z
      }
      if (keys.s) {
        velocity.z = moveSpeed;
        rigidBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true); // Face +Z
      }
      if (keys.a) {
        velocity.x = -moveSpeed;
        rigidBodyRef.current.setRotation(
          { x: 0, y: -0.707, z: 0, w: 0.707 },
          true,
        ); // Face -X
        lastRotationRef.current = -Math.PI / 2;
      }
      if (keys.d) {
        velocity.x = moveSpeed;
        rigidBodyRef.current.setRotation(
          { x: 0, y: 0.707, z: 0, w: 0.707 },
          true,
        ); // Face +X
        lastRotationRef.current = Math.PI / 2;
      }

      rigidBodyRef.current.setLinvel(velocity, true);

      // When idle, maintain last rotation
      if (!moving) {
        const halfAngle = lastRotationRef.current / 2;
        rigidBodyRef.current.setRotation(
          { x: 0, y: Math.sin(halfAngle), z: 0, w: Math.cos(halfAngle) },
          true,
        );
      }
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={[-1, 0.9, 0]}
      lockRotations
      enabledRotations={[false, false, false]}
      colliders={false}
    >
      {/* Torso capsule */}
      <CapsuleCollider
        args={[
          CHARACTER_DEFAULTS.COLLIDERS.TORSO.halfHeight,
          CHARACTER_DEFAULTS.COLLIDERS.TORSO.radius,
        ]}
        position={CHARACTER_DEFAULTS.COLLIDERS.TORSO.position}
      />
      {/* Head capsule */}
      <CapsuleCollider
        args={[
          CHARACTER_DEFAULTS.COLLIDERS.HEAD.halfHeight,
          CHARACTER_DEFAULTS.COLLIDERS.HEAD.radius,
        ]}
        position={CHARACTER_DEFAULTS.COLLIDERS.HEAD.position}
      />
      <group ref={modelRef}>
        <primitive
          object={currentFbx}
          scale={CHARACTER_DEFAULTS.SCALE}
          position={[0, -0.9, 0]}
        />
      </group>
    </RigidBody>
  );
}
