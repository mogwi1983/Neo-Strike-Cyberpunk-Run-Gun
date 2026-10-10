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

  const dpadBtn =
    'flex items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/90 text-cyan-400 backdrop-blur-md active:bg-cyan-500 active:text-black transition-colors landscape-short:h-9 landscape-short:w-9 h-12 w-12';
  const actionSm =
    'flex items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/90 text-cyan-400 backdrop-blur-md active:bg-cyan-500 active:text-black transition-colors landscape-short:h-9 landscape-short:w-9 h-12 w-12';

  return (
    <div
      className="relative z-40 w-full shrink-0 select-none touch-none border-t border-slate-800/80 bg-slate-950/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 landscape-short:px-1 landscape-short:pt-1 landscape-short:pb-[max(0.25rem,env(safe-area-inset-bottom))] md:px-4 md:pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pt-3"
      aria-label="Touch game controls"
    >
      <div className="mx-auto flex max-w-4xl items-end justify-between gap-2">
        {/* Left: Directional D-Pad */}
        <div className="pointer-events-auto relative h-36 w-36 landscape-short:h-[6.75rem] landscape-short:w-[6.75rem]">
          <button
            onTouchStart={(e) => handleTouchStart('up', e)}
            onTouchEnd={(e) => handleTouchEnd('up', e)}
            onMouseDown={() => input.setVirtualButton('up', true)}
            onMouseUp={() => input.setVirtualButton('up', false)}
            className={`${dpadBtn} absolute left-12 top-0 landscape-short:left-9`}
            aria-label="Aim Up"
          >
            <ChevronUp className="h-6 w-6 landscape-short:h-5 landscape-short:w-5" />
          </button>

          <button
            onTouchStart={(e) => handleTouchStart('down', e)}
            onTouchEnd={(e) => handleTouchEnd('down', e)}
            onMouseDown={() => input.setVirtualButton('down', true)}
            onMouseUp={() => input.setVirtualButton('down', false)}
            className={`${dpadBtn} absolute bottom-0 left-12 landscape-short:left-9`}
            aria-label="Duck / Aim Down"
          >
            <ChevronDown className="h-6 w-6 landscape-short:h-5 landscape-short:w-5" />
          </button>

          <button
            onTouchStart={(e) => handleTouchStart('left', e)}
            onTouchEnd={(e) => handleTouchEnd('left', e)}
            onMouseDown={() => input.setVirtualButton('left', true)}
            onMouseUp={() => input.setVirtualButton('left', false)}
            className={`${dpadBtn} absolute left-0 top-12 landscape-short:top-9`}
            aria-label="Run Left"
          >
            <ChevronLeft className="h-6 w-6 landscape-short:h-5 landscape-short:w-5" />
          </button>

          <button
            onTouchStart={(e) => handleTouchStart('right', e)}
            onTouchEnd={(e) => handleTouchEnd('right', e)}
            onMouseDown={() => input.setVirtualButton('right', true)}
            onMouseUp={() => input.setVirtualButton('right', false)}
            className={`${dpadBtn} absolute right-0 top-12 landscape-short:top-9`}
            aria-label="Run Right"
          >
            <ChevronRight className="h-6 w-6 landscape-short:h-5 landscape-short:w-5" />
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div className="pointer-events-auto flex items-end gap-2 landscape-short:gap-1.5 md:gap-3">
          <button
            onTouchStart={(e) => handleTouchStart('bomb', e)}
            onTouchEnd={(e) => handleTouchEnd('bomb', e)}
            onMouseDown={() => input.setVirtualButton('bomb', true)}
            onMouseUp={() => input.setVirtualButton('bomb', false)}
            className={`${actionSm} border-amber-600/80 bg-amber-950/80 text-amber-400 active:bg-amber-500 active:text-black`}
            aria-label="EMP Super Bomb"
          >
            <Bomb className="h-5 w-5 landscape-short:h-4 landscape-short:w-4" />
          </button>

          <button
            onTouchStart={(e) => handleTouchStart('dash', e)}
            onTouchEnd={(e) => handleTouchEnd('dash', e)}
            onMouseDown={() => input.setVirtualButton('dash', true)}
            onMouseUp={() => input.setVirtualButton('dash', false)}
            className={actionSm}
            aria-label="Dash Roll"
          >
            <Zap className="h-5 w-5 landscape-short:h-4 landscape-short:w-4" />
          </button>

          <button
            onTouchStart={(e) => handleTouchStart('jump', e)}
            onTouchEnd={(e) => handleTouchEnd('jump', e)}
            onMouseDown={() => input.setVirtualButton('jump', true)}
            onMouseUp={() => input.setVirtualButton('jump', false)}
            className="flex h-14 w-14 items-center justify-center rounded-xl border border-indigo-700/80 bg-indigo-950/90 text-indigo-300 backdrop-blur-md active:bg-indigo-500 active:text-white transition-colors landscape-short:h-10 landscape-short:w-10 landscape-short:rounded-lg"
            aria-label="Jump"
          >
            <ArrowUp className="h-6 w-6 landscape-short:h-5 landscape-short:w-5" />
          </button>

          <button
            onTouchStart={(e) => handleTouchStart('shoot', e)}
            onTouchEnd={(e) => handleTouchEnd('shoot', e)}
            onMouseDown={() => input.setVirtualButton('shoot', true)}
            onMouseUp={() => input.setVirtualButton('shoot', false)}
            className="flex h-16 w-16 items-center justify-center rounded-xl border border-rose-600/90 bg-rose-950/90 text-rose-400 backdrop-blur-md active:bg-rose-500 active:text-black transition-colors shadow-lg shadow-rose-950/50 landscape-short:h-11 landscape-short:w-11 landscape-short:rounded-lg"
            aria-label="Primary Fire"
          >
            <Crosshair className="h-7 w-7 landscape-short:h-5 landscape-short:w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
