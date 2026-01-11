import { useState, useCallback } from 'react';
import { BOT_DEFAULTS } from '@/app/constants';

export interface DebugSettings {
  debugMode: boolean;
  enableBotWalk: boolean;
  botWalkDurationMS: number;
  enableBotAttack: boolean;
  botAttackDurationMS: number;
}

export const DEFAULT_DEBUG_SETTINGS: DebugSettings = {
  debugMode: false,
  enableBotWalk: BOT_DEFAULTS.enableBotWalk,
  botWalkDurationMS: BOT_DEFAULTS.botWalkDurationMS,
  enableBotAttack: BOT_DEFAULTS.enableBotAttack,
  botAttackDurationMS: BOT_DEFAULTS.botAttackDurationMS,
};

export function useDebugSettings() {
  const [settings, setSettings] = useState<DebugSettings>(
    DEFAULT_DEBUG_SETTINGS,
  );

  const updateSettings = useCallback((newSettings: Partial<DebugSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  return {
    settings,
    updateSettings,
  };
}
