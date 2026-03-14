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
import { KeyState } from '@/app/components/hooks/useKeyboardControls';
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

  const [attacking, setAttacking] = useState(false);

  // Determine if character is moving (not moving if attacking)
  const moving = useMemo(() => {
    return !attacking && (keys.w || keys.s || keys.a || keys.d);
  }, [keys, attacking]);

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
  const attackingRef = useRef(false);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  const prevQRef = useRef(false);
  const prevERef = useRef(false);

  // Initialize mixer once
  useEffect(() => {
    if (!model) return;

    const m = new THREE.AnimationMixer(model);
    mixer.current = m;

    // When attack animation finishes, go back to idle/walk
    const onFinished = () => {
      attackingRef.current = false;
      setAttacking(false);
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

      // Detect Q/E key press edge (rising edge)
      const qPressed = keys.q && !prevQRef.current;
      const ePressed = keys.e && !prevERef.current;
      if ((qPressed || ePressed) && !attackingRef.current) {
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

      // Transition to idle/walk when not attacking
      if (!attackingRef.current) {
        const clip = moving ? walkAnim : idleAnim;
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
        if (attacking) {
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
      if (!attackingRef.current) {
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
          scale={CHARACTER_DEFAULTS.SCALE}
          position={[0, -0.9, 0]}
        />
      </group>
    </RigidBody>
  );
}
