'use client';

import { useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Character } from '@/app/components/Character';
import { Bot } from '@/app/components/Bot';
import { World } from '@/app/components/World';
import { useKeyboardControls } from '@/app/components/hooks/useKeyboardControls';
import { Controls } from '@/app/components/Controls';
import { ENVIRONMENT_DEFAULTS, GAME_DEFAULTS } from '@/app/constants';

function createInitialBots(): Record<string, boolean> {
  const bots: Record<string, boolean> = {};
  for (let i = 0; i < GAME_DEFAULTS.INITIAL_BOT_COUNT; i++) {
    bots[`bot-${i}`] = true;
  }
  return bots;
}

export default function Home() {
  const { keys, updateKey } = useKeyboardControls();
  const [bots, setBots] = useState<Record<string, boolean>>(createInitialBots);

  const handleBotDeath = useCallback((id: string) => {
    setBots((prevBots) => {
      const newBots = { ...prevBots };
      delete newBots[id];
      return newBots;
    });
  }, []);

  const botComponents = useMemo(() => {
    return Object.keys(bots).map((id) => (
      <Bot key={id} id={id} onDeath={handleBotDeath} />
    ));
  }, [bots, handleBotDeath]);

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
        <Physics gravity={[0, 0, 0]} debug={ENVIRONMENT_DEFAULTS.physics.debug}>
          {botComponents}
          <Character keys={keys} />
        </Physics>
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
