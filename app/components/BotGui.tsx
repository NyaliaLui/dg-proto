'use client';

import { useEffect, useRef, MutableRefObject } from 'react';
import GUI from 'lil-gui';
import { BotSettings } from '@/app/components/hooks/useBotSettings';

interface BotGuiProps {
  settingsRef: MutableRefObject<BotSettings>;
  onSettingsChange: () => void;
}

export function BotGui({ settingsRef, onSettingsChange }: BotGuiProps) {
  const guiRef = useRef<GUI | null>(null);

  useEffect(() => {
    const gui = new GUI({ title: 'Bot Settings' });
    guiRef.current = gui;

    // Position in top right corner
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '0';
    gui.domElement.style.right = '0';

    // Add controls that modify the ref and trigger re-render
    gui
      .add(settingsRef.current, 'walkEnabled')
      .name('Walk Enabled')
      .onChange(onSettingsChange);
    gui
      .add(settingsRef.current, 'walkDurationMS', 100, 5000, 100)
      .name('Walk Duration (ms)')
      .onChange(onSettingsChange);
    gui
      .add(settingsRef.current, 'attackEnabled')
      .name('Attack Enabled')
      .onChange(onSettingsChange);
    gui
      .add(settingsRef.current, 'attackDurationMS', 100, 5000, 100)
      .name('Attack Duration (ms)')
      .onChange(onSettingsChange);

    return () => {
      gui.destroy();
      guiRef.current = null;
    };
  }, [settingsRef, onSettingsChange]);

  return null;
}
