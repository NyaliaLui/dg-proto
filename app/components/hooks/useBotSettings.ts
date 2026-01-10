import { useRef, useCallback, useState } from 'react';
import { BOT_DEFAULTS } from '@/app/constants';

export interface BotSettings {
  walkEnabled: boolean;
  walkDurationMS: number;
}

export function useBotSettings() {
  const [, forceRender] = useState(0);

  const settingsRef = useRef<BotSettings>({
    walkEnabled: BOT_DEFAULTS.walkEnabled,
    walkDurationMS: BOT_DEFAULTS.walkDurationMS,
  });

  const updateSettings = useCallback(() => {
    forceRender((n) => n + 1);
  }, []);

  return {
    settingsRef,
    updateSettings,
  };
}
