import React from 'react';
import { InputManager } from '../game/InputManager';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Crosshair, ArrowUp, Zap, Bomb } from 'lucide-react';

interface TouchControlsProps {
  input: InputManager;
  visible: boolean;
  /** Overlay on game (landscape) vs bar below canvas (portrait) */
  placement?: 'overlay' | 'bar';
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  input,
  visible,
  placement = 'bar',
}) => {
  if (!visible) return null;

  const handleTouchStart = (action: 'left' | 'right' | 'up' | 'down' | 'jump' | 'shoot' | 'dash' | 'bomb', e: React.TouchEvent) => {
    e.preventDefault();
    input.setVirtualButton(action, true);
  };

  const handleTouchEnd = (action: 'left' | 'right' | 'up' | 'down' | 'jump' | 'shoot' | 'dash' | 'bomb', e: React.TouchEvent) => {
    e.preventDefault();
    input.setVirtualButton(action, false);
  };

  const isOverlay = placement === 'overlay';

  const dpadBtn =
    'flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/95 text-cyan-400 backdrop-blur-md active:bg-cyan-500 active:text-black transition-colors landscape-short:h-9 landscape-short:w-9 sm:h-12 sm:w-12';
  const actionSm =
    'flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/95 text-cyan-400 backdrop-blur-md active:bg-cyan-500 active:text-black transition-colors landscape-short:h-9 landscape-short:w-9 sm:h-12 sm:w-12';

  const controlsRow = (
    <div className="mx-auto flex w-full max-w-4xl items-end justify-between gap-2">
      <div className="pointer-events-auto relative h-[7.25rem] w-[7.25rem] shrink-0 landscape-short:h-[6.25rem] landscape-short:w-[6.25rem] sm:h-36 sm:w-36">
        <button
          onTouchStart={(e) => handleTouchStart('up', e)}
          onTouchEnd={(e) => handleTouchEnd('up', e)}
          onMouseDown={() => input.setVirtualButton('up', true)}
          onMouseUp={() => input.setVirtualButton('up', false)}
          className={`${dpadBtn} absolute left-9 top-0 landscape-short:left-8 sm:left-12`}
          aria-label="Aim Up"
        >
          <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          onTouchStart={(e) => handleTouchStart('down', e)}
          onTouchEnd={(e) => handleTouchEnd('down', e)}
          onMouseDown={() => input.setVirtualButton('down', true)}
          onMouseUp={() => input.setVirtualButton('down', false)}
          className={`${dpadBtn} absolute bottom-0 left-9 landscape-short:left-8 sm:left-12`}
          aria-label="Duck / Aim Down"
        >
          <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          onTouchStart={(e) => handleTouchStart('left', e)}
          onTouchEnd={(e) => handleTouchEnd('left', e)}
          onMouseDown={() => input.setVirtualButton('left', true)}
          onMouseUp={() => input.setVirtualButton('left', false)}
          className={`${dpadBtn} absolute left-0 top-9 landscape-short:top-8 sm:top-12`}
          aria-label="Run Left"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          onTouchStart={(e) => handleTouchStart('right', e)}
          onTouchEnd={(e) => handleTouchEnd('right', e)}
          onMouseDown={() => input.setVirtualButton('right', true)}
          onMouseUp={() => input.setVirtualButton('right', false)}
          className={`${dpadBtn} absolute right-0 top-9 landscape-short:top-8 sm:top-12`}
          aria-label="Run Right"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      <div className="pointer-events-auto flex shrink-0 items-end gap-1.5 landscape-short:gap-1 sm:gap-3">
        <button
          onTouchStart={(e) => handleTouchStart('bomb', e)}
          onTouchEnd={(e) => handleTouchEnd('bomb', e)}
          onMouseDown={() => input.setVirtualButton('bomb', true)}
          onMouseUp={() => input.setVirtualButton('bomb', false)}
          className={`${actionSm} border-amber-600/80 bg-amber-950/90 text-amber-400 active:bg-amber-500 active:text-black`}
          aria-label="EMP Super Bomb"
        >
          <Bomb className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <button
          onTouchStart={(e) => handleTouchStart('dash', e)}
          onTouchEnd={(e) => handleTouchEnd('dash', e)}
          onMouseDown={() => input.setVirtualButton('dash', true)}
          onMouseUp={() => input.setVirtualButton('dash', false)}
          className={actionSm}
          aria-label="Dash Roll"
        >
          <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <button
          onTouchStart={(e) => handleTouchStart('jump', e)}
          onTouchEnd={(e) => handleTouchEnd('jump', e)}
          onMouseDown={() => input.setVirtualButton('jump', true)}
          onMouseUp={() => input.setVirtualButton('jump', false)}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-700/80 bg-indigo-950/95 text-indigo-300 backdrop-blur-md active:bg-indigo-500 active:text-white transition-colors landscape-short:h-10 landscape-short:w-10 sm:h-14 sm:w-14"
          aria-label="Jump"
        >
          <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          onTouchStart={(e) => handleTouchStart('shoot', e)}
          onTouchEnd={(e) => handleTouchEnd('shoot', e)}
          onMouseDown={() => input.setVirtualButton('shoot', true)}
          onMouseUp={() => input.setVirtualButton('shoot', false)}
          className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-xl border border-rose-600/90 bg-rose-950/95 text-rose-400 backdrop-blur-md active:bg-rose-500 active:text-black transition-colors shadow-lg shadow-rose-950/50 landscape-short:h-11 landscape-short:w-11 sm:h-16 sm:w-16"
          aria-label="Primary Fire"
        >
          <Crosshair className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>
      </div>
    </div>
  );

  const safePad =
    'pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))]';

  if (isOverlay) {
    return (
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-40 select-none touch-none bg-gradient-to-t from-black/90 via-black/55 to-transparent pt-6 ${safePad}`}
        aria-label="Touch game controls"
      >
        {controlsRow}
      </div>
    );
  }

  return (
    <div
      className={`relative z-40 w-full shrink-0 select-none touch-none border-t border-slate-800/80 bg-slate-950/95 pt-2 ${safePad}`}
      aria-label="Touch game controls"
    >
      {controlsRow}
    </div>
  );
};
