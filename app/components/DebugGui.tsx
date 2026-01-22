'use client';

import { useEffect } from 'react';
import { Leva, useControls } from 'leva';
import { DebugSettings } from '@/app/components/hooks/useDebugSettings';

interface DebugGuiProps {
  settings: DebugSettings;
  onSettingsChange: (newSettings: Partial<DebugSettings>) => void;
}

export function DebugGui({ settings, onSettingsChange }: DebugGuiProps) {
  const controls = useControls('Debug Settings', {
    debugMode: {
      value: settings.debugMode,
      label: 'Debug Mode',
    },
    enableBotWalk: {
      value: settings.enableBotWalk,
      label: 'Enable Bot Walk',
    },
    botWalkDurationMS: {
      value: settings.botWalkDurationMS,
      min: 100,
      max: 5000,
      step: 100,
      label: 'Bot Walk Duration (ms)',
    },
    enableBotAttack: {
      value: settings.enableBotAttack,
      label: 'Enable Bot Attack',
    },
    attackSpeed: {
      value: settings.attackSpeed,
      min: 100,
      max: 5000,
      step: 100,
      label: 'Attack Speed (ms)',
    },
  });

  useEffect(() => {
    onSettingsChange({
      debugMode: controls.debugMode,
      enableBotWalk: controls.enableBotWalk,
      botWalkDurationMS: controls.botWalkDurationMS,
      enableBotAttack: controls.enableBotAttack,
      attackSpeed: controls.attackSpeed,
    });
  }, [
    controls.debugMode,
    controls.enableBotWalk,
    controls.botWalkDurationMS,
    controls.enableBotAttack,
    controls.attackSpeed,
    onSettingsChange,
  ]);

  return <Leva />;
}
