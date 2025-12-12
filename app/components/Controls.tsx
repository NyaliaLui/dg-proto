'use client';
import { useRef } from 'react';

import { SetKeyStateFn } from '@/app/components/hooks/useKeyboardControls';
import { useAnalogControls } from '@/app/components/hooks/useAnalogControls';
import { CONTROLS_TEST_IDS } from '@/app/test-ids';
import { CONTROLS_DEFAULTS } from '../constants';

export type { AnalogStickProps, OnscreenKeysProps, ControlsProps };
export { AnalogStick, OnscreenKeys, Controls };

interface AnalogStickProps {
  updateKey: SetKeyStateFn;
}

function AnalogStick({ updateKey }: AnalogStickProps) {
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const { handlers, isDragging, knobPosition } = useAnalogControls({
    updateKey: updateKey,
    stickRef: stickRef,
  });

  return (
    <div
      className="relative"
      aria-label="Move with the analog stick or WASD keys"
      data-testid={CONTROLS_TEST_IDS.ANALOG_STICK}
    >
      {/* Stick Base */}
      <div
        ref={stickRef}
        className="relative w-20 h-20 bg-gray-700 bg-opacity-80 border border-gray-500 rounded-full flex items-center justify-center cursor-pointer select-none"
        onMouseDown={handlers.mouseDown}
        onTouchStart={handlers.touchStart}
      >
        {/* Stick Knob */}
        <div
          ref={knobRef}
          className="absolute w-6 h-6 bg-gray-300 border border-gray-400 rounded-full transition-all duration-75 shadow-lg"
          style={{
            transform: `translate(${knobPosition.x}px, ${knobPosition.y}px)`,
            backgroundColor: isDragging ? '#e5e7eb' : '#d1d5db',
          }}
        />

        {/* Center dot indicator */}
        {!isDragging && (
          <div className="absolute w-2 h-2 bg-gray-400 rounded-full opacity-50" />
        )}
      </div>
    </div>
  );
}

interface OnscreenKeysProps {
  updateKey: SetKeyStateFn;
}

function OnscreenKeys({ updateKey }: OnscreenKeysProps) {
  const smallButtonClass =
    'w-12 h-12 bg-gray-700 bg-opacity-80 border-1 border-gray-500 rounded-full flex items-center justify-center cursor-pointer select-none active:bg-gray-600 transition-colors text-white font-semibold text-xs';
  const largeButtonClass =
    'w-16 h-16 bg-gray-700 bg-opacity-80 border-1 border-gray-500 rounded-full flex items-center justify-center cursor-pointer select-none active:bg-gray-600 transition-colors text-white font-semibold text-sm';

  // Helper function to handle mechanics key release with timeout
  const handleMechanics = (key: 'q' | 'e' | 'p' | 'space') => {
    setTimeout(() => {
      updateKey(key, false);
    }, CONTROLS_DEFAULTS.MECHANICS_TIMEOUT);
  };

  return (
    <div
      className="flex flex-col gap-2"
      aria-label="Action buttons"
      data-testid={CONTROLS_TEST_IDS.ONSCREEN_KEYS}
    >
      {/* Top row - Jump button */}
      <div className="flex justify-center">
        <button
          className={smallButtonClass}
          data-testid={CONTROLS_TEST_IDS.JUMP_BUTTON}
          aria-label="Jump"
          onMouseDown={() => updateKey('space', true)}
          onMouseUp={() => handleMechanics('space')}
          onMouseLeave={() => handleMechanics('space')}
          onTouchStart={() => updateKey('space', true)}
          onTouchEnd={() => handleMechanics('space')}
        >
          Jump
        </button>
      </div>

      {/* Bottom row - Special, Normal, Item buttons */}
      <div className="flex gap-2 items-center">
        <button
          className={smallButtonClass}
          data-testid={CONTROLS_TEST_IDS.SPECIAL_BUTTON}
          aria-label="Special"
          onMouseDown={() => updateKey('e', true)}
          onMouseUp={() => handleMechanics('e')}
          onMouseLeave={() => handleMechanics('e')}
          onTouchStart={() => updateKey('e', true)}
          onTouchEnd={() => handleMechanics('e')}
        >
          Special
        </button>
        <button
          className={largeButtonClass}
          data-testid={CONTROLS_TEST_IDS.NORMAL_BUTTON}
          aria-label="Normal"
          onMouseDown={() => updateKey('q', true)}
          onMouseUp={() => handleMechanics('q')}
          onMouseLeave={() => handleMechanics('q')}
          onTouchStart={() => updateKey('q', true)}
          onTouchEnd={() => handleMechanics('q')}
        >
          Normal
        </button>
        <button
          className={smallButtonClass}
          data-testid={CONTROLS_TEST_IDS.ITEM_BUTTON}
          aria-label="Item"
          onMouseDown={() => updateKey('p', true)}
          onMouseUp={() => handleMechanics('p')}
          onMouseLeave={() => handleMechanics('p')}
          onTouchStart={() => updateKey('p', true)}
          onTouchEnd={() => handleMechanics('p')}
        >
          Item
        </button>
      </div>
    </div>
  );
}

interface ControlsProps {
  updateKey: SetKeyStateFn;
}

function Controls({ updateKey }: ControlsProps) {
  return (
    <>
      {/* Analog Stick */}
      <div className="lg:hidden fixed bottom-1/12 left-1/12 z-50">
        <AnalogStick updateKey={updateKey} />
      </div>

      {/* Onscreen Keys */}
      <div className="lg:hidden fixed bottom-1/12 right-1/12 z-50">
        <OnscreenKeys updateKey={updateKey} />
      </div>
    </>
  );
}
