import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { expect, jest, describe, it } from '@jest/globals';
import { useAnalogControls } from '@/app/components/hooks/useAnalogControls';
import { createRef } from 'react';

describe('useAnalogControls Hook', () => {
  const mockUpdateKey = jest.fn();
  const mockStickRef = createRef<HTMLDivElement>();

  beforeEach(() => {
    mockUpdateKey.mockClear();

    // Mock getBoundingClientRect
    Object.defineProperty(HTMLDivElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: jest.fn(() => ({
        left: 0,
        top: 0,
        width: 80,
        height: 80,
        right: 80,
        bottom: 80,
      })),
    });
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useAnalogControls({
          updateKey: mockUpdateKey,
          stickRef: mockStickRef,
        }),
      );

      expect(result.current.isDragging).toBe(false);
      expect(result.current.knobPosition).toEqual({ x: 0, y: 0 });
      expect(result.current.handlers).toBeDefined();
      expect(result.current.handlers.mouseDown).toBeDefined();
      expect(result.current.handlers.touchStart).toBeDefined();
    });
  });

  describe('Mouse Events', () => {
    it('should set isDragging to true on mouse down', () => {
      const { result } = renderHook(() =>
        useAnalogControls({
          updateKey: mockUpdateKey,
          stickRef: mockStickRef,
        }),
      );

      const mockMouseEvent = {
        preventDefault: jest.fn(),
        clientX: 40,
        clientY: 40,
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handlers.mouseDown(mockMouseEvent);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('should reset position on mouse end', () => {
      const { result } = renderHook(() =>
        useAnalogControls({
          updateKey: mockUpdateKey,
          stickRef: mockStickRef,
        }),
      );

      const mockMouseEvent = {
        preventDefault: jest.fn(),
        clientX: 40,
        clientY: 40,
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handlers.mouseDown(mockMouseEvent);
      });

      expect(result.current.isDragging).toBe(true);

      act(() => {
        const mouseUpEvent = new MouseEvent('mouseup');
        document.dispatchEvent(mouseUpEvent);
      });

      expect(result.current.isDragging).toBe(false);
      expect(result.current.knobPosition).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Touch Events', () => {
    it('should set isDragging to true on touch start', () => {
      const { result } = renderHook(() =>
        useAnalogControls({
          updateKey: mockUpdateKey,
          stickRef: mockStickRef,
        }),
      );

      const mockTouchEvent = {
        preventDefault: jest.fn(),
        touches: [{ clientX: 40, clientY: 40 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.touchStart(mockTouchEvent);
      });

      expect(result.current.isDragging).toBe(true);
    });
  });

  describe('Key State Updates', () => {
    it('should reset all movement keys when drag ends', () => {
      const { result } = renderHook(() =>
        useAnalogControls({
          updateKey: mockUpdateKey,
          stickRef: mockStickRef,
        }),
      );

      const mockMouseEvent = {
        preventDefault: jest.fn(),
        clientX: 40,
        clientY: 40,
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handlers.mouseDown(mockMouseEvent);
      });

      act(() => {
        const mouseUpEvent = new MouseEvent('mouseup');
        document.dispatchEvent(mouseUpEvent);
      });

      expect(mockUpdateKey).toHaveBeenCalledWith('w', false);
      expect(mockUpdateKey).toHaveBeenCalledWith('a', false);
      expect(mockUpdateKey).toHaveBeenCalledWith('s', false);
      expect(mockUpdateKey).toHaveBeenCalledWith('d', false);
    });
  });

  describe('Position Calculation', () => {
    it('should update knob position within stick boundary', () => {
      const { result } = renderHook(() =>
        useAnalogControls({
          updateKey: mockUpdateKey,
          stickRef: mockStickRef,
        }),
      );

      const mockMouseEvent = {
        preventDefault: jest.fn(),
        clientX: 50,
        clientY: 40,
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handlers.mouseDown(mockMouseEvent);
      });

      expect(result.current.knobPosition.x).toBeGreaterThanOrEqual(-28);
      expect(result.current.knobPosition.x).toBeLessThanOrEqual(28);
      expect(result.current.knobPosition.y).toBeGreaterThanOrEqual(-28);
      expect(result.current.knobPosition.y).toBeLessThanOrEqual(28);
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should add event listeners when dragging', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const { result } = renderHook(() =>
        useAnalogControls({
          updateKey: mockUpdateKey,
          stickRef: mockStickRef,
        }),
      );

      const mockMouseEvent = {
        preventDefault: jest.fn(),
        clientX: 40,
        clientY: 40,
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handlers.mouseDown(mockMouseEvent);
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function),
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function),
      );

      addEventListenerSpy.mockRestore();
    });

    it('should remove event listeners when drag ends', () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener',
      );
      const { result } = renderHook(() =>
        useAnalogControls({
          updateKey: mockUpdateKey,
          stickRef: mockStickRef,
        }),
      );

      const mockMouseEvent = {
        preventDefault: jest.fn(),
        clientX: 40,
        clientY: 40,
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handlers.mouseDown(mockMouseEvent);
      });

      act(() => {
        const mouseUpEvent = new MouseEvent('mouseup');
        document.dispatchEvent(mouseUpEvent);
      });

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
