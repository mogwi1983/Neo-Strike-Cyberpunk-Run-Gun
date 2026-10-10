import React from 'react';
import { Player, Boss, GameStats } from '../types/game';
import { WEAPON_CONFIGS } from '../game/weapons';
import { Pause, Volume2, VolumeX, Shield, Bomb, Heart } from 'lucide-react';
import { sound } from '../game/AudioSystem';

interface HUDProps {
  player: Player | null;
  boss: Boss | null;
  stats: GameStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  boss,
  stats,
  isMuted,
  onToggleMute,
  onPause,
}) => {
  if (!player) return null;

  const currentWeapon = WEAPON_CONFIGS[player.weaponTier];
  const hpPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));

  // XP Progress towards next tier
  const prevXpThreshold = player.weaponTier > 1 ? WEAPON_CONFIGS[(player.weaponTier - 1) as 1 | 2 | 3 | 4].xpRequired : 0;
  const currentTierRequired = player.nextTierXp - prevXpThreshold;
  const currentTierProgress = Math.max(0, player.weaponXp - prevXpThreshold);
  const xpPercent = player.weaponTier === 5 ? 100 : Math.min(100, Math.round((currentTierProgress / Math.max(1, currentTierRequired)) * 100));

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 select-none">
      {/* Top Main Status Bar */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-950/85 px-4 py-2.5 backdrop-blur-md shadow-2xl">
        {/* Left: Player Health & Lives */}
        <div className="flex items-center gap-4">
          {/* Health Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-wider text-slate-300">
              <span className="flex items-center gap-1 font-mono">
                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                <span>HP</span>
              </span>
              <span className="font-mono tabular-nums text-slate-200">
                {Math.ceil(player.health)}/{player.maxHealth}
              </span>
            </div>
            <div className="relative h-2.5 w-32 md:w-44 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full transition-all duration-150 ${
                  hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
              {player.shieldTimer > 0 && (
                <div className="absolute inset-0 bg-cyan-400/40 animate-pulse" />
              )}
            </div>
          </div>

          {/* Lives Count */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400">
            <span className="text-slate-500">LIVES</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.max(0, player.lives) }).map((_, i) => (
                <span key={i} className="h-3 w-2 rounded-sm bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              ))}
            </div>
          </div>

          {/* Shield Active Indicator */}
          {player.shieldTimer > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-300 animate-pulse">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <span>SHIELD</span>
            </div>
          )}
        </div>

        {/* Center: Active Weapon & Progressive XP */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold uppercase tracking-wider font-cyber"
              style={{ color: currentWeapon.color }}
            >
              LV.{player.weaponTier} {currentWeapon.name}
            </span>
            {player.weaponTier === 5 && (
              <span className="text-[10px] font-mono font-bold text-amber-400">MAX</span>
            )}
          </div>
          {/* XP Gauge */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <div className="h-1.5 w-24 md:w-36 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full transition-all duration-150"
                style={{
                  width: `${xpPercent}%`,
                  backgroundColor: currentWeapon.color,
                }}
              />
            </div>
            <span className="tabular-nums">{xpPercent}%</span>
          </div>
        </div>

        {/* Right: Score, Bomb Count & Controls */}
        <div className="flex items-center gap-4">
          {/* Bombs */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
            <Bomb className="h-3.5 w-3.5 text-amber-400" />
            <span className="tabular-nums">x{player.bombs}</span>
          </div>

          {/* Score & Multiplier */}
          <div className="flex flex-col items-end">
            <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">
              {stats.score.toLocaleString()}
            </span>
            {player.multiplier > 1.0 && (
              <span className="text-[10px] font-mono font-bold text-amber-300 tabular-nums animate-pulse">
                {player.multiplier.toFixed(1)}x COMBO
              </span>
            )}
          </div>

          {/* Audio & Pause Action Buttons (pointer-events-auto) */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              onClick={onToggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              aria-label="Toggle Mute"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onPause}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              title="Pause Game"
              aria-label="Pause Game"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Boss Health Bar Overlay when active */}
      {boss && boss.active && !boss.defeated && (
        <div className="mx-auto mt-3 max-w-lg rounded-lg border border-rose-900/80 bg-slate-950/90 p-2.5 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-rose-400 tracking-wide">{boss.name}</span>
            <span className="text-slate-400">
              PHASE {boss.phase}/{boss.maxPhases} ·{' '}
              <span className="text-rose-300 tabular-nums">
                {Math.max(0, Math.ceil(boss.health))}/{boss.maxHealth}
              </span>
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-100"
              style={{
                width: `${Math.max(0, Math.min(100, (boss.health / boss.maxHealth) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
