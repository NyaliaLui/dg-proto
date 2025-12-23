'use client';

import {
  useRef,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { CHARACTER_DEFAULTS } from '@/app/constants';
import {
  calculateBoundingCapsule,
  calculateHeadCapsule,
  BoundingCapsule,
} from '@/app/collision';
import { BoundsVisualizer } from '@/app/components/BoundsVisualizer';

export interface NPCHandle {
  getBoundingCapsule: () => BoundingCapsule | null;
  getRef: () => React.RefObject<THREE.Group | null>;
}

export const NPC = forwardRef<NPCHandle>((props, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const [outMostCapsule, setOutMostCapsule] = useState<BoundingCapsule | null>(
    null,
  );
  const [headCapsule, setHeadCapsule] = useState<BoundingCapsule | null>(null);

  useImperativeHandle(ref, () => ({
    getBoundingCapsule: () => outMostCapsule,
    getRef: () => groupRef,
  }));

  // Load all models
  const idleFbx = useFBX(CHARACTER_DEFAULTS.MODELS.IDLE);

  const mixer = useRef<THREE.AnimationMixer | null>(null);

  // Clone the model so it can be used independently
  const currentFbx = useMemo(() => SkeletonUtils.clone(idleFbx), [idleFbx]);

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

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = -Math.PI / 2;
    }
  }, []);

  useFrame((_state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }

    // Update bounding capsules
    if (groupRef.current) {
      const npcOutMostCapsule = calculateBoundingCapsule(groupRef.current);
      const npcHeadCapsule = calculateHeadCapsule(npcOutMostCapsule);
      setOutMostCapsule(npcOutMostCapsule);
      setHeadCapsule(npcHeadCapsule);
    }
  });

  return (
    <>
      <group ref={groupRef} position={[1, 0, 0]}>
        <primitive object={currentFbx} scale={CHARACTER_DEFAULTS.SCALE} />
      </group>

      {/* Visualize NPC bounding capsules */}
      <BoundsVisualizer capsule={outMostCapsule} color="#0000ff" />
      <BoundsVisualizer capsule={headCapsule} color="#ffff00" />
    </>
  );
});

NPC.displayName = 'NPC';
