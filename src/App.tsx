/**
 * Neo-Strike: Cyberpunk Run & Gun Platformer
 * Main App Component
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { InputManager } from './game/InputManager';
import { sound } from './game/AudioSystem';
import { GameScreen, Difficulty, Player, Boss, GameStats } from './types/game';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { TitleScreen } from './components/TitleScreen';
import { PauseModal } from './components/PauseModal';
import { StageClearModal } from './components/StageClearModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [difficulty, setDifficulty] = useState<Difficulty>('VETERAN');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [clearedStageId, setClearedStageId] = useState<number>(1);
  const [touchControlsActive, setTouchControlsActive] = useState<boolean>(false);

  // HUD state updated from game loop
  const [playerState, setPlayerState] = useState<Player | null>(null);
  const [bossState, setBossState] = useState<Boss | null>(null);
  const [statsState, setStatsState] = useState<GameStats>({
    kills: 0,
    score: 0,
    timeSeconds: 0,
    highestWeaponTier: 1,
    bossDefeated: false,
    bombsUsed: 0,
    damageTaken: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<InputManager>(new InputManager());

  // Auto-detect mobile touch screen capability
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      setTouchControlsActive(true);
    }
  }, []);

  // Initialize InputManager once
  useEffect(() => {
    const input = inputRef.current;
    input.init(() => {
      // Pause callback from keyboard (Esc / P)
      setScreen((prev) => {
        if (prev === 'PLAYING') {
          engineRef.current?.pause();
          return 'PAUSED';
        } else if (prev === 'PAUSED') {
          engineRef.current?.resume();
          return 'PLAYING';
        }
        return prev;
      });
    });

    return () => {
      input.destroy();
    };
  }, []);

  // Callback from GameEngine to update HUD
  const handleHudUpdate = useCallback((player: Player, boss: Boss | null, stats: GameStats) => {
    setPlayerState({ ...player });
    setBossState(boss ? { ...boss } : null);
    setStatsState({ ...stats });
  }, []);

  // Callback when a stage is cleared
  const handleStageClear = useCallback((stageId: number, stats: GameStats) => {
    setClearedStageId(stageId);
    setStatsState({ ...stats });
    setScreen('STAGE_CLEAR');
    engineRef.current?.pause();
  }, []);

  // Callback on game over
  const handleGameOver = useCallback((stats: GameStats) => {
    setStatsState({ ...stats });
    setScreen('GAME_OVER');
  }, []);

  // Callback on victory (Stage 3 cleared)
  const handleVictory = useCallback((stats: GameStats) => {
    setStatsState({ ...stats });
    setScreen('VICTORY');
    engineRef.current?.pause();
  }, []);

  // Start new game
  const handleStartGame = () => {
    sound.unlock();
    if (!canvasRef.current) return;

    // Destroy existing engine if any
    if (engineRef.current) {
      engineRef.current.stop();
    }

    const engine = new GameEngine(
      canvasRef.current,
      inputRef.current,
      difficulty,
      handleHudUpdate,
      handleStageClear,
      handleGameOver,
      handleVictory
    );

    engineRef.current = engine;
    engine.loadStage(0);
    engine.start();
    setScreen('PLAYING');
  };

  // Resume paused game
  const handleResume = () => {
    engineRef.current?.resume();
    setScreen('PLAYING');
  };

  // Restart current stage
  const handleRestartStage = () => {
    engineRef.current?.loadStage(clearedStageId - 1);
    engineRef.current?.start();
    setScreen('PLAYING');
  };

  // Proceed to next stage
  const handleProceedNextStage = () => {
    engineRef.current?.loadStage(clearedStageId);
    engineRef.current?.start();
    setScreen('PLAYING');
  };

  // Quit to Title
  const handleQuitToTitle = () => {
    engineRef.current?.stop();
    setScreen('TITLE');
  };

  // Toggle audio mute
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#06080e] text-slate-100">
      {/* Active Game Canvas Container */}
      <div className="relative flex h-full w-full items-center justify-center bg-black">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="h-full w-full max-h-full max-w-full aspect-[16/9] object-contain shadow-2xl"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Scanlines layer for authentic CRT aesthetic */}
        <div className="scanlines absolute inset-0 pointer-events-none opacity-40" />

        {/* HUD (active during PLAYING & PAUSED) */}
        {(screen === 'PLAYING' || screen === 'PAUSED') && (
          <HUD
            player={playerState}
            boss={bossState}
            stats={statsState}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={() => {
              engineRef.current?.pause();
              setScreen('PAUSED');
            }}
          />
        )}

        {/* On-Screen Mobile Touch Controls */}
        {screen === 'PLAYING' && (
          <TouchControls input={inputRef.current} visible={touchControlsActive} />
        )}
      </div>

      {/* Screen Modals & Overlays */}
      {screen === 'TITLE' && (
        <div className="absolute inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-md">
          <TitleScreen
            difficulty={difficulty}
            onSelectDifficulty={(diff) => {
              setDifficulty(diff);
              engineRef.current?.setDifficulty(diff);
            }}
            onStartGame={handleStartGame}
            touchControlsActive={touchControlsActive}
            onToggleTouchControls={() => setTouchControlsActive((prev) => !prev)}
          />
        </div>
      )}

      {screen === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestartStage={handleRestartStage}
          onQuitToTitle={handleQuitToTitle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {screen === 'STAGE_CLEAR' && (
        <StageClearModal
          stageId={clearedStageId}
          stats={statsState}
          onProceed={handleProceedNextStage}
        />
      )}

      {screen === 'GAME_OVER' && (
        <GameOverModal
          stats={statsState}
          onRetry={handleRestartStage}
          onQuitToTitle={handleQuitToTitle}
        />
      )}

      {screen === 'VICTORY' && (
        <VictoryModal
          stats={statsState}
          onPlayAgain={handleStartGame}
          onQuitToTitle={handleQuitToTitle}
        />
      )}
    </div>
  );
}
