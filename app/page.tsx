'use client';

import { useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Character } from '@/app/components/Character';
import { Barbarian } from '@/app/components/Barbarian';
import { World } from '@/app/components/World';
import { useKeyboardControls } from '@/app/components/hooks/useKeyboardControls';
import { Controls } from '@/app/components/Controls';
import { DebugGui } from '@/app/components/DebugGui';
import { HealthBar } from '@/app/components/HealthBar';
import { GameOver } from '@/app/components/GameOver';
import { useDebugSettings } from '@/app/components/hooks/useDebugSettings';
import { ENVIRONMENT_DEFAULTS, GAME_DEFAULTS } from '@/app/constants';
import { Button } from 'flowbite-react';

function createInitialBarbarians(): Record<string, boolean> {
  const barbarians: Record<string, boolean> = {};
  for (let i = 0; i < GAME_DEFAULTS.INITIAL_BARBARIAN_COUNT; i++) {
    barbarians[`barbarian-${i}`] = true;
  }
  return barbarians;
}

export default function Home() {
  const { settings, updateSettings } = useDebugSettings();
  const { keys, updateKey } = useKeyboardControls(settings);
  const [barbarians, setBarbarians] = useState<Record<string, boolean>>(createInitialBarbarians);
  const [playerHP, setPlayerHP] = useState(GAME_DEFAULTS.PLAYER_MAX_HP);
  const [debugGuiHidden, setDebugGuiHidden] = useState(true);

  const handleBarbarianDeath = useCallback((id: string) => {
    setBarbarians((prevBarbarians) => {
      const newBarbarians = { ...prevBarbarians };
      delete newBarbarians[id];
      return newBarbarians;
    });
  }, []);

  const handlePlayerHit = useCallback(() => {
    setPlayerHP((prevHP) => Math.max(0, prevHP - 10));
  }, []);

  const barbarianComponents = useMemo(() => {
    return Object.keys(barbarians).map((id) => (
      <Barbarian
        key={id}
        id={id}
        onDeath={handleBarbarianDeath}
        settings={settings}
      />
    ));
  }, [barbarians, handleBarbarianDeath, settings]);

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
        <Physics gravity={[0, 0, 0]} debug={settings.debugMode}>
          {barbarianComponents}
          <Character keys={keys} onHit={handlePlayerHit} settings={settings} />
        </Physics>
        <World />
        <OrbitControls
          enableZoom={ENVIRONMENT_DEFAULTS.orbitControls.enableZoom}
          enablePan={ENVIRONMENT_DEFAULTS.orbitControls.enablePan}
          enableRotate={ENVIRONMENT_DEFAULTS.orbitControls.enableRotate}
        />
      </Canvas>
      <Controls updateKey={updateKey} settings={settings} />
      <Button
        onClick={() => setDebugGuiHidden((prev) => !prev)}
        color="gray"
        size="xs"
        className="absolute top-4 right-4"
      >
        Debug Settings
      </Button>
      <DebugGui
        settings={settings}
        onSettingsChange={updateSettings}
        hidden={debugGuiHidden}
      />
      <HealthBar currentHP={playerHP} maxHP={GAME_DEFAULTS.PLAYER_MAX_HP} />
      <GameOver show={playerHP <= 0} />
    </div>
  );
}
