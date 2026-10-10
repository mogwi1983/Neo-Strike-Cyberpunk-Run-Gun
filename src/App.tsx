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
import { useAppViewport } from './hooks/useAppViewport';
import { enterFullscreen, isFullscreenActive, isFullscreenSupported, isIOS, isStandaloneApp, toggleFullscreen } from './game/fullscreen';

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
  const touchControlsUserSetRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setIsFullscreen(isFullscreenActive());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  // Auto-detect touch + compact mobile viewports (landscape phones, narrow portrait)
  useEffect(() => {
    const syncTouchControls = () => {
      if (touchControlsUserSetRef.current) return;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const narrowPortrait = window.matchMedia('(max-width: 767px)').matches;
      const landscapePhone = window.matchMedia('(orientation: landscape) and (max-height: 520px)').matches;
      setTouchControlsActive(hasTouch || narrowPortrait || landscapePhone);
    };

    syncTouchControls();
    window.addEventListener('resize', syncTouchControls);
    window.addEventListener('orientationchange', syncTouchControls);
    return () => {
      window.removeEventListener('resize', syncTouchControls);
      window.removeEventListener('orientationchange', syncTouchControls);
    };
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
    if (touchControlsActive && isFullscreenSupported()) {
      void enterFullscreen();
    }
    if (!canvasRef.current) return;
    inputRef.current.reset();

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
    inputRef.current.reset();
    engineRef.current?.resume();
    setScreen('PLAYING');
  };

  // Restart current stage
  const handleRestartStage = () => {
    inputRef.current.reset();
    engineRef.current?.loadStage(clearedStageId - 1);
    engineRef.current?.start();
    setScreen('PLAYING');
  };

  // Proceed to next stage
  const handleProceedNextStage = () => {
    inputRef.current.reset();
    engineRef.current?.loadStage(clearedStageId);
    engineRef.current?.start();
    setScreen('PLAYING');
  };

  // Quit to Title
  const handleQuitToTitle = () => {
    engineRef.current?.stop();
    inputRef.current.reset();
    setScreen('TITLE');
  };

  // Toggle audio mute
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const viewport = useAppViewport();
  const showTouchControls = screen === 'PLAYING' && touchControlsActive;
  const portraitControls = showTouchControls && !viewport.isLandscape;
  const reserveBrowserChrome = isIOS() && !isStandaloneApp() && !isFullscreen;
  const showGameChrome = screen === 'PLAYING' || screen === 'PAUSED';

  return (
    <div
      className="fixed z-0 flex flex-col overflow-hidden bg-[#06080e] text-slate-100"
      style={{
        width: viewport.width,
        height: viewport.height,
        top: viewport.offsetTop,
        left: viewport.offsetLeft,
      }}
    >
      {/* Portrait with touch controls: HUD, then canvas, then a thumb zone. Otherwise the canvas is centered. */}
      <div
        className={`relative flex w-full bg-black ${
          portraitControls
            ? 'shrink-0 justify-center pt-[calc(env(safe-area-inset-top)+4.5rem)]'
            : 'min-h-0 flex-1 items-center justify-center'
        }`}
      >
        <div className="relative flex h-full max-h-full w-full items-center justify-center">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="block aspect-[16/9] max-h-full max-w-full object-contain shadow-2xl"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Scanlines layer for authentic CRT aesthetic */}
          <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />
        </div>
      </div>

      {portraitControls && (
        <TouchControls input={inputRef.current} layout="portrait" reserveBrowserChrome={reserveBrowserChrome} />
      )}

      {showTouchControls && viewport.isLandscape && (
        <TouchControls input={inputRef.current} layout="landscape" reserveBrowserChrome={reserveBrowserChrome} />
      )}

      {/* HUD (active during PLAYING & PAUSED) */}
      {showGameChrome && (
        <HUD
          player={playerState}
          boss={bossState}
          stats={statsState}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={() => {
            inputRef.current.reset();
            engineRef.current?.pause();
            setScreen('PAUSED');
          }}
          isFullscreen={isFullscreen}
          onToggleFullscreen={isFullscreenSupported() ? () => void toggleFullscreen() : undefined}
        />
      )}

      {/* Screen Modals & Overlays */}
      {screen === 'TITLE' && (
        <div className="absolute inset-0 z-50 flex flex-col overflow-y-auto overscroll-y-contain bg-slate-950/95 backdrop-blur-md">
          <TitleScreen
            difficulty={difficulty}
            onSelectDifficulty={(diff) => {
              setDifficulty(diff);
              engineRef.current?.setDifficulty(diff);
            }}
            onStartGame={handleStartGame}
            touchControlsActive={touchControlsActive}
            onToggleTouchControls={() => {
              touchControlsUserSetRef.current = true;
              setTouchControlsActive((prev) => !prev);
            }}
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
