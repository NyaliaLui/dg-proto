'use client';

import { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Character } from '@/app/components/Character';
import { NPC, NPCHandle } from '@/app/components/NPC';
import { World } from '@/app/components/World';
import { useKeyboardControls } from '@/app/components/hooks/useKeyboardControls';
import { Controls } from '@/app/components/Controls';
import { ENVIRONMENT_DEFAULTS } from '@/app/constants';

export default function Home() {
  const { keys, updateKey } = useKeyboardControls();
  const npcRef = useRef<NPCHandle>(null);

  // Log to verify NPC ref is set
  useEffect(() => {
    const interval = setInterval(() => {
      if (npcRef.current) {
        const bounds = npcRef.current.getBoundingBox();
        console.log('NPC bounds:', bounds);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-full bg-zinc-900">
      <Canvas
        shadows={ENVIRONMENT_DEFAULTS.enableShadows}
        camera={{
          position: ENVIRONMENT_DEFAULTS.camera.position,
          fov: ENVIRONMENT_DEFAULTS.camera.fov,
        }}
      >
        <ambientLight intensity={ENVIRONMENT_DEFAULTS.ambientLight.intensity} />
        <directionalLight
          position={ENVIRONMENT_DEFAULTS.directionalLight.position}
          intensity={ENVIRONMENT_DEFAULTS.directionalLight.intensity}
        />
        <NPC ref={npcRef} />
        <Character keys={keys} npcRef={npcRef} />
        <World />
        <OrbitControls
          enableZoom={ENVIRONMENT_DEFAULTS.orbitControls.enableZoom}
          enablePan={ENVIRONMENT_DEFAULTS.orbitControls.enablePan}
          enableRotate={ENVIRONMENT_DEFAULTS.orbitControls.enableRotate}
        />
      </Canvas>
      <Controls updateKey={updateKey} />
    </div>
  );
}
