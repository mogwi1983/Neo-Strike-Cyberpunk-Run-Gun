import React from 'react';
import { GameStats } from '../types/game';
import { RotateCcw, Home, Skull, Trophy } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  onRetry: () => void;
  onQuitToTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRetry,
  onQuitToTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-2xl border border-rose-900/80 bg-slate-950 p-6 shadow-2xl shadow-rose-950/40 space-y-6 text-center">
        <div className="space-y-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/60 border border-rose-800 text-rose-500 mb-2">
            <Skull className="h-6 w-6" />
          </div>
          <h2 className="font-cyber text-4xl font-extrabold tracking-wider text-rose-500">
            SIGNAL LOST
          </h2>
          <p className="text-xs font-mono text-slate-400">
            ALL LIVES DEPLETED · COMM-LINK SEVERED
          </p>
        </div>

        {/* Final Score Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2 text-left">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">FINAL SCORE</span>
            <span className="text-base font-bold text-amber-400 tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">TOTAL KILLS</span>
            <span className="text-sm font-bold text-slate-200 tabular-nums">
              {stats.kills}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">SURVIVAL TIME</span>
            <span className="text-sm font-bold text-slate-200 tabular-nums">
              {Math.floor(stats.timeSeconds / 60)}m {stats.timeSeconds % 60}s
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onRetry}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500 bg-rose-600 py-3.5 text-sm font-cyber font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rose-600/30"
          >
            <RotateCcw className="h-4 w-4" />
            <span>RETRY STAGE</span>
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
