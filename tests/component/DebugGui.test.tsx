import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
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
    it('should render without crashing', () => {
      const { container } = render(
        <DebugGui
          settings={DEFAULT_DEBUG_SETTINGS}
          onSettingsChange={mockOnSettingsChange}
        />,
      );

      // Leva is hidden, so the container should be empty
      expect(container).toBeInTheDocument();
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
