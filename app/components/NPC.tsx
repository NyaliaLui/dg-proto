'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { SkeletonHelper } from 'three';

import { CHARACTER_DEFAULTS } from '@/app/constants';
import { getAnimation } from '@/app/utils';

export function NPC() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useThree();
  const skeletonHelperRef = useRef<SkeletonHelper | null>(null);

  // Load the skinned model
  const modelFbx = useFBX(CHARACTER_DEFAULTS.MODELS.XBOT);

  // Load idle animation from separate file
  const idleAnim = getAnimation(useFBX(CHARACTER_DEFAULTS.ANIMATIONS.IDLE));

  const mixer = useRef<THREE.AnimationMixer | null>(null);

  // Clone the model so it can be used independently
  const model = useMemo(() => SkeletonUtils.clone(modelFbx), [modelFbx]);

  // Create skeleton helper for visualization
  useEffect(() => {
    if (model) {
      const helper = new SkeletonHelper(model);
      skeletonHelperRef.current = helper;
      scene.add(helper);

      return () => {
        scene.remove(helper);
        skeletonHelperRef.current = null;
      };
    }
  }, [model, scene]);

  // Get the idle animation clip
  const currentAnimation = useMemo(() => {
    return idleAnim;
  }, [idleAnim]);

  useEffect(() => {
    // Clean up previous mixer
    if (mixer.current) {
      mixer.current.stopAllAction();
      mixer.current = null;
    }

    // Set up new mixer with current animation on the model
    if (model && currentAnimation) {
      mixer.current = new THREE.AnimationMixer(model);
      const action = mixer.current.clipAction(currentAnimation);
      action.play();
    }

    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
      }
    };
  }, [model, currentAnimation]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = -Math.PI / 2;
    }
  }, []);

  useFrame((_state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

  return (
    <RigidBody type="fixed" position={[1, 0.9, 0]} colliders={false}>
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
      <group ref={groupRef}>
        <primitive
          object={model}
          scale={CHARACTER_DEFAULTS.SCALE}
          position={[0, -0.9, 0]}
        />
      </group>
    </RigidBody>
  );
}
