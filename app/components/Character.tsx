'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { CHARACTER_DEFAULTS } from '@/app/constants';
import { KeyState } from '@/app/components/hooks/useKeyboardControls';
import { calculateBoundingBox, checkCollision, logBox } from '@/app/collision';
import { BoundsVisualizer } from '@/app/components/BoundsVisualizer';
import { NPCHandle } from '@/app/components/NPC';

interface CharacterProps {
  keys: KeyState;
  npcRef: React.RefObject<NPCHandle | null>;
}

export function Character({ keys, npcRef }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lastRotationRef = useRef<number>(Math.PI / 2);
  const [boundingBoxes, setBoundingBoxes] = useState<THREE.Box3[]>([]);
  const [isColliding, setIsColliding] = useState(false);

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

    if (groupRef.current) {
      // Create bounding boxes for each child of currentFbx
      const childBoxes: THREE.Box3[] = [];
      const childBox = calculateBoundingBox(
        'pre',
        currentFbx.children[0].children[0],
      );
      childBoxes.push(childBox);
      // currentFbx.children[0].children.forEach((child: THREE.Object3D<THREE.Object3DEventMap>, index: number) => {
      //   console.log(`${child.name}:${index}=>${child.children.length}`);
      //   const childBox = calculateBoundingBox(child);
      //   childBoxes.push(childBox);
      // });
      setBoundingBoxes(childBoxes);

      // Get NPC data
      const npcBounds = npcRef.current?.getBoundingBox();

      // Check collision with NPC - check if any child box collides
      let collision = false;
      if (npcBounds) {
        for (const childBox of childBoxes) {
          if (checkCollision(childBox, npcBounds)) {
            collision = true;
            break;
          }
        }
        setIsColliding(collision);
      }

      const moveSpeed = CHARACTER_DEFAULTS.MOVE_SPEED * delta;
      const previousPosition = groupRef.current.position.clone();

      // WASD movement with rotation to face direction (right-handed coordinate system)
      if (keys.w) {
        groupRef.current.position.z -= moveSpeed; // Move forward (toward -Z)
        groupRef.current.rotation.y = Math.PI; // Face forward (-Z direction)
      }
      if (keys.s) {
        groupRef.current.position.z += moveSpeed; // Move backward (toward +Z)
        groupRef.current.rotation.y = 0; // Face backward (+Z direction, toward camera)
      }
      if (keys.a) {
        groupRef.current.position.x -= moveSpeed; // Move left (toward -X)
        groupRef.current.rotation.y = -Math.PI / 2; // Face left (-X direction)
        lastRotationRef.current = -Math.PI / 2;
      }
      if (keys.d) {
        groupRef.current.position.x += moveSpeed; // Move right (toward +X)
        groupRef.current.rotation.y = Math.PI / 2; // Face right (+X direction)
        lastRotationRef.current = Math.PI / 2;
      }

      // Collision response: revert position if collision detected after movement
      if (npcBounds && groupRef.current) {
        // Recalculate child boxes after movement
        const newChildBoxes: THREE.Box3[] = [];
        const childBox = calculateBoundingBox(
          'post',
          currentFbx.children[0].children[0],
        );
        newChildBoxes.push(childBox);
        // currentFbx.children[0].children.forEach((child: THREE.Object3D<THREE.Object3DEventMap>) => {
        //   const childBox = calculateBoundingBox(child);
        //   newChildBoxes.push(childBox);
        // });

        // Check if any child box collides with NPC
        let hasCollision = false;
        for (const childBox of newChildBoxes) {
          if (checkCollision(childBox, npcBounds)) {
            hasCollision = true;
            break;
          }
        }

        if (hasCollision) {
          groupRef.current.position.copy(previousPosition);
          setIsColliding(true);
        }
      }

      // When idle, maintain last rotation
      if (!moving) {
        groupRef.current.rotation.y = lastRotationRef.current;
      }

      if (isColliding && boundingBoxes.length > 0) {
        boundingBoxes.forEach((box, index) => {
          console.log(`Child ${index}:`);
          // logBox(box);
        });
        if (npcBounds) {
          console.log('NPC:');
          // logBox(npcBounds);
        }
      }
    }
  });

  return (
    <>
      <group ref={groupRef} position={[-1, 0, 0]}>
        <primitive object={currentFbx} scale={CHARACTER_DEFAULTS.SCALE} />
      </group>

      {/* Visualize character bounding boxes - one for each child */}
      {boundingBoxes.map((box, index) => (
        <BoundsVisualizer
          key={`char-box-${index}`}
          box={box}
          color="#00ff00"
          isColliding={isColliding}
        />
      ))}
    </>
  );
}
