import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it } from '@jest/globals';
import { Controls, AnalogStick, OnscreenKeys } from '@/app/components/Controls';
import { CONTROLS_TEST_IDS } from '@/app/test-ids';
import { BARBARIAN_DEFAULTS } from '@/app/constants';
import { DebugSettings } from '@/app/components/hooks/useDebugSettings';

describe('Controls Component', () => {
  const mockUpdateKey = jest.fn();
  const defaultSettings: DebugSettings = {
    debugMode: false,
    enableBarbarianWalk: BARBARIAN_DEFAULTS.enableBarbarianWalk,
    barbarianWalkDurationMS: BARBARIAN_DEFAULTS.barbarianWalkDurationMS,
    enableBarbarianAttack: BARBARIAN_DEFAULTS.enableBarbarianAttack,
    attackSpeed: BARBARIAN_DEFAULTS.attackSpeed,
    enableBarbarianJump: BARBARIAN_DEFAULTS.enableBarbarianJump,
    jumpDurationMS: BARBARIAN_DEFAULTS.jumpDurationMS,
  };

  beforeEach(() => {
    mockUpdateKey.mockClear();
  });

  describe('Controls', () => {
    it('should render AnalogStick and OnscreenKeys', () => {
      render(<Controls updateKey={mockUpdateKey} settings={defaultSettings} />);

      const analogStick = screen.getByTestId(CONTROLS_TEST_IDS.ANALOG_STICK);
      const onscreenKeys = screen.getByTestId(CONTROLS_TEST_IDS.ONSCREEN_KEYS);

      expect(analogStick).toBeInTheDocument();
      expect(onscreenKeys).toBeInTheDocument();
    });
  });

  describe('AnalogStick', () => {
    it('should render the analog stick', () => {
      render(<AnalogStick updateKey={mockUpdateKey} />);
      const analogStick = screen.getByTestId(CONTROLS_TEST_IDS.ANALOG_STICK);
      expect(analogStick).toBeInTheDocument();
    });

    it('should have correct aria-label', () => {
      render(<AnalogStick updateKey={mockUpdateKey} />);
      const analogStick = screen.getByLabelText(
        'Move with the analog stick or WASD keys',
      );
      expect(analogStick).toBeInTheDocument();
    });
  });

  describe('OnscreenKeys', () => {
    it('should render all action buttons', () => {
      render(
        <OnscreenKeys updateKey={mockUpdateKey} settings={defaultSettings} />,
      );

      const specialButton = screen.getByTestId(
        CONTROLS_TEST_IDS.SPECIAL_BUTTON,
      );
      const normalButton = screen.getByTestId(CONTROLS_TEST_IDS.NORMAL_BUTTON);
      const itemButton = screen.getByTestId(CONTROLS_TEST_IDS.ITEM_BUTTON);

      expect(specialButton).toBeInTheDocument();
      expect(normalButton).toBeInTheDocument();
      expect(itemButton).toBeInTheDocument();
    });

    it('should call updateKey with q true on normal button mouse down', () => {
      render(
        <OnscreenKeys updateKey={mockUpdateKey} settings={defaultSettings} />,
      );
      const normalButton = screen.getByTestId(CONTROLS_TEST_IDS.NORMAL_BUTTON);

      fireEvent.mouseDown(normalButton);
      expect(mockUpdateKey).toHaveBeenCalledWith('q', true);
    });

    it('should call updateKey with e true on special button mouse down', () => {
      render(
        <OnscreenKeys updateKey={mockUpdateKey} settings={defaultSettings} />,
      );
      const specialButton = screen.getByTestId(
        CONTROLS_TEST_IDS.SPECIAL_BUTTON,
      );

      fireEvent.mouseDown(specialButton);
      expect(mockUpdateKey).toHaveBeenCalledWith('e', true);
    });

    it('should call updateKey with p true on item button mouse down', () => {
      render(
        <OnscreenKeys updateKey={mockUpdateKey} settings={defaultSettings} />,
      );
      const itemButton = screen.getByTestId(CONTROLS_TEST_IDS.ITEM_BUTTON);

      fireEvent.mouseDown(itemButton);
      expect(mockUpdateKey).toHaveBeenCalledWith('p', true);
    });

    it('should have correct aria-labels for all buttons', () => {
      render(
        <OnscreenKeys updateKey={mockUpdateKey} settings={defaultSettings} />,
      );

      expect(screen.getByLabelText('Special')).toBeInTheDocument();
      expect(screen.getByLabelText('Normal')).toBeInTheDocument();
      expect(screen.getByLabelText('Item')).toBeInTheDocument();
    });
  });
});
