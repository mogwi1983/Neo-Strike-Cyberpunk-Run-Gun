import React from 'react';
import { Difficulty } from '../types/game';
import { WEAPON_CONFIGS } from '../game/weapons';
import { Play, Gamepad2, Keyboard, Smartphone, Crosshair, Shield, Zap, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  difficulty: Difficulty;
  onSelectDifficulty: (diff: Difficulty) => void;
  onStartGame: () => void;
  touchControlsActive: boolean;
  onToggleTouchControls: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  difficulty,
  onSelectDifficulty,
  onStartGame,
  touchControlsActive,
  onToggleTouchControls,
}) => {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-5 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] select-none sm:gap-6 sm:p-6 md:p-10 landscape-short:gap-2 landscape-short:p-3 landscape-short:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 bg-radial from-slate-900/40 via-slate-950 to-black" />

      {/* Header / Brand */}
      <header className="relative z-10 flex w-full items-center justify-between gap-4 border-b border-slate-800/80 pb-3 landscape-short:hidden landscape-short:pb-0 md:gap-8 md:pb-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-slate-400">
            ARCADE EDITION · 60 FPS CANVAS
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>CONTRA TRIBUTE</span>
          <span>·</span>
          <span>CYBERPUNK 2026</span>
        </div>
      </header>

      {/* Main Hero & Content */}
      <main className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center">
        {/* Title Lockup */}
        <div className="space-y-2 landscape-short:space-y-1 md:space-y-3">
          <h1 className="font-cyber text-4xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-rose-500 to-amber-400 drop-shadow-[0_0_35px_rgba(0,240,255,0.4)] sm:text-5xl md:text-7xl lg:text-8xl landscape-short:text-3xl">
            NEO-STRIKE
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-300 sm:text-sm md:text-base landscape-short:text-[10px]">
            Cyberpunk Run &amp; Gun Platformer
          </p>
          <p className="mx-auto max-w-xl text-xs text-slate-400 leading-relaxed sm:text-sm landscape-short:hidden">
            Run, jump, duck, and dodge bio-mechanical alien volleys. Slay invaders to level up your arsenal from rapid pulse rifles to devastating nova spreads across multi-stage boss missions.
          </p>
        </div>

        {/* Difficulty Selection */}
        <div className="mt-5 flex w-full max-w-lg flex-col items-center gap-2 sm:mt-8 sm:gap-3 landscape-short:mt-3">
          <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 sm:text-xs">
            SELECT DIFFICULTY
          </span>
          <div className="flex w-full flex-col gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 p-1.5 backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-2">
            {(['RECRUIT', 'VETERAN', 'ARCADE'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => onSelectDifficulty(d)}
                className={`w-full px-3 py-2 text-[10px] font-mono font-bold rounded-lg transition-all sm:w-auto sm:px-4 sm:text-xs landscape-short:py-1.5 ${
                  difficulty === d
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {d === 'RECRUIT' && 'RECRUIT (140 HP · 5 LIVES)'}
                {d === 'VETERAN' && 'VETERAN (100 HP · 3 LIVES)'}
                {d === 'ARCADE' && 'ARCADE (70 HP · 2 LIVES)'}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Action + mobile touch toggle (always reachable on small screens) */}
        <div className="mt-5 flex w-full max-w-md flex-col items-center gap-3 sm:mt-8 landscape-short:mt-3">
          <button
            onClick={onStartGame}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400 bg-gradient-to-r from-cyan-500 to-rose-600 px-6 py-3 text-sm font-cyber font-bold uppercase tracking-wider text-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-cyan-500/25 sm:w-auto sm:gap-3 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-base landscape-short:px-5 landscape-short:py-2 landscape-short:text-xs"
          >
            <Play className="h-4 w-4 fill-current sm:h-5 sm:w-5" />
            <span>START MISSION</span>
          </button>
          <div className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 landscape-short:flex md:hidden">
            <span className="text-[10px] font-mono font-bold text-amber-400">ON-SCREEN CONTROLS</span>
            <button
              type="button"
              onClick={onToggleTouchControls}
              className="text-[10px] font-mono rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-300"
            >
              {touchControlsActive ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Weapon Upgrade Preview Strip */}
        <div className="mt-8 hidden w-full rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-md sm:mt-12 md:block landscape-short:hidden">
          <div className="mb-3 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>KILL PROGRESSION ARSENAL TIERS</span>
            </span>
            <span>KILL ENEMIES TO LEVEL UP IN REAL-TIME</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((tier) => {
              const info = WEAPON_CONFIGS[tier as 1 | 2 | 3 | 4 | 5];
              return (
                <div
                  key={tier}
                  className="flex flex-col items-start gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left"
                >
                  <span
                    className="text-[11px] font-mono font-bold"
                    style={{ color: info.color }}
                  >
                    TIER {tier}
                  </span>
                  <span className="text-xs font-bold text-slate-200 truncate w-full">
                    {info.name}
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    {info.tagline}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Control Support Grid */}
        <div className="mt-6 grid w-full grid-cols-1 gap-4 text-left md:grid-cols-3 landscape-short:hidden">
          {/* Keyboard */}
          <div className="flex flex-col gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
              <Keyboard className="h-4 w-4" />
              <span>KEYBOARD</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1 font-mono">
              <li><span className="text-slate-200">WASD / Arrows</span>: Move &amp; 8-Way Aim</li>
              <li><span className="text-slate-200">J / Space</span>: Fire Weapon</li>
              <li><span className="text-slate-200">K / W</span>: Jump (Hold for high)</li>
              <li><span className="text-slate-200">L / Shift</span>: Dash / Dodge Roll</li>
              <li><span className="text-slate-200">E / B</span>: Super EMP Bomb</li>
            </ul>
          </div>

          {/* Gamepad */}
          <div className="flex flex-col gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-400">
              <Gamepad2 className="h-4 w-4" />
              <span>GAMEPAD (XBOX/PS)</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1 font-mono">
              <li><span className="text-slate-200">D-Pad / Left Stick</span>: Move &amp; Aim</li>
              <li><span className="text-slate-200">X Button / RT</span>: Fire Weapon</li>
              <li><span className="text-slate-200">A Button</span>: Jump</li>
              <li><span className="text-slate-200">B Button</span>: Dash / Roll</li>
              <li><span className="text-slate-200">Y / RB</span>: Super EMP Bomb</li>
            </ul>
          </div>

          {/* Mobile Touch */}
          <div className="flex flex-col gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                <Smartphone className="h-4 w-4" />
                <span>MOBILE TOUCH</span>
              </div>
              <button
                onClick={onToggleTouchControls}
                className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
              >
                {touchControlsActive ? 'ON' : 'OFF'}
              </button>
            </div>
            <ul className="text-xs text-slate-400 space-y-1 font-mono">
              <li><span className="text-slate-200">Left D-Pad</span>: Run &amp; Aim</li>
              <li><span className="text-slate-200">Fire Button</span>: Rapid-Fire</li>
              <li><span className="text-slate-200">Jump / Dash</span>: Evasive Moves</li>
              <li><span className="text-slate-200">Bomb Button</span>: Screen Wipe</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex w-full items-center justify-between border-t border-slate-800/80 pt-3 text-[10px] font-mono text-slate-500 sm:pt-4 sm:text-xs landscape-short:hidden">
        <span>3 CAMPAIGN STAGES · MULTI-PHASE BOSSES</span>
        <span>PRESS P OR ESC TO PAUSE</span>
      </footer>
    </div>
  );
};
