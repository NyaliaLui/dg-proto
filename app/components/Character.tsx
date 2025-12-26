'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import {
  CapsuleCollider,
  RigidBody,
  RapierRigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { SkeletonHelper } from 'three';

import { CHARACTER_DEFAULTS } from '@/app/constants';
import { KeyState } from '@/app/components/hooks/useKeyboardControls';
import {
  getAnimation,
  getBoneList,
  makeBoneVertexMap,
  getBoneWorldPosition,
  BoneVertexMap,
} from '@/app/utils';

interface CharacterProps {
  keys: KeyState;
}

export function Character({ keys }: CharacterProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
  const lastRotationRef = useRef<number>(Math.PI / 2);
  const [handPosition, setHandPosition] = useState<[number, number, number]>([
    0, 0.4, 0.75,
  ]);
  const { scene } = useThree();
  const skeletonHelperRef = useRef<SkeletonHelper | null>(null);
  const boneVertexMapRef = useRef<BoneVertexMap | null>(null);

  // Determine if character is moving
  const moving = useMemo(() => {
    return keys.w || keys.s || keys.a || keys.d;
  }, [keys.w, keys.s, keys.a, keys.d]);

  // Load the skinned model
  const modelFbx = useFBX(CHARACTER_DEFAULTS.MODELS.XBOT);

  // Load animations from separate files
  const idleAnim = getAnimation(useFBX(CHARACTER_DEFAULTS.ANIMATIONS.IDLE));
  const walkAnim = getAnimation(useFBX(CHARACTER_DEFAULTS.ANIMATIONS.WALK));
  const punchAnim = getAnimation(useFBX(CHARACTER_DEFAULTS.ANIMATIONS.NORMAL));

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

  const mixer = useRef<THREE.AnimationMixer | null>(null);

  // Determine which animation to play based on state
  const currentAnimation = useMemo(() => {
    if (keys.q) {
      return punchAnim;
    }
    if (moving) {
      return walkAnim;
    }
    return idleAnim;
  }, [keys.q, moving, idleAnim, walkAnim, punchAnim]);

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

  useFrame((_state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }

    // Update hand collider position based on bone world position from SkeletonHelper
    if (
      keys.q &&
      skeletonHelperRef.current &&
      boneVertexMapRef.current &&
      model
    ) {
      // Update the model's world matrices to ensure bone positions are current
      model.updateMatrixWorld(true);
      // Update the skeleton helper's geometry (it reads from bones internally)
      skeletonHelperRef.current.updateMatrixWorld(true);

      const positions = skeletonHelperRef.current.geometry.attributes.position;
      const leftHandPos = getBoneWorldPosition(
        'mixamorigLeftHand',
        boneVertexMapRef.current,
        positions,
      );
      leftHandPos?.multiplyScalar(CHARACTER_DEFAULTS.SCALE);

      if (leftHandPos && rigidBodyRef.current) {
        // Get the rigid body position to calculate relative position
        const rbPos = rigidBodyRef.current.translation();

        // Calculate hand position relative to the rigid body
        const relativePos: [number, number, number] = [
          leftHandPos.x - rbPos.x - 1.05,
          leftHandPos.y - rbPos.y,
          leftHandPos.z - rbPos.z + 0.03,
        ];

        setHandPosition(relativePos);
      }
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
      {/* Hand capsule - only active during attack */}
      {keys.q && (
        <CapsuleCollider args={[0.01, 0.08]} position={handPosition} />
      )}
      <group ref={modelRef}>
        <primitive
          object={model}
          scale={CHARACTER_DEFAULTS.SCALE}
          position={[0, -0.9, 0]}
        />
      </group>
    </RigidBody>
  );
}
