'use client';

import { useEffect, useRef } from 'react';
import GUI from 'lil-gui';
import {
  DebugSettings,
  DEFAULT_DEBUG_SETTINGS,
} from '@/app/components/hooks/useDebugSettings';

interface DebugGuiProps {
  settings: DebugSettings;
  onSettingsChange: (newSettings: Partial<DebugSettings>) => void;
}

export function DebugGui({ settings, onSettingsChange }: DebugGuiProps) {
  const guiRef = useRef<GUI | null>(null);
  // lil-gui requires a mutable object to bind to
  const settingsObjRef = useRef<DebugSettings>({ ...DEFAULT_DEBUG_SETTINGS });

  // Sync the ref with incoming settings
  useEffect(() => {
    settingsObjRef.current = { ...settings };
  }, [settings]);

  useEffect(() => {
    const gui = new GUI({ title: 'Debug Settings' });
    guiRef.current = gui;

    // Position in top right corner
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '0';
    gui.domElement.style.right = '0';

    // Add controls that modify the ref and call onSettingsChange
    gui
      .add(settingsObjRef.current, 'debugMode')
      .name('Debug Mode')
      .onChange((value: boolean) => onSettingsChange({ debugMode: value }));
    gui
      .add(settingsObjRef.current, 'walkEnabled')
      .name('Walk Enabled')
      .onChange((value: boolean) => onSettingsChange({ walkEnabled: value }));
    gui
      .add(settingsObjRef.current, 'walkDurationMS', 100, 5000, 100)
      .name('Walk Duration (ms)')
      .onChange((value: number) => onSettingsChange({ walkDurationMS: value }));
    gui
      .add(settingsObjRef.current, 'attackEnabled')
      .name('Attack Enabled')
      .onChange((value: boolean) => onSettingsChange({ attackEnabled: value }));
    gui
      .add(settingsObjRef.current, 'attackDurationMS', 100, 5000, 100)
      .name('Attack Duration (ms)')
      .onChange((value: number) =>
        onSettingsChange({ attackDurationMS: value }),
      );

    return () => {
      gui.destroy();
      guiRef.current = null;
    };
  }, [onSettingsChange]);

  return null;
}
