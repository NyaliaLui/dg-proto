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
import { DebugGui } from '@/app/components/DebugGui';
import { HealthBar } from '@/app/components/HealthBar';
import { GameOver } from '@/app/components/GameOver';
import { useDebugSettings } from '@/app/components/hooks/useDebugSettings';
import { ENVIRONMENT_DEFAULTS, GAME_DEFAULTS } from '@/app/constants';
import { Button } from 'flowbite-react';

function createInitialBots(): Record<string, boolean> {
  const bots: Record<string, boolean> = {};
  for (let i = 0; i < GAME_DEFAULTS.INITIAL_BOT_COUNT; i++) {
    bots[`bot-${i}`] = true;
  }
  return bots;
}

export default function Home() {
  const { settings, updateSettings } = useDebugSettings();
  const { keys, updateKey } = useKeyboardControls(settings);
  const [bots, setBots] = useState<Record<string, boolean>>(createInitialBots);
  const [playerHP, setPlayerHP] = useState(GAME_DEFAULTS.PLAYER_MAX_HP);
  const [debugGuiHidden, setDebugGuiHidden] = useState(true);

  const handleBotDeath = useCallback((id: string) => {
    setBots((prevBots) => {
      const newBots = { ...prevBots };
      delete newBots[id];
      return newBots;
    });
  }, []);

  const handlePlayerHit = useCallback(() => {
    setPlayerHP((prevHP) => Math.max(0, prevHP - 10));
  }, []);

  const botComponents = useMemo(() => {
    return Object.keys(bots).map((id) => (
      <Bot key={id} id={id} onDeath={handleBotDeath} settings={settings} />
    ));
  }, [bots, handleBotDeath, settings]);

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
          {botComponents}
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
        size="sm"
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
