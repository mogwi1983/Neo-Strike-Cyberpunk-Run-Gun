import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InputManager } from '../game/InputManager';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Crosshair, ArrowUp, Zap, Bomb } from 'lucide-react';

type Action = 'jump' | 'shoot' | 'dash' | 'bomb';

interface Direction {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

const NO_DIRECTION: Direction = { left: false, right: false, up: false, down: false };

interface TouchControlsProps {
  input: InputManager;
  /** Landscape overlays the game; portrait fills the space under the canvas. */
  layout: 'landscape' | 'portrait';
  /** Extra bottom clearance for floating browser toolbars (iOS Safari). */
  reserveBrowserChrome: boolean;
}

function directionFromOffset(dx: number, dy: number, radius: number): Direction {
  if (Math.hypot(dx, dy) < radius * 0.22) return NO_DIRECTION;
  // 8-way sectors so diagonals (run + aim up/down) work with one thumb.
  const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  return {
    right: sector === 0 || sector === 1 || sector === -1,
    left: sector === 4 || sector === -4 || sector === 3 || sector === -3,
    down: sector === 1 || sector === 2 || sector === 3,
    up: sector === -1 || sector === -2 || sector === -3,
  };
}

const DPad: React.FC<{ input: InputManager }> = ({ input }) => {
  const padRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<number | null>(null);
  const [dir, setDir] = useState<Direction>(NO_DIRECTION);

  const apply = useCallback(
    (next: Direction) => {
      input.setVirtualButton('left', next.left);
      input.setVirtualButton('right', next.right);
      input.setVirtualButton('up', next.up);
      input.setVirtualButton('down', next.down);
      setDir((prev) =>
        prev.left === next.left && prev.right === next.right && prev.up === next.up && prev.down === next.down
          ? prev
          : next
      );
    },
    [input]
  );

  const update = (e: React.PointerEvent) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    apply(directionFromOffset(dx, dy, rect.width / 2));
  };

  const release = (e: React.PointerEvent) => {
    if (pointerRef.current !== e.pointerId) return;
    pointerRef.current = null;
    apply(NO_DIRECTION);
  };

  useEffect(() => () => apply(NO_DIRECTION), [apply]);

  const arrow = (active: boolean) =>
    `absolute flex h-1/3 w-1/3 items-center justify-center rounded-xl border transition-colors ${
      active
        ? 'border-cyan-300 bg-cyan-500 text-black'
        : 'border-slate-600/70 bg-slate-900/80 text-cyan-300'
    }`;

  return (
    <div
      ref={padRef}
      className="pointer-events-auto relative aspect-square h-full touch-none select-none rounded-full bg-slate-950/40"
      onPointerDown={(e) => {
        if (pointerRef.current !== null) return;
        pointerRef.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (pointerRef.current === e.pointerId) update(e);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
      role="group"
      aria-label="Movement pad"
    >
      <div className={`${arrow(dir.up)} left-1/3 top-0`}>
        <ChevronUp className="h-3/5 w-3/5" />
      </div>
      <div className={`${arrow(dir.down)} bottom-0 left-1/3`}>
        <ChevronDown className="h-3/5 w-3/5" />
      </div>
      <div className={`${arrow(dir.left)} left-0 top-1/3`}>
        <ChevronLeft className="h-3/5 w-3/5" />
      </div>
      <div className={`${arrow(dir.right)} right-0 top-1/3`}>
        <ChevronRight className="h-3/5 w-3/5" />
      </div>
      <div className="absolute left-1/3 top-1/3 h-1/3 w-1/3 rounded-lg bg-slate-900/60" />
    </div>
  );
};

const ActionButton: React.FC<{
  input: InputManager;
  action: Action;
  label: string;
  position: string;
  idleClassName: string;
  activeClassName: string;
  children: React.ReactNode;
}> = ({ input, action, label, position, idleClassName, activeClassName, children }) => {
  const pointersRef = useRef(new Set<number>());
  const [pressed, setPressed] = useState(false);

  const set = useCallback(
    (on: boolean) => {
      input.setVirtualButton(action, on);
      setPressed(on);
    },
    [input, action]
  );

  const release = (e: React.PointerEvent) => {
    if (!pointersRef.current.delete(e.pointerId)) return;
    if (pointersRef.current.size === 0) set(false);
  };

  useEffect(() => () => input.setVirtualButton(action, false), [input, action]);

  return (
    <button
      type="button"
      className={`pointer-events-auto absolute flex aspect-square touch-none select-none items-center justify-center rounded-full border-2 shadow-lg transition-transform ${position} ${
        pressed ? `scale-95 ${activeClassName}` : idleClassName
      }`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        pointersRef.current.add(e.pointerId);
        set(true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={label}
    >
      {children}
    </button>
  );
};

export const TouchControls: React.FC<TouchControlsProps> = ({ input, layout, reserveBrowserChrome }) => {
  // Fingers can be lifted while the app is backgrounded; never leave a button held.
  useEffect(() => {
    const releaseAll = () => input.reset();
    const onVisibility = () => {
      if (document.hidden) releaseAll();
    };
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', releaseAll);
      document.removeEventListener('visibilitychange', onVisibility);
      releaseAll();
    };
  }, [input]);

  const actions = (
    <div className="relative aspect-[10/9] h-full">
      <ActionButton
        input={input}
        action="dash"
        label="Dash Roll"
        position="left-[6%] top-0 w-[30%]"
        idleClassName="border-slate-500/80 bg-slate-900/85 text-cyan-300"
        activeClassName="border-cyan-300 bg-cyan-500 text-black"
      >
        <Zap className="h-1/2 w-1/2" />
      </ActionButton>
      <ActionButton
        input={input}
        action="bomb"
        label="EMP Super Bomb"
        position="right-[4%] top-0 w-[30%]"
        idleClassName="border-amber-600/80 bg-amber-950/85 text-amber-300"
        activeClassName="border-amber-300 bg-amber-500 text-black"
      >
        <Bomb className="h-1/2 w-1/2" />
      </ActionButton>
      <ActionButton
        input={input}
        action="shoot"
        label="Primary Fire"
        position="bottom-0 left-0 w-[44%]"
        idleClassName="border-rose-500/90 bg-rose-950/90 text-rose-300"
        activeClassName="border-rose-300 bg-rose-500 text-black"
      >
        <Crosshair className="h-1/2 w-1/2" />
      </ActionButton>
      <ActionButton
        input={input}
        action="jump"
        label="Jump"
        position="bottom-[14%] right-0 w-[44%]"
        idleClassName="border-indigo-500/90 bg-indigo-950/90 text-indigo-200"
        activeClassName="border-indigo-300 bg-indigo-500 text-white"
      >
        <ArrowUp className="h-1/2 w-1/2" />
      </ActionButton>
    </div>
  );

  if (layout === 'landscape') {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-40 flex select-none items-center justify-between pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-20"
        aria-label="Touch game controls"
      >
        <div className="h-[min(9rem,42vh)]">
          <DPad input={input} />
        </div>
        <div className="h-[min(8.5rem,40vh)]">{actions}</div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-0 w-full flex-1 select-none items-center justify-between bg-[#06080e] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-3 ${
        reserveBrowserChrome
          ? 'pb-[calc(env(safe-area-inset-bottom)+5.5rem)]'
          : 'pb-[max(1rem,env(safe-area-inset-bottom))]'
      }`}
      aria-label="Touch game controls"
    >
      <div className="h-[min(9.5rem,42vw)]">
        <DPad input={input} />
      </div>
      <div className="h-[min(9rem,40vw)]">{actions}</div>
    </div>
  );
};
