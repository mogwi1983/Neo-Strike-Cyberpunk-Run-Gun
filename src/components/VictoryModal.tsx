import React from 'react';
import { GameStats } from '../types/game';
import { Trophy, Award, RotateCcw, Home, Sparkles, CheckCircle2 } from 'lucide-react';

interface VictoryModalProps {
  stats: GameStats;
  onPlayAgain: () => void;
  onQuitToTitle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  onPlayAgain,
  onQuitToTitle,
}) => {
  // Compute Rank based on score & kills
  let rank = 'B';
  let rankColor = 'text-amber-400';
  let rankSubtitle = 'Vanguard Operative';

  if (stats.score >= 50000 && stats.kills >= 60) {
    rank = 'S';
    rankColor = 'text-cyan-400';
    rankSubtitle = 'Apex Cyber Commando';
  } else if (stats.score >= 35000) {
    rank = 'A';
    rankColor = 'text-emerald-400';
    rankSubtitle = 'Elite Strike Leader';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-500/70 bg-slate-950 p-6 shadow-2xl shadow-cyan-500/30 space-y-6 text-center">
        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-950/50 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>EARTH SAVED · ALIEN INVASION PURGED</span>
          </div>
          <h2 className="font-cyber text-4xl md:text-5xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-rose-500 to-amber-300 drop-shadow-[0_0_25px_rgba(0,240,255,0.5)]">
            VICTORY ACHIEVED!
          </h2>
          <p className="text-xs font-mono text-slate-400">
            THE HIVE MIND OVERMIND HAS BEEN OBLITERATED
          </p>
        </div>

        {/* Rank Showcase */}
        <div className="flex items-center justify-around rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-col items-center">
            <span className="text-xs font-mono text-slate-400">COMBAT RATING</span>
            <div className={`font-cyber text-6xl font-black ${rankColor} drop-shadow-md`}>
              {rank}
            </div>
            <span className="text-[11px] font-mono text-slate-300 font-semibold mt-0.5">
              {rankSubtitle}
            </span>
          </div>

          <div className="h-16 w-px bg-slate-800" />

          <div className="flex flex-col items-start gap-1 text-left text-xs font-mono">
            <div className="text-slate-400">TOTAL SCORE</div>
            <div className="text-2xl font-bold text-amber-400 tabular-nums">
              {stats.score.toLocaleString()}
            </div>
            <div className="text-slate-400 mt-1">
              TOTAL KILLS: <span className="text-slate-200 font-bold">{stats.kills}</span>
            </div>
          </div>
        </div>

        {/* Campaign Metrics */}
        <div className="grid grid-cols-3 gap-2.5 text-left text-xs font-mono">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <span className="text-slate-400 text-[11px]">TIME</span>
            <div className="text-base font-bold text-slate-200 mt-0.5 tabular-nums">
              {Math.floor(stats.timeSeconds / 60)}m {stats.timeSeconds % 60}s
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <span className="text-slate-400 text-[11px]">MAX WEAPON</span>
            <div className="text-base font-bold text-cyan-400 mt-0.5">
              TIER {stats.highestWeaponTier}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <span className="text-slate-400 text-[11px]">BOMBS USED</span>
            <div className="text-base font-bold text-slate-200 mt-0.5 tabular-nums">
              {stats.bombsUsed}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onPlayAgain}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400 bg-gradient-to-r from-cyan-500 to-rose-600 py-3.5 text-base font-cyber font-bold uppercase tracking-wider text-black transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-cyan-500/25"
          >
            <RotateCcw className="h-5 w-5" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onQuitToTitle}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 py-3 text-sm font-cyber font-bold uppercase tracking-wider text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <Home className="h-4 w-4" />
            <span>RETURN TO TITLE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
