'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { SkeletonHelper } from 'three';

import { CHARACTER_DEFAULTS } from '@/app/constants';
import {
  getAnimation,
  getBoneList,
  makeBoneVertexMap,
  getBoneWorldPosition,
  BoneVertexMap,
} from '@/app/utils';

export function Bot() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useThree();
  const skeletonHelperRef = useRef<SkeletonHelper | null>(null);
  const boneVertexMapRef = useRef<BoneVertexMap | null>(null);
  const [torsoPosition, setTorsoPosition] = useState<[number, number, number]>([
    ...CHARACTER_DEFAULTS.COLLIDERS.TORSO.position,
  ]);
  const [headPosition, setHeadPosition] = useState<[number, number, number]>([
    ...CHARACTER_DEFAULTS.COLLIDERS.HEAD.position,
  ]);

  // Load the skinned model
  const modelFbx = useFBX(CHARACTER_DEFAULTS.MODELS.XBOT);

  // Load idle animation from separate file
  const idleAnim = getAnimation(useFBX(CHARACTER_DEFAULTS.ANIMATIONS.IDLE));

  const mixer = useRef<THREE.AnimationMixer | null>(null);

  // Clone the model so it can be used independently
  const model = useMemo(() => SkeletonUtils.clone(modelFbx), [modelFbx]);

  // Create skeleton helper for visualization and build bone vertex map
  useEffect(() => {
    if (model) {
      const helper = new SkeletonHelper(model);
      const bones = getBoneList(model);
      const boneVertexMap = makeBoneVertexMap(bones);

      skeletonHelperRef.current = helper;
      boneVertexMapRef.current = boneVertexMap;
      scene.add(helper);

      return () => {
        scene.remove(helper);
        skeletonHelperRef.current = null;
        boneVertexMapRef.current = null;
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

    // Update collider positions based on bone world positions from SkeletonHelper
    if (skeletonHelperRef.current && boneVertexMapRef.current && model) {
      // Update the model's world matrices to ensure bone positions are current
      model.updateMatrixWorld(true);
      // Update the skeleton helper's geometry (it reads from bones internally)
      skeletonHelperRef.current.updateMatrixWorld(true);

      const positions = skeletonHelperRef.current.geometry.attributes.position;

      // Update torso position based on spine bone
      const spinePos = getBoneWorldPosition(
        'mixamorigSpine',
        boneVertexMapRef.current,
        positions,
      );
      if (spinePos) {
        spinePos.multiplyScalar(CHARACTER_DEFAULTS.SCALE);
        setTorsoPosition([
          spinePos.x,
          spinePos.y + CHARACTER_DEFAULTS.COLLIDERS.TORSO.offset.y,
          spinePos.z + CHARACTER_DEFAULTS.COLLIDERS.TORSO.offset.z,
        ]);
      }

      // Update head position based on head bone
      const headBonePos = getBoneWorldPosition(
        'mixamorigHead',
        boneVertexMapRef.current,
        positions,
      );
      if (headBonePos) {
        headBonePos.multiplyScalar(CHARACTER_DEFAULTS.SCALE);
        setHeadPosition([
          headBonePos.x,
          headBonePos.y + CHARACTER_DEFAULTS.COLLIDERS.HEAD.offset.y,
          headBonePos.z + CHARACTER_DEFAULTS.COLLIDERS.HEAD.offset.z,
        ]);
      }
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
        position={torsoPosition}
      />
      {/* Head capsule */}
      <CapsuleCollider
        args={[
          CHARACTER_DEFAULTS.COLLIDERS.HEAD.halfHeight,
          CHARACTER_DEFAULTS.COLLIDERS.HEAD.radius,
        ]}
        position={headPosition}
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
