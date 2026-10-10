import React from 'react';
import { InputManager } from '../game/InputManager';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Crosshair, ArrowUp, Zap, Bomb } from 'lucide-react';

interface TouchControlsProps {
  input: InputManager;
  visible: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ input, visible }) => {
  if (!visible) return null;

  const handleTouchStart = (action: 'left' | 'right' | 'up' | 'down' | 'jump' | 'shoot' | 'dash' | 'bomb', e: React.TouchEvent) => {
    e.preventDefault();
    input.setVirtualButton(action, true);
  };

  const handleTouchEnd = (action: 'left' | 'right' | 'up' | 'down' | 'jump' | 'shoot' | 'dash' | 'bomb', e: React.TouchEvent) => {
    e.preventDefault();
    input.setVirtualButton(action, false);
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 p-4 select-none touch-none">
      <div className="flex items-end justify-between">
        {/* Left: Directional D-Pad */}
        <div className="pointer-events-auto relative h-36 w-36">
          {/* Up */}
          <button
            onTouchStart={(e) => handleTouchStart('up', e)}
            onTouchEnd={(e) => handleTouchEnd('up', e)}
            onMouseDown={() => input.setVirtualButton('up', true)}
            onMouseUp={() => input.setVirtualButton('up', false)}
            className="absolute left-12 top-0 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-cyan-400 backdrop-blur-md active:bg-cyan-500 active:text-black transition-colors"
            aria-label="Aim Up"
          >
            <ChevronUp className="h-6 w-6" />
          </button>

          {/* Down */}
          <button
            onTouchStart={(e) => handleTouchStart('down', e)}
            onTouchEnd={(e) => handleTouchEnd('down', e)}
            onMouseDown={() => input.setVirtualButton('down', true)}
            onMouseUp={() => input.setVirtualButton('down', false)}
            className="absolute bottom-0 left-12 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-cyan-400 backdrop-blur-md active:bg-cyan-500 active:text-black transition-colors"
            aria-label="Duck / Aim Down"
          >
            <ChevronDown className="h-6 w-6" />
          </button>

          {/* Left */}
          <button
            onTouchStart={(e) => handleTouchStart('left', e)}
            onTouchEnd={(e) => handleTouchEnd('left', e)}
            onMouseDown={() => input.setVirtualButton('left', true)}
            onMouseUp={() => input.setVirtualButton('left', false)}
            className="absolute left-0 top-12 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-cyan-400 backdrop-blur-md active:bg-cyan-500 active:text-black transition-colors"
            aria-label="Run Left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Right */}
          <button
            onTouchStart={(e) => handleTouchStart('right', e)}
            onTouchEnd={(e) => handleTouchEnd('right', e)}
            onMouseDown={() => input.setVirtualButton('right', true)}
            onMouseUp={() => input.setVirtualButton('right', false)}
            className="absolute right-0 top-12 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-cyan-400 backdrop-blur-md active:bg-cyan-500 active:text-black transition-colors"
            aria-label="Run Right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Right: Action Buttons (Fire, Jump, Dash, Bomb) */}
        <div className="pointer-events-auto flex items-end gap-3">
          {/* EMP Bomb Button */}
          <button
            onTouchStart={(e) => handleTouchStart('bomb', e)}
            onTouchEnd={(e) => handleTouchEnd('bomb', e)}
            onMouseDown={() => input.setVirtualButton('bomb', true)}
            onMouseUp={() => input.setVirtualButton('bomb', false)}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-600/80 bg-amber-950/80 text-amber-400 backdrop-blur-md active:bg-amber-500 active:text-black transition-colors"
            aria-label="EMP Super Bomb"
          >
            <Bomb className="h-5 w-5" />
          </button>

          {/* Dash / Roll Button */}
          <button
            onTouchStart={(e) => handleTouchStart('dash', e)}
            onTouchEnd={(e) => handleTouchEnd('dash', e)}
            onMouseDown={() => input.setVirtualButton('dash', true)}
            onMouseUp={() => input.setVirtualButton('dash', false)}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-cyan-400 backdrop-blur-md active:bg-cyan-500 active:text-black transition-colors"
            aria-label="Dash Roll"
          >
            <Zap className="h-5 w-5" />
          </button>

          {/* Jump Button */}
          <button
            onTouchStart={(e) => handleTouchStart('jump', e)}
            onTouchEnd={(e) => handleTouchEnd('jump', e)}
            onMouseDown={() => input.setVirtualButton('jump', true)}
            onMouseUp={() => input.setVirtualButton('jump', false)}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-700/80 bg-indigo-950/80 text-indigo-300 backdrop-blur-md active:bg-indigo-500 active:text-white transition-colors"
            aria-label="Jump"
          >
            <ArrowUp className="h-6 w-6" />
          </button>

          {/* Primary Fire Button (Largest) */}
          <button
            onTouchStart={(e) => handleTouchStart('shoot', e)}
            onTouchEnd={(e) => handleTouchEnd('shoot', e)}
            onMouseDown={() => input.setVirtualButton('shoot', true)}
            onMouseUp={() => input.setVirtualButton('shoot', false)}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-600/90 bg-rose-950/90 text-rose-400 backdrop-blur-md active:bg-rose-500 active:text-black transition-colors shadow-lg shadow-rose-950/50"
            aria-label="Primary Fire"
          >
            <Crosshair className="h-7 w-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
