import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  expect,
  describe,
  it,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { DebugGui } from '@/app/components/DebugGui';
import { DEFAULT_DEBUG_SETTINGS } from '@/app/components/hooks/useDebugSettings';

describe('DebugGui Component', () => {
  const mockOnSettingsChange = jest.fn();

  beforeEach(() => {
    mockOnSettingsChange.mockClear();
  });

  afterEach(() => {
    // Clean up Leva's store between tests
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the Leva panel with Debug Settings folder', () => {
      render(
        <DebugGui
          settings={DEFAULT_DEBUG_SETTINGS}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      // Leva renders the folder name as text
      expect(screen.getByText('Debug Settings')).toBeInTheDocument();
    });

    it('should render all control labels', () => {
      render(
        <DebugGui
          settings={DEFAULT_DEBUG_SETTINGS}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      expect(screen.getByText('Debug Mode')).toBeInTheDocument();
      expect(screen.getByText('Enable Bot Walk')).toBeInTheDocument();
      expect(screen.getByText('Bot Walk Duration (ms)')).toBeInTheDocument();
      expect(screen.getByText('Enable Bot Attack')).toBeInTheDocument();
      expect(screen.getByText('Attack Speed (ms)')).toBeInTheDocument();
    });
  });

  describe('Settings Change', () => {
    it('should call onSettingsChange on initial render', () => {
      render(
        <DebugGui
          settings={DEFAULT_DEBUG_SETTINGS}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        debugMode: DEFAULT_DEBUG_SETTINGS.debugMode,
        enableBotWalk: DEFAULT_DEBUG_SETTINGS.enableBotWalk,
        botWalkDurationMS: DEFAULT_DEBUG_SETTINGS.botWalkDurationMS,
        enableBotAttack: DEFAULT_DEBUG_SETTINGS.enableBotAttack,
        attackSpeed: DEFAULT_DEBUG_SETTINGS.attackSpeed,
      });
    });
  });
});
