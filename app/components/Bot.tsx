'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
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
import { BotSettings } from '@/app/components/hooks/useBotSettings';
import {
  getAnimation,
  getBoneList,
  makeBoneVertexMap,
  getBoneWorldPosition,
  BoneVertexMap,
} from '@/app/utils';

interface BotProps {
  id: string;
  onDeath?: (id: string) => void;
  settings: BotSettings;
}

export function Bot({ id, onDeath, settings }: BotProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
  const lastRotationRef = useRef<number>(-Math.PI / 2);
  const { scene } = useThree();
  const skeletonHelperRef = useRef<SkeletonHelper | null>(null);
  const boneVertexMapRef = useRef<BoneVertexMap | null>(null);
  const [torsoPosition, setTorsoPosition] = useState<[number, number, number]>([
    ...CHARACTER_DEFAULTS.COLLIDERS.TORSO.position,
  ]);
  const [headPosition, setHeadPosition] = useState<[number, number, number]>([
    ...CHARACTER_DEFAULTS.COLLIDERS.HEAD.position,
  ]);
  const [hp, setHp] = useState(3);
  const [isWalking, setIsWalking] = useState(false);
  const [direction, setDirection] = useState<number>(-1); // 1 = right, -1 = left
  const wasWalkingRef = useRef(false);

  const handleHit = useCallback(() => {
    setHp((prevHp) => {
      const newHp = prevHp - 1;
      return newHp;
    });
  }, []);

  // Notify parent when bot dies
  useEffect(() => {
    if (hp <= 0 && onDeath) {
      onDeath(id);
    }
  }, [hp, id, onDeath]);

  // Load the skinned model
  const modelFbx = useFBX(CHARACTER_DEFAULTS.MODELS.XBOT);

  // Load animations from separate files
  const idleAnim = getAnimation(useFBX(CHARACTER_DEFAULTS.ANIMATIONS.IDLE));
  const walkAnim = getAnimation(useFBX(CHARACTER_DEFAULTS.ANIMATIONS.WALK));

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

  // Get the current animation clip based on walking state
  const currentAnimation = useMemo(() => {
    return isWalking ? walkAnim : idleAnim;
  }, [isWalking, walkAnim, idleAnim]);

  // Simple patrol behavior: toggle walking every walkDurationMS and change direction
  useEffect(() => {
    const interval = setInterval(() => {
      setIsWalking((prev) => {
        if (!settings.walkEnabled) return false;
        if (!prev && !wasWalkingRef.current) {
          // Starting to walk, change direction
          setDirection((d) => d * -1);
        }
        wasWalkingRef.current = !prev;
        return !prev;
      });
    }, settings.walkDurationMS);

    return () => clearInterval(interval);
  }, [settings.walkEnabled, settings.walkDurationMS]);

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
      }
    }

    // Movement and rotation logic
    if (rigidBodyRef.current) {
      const moveSpeed = CHARACTER_DEFAULTS.MOVE_SPEED;
      const velocity = { x: 0, y: 0, z: 0 };

      if (isWalking) {
        velocity.x = direction * moveSpeed;

        // Set rotation based on direction
        if (direction === -1) {
          // Face -X (left)
          rigidBodyRef.current.setRotation(
            { x: 0, y: -0.707, z: 0, w: 0.707 },
            true,
          );
          lastRotationRef.current = -Math.PI / 2;
        } else {
          // Face +X (right)
          rigidBodyRef.current.setRotation(
            { x: 0, y: 0.707, z: 0, w: 0.707 },
            true,
          );
          lastRotationRef.current = Math.PI / 2;
        }
      } else {
        // When idle, maintain last rotation
        const halfAngle = lastRotationRef.current / 2;
        rigidBodyRef.current.setRotation(
          { x: 0, y: Math.sin(halfAngle), z: 0, w: Math.cos(halfAngle) },
          true,
        );
      }

      rigidBodyRef.current.setLinvel(velocity, true);
    }
  });

  const hpBlocks = useMemo(() => {
    const blocks = [];
    const blockSize = 0.08;
    const gap = 0.04;
    const totalWidth = hp * blockSize + (hp - 1) * gap;
    const startX = -totalWidth / 2 + blockSize / 2;

    for (let i = 0; i < hp; i++) {
      blocks.push(
        <mesh key={i} position={[startX + i * (blockSize + gap), 0, 0]}>
          <boxGeometry args={[blockSize, blockSize, blockSize]} />
          <meshStandardMaterial color="red" />
        </mesh>,
      );
    }
    return blocks;
  }, [hp]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={[1, 0.9, 0]}
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
        onIntersectionEnter={handleHit}
      />
      {/* Head capsule */}
      <CapsuleCollider
        args={[
          CHARACTER_DEFAULTS.COLLIDERS.HEAD.halfHeight,
          CHARACTER_DEFAULTS.COLLIDERS.HEAD.radius,
        ]}
        position={headPosition}
        sensor
        onIntersectionEnter={handleHit}
      />
      {/* HP blocks floating above head */}
      <group
        position={[headPosition[0], headPosition[1] + 0.3, headPosition[2]]}
      >
        {hpBlocks}
      </group>
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
