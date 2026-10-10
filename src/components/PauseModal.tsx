import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestartStage: () => void;
  onQuitToTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestartStage,
  onQuitToTitle,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <h2 className="font-cyber text-3xl font-bold tracking-wider text-cyan-400">
            SYSTEM PAUSED
          </h2>
          <p className="text-xs font-mono text-slate-400">
            PRESS P OR ESC TO RESUME MISSION
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400 bg-cyan-500 py-3 text-sm font-cyber font-bold uppercase tracking-wider text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>RESUME MISSION</span>
          </button>

          <button
            onClick={onRestartStage}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-3 text-sm font-cyber font-bold uppercase tracking-wider text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            <span>RESTART STAGE</span>
          </button>

          <button
            onClick={onToggleMute}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-3 text-sm font-cyber font-bold uppercase tracking-wider text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={onQuitToTitle}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 py-3 text-sm font-cyber font-bold uppercase tracking-wider text-rose-400 transition-colors hover:bg-slate-900 hover:text-rose-300"
          >
            <Home className="h-4 w-4" />
            <span>QUIT TO TITLE</span>
          </button>
        </div>

        {/* Quick controls recall */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 text-xs font-mono text-slate-400 space-y-1">
          <div className="text-slate-200 font-semibold mb-1">KEYBOARD CONTROLS</div>
          <div>WASD/Arrows: 8-Way Aim &amp; Move</div>
          <div>J / Space: Shoot · K: Jump · L: Dash · E: EMP Bomb</div>
        </div>
      </div>
    </div>
  );
};
