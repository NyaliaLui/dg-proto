'use client';

import { useEffect, useRef, RefObject } from 'react';
import GUI from 'lil-gui';
import { DebugSettings } from '@/app/components/hooks/useDebugSettings';

interface DebugGuiProps {
  settingsRef: RefObject<DebugSettings>;
  onSettingsChange: () => void;
}

export function DebugGui({ settingsRef, onSettingsChange }: DebugGuiProps) {
  const guiRef = useRef<GUI | null>(null);

  useEffect(() => {
    const gui = new GUI({ title: 'Debug Settings' });
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
