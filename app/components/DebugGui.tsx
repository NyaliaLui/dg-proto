'use client';

import { useEffect, useState } from 'react';
import { Leva, useControls } from 'leva';
import { DebugSettings } from '@/app/components/hooks/useDebugSettings';
import { LEVA_THEMES } from '@/app/constants';

interface DebugGuiProps {
  settings: DebugSettings;
  onSettingsChange: (newSettings: Partial<DebugSettings>) => void;
  hidden?: boolean;
}

type ScreenSize = 'mobile' | 'tablet' | 'desktop';

function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      // Breakpoints based on lg and xl tailwindcss breakpoints
      if (width >= 1024) {
        setScreenSize('tablet');
      } else if (width >= 1280) {
        setScreenSize('desktop');
      } else {
        setScreenSize('mobile');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
}

export function DebugGui({
  settings,
  onSettingsChange,
  hidden = true,
}: DebugGuiProps) {
  const screenSize = useScreenSize();
  const theme = LEVA_THEMES[screenSize];

  const controls = useControls('Debug Settings', {
    debugMode: {
      value: settings.debugMode,
      label: 'Show Hit & Hurt Boxes',
    },
    enableBotWalk: {
      value: settings.enableBotWalk,
      label: 'Enable Bot Walk',
    },
    botWalkDurationMS: {
      value: settings.botWalkDurationMS,
      label: 'Bot Walk Duration (ms)',
    },
    enableBotAttack: {
      value: settings.enableBotAttack,
      label: 'Enable Bot Attack',
    },
    attackSpeed: {
      value: settings.attackSpeed,
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

  return (
    <Leva
      hidden={hidden}
      titleBar={{ title: 'Debug Settings' }}
      theme={theme}
    />
  );
}
