import { useState, useCallback } from 'react';
import { BOT_DEFAULTS } from '@/app/constants';

export interface DebugSettings {
  debugMode: boolean;
  walkEnabled: boolean;
  walkDurationMS: number;
  attackEnabled: boolean;
  attackDurationMS: number;
}

export const DEFAULT_DEBUG_SETTINGS: DebugSettings = {
  debugMode: false,
  walkEnabled: BOT_DEFAULTS.walkEnabled,
  walkDurationMS: BOT_DEFAULTS.walkDurationMS,
  attackEnabled: BOT_DEFAULTS.attackEnabled,
  attackDurationMS: BOT_DEFAULTS.attackDurationMS,
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
