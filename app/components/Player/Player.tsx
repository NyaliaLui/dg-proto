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

import { SHARED_DEFAULTS, PLAYER_DEFAULTS } from '@/app/constants';
import { KeyState } from '@/app/components/Player/hooks/useKeyboardControls';
import { DebugSettings } from '@/app/components/hooks/useDebugSettings';
import {
  getAnimation,
  getBoneList,
  makeBoneVertexMap,
  getBoneWorldPosition,
  makeFanVertices,
  BoneVertexMap,
} from '@/app/utils';

interface PlayerProps {
  keys: KeyState;
  onHit?: () => void;
  settings: DebugSettings;
}

export function Player({ keys, onHit, settings }: PlayerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
  const lastRotationRef = useRef<number>(Math.PI / 2);
  const [torsoPosition, setTorsoPosition] = useState<[number, number, number]>([
    ...SHARED_DEFAULTS.COLLIDERS.TORSO.position,
  ]);
  const [headPosition, setHeadPosition] = useState<[number, number, number]>([
    ...SHARED_DEFAULTS.COLLIDERS.HEAD.position,
  ]);
  const [swordPosition, setSwordPosition] = useState<[number, number, number]>([
    ...PLAYER_DEFAULTS.COLLIDERS.SWORD.position,
  ]);
  const fanVertices = useMemo(
    () =>
      makeFanVertices(
        PLAYER_DEFAULTS.COLLIDERS.SWORD.innerRadius,
        PLAYER_DEFAULTS.COLLIDERS.SWORD.outerRadius,
        PLAYER_DEFAULTS.COLLIDERS.SWORD.halfAngle,
        PLAYER_DEFAULTS.COLLIDERS.SWORD.halfThickness,
        PLAYER_DEFAULTS.COLLIDERS.SWORD.segments,
      ),
    [],
  );
  const { scene } = useThree();
  const skeletonHelperRef = useRef<SkeletonHelper | null>(null);
  const boneVertexMapRef = useRef<BoneVertexMap | null>(null);

  const [attacking, setAttacking] = useState(false);
  const [jumping, setJumping] = useState(false);

  const crouching = keys.ctrl;

  // Determine if character is moving (not moving if attacking, crouching, or jumping)
  const moving = useMemo(() => {
    return (
      !attacking &&
      !crouching &&
      !jumping &&
      (keys.w || keys.s || keys.a || keys.d)
    );
  }, [keys, attacking, crouching, jumping]);

  // Load the skinned model
  const modelFbx = useFBX(PLAYER_DEFAULTS.MODEL);

  // Load animations from separate files
  const idleAnim = getAnimation(useFBX(SHARED_DEFAULTS.ANIMATIONS.IDLE));
  const walkAnim = getAnimation(useFBX(SHARED_DEFAULTS.ANIMATIONS.WALK));
  const normalAnim = getAnimation(useFBX(PLAYER_DEFAULTS.ANIMATIONS.NORMAL));
  const crouchAnim = getAnimation(useFBX(PLAYER_DEFAULTS.ANIMATIONS.CROUCH));
  const jumpAnim = getAnimation(useFBX(PLAYER_DEFAULTS.ANIMATIONS.JUMP));


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
  const attackingRef = useRef(false);
  const jumpingRef = useRef(false);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  const prevQRef = useRef(false);
  const prevERef = useRef(false);
  const prevSpaceRef = useRef(false);

  // Initialize mixer once
  useEffect(() => {
    if (!model) return;

    const m = new THREE.AnimationMixer(model);
    mixer.current = m;

    // When one-shot animation finishes, go back to idle/walk
    const onFinished = () => {
      attackingRef.current = false;
      setAttacking(false);
      jumpingRef.current = false;
      setJumping(false);
    };
    m.addEventListener('finished', onFinished);

    // Start with idle
    const action = m.clipAction(idleAnim);
    action.play();
    currentActionRef.current = action;

    return () => {
      m.removeEventListener('finished', onFinished);
      m.stopAllAction();
      mixer.current = null;
      currentActionRef.current = null;
    };
  }, [model, idleAnim]);

  useFrame((_state, delta) => {
    if (mixer.current) {
      const m = mixer.current;

      // Detect Q/E key press edge (rising edge) - block attacks while crouching
      const qPressed = keys.q && !prevQRef.current;
      const ePressed = keys.e && !prevERef.current;
      if ((qPressed || ePressed) && !attackingRef.current && !crouching) {
        attackingRef.current = true;
        setAttacking(true);

        const attackAction = m.clipAction(normalAnim);
        attackAction.reset();
        attackAction.setLoop(THREE.LoopOnce, 1);
        attackAction.clampWhenFinished = false;

        if (currentActionRef.current) {
          currentActionRef.current.fadeOut(0.1);
        }
        attackAction.fadeIn(0.1).play();
        currentActionRef.current = attackAction;
      }
      prevQRef.current = keys.q;
      prevERef.current = keys.e;

      // Detect Space key press edge (rising edge) - block jump while crouching or attacking
      const spacePressed = keys.space && !prevSpaceRef.current;
      if (
        spacePressed &&
        !jumpingRef.current &&
        !attackingRef.current &&
        !crouching
      ) {
        jumpingRef.current = true;
        setJumping(true);

        const jumpAction = m.clipAction(jumpAnim);
        jumpAction.reset();
        jumpAction.setLoop(THREE.LoopOnce, 1);
        jumpAction.clampWhenFinished = false;

        if (currentActionRef.current) {
          currentActionRef.current.fadeOut(0.1);
        }
        jumpAction.fadeIn(0.1).play();
        currentActionRef.current = jumpAction;
      }
      prevSpaceRef.current = keys.space;

      // Transition to idle/walk/crouch when not attacking or jumping
      if (!attackingRef.current && !jumpingRef.current) {
        const clip = crouching ? crouchAnim : moving ? walkAnim : idleAnim;
        const nextAction = m.clipAction(clip);

        if (currentActionRef.current !== nextAction) {
          nextAction.reset();
          nextAction.setLoop(THREE.LoopRepeat, Infinity);
          if (currentActionRef.current) {
            currentActionRef.current.fadeOut(0.1);
          }
          nextAction.fadeIn(0.1).play();
          currentActionRef.current = nextAction;
        }
      }

      m.update(delta);
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

        // Update sword position (only during attack)
        if (attacking) {
          const swordPos = getBoneWorldPosition(
            'mixamorigSpine1',
            boneVertexMapRef.current,
            positions,
          );
          if (swordPos) {
            swordPos.multiplyScalar(SHARED_DEFAULTS.SCALE);
            setSwordPosition([
              swordPos.x,
              swordPos.y + PLAYER_DEFAULTS.COLLIDERS.SWORD.offset.y,
              swordPos.z + PLAYER_DEFAULTS.COLLIDERS.SWORD.offset.z,
            ]);
          }
        }
      }
    }

    if (rigidBodyRef.current) {
      const moveSpeed = SHARED_DEFAULTS.MOVE_SPEED;
      const velocity = { x: 0, y: 0, z: 0 };

      // Block movement during attacks, crouching, or jumping
      if (!attackingRef.current && !crouching && !jumpingRef.current) {
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
          SHARED_DEFAULTS.COLLIDERS.TORSO.halfHeight,
          SHARED_DEFAULTS.COLLIDERS.TORSO.radius,
        ]}
        position={torsoPosition}
        sensor
        onIntersectionEnter={onHit}
      />
      {/* Head capsule */}
      <CapsuleCollider
        args={[
          SHARED_DEFAULTS.COLLIDERS.HEAD.halfHeight,
          SHARED_DEFAULTS.COLLIDERS.HEAD.radius,
        ]}
        position={headPosition}
        sensor
        onIntersectionEnter={onHit}
      />
      {/* Sword fan collider - only active during attack */}
      {attacking && (
        <ConvexHullCollider
          args={[fanVertices]}
          position={swordPosition}
          rotation={[0, 0, -Math.PI / 5]}
        />
      )}
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
