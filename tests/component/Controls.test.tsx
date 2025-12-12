import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, describe, it } from '@jest/globals';
import { Controls, AnalogStick, OnscreenKeys } from '@/app/components/Controls';
import { CONTROLS_TEST_IDS } from '@/app/test-ids';
import { CONTROLS_DEFAULTS } from '@/app/constants';

describe('Controls Component', () => {
  const mockUpdateKey = jest.fn();

  beforeEach(() => {
    mockUpdateKey.mockClear();
  });

  describe('Controls', () => {
    it('should render AnalogStick and OnscreenKeys', () => {
      render(<Controls updateKey={mockUpdateKey} />);

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
      render(<OnscreenKeys updateKey={mockUpdateKey} />);

      const jumpButton = screen.getByTestId(CONTROLS_TEST_IDS.JUMP_BUTTON);
      const specialButton = screen.getByTestId(
        CONTROLS_TEST_IDS.SPECIAL_BUTTON,
      );
      const normalButton = screen.getByTestId(CONTROLS_TEST_IDS.NORMAL_BUTTON);
      const itemButton = screen.getByTestId(CONTROLS_TEST_IDS.ITEM_BUTTON);

      expect(jumpButton).toBeInTheDocument();
      expect(specialButton).toBeInTheDocument();
      expect(normalButton).toBeInTheDocument();
      expect(itemButton).toBeInTheDocument();
    });

    it('should call updateKey with space true on jump button mouse down', () => {
      render(<OnscreenKeys updateKey={mockUpdateKey} />);
      const jumpButton = screen.getByTestId(CONTROLS_TEST_IDS.JUMP_BUTTON);

      fireEvent.mouseDown(jumpButton);
      expect(mockUpdateKey).toHaveBeenCalledWith('space', true);
    });

    it('should call updateKey with space false on jump button mouse up', () => {
      render(<OnscreenKeys updateKey={mockUpdateKey} />);
      const jumpButton = screen.getByTestId(CONTROLS_TEST_IDS.JUMP_BUTTON);

      fireEvent.mouseUp(jumpButton);

      waitFor(
        () => {
          expect(mockUpdateKey).toHaveBeenCalledWith('space', false);
        },
        { timeout: CONTROLS_DEFAULTS.MECHANICS_TIMEOUT },
      );
    });

    it('should call updateKey with q true on normal button mouse down', () => {
      render(<OnscreenKeys updateKey={mockUpdateKey} />);
      const normalButton = screen.getByTestId(CONTROLS_TEST_IDS.NORMAL_BUTTON);

      fireEvent.mouseDown(normalButton);
      expect(mockUpdateKey).toHaveBeenCalledWith('q', true);
    });

    it('should call updateKey with e true on special button mouse down', () => {
      render(<OnscreenKeys updateKey={mockUpdateKey} />);
      const specialButton = screen.getByTestId(
        CONTROLS_TEST_IDS.SPECIAL_BUTTON,
      );

      fireEvent.mouseDown(specialButton);
      expect(mockUpdateKey).toHaveBeenCalledWith('e', true);
    });

    it('should call updateKey with p true on item button mouse down', () => {
      render(<OnscreenKeys updateKey={mockUpdateKey} />);
      const itemButton = screen.getByTestId(CONTROLS_TEST_IDS.ITEM_BUTTON);

      fireEvent.mouseDown(itemButton);
      expect(mockUpdateKey).toHaveBeenCalledWith('p', true);
    });

    it('should have correct aria-labels for all buttons', () => {
      render(<OnscreenKeys updateKey={mockUpdateKey} />);

      expect(screen.getByLabelText('Jump')).toBeInTheDocument();
      expect(screen.getByLabelText('Special')).toBeInTheDocument();
      expect(screen.getByLabelText('Normal')).toBeInTheDocument();
      expect(screen.getByLabelText('Item')).toBeInTheDocument();
    });
  });
});
