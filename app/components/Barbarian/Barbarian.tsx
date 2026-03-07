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

import {
  SHARED_DEFAULTS,
  BARBARIAN_DEFAULTS,
  GAME_DEFAULTS,
  DEFAULT_COLORS,
} from '@/app/constants';
import { DebugSettings } from '@/app/components/hooks/useDebugSettings';
import {
  getAnimation,
  getBoneList,
  makeBoneVertexMap,
  getBoneWorldPosition,
  BoneVertexMap,
} from '@/app/utils';

interface BarbarianProps {
  id: string;
  onDeath?: (id: string) => void;
  settings: DebugSettings;
}

export function Barbarian({ id, onDeath, settings }: BarbarianProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
  const lastRotationRef = useRef<number>(-Math.PI / 2);
  const { scene } = useThree();
  const skeletonHelperRef = useRef<SkeletonHelper | null>(null);
  const boneVertexMapRef = useRef<BoneVertexMap | null>(null);
  const [torsoPosition, setTorsoPosition] = useState<[number, number, number]>([
    ...SHARED_DEFAULTS.COLLIDERS.TORSO.position,
  ]);
  const [headPosition, setHeadPosition] = useState<[number, number, number]>([
    ...SHARED_DEFAULTS.COLLIDERS.HEAD.position,
  ]);
  const [handPosition, setHandPosition] = useState<[number, number, number]>([
    ...BARBARIAN_DEFAULTS.COLLIDERS.HAND.position,
  ]);
  const [hp, setHp] = useState(GAME_DEFAULTS.INITIAL_BARBARIAN_HP);
  const [isWalking, setIsWalking] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isRightBlocking, setIsRightBlocking] = useState(false);
  const [isKicking, setIsKicking] = useState(false);
  const [direction, setDirection] = useState<number>(-1); // 1 = right, -1 = left
  const wasWalkingRef = useRef(false);
  const yVelocityRef = useRef<number>(0);
  const isGroundedRef = useRef<boolean>(true);
  const jumpStartYRef = useRef<number>(0);
  const jumpPendingRef = useRef<boolean>(false);

  const handleHit = useCallback(() => {
    setHp((prevHp) => {
      const newHp = prevHp - 1;
      return newHp;
    });
  }, []);

  // Notify parent when barbarian dies
  useEffect(() => {
    if (hp <= 0 && onDeath) {
      onDeath(id);
    }
  }, [hp, id, onDeath]);

  // Load the skinned model
  const modelFbx = useFBX(BARBARIAN_DEFAULTS.MODEL);

  // Load animations from separate files
  const idleAnim = getAnimation(useFBX(SHARED_DEFAULTS.ANIMATIONS.IDLE));
  const walkAnim = getAnimation(useFBX(SHARED_DEFAULTS.ANIMATIONS.WALK));
  const normalAnim = getAnimation(useFBX(BARBARIAN_DEFAULTS.ANIMATIONS.NORMAL));
  const jumpAnim = getAnimation(useFBX(BARBARIAN_DEFAULTS.ANIMATIONS.JUMP));
  const leftBlockAnim = getAnimation(
    useFBX(BARBARIAN_DEFAULTS.ANIMATIONS.LEFT_BLOCK),
  );
  const rightBlockAnim = getAnimation(
    useFBX(BARBARIAN_DEFAULTS.ANIMATIONS.RIGHT_BLOCK),
  );
  const kickAnim = getAnimation(useFBX(BARBARIAN_DEFAULTS.ANIMATIONS.KICK));

  const mixer = useRef<THREE.AnimationMixer | null>(null);

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

  // Get the current animation clip based on state (attack/jump > kick > right block > left block > walk > idle)
  const currentAnimation = useMemo(() => {
    if (isJumping) return jumpAnim;
    if (isAttacking) return normalAnim;
    if (isKicking) return kickAnim;
    if (isRightBlocking) return rightBlockAnim;
    if (isBlocking) return leftBlockAnim;
    if (isWalking) return walkAnim;
    return idleAnim;
  }, [
    isAttacking,
    isJumping,
    isKicking,
    isRightBlocking,
    isBlocking,
    isWalking,
    normalAnim,
    jumpAnim,
    kickAnim,
    rightBlockAnim,
    leftBlockAnim,
    walkAnim,
    idleAnim,
  ]);

  // Simple patrol behavior: toggle walking every barbarianWalkDurationMS and change direction
  useEffect(() => {
    const interval = setInterval(() => {
      setIsWalking((prev) => {
        if (!settings.enableBarbarianWalk) return false;
        if (!prev && !wasWalkingRef.current) {
          // Starting to walk, change direction
          setDirection((d) => d * -1);
        }
        wasWalkingRef.current = !prev;
        return !prev;
      });
    }, settings.barbarianWalkDurationMS);

    return () => clearInterval(interval);
  }, [settings.enableBarbarianWalk, settings.barbarianWalkDurationMS]);

  // Attack behavior: toggle attacking every attackSpeed
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAttacking((prev) => {
        if (!settings.enableBarbarianAttack) return false;
        return !prev;
      });
    }, settings.attackSpeed);

    return () => clearInterval(interval);
  }, [settings.enableBarbarianAttack, settings.attackSpeed]);

  // Jump behavior: trigger jump every jumpDurationMS
  useEffect(() => {
    const interval = setInterval(() => {
      if (settings.enableBarbarianJump) {
        jumpPendingRef.current = true;
      }
    }, settings.jumpDurationMS);

    return () => clearInterval(interval);
  }, [settings.enableBarbarianJump, settings.jumpDurationMS]);

  // Left block behavior: toggle blocking every blockDurationMS
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlocking((prev) => {
        if (!settings.enableBarbarianLeftBlock) return false;
        return !prev;
      });
    }, settings.blockDurationMS);

    return () => clearInterval(interval);
  }, [settings.enableBarbarianLeftBlock, settings.blockDurationMS]);

  // Right block behavior: toggle right blocking every rightBlockDurationMS
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRightBlocking((prev) => {
        if (!settings.enableBarbarianRightBlock) return false;
        return !prev;
      });
    }, settings.rightBlockDurationMS);

    return () => clearInterval(interval);
  }, [settings.enableBarbarianRightBlock, settings.rightBlockDurationMS]);

  // Kick behavior: toggle kicking every kickSpeed
  useEffect(() => {
    const interval = setInterval(() => {
      setIsKicking((prev) => {
        if (!settings.enableBarbarianKick) return false;
        return !prev;
      });
    }, settings.kickSpeed);

    return () => clearInterval(interval);
  }, [settings.enableBarbarianKick, settings.kickSpeed]);

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
      if (currentAnimation === jumpAnim) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      action.play();
    }

    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
      }
    };
  }, [model, currentAnimation, jumpAnim]);

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
          spinePos.multiplyScalar(SHARED_DEFAULTS.SCALE);
          setTorsoPosition([
            spinePos.x,
            spinePos.y + SHARED_DEFAULTS.COLLIDERS.TORSO.offset.y,
            spinePos.z + SHARED_DEFAULTS.COLLIDERS.TORSO.offset.z,
          ]);
        }

        // Update head position based on head bone
        const headBonePos = getBoneWorldPosition(
          'mixamorigHead',
          boneVertexMapRef.current,
          positions,
        );
        if (headBonePos) {
          headBonePos.multiplyScalar(SHARED_DEFAULTS.SCALE);
          setHeadPosition([
            headBonePos.x,
            headBonePos.y + SHARED_DEFAULTS.COLLIDERS.HEAD.offset.y,
            headBonePos.z + SHARED_DEFAULTS.COLLIDERS.HEAD.offset.z,
          ]);
        }

        // Update hand position (only during attack)
        if (isAttacking) {
          const leftHandPos = getBoneWorldPosition(
            'mixamorigLeftHand',
            boneVertexMapRef.current,
            positions,
          );
          if (leftHandPos) {
            leftHandPos.multiplyScalar(SHARED_DEFAULTS.SCALE);
            setHandPosition([
              leftHandPos.x,
              leftHandPos.y + BARBARIAN_DEFAULTS.COLLIDERS.HAND.offset.y,
              leftHandPos.z + BARBARIAN_DEFAULTS.COLLIDERS.HAND.offset.z,
            ]);
          }
        }
      }
    }

    // Movement and rotation logic
    if (rigidBodyRef.current) {
      const moveSpeed = SHARED_DEFAULTS.MOVE_SPEED;
      const velocity = { x: 0, y: 0, z: 0 };

      // Trigger jump while grounded
      if (jumpPendingRef.current && isGroundedRef.current) {
        jumpPendingRef.current = false;
        const t = rigidBodyRef.current.translation();
        jumpStartYRef.current = t.y;
        yVelocityRef.current = BARBARIAN_DEFAULTS.JUMP.VELOCITY;
        isGroundedRef.current = false;
        setIsJumping(true);
      }

      // Simulate vertical physics while airborne
      if (!isGroundedRef.current) {
        const clampedDelta = Math.min(delta, 1 / 30);
        yVelocityRef.current -= BARBARIAN_DEFAULTS.JUMP.GRAVITY * clampedDelta;
        const t = rigidBodyRef.current.translation();
        if (yVelocityRef.current < 0 && t.y <= jumpStartYRef.current) {
          yVelocityRef.current = 0;
          isGroundedRef.current = true;
          setIsJumping(false);
          rigidBodyRef.current.setTranslation(
            { x: t.x, y: jumpStartYRef.current, z: t.z },
            true,
          );
        }
      }

      velocity.y = yVelocityRef.current;

      // Block movement during attacks, kicks, or blocks - these take priority
      if (
        isWalking &&
        !isAttacking &&
        !isKicking &&
        !isRightBlocking &&
        !isBlocking
      ) {
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
      } else if (
        !isWalking ||
        isAttacking ||
        isKicking ||
        isRightBlocking ||
        isBlocking
      ) {
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
    const startZ = -totalWidth / 2 + blockSize / 2;

    for (let i = 0; i < hp; i++) {
      blocks.push(
        <mesh key={i} position={[0, 0, startZ + i * (blockSize + gap)]}>
          <boxGeometry args={[blockSize, blockSize, blockSize]} />
          <meshStandardMaterial color={DEFAULT_COLORS.HP_RED} />
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
          SHARED_DEFAULTS.COLLIDERS.TORSO.halfHeight,
          SHARED_DEFAULTS.COLLIDERS.TORSO.radius,
        ]}
        position={torsoPosition}
        sensor
        onIntersectionEnter={handleHit}
      />
      {/* Head capsule */}
      <CapsuleCollider
        args={[
          SHARED_DEFAULTS.COLLIDERS.HEAD.halfHeight,
          SHARED_DEFAULTS.COLLIDERS.HEAD.radius,
        ]}
        position={headPosition}
        sensor
        onIntersectionEnter={handleHit}
      />
      {/* Hand capsule - only active during attack */}
      {isAttacking && (
        <CapsuleCollider
          args={[
            BARBARIAN_DEFAULTS.COLLIDERS.HAND.halfHeight,
            BARBARIAN_DEFAULTS.COLLIDERS.HAND.radius,
          ]}
          position={handPosition}
        />
      )}
      {/* HP blocks floating above head */}
      <group
        position={[headPosition[0], headPosition[1] + 0.3, headPosition[2]]}
      >
        {hpBlocks}
      </group>
      <group ref={modelRef}>
        <primitive
          object={model}
          scale={SHARED_DEFAULTS.SCALE}
          position={[0, -0.9, 0]}
        />
      </group>
    </RigidBody>
  );
}
