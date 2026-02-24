'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import {
  CapsuleCollider,
  ConvexHullCollider,
  RigidBody,
  RapierRigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { SkeletonHelper } from 'three';

import { CHARACTER_DEFAULTS } from '@/app/constants';
import {
  KeyState,
  isAttacking,
} from '@/app/components/hooks/useKeyboardControls';
import { DebugSettings } from '@/app/components/hooks/useDebugSettings';
import {
  getAnimation,
  getBoneList,
  makeBoneVertexMap,
  getBoneWorldPosition,
  makeFanVertices,
  BoneVertexMap,
} from '@/app/utils';

interface CharacterProps {
  keys: KeyState;
  onHit?: () => void;
  settings: DebugSettings;
}

export function Character({ keys, onHit, settings }: CharacterProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
  const lastRotationRef = useRef<number>(Math.PI / 2);
  const [torsoPosition, setTorsoPosition] = useState<[number, number, number]>([
    ...CHARACTER_DEFAULTS.COLLIDERS.TORSO.position,
  ]);
  const [headPosition, setHeadPosition] = useState<[number, number, number]>([
    ...CHARACTER_DEFAULTS.COLLIDERS.HEAD.position,
  ]);
  const [swordPosition, setSwordPosition] = useState<[number, number, number]>([
    ...CHARACTER_DEFAULTS.COLLIDERS.SWORD.position,
  ]);
  const fanVertices = useMemo(
    () =>
      makeFanVertices(
        CHARACTER_DEFAULTS.COLLIDERS.SWORD.innerRadius,
        CHARACTER_DEFAULTS.COLLIDERS.SWORD.outerRadius,
        CHARACTER_DEFAULTS.COLLIDERS.SWORD.halfAngle,
        CHARACTER_DEFAULTS.COLLIDERS.SWORD.halfThickness,
        CHARACTER_DEFAULTS.COLLIDERS.SWORD.segments,
      ),
    [],
  );
  const { scene } = useThree();
  const skeletonHelperRef = useRef<SkeletonHelper | null>(null);
  const boneVertexMapRef = useRef<BoneVertexMap | null>(null);

  // Determine if character is moving (not moving if attacking)
  const moving = useMemo(() => {
    return !isAttacking(keys) && (keys.w || keys.s || keys.a || keys.d);
  }, [keys]);

  // Load the skinned model
  const modelFbx = useFBX(CHARACTER_DEFAULTS.MODELS.PALADIN);

  // Load animations from separate files
  const idleAnim = getAnimation(useFBX(CHARACTER_DEFAULTS.ANIMATIONS.IDLE));
  const walkAnim = getAnimation(useFBX(CHARACTER_DEFAULTS.ANIMATIONS.WALK));
  const normalAnim = getAnimation(useFBX(CHARACTER_DEFAULTS.ANIMATIONS.NORMAL));

  // Clone the model so it can be used independently
  const model = useMemo(() => SkeletonUtils.clone(modelFbx), [modelFbx]);

  // Create skeleton helper for visualization and build bone vertex map
  useEffect(() => {
    if (model) {
      const helper = new SkeletonHelper(model);
      helper.visible = settings.debugMode;
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
  }, [model, scene, settings.debugMode]);

  const mixer = useRef<THREE.AnimationMixer | null>(null);

  // Determine which animation to play based on state
  const currentAnimation = useMemo(() => {
    if (isAttacking(keys)) {
      return normalAnim;
    }
    if (moving) {
      return walkAnim;
    }
    return idleAnim;
  }, [keys, moving, idleAnim, walkAnim, normalAnim]);

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

    // Update collider positions based on bone world positions from SkeletonHelper
    if (skeletonHelperRef.current && boneVertexMapRef.current && model) {
      // Update the model's world matrices to ensure bone positions are current
      model.updateMatrixWorld(true);
      // Update the skeleton helper's geometry (it reads from bones internally)
      skeletonHelperRef.current.updateMatrixWorld(true);

      const positions = skeletonHelperRef.current.geometry.attributes.position;

      if (rigidBodyRef.current) {
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

        // Update sword position (only during attack)
        if (isAttacking(keys)) {
          const swordPos = getBoneWorldPosition(
            'mixamorigSpine1',
            boneVertexMapRef.current,
            positions,
          );
          if (swordPos) {
            swordPos.multiplyScalar(CHARACTER_DEFAULTS.SCALE);
            setSwordPosition([
              swordPos.x,
              swordPos.y + CHARACTER_DEFAULTS.COLLIDERS.SWORD.offset.y,
              swordPos.z + CHARACTER_DEFAULTS.COLLIDERS.SWORD.offset.z,
            ]);
          }
        }
      }
    }

    if (rigidBodyRef.current) {
      const moveSpeed = CHARACTER_DEFAULTS.MOVE_SPEED;
      const velocity = { x: 0, y: 0, z: 0 };

      // Block movement during attacks - attacks take priority
      if (!isAttacking(keys)) {
        // WASD movement with rotation to face direction
        if (keys.w) {
          velocity.z = -moveSpeed;
        }
        if (keys.s) {
          velocity.z = moveSpeed;
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

        // Apply last horizontal rotation when moving vertically without horizontal input
        if ((keys.w || keys.s) && !keys.a && !keys.d) {
          const halfAngle = lastRotationRef.current / 2;
          rigidBodyRef.current.setRotation(
            { x: 0, y: Math.sin(halfAngle), z: 0, w: Math.cos(halfAngle) },
            true,
          );
        }
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
        position={torsoPosition}
        sensor
        onIntersectionEnter={onHit}
      />
      {/* Head capsule */}
      <CapsuleCollider
        args={[
          CHARACTER_DEFAULTS.COLLIDERS.HEAD.halfHeight,
          CHARACTER_DEFAULTS.COLLIDERS.HEAD.radius,
        ]}
        position={headPosition}
        sensor
        onIntersectionEnter={onHit}
      />
      {/* Sword fan collider - only active during attack */}
      {isAttacking(keys) && (
        <ConvexHullCollider
          args={[fanVertices]}
          position={swordPosition}
          rotation={[0, 0, -Math.PI / 5]}
        />
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
