'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Player } from '@/app/components/Player/Player';
import {
  Barbarian,
  BarbarianHandle,
} from '@/app/components/Barbarian/Barbarian';
import { World } from '@/app/components/World';
import { useKeyboardControls } from '@/app/components/Player/hooks/useKeyboardControls';
import { Controls } from '@/app/components/Player/Controls';
import { DebugGui } from '@/app/components/DebugGui';
import { HealthBar } from '@/app/components/Player/HealthBar';
import { GameOver } from '@/app/components/GameOver';
import { useDebugSettings } from '@/app/components/hooks/useDebugSettings';
import * as THREE from 'three';
import { ENVIRONMENT_DEFAULTS, GAME_DEFAULTS } from '@/app/constants';
import { Button } from 'flowbite-react';
import { BarbarianAIClient } from '@/app/ai/BarbarianAIClient';
import type {
  ClientPlayerState,
  ClientBarbarianState,
  BarbarianDecision,
} from '@/app/ai/sharedTypes';

/** Initial spawn position per barbarian — spread along Z so they don't overlap. */
function createInitialBarbarians(): Record<string, [number, number, number]> {
  const barbarians: Record<string, [number, number, number]> = {};
  const count = GAME_DEFAULTS.INITIAL_BARBARIAN_COUNT;
  for (let i = 0; i < count; i++) {
    const z = (i - (count - 1) / 2) * 3; // e.g. 1 barb → z=0, 2 barbs → z=±1.5
    barbarians[`barbarian-${i}`] = [3, 0.9, z];
  }
  return barbarians;
}

export default function Home() {
  const { settings, updateSettings } = useDebugSettings();
  const { keys, updateKey } = useKeyboardControls(settings);
  const [barbarians, setBarbarians] = useState<
    Record<string, [number, number, number]>
  >(createInitialBarbarians);
  const [playerHP, setPlayerHP] = useState(GAME_DEFAULTS.PLAYER_MAX_HP);
  const [debugGuiHidden, setDebugGuiHidden] = useState(true);
  const barbarianGroupsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const barbarianRefsRef = useRef<Map<string, BarbarianHandle>>(new Map());

  // ── Shared refs for AI client ──────────────────────────────────────────────
  const playerPositionRef = useRef(new THREE.Vector3());
  const playerStateRef = useRef<ClientPlayerState | null>(null);
  const playerHPRef = useRef<number>(GAME_DEFAULTS.PLAYER_MAX_HP);
  const barbarianStatesRef = useRef<Record<string, ClientBarbarianState>>({});
  const barbarianDecisionsRef = useRef<
    Record<string, BarbarianDecision | null>
  >({});
  const aiClientRef = useRef<BarbarianAIClient | null>(null);

  // Keep playerHPRef in sync with React state
  useEffect(() => {
    playerHPRef.current = playerHP;
  }, [playerHP]);

  // Start the AI client once on mount, clean up on unmount
  useEffect(() => {
    const half = ENVIRONMENT_DEFAULTS.groundDim / 2;
    const client = new BarbarianAIClient({
      serverUrl: 'ws://localhost:8765',
      playerStateRef,
      playerHPRef,
      barbarianStatesRef,
      barbarianDecisionsRef,
      getEnvironment: () => ({
        worldBounds: { minX: -half, maxX: half, minZ: -half, maxZ: half },
        groundY: 0,
      }),
      onSpawn: (spawn) => {
        setBarbarians((prev) => ({
          ...prev,
          [spawn.barbarianId]: [
            spawn.spawnPosition.x,
            spawn.spawnPosition.y,
            spawn.spawnPosition.z,
          ],
        }));
      },
    });
    aiClientRef.current = client;
    return () => {
      client.disconnect();
      aiClientRef.current = null;
    };
  }, []);

  const handleBarbarianDeath = useCallback((id: string) => {
    setBarbarians((prevBarbarians) => {
      const newBarbarians = { ...prevBarbarians };
      delete newBarbarians[id];
      delete barbarianStatesRef.current[id];
      delete barbarianDecisionsRef.current[id];
      aiClientRef.current?.notifyBarbarianDied(
        id,
        Object.keys(newBarbarians).length,
      );
      return newBarbarians;
    });
  }, []);

  const handlePlayerHit = useCallback(() => {
    setPlayerHP((prevHP) => Math.max(0, prevHP - 10));
  }, []);

  const handleBarbarianRegister = useCallback(
    (id: string, model: THREE.Object3D) => {
      barbarianGroupsRef.current.set(id, model);
    },
    [],
  );

  const handleBarbarianUnregister = useCallback((id: string) => {
    barbarianGroupsRef.current.delete(id);
  }, []);

  const handleSwordHit = useCallback((barbarianId: string) => {
    barbarianRefsRef.current.get(barbarianId)?.takeDamage();
  }, []);

  const barbarianComponents = useMemo(() => {
    return Object.entries(barbarians).map(([id, initialPosition]) => (
      <Barbarian
        key={id}
        ref={(handle) => {
          if (handle) {
            barbarianRefsRef.current.set(id, handle);
          } else {
            barbarianRefsRef.current.delete(id);
          }
        }}
        id={id}
        initialPosition={initialPosition}
        onDeath={handleBarbarianDeath}
        onRegister={handleBarbarianRegister}
        onUnregister={handleBarbarianUnregister}
        settings={settings}
        playerPositionRef={playerPositionRef}
        barbarianStatesRef={barbarianStatesRef}
        barbarianDecisionsRef={barbarianDecisionsRef}
      />
    ));
  }, [
    barbarians,
    handleBarbarianDeath,
    handleBarbarianRegister,
    handleBarbarianUnregister,
    settings,
  ]);

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
          <Player
            keys={keys}
            onHit={handlePlayerHit}
            onSwordHit={handleSwordHit}
            barbarianTargets={barbarianGroupsRef}
            settings={settings}
            playerPositionRef={playerPositionRef}
            playerStateRef={playerStateRef}
          />
        </Physics>
        <World />
        <OrbitControls
          enableZoom={ENVIRONMENT_DEFAULTS.orbitControls.enableZoom}
          enablePan={ENVIRONMENT_DEFAULTS.orbitControls.enablePan}
          enableRotate={ENVIRONMENT_DEFAULTS.orbitControls.enableRotate}
        />
      </Canvas>
      <Controls updateKey={updateKey} />
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
