import React from 'react';
import { GameStats } from '../types/game';
import { WEAPON_CONFIGS } from '../game/weapons';
import { ArrowRight, Trophy, Zap, Crosshair, Clock } from 'lucide-react';

interface StageClearModalProps {
  stageId: number;
  stats: GameStats;
  onProceed: () => void;
}

export const StageClearModal: React.FC<StageClearModalProps> = ({
  stageId,
  stats,
  onProceed,
}) => {
  const currentWeapon = WEAPON_CONFIGS[stats.highestWeaponTier];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-500/50 bg-slate-950 p-6 shadow-2xl shadow-cyan-950/50 space-y-6 text-center">
        <div className="space-y-1">
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400">
            SECTOR LIBERATED
          </span>
          <h2 className="font-cyber text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
            STAGE {stageId} CLEAR!
          </h2>
          <p className="text-xs font-mono text-slate-400">
            BOSS DESTROYED · BIO-CORE OVERDRIVE SYNCHRONIZED
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span>SCORE</span>
            </span>
            <span className="text-xl font-mono font-bold text-amber-400 tabular-nums mt-1">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Crosshair className="h-3.5 w-3.5 text-rose-400" />
              <span>ALIENS PURGED</span>
            </span>
            <span className="text-xl font-mono font-bold text-slate-200 tabular-nums mt-1">
              {stats.kills} KILLS
            </span>
          </div>

          <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>MAX WEAPON TIER</span>
            </span>
            <span
              className="text-base font-cyber font-bold mt-1"
              style={{ color: currentWeapon.color }}
            >
              LV.{stats.highestWeaponTier} {currentWeapon.name}
            </span>
          </div>

          <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>TIME ELAPSED</span>
            </span>
            <span className="text-xl font-mono font-bold text-slate-200 tabular-nums mt-1">
              {Math.floor(stats.timeSeconds / 60)}m {stats.timeSeconds % 60}s
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={onProceed}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400 bg-cyan-500 py-3.5 text-base font-cyber font-bold uppercase tracking-wider text-black transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/20"
          >
            <span>PROCEED TO STAGE {stageId + 1}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
