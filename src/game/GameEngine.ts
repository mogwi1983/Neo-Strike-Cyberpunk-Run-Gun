import {
  Player,
  Bullet,
  Enemy,
  Boss,
  Particle,
  DropItem,
  Platform,
  LevelConfig,
  Difficulty,
  GameStats,
  WeaponTier,
} from '../types/game';
import { InputManager } from './InputManager';
import { WEAPON_CONFIGS, createPlayerBullets } from './weapons';
import { sound } from './AudioSystem';
import { LEVELS } from './levels/levelData';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private difficulty: Difficulty;

  private currentStageIndex: number = 0;
  private level!: LevelConfig;

  // Entities
  private player!: Player;
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private activeBoss: Boss | null = null;
  private particles: Particle[] = [];
  private drops: DropItem[] = [];

  // Spawn tracking
  private triggeredSpawns: Set<number> = new Set();
  private nextEntityId: number = 1;

  // Camera & Viewport
  private cameraX: number = 0;
  private cameraY: number = 0;
  private screenShake: number = 0;
  private flashAlpha: number = 0;

  // Loop & Timing
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private gameTimeSeconds: number = 0;

  // Stats
  private stats: GameStats = {
    kills: 0,
    score: 0,
    timeSeconds: 0,
    highestWeaponTier: 1,
    bossDefeated: false,
    bombsUsed: 0,
    damageTaken: 0,
  };

  // Callbacks
  private onHudUpdate: (player: Player, boss: Boss | null, stats: GameStats) => void;
  private onStageClearCallback: (stageId: number, stats: GameStats) => void;
  private onGameOverCallback: (stats: GameStats) => void;
  private onVictoryCallback: (stats: GameStats) => void;

  constructor(
    canvas: HTMLCanvasElement,
    input: InputManager,
    difficulty: Difficulty,
    onHudUpdate: (player: Player, boss: Boss | null, stats: GameStats) => void,
    onStageClear: (stageId: number, stats: GameStats) => void,
    onGameOver: (stats: GameStats) => void,
    onVictory: (stats: GameStats) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.input = input;
    this.difficulty = difficulty;
    this.onHudUpdate = onHudUpdate;
    this.onStageClearCallback = onStageClear;
    this.onGameOverCallback = onGameOver;
    this.onVictoryCallback = onVictory;

    this.loop = this.loop.bind(this);
    this.loadStage(0);
  }

  public setDifficulty(diff: Difficulty) {
    this.difficulty = diff;
  }

  public loadStage(stageIndex: number) {
    this.currentStageIndex = stageIndex % LEVELS.length;
    this.level = JSON.parse(JSON.stringify(LEVELS[this.currentStageIndex]));

    // Checkpoint reset for level
    this.triggeredSpawns.clear();
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.drops = [];
    this.activeBoss = null;

    const maxHp = this.difficulty === 'RECRUIT' ? 140 : this.difficulty === 'ARCADE' ? 70 : 100;
    const initialLives = this.difficulty === 'RECRUIT' ? 5 : this.difficulty === 'ARCADE' ? 2 : 3;

    // Retain weapon tier from previous stage if progressing, or default to 1
    const currentTier = this.player ? this.player.weaponTier : (1 as WeaponTier);
    const currentXp = this.player ? this.player.weaponXp : 0;
    const currentScore = this.player ? this.player.score : 0;
    const currentBombs = this.player ? Math.max(2, this.player.bombs) : (this.difficulty === 'RECRUIT' ? 4 : 2);

    this.player = {
      x: this.level.playerStartX,
      y: this.level.playerStartY,
      vx: 0,
      vy: 0,
      width: 28,
      height: 48,
      facing: 1,
      aimAngle: 0,
      isGrounded: false,
      isDucking: false,
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 0,
      invulnerableTimer: 90, // spawn shield
      health: maxHp,
      maxHealth: maxHp,
      lives: this.player ? this.player.lives : initialLives,
      weaponTier: currentTier,
      weaponXp: currentXp,
      nextTierXp: WEAPON_CONFIGS[currentTier].xpRequired,
      bombs: currentBombs,
      shieldTimer: 0,
      score: currentScore,
      multiplier: 1,
      multiplierTimer: 0,
      shootCooldown: 0,
      runFrame: 0,
    };

    this.cameraX = 0;
    this.cameraY = 0;
    this.screenShake = 0;
    this.flashAlpha = 0;

    // Start background music
    sound.startMusic();
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now();
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    sound.stopMusic();
  }

  // --- Main 60FPS Game Loop ---
  private loop(timestamp: number) {
    if (!this.isRunning || this.isPaused) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // clamp max delta
    this.lastTime = timestamp;
    this.gameTimeSeconds += dt;
    this.stats.timeSeconds = Math.floor(this.gameTimeSeconds);

    this.update(dt);
    this.render();

    this.onHudUpdate(this.player, this.activeBoss, this.stats);

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  // --- Physics & Entity Updates ---
  private update(dt: number) {
    const inputState = this.input.poll();

    // 1. Player Timers
    if (this.player.invulnerableTimer > 0) this.player.invulnerableTimer--;
    if (this.player.shieldTimer > 0) this.player.shieldTimer--;
    if (this.player.dashCooldown > 0) this.player.dashCooldown--;
    if (this.player.shootCooldown > 0) this.player.shootCooldown--;
    if (this.screenShake > 0) this.screenShake *= 0.88;
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);

    // Multiplier combo decay
    if (this.player.multiplierTimer > 0) {
      this.player.multiplierTimer -= dt;
      if (this.player.multiplierTimer <= 0) {
        this.player.multiplier = 1;
      }
    }

    // 2. Player Aiming Direction
    this.updatePlayerAim(inputState);

    // 3. Player Dash Roll
    if (inputState.dash && this.player.dashCooldown <= 0 && !this.player.isDashing) {
      this.player.isDashing = true;
      this.player.dashTimer = 16; // 16 frames of dash
      this.player.dashCooldown = 45; // Cooldown
      this.player.invulnerableTimer = Math.max(this.player.invulnerableTimer, 16);
      this.player.vx = this.player.facing * 12;
      sound.playDash();

      // Dash ghost particles
      this.createDashGhostParticles();
    }

    if (this.player.isDashing) {
      this.player.dashTimer--;
      this.player.vx = this.player.facing * 11;
      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
      }
    } else {
      // 4. Standard Horizontal Movement
      const moveSpeed = 5.2;
      const accel = 0.85;

      if (inputState.left) {
        this.player.vx = Math.max(-moveSpeed, this.player.vx - accel);
        this.player.facing = -1;
        this.player.runFrame += 0.25;
      } else if (inputState.right) {
        this.player.vx = Math.min(moveSpeed, this.player.vx + accel);
        this.player.facing = 1;
        this.player.runFrame += 0.25;
      } else {
        this.player.vx *= 0.72; // Ground friction
        if (Math.abs(this.player.vx) < 0.1) this.player.vx = 0;
      }
    }

    // 5. Ducking / Crouch
    this.player.isDucking = inputState.down && this.player.isGrounded && !this.player.isDashing;
    this.player.height = this.player.isDucking ? 28 : 48;

    // 6. Jump Physics
    const gravity = 0.52;
    const jumpImpulse = -11.5;

    if (inputState.jump && this.player.isGrounded && !this.player.isDucking) {
      this.player.vy = jumpImpulse;
      this.player.isGrounded = false;
      sound.playJump();
    } else if (!inputState.jump && this.player.vy < -3.5) {
      // Variable jump height: release jump early to cut ascent
      this.player.vy *= 0.6;
    }

    this.player.vy += gravity;
    if (this.player.vy > 14) this.player.vy = 14; // Terminal velocity

    // 7. Super Bomb
    if (inputState.bomb && this.player.bombs > 0) {
      this.triggerSuperBomb();
    }

    // 8. Shooting
    if (inputState.shoot && this.player.shootCooldown <= 0) {
      const config = WEAPON_CONFIGS[this.player.weaponTier];
      this.player.shootCooldown = config.fireRate;

      const newBullets = createPlayerBullets(this.player);
      this.bullets.push(...newBullets);

      // Play audio based on weapon
      if (config.type === 'PULSE') sound.playLaser(1);
      else if (config.type === 'SPREAD') sound.playSpread();
      else if (config.type === 'BEAM') sound.playLaser(3);
      else if (config.type === 'HOMING') sound.playMissile();
      else if (config.type === 'OVERCHARGE') sound.playLaser(5);

      // Muzzle sparks
      this.createMuzzleSparks();
    }

    // 9. Move & Collide Player with Platforms
    this.movePlayerWithCollision();

    // 10. Checkpoints Check
    this.level.checkpoints.forEach((cp) => {
      if (!cp.reached && Math.abs(this.player.x - cp.x) < 80) {
        cp.reached = true;
        sound.playPowerup();
        this.createLevelUpParticles(cp.x, cp.y - 30, '#00f0ff');
      }
    });

    // 11. Enemy Spawning Trigger
    this.checkEnemySpawns();

    // 12. Update Enemies & AI
    this.updateEnemies();

    // 13. Update Boss
    this.updateBoss(dt);

    // 14. Update Bullets
    this.updateBullets();

    // 15. Update Drops & Pickups
    this.updateDrops();

    // 16. Update Particles
    this.updateParticles();

    // 17. Update Camera
    this.updateCamera();

    // 18. Check Pit Death
    if (this.player.y > this.level.height + 40) {
      this.handlePlayerDeath('pit');
    }
  }

  private updatePlayerAim(input: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    hasAimVector: boolean;
    aimX: number;
    aimY: number;
  }) {
    if (input.hasAimVector && (input.aimX !== 0 || input.aimY !== 0)) {
      this.player.aimAngle = Math.atan2(input.aimY, input.aimX);
      if (Math.cos(this.player.aimAngle) > 0.1) this.player.facing = 1;
      else if (Math.cos(this.player.aimAngle) < -0.1) this.player.facing = -1;
      return;
    }

    const facingRight = this.player.facing === 1;

    if (input.up) {
      if (input.right) {
        this.player.aimAngle = -Math.PI / 4; // 45 deg up-right
        this.player.facing = 1;
      } else if (input.left) {
        this.player.aimAngle = (-3 * Math.PI) / 4; // 45 deg up-left
        this.player.facing = -1;
      } else {
        this.player.aimAngle = -Math.PI / 2; // Straight up
      }
    } else if (input.down) {
      if (!this.player.isGrounded) {
        // Airborne: shoot straight down or diagonally down
        if (input.right) {
          this.player.aimAngle = Math.PI / 4;
          this.player.facing = 1;
        } else if (input.left) {
          this.player.aimAngle = (3 * Math.PI) / 4;
          this.player.facing = -1;
        } else {
          this.player.aimAngle = Math.PI / 2; // Straight down
        }
      } else {
        // Grounded ducking: shoot straight forward
        if (input.right) {
          this.player.aimAngle = Math.PI / 6; // slightly down-angled forward
          this.player.facing = 1;
        } else if (input.left) {
          this.player.aimAngle = (5 * Math.PI) / 6;
          this.player.facing = -1;
        } else {
          this.player.aimAngle = facingRight ? 0 : Math.PI;
        }
      }
    } else {
      // Horizontal
      this.player.aimAngle = facingRight ? 0 : Math.PI;
    }
  }

  private movePlayerWithCollision() {
    // Horizontal Movement
    this.player.x += this.player.vx;

    // Arena boundary clamp
    if (this.player.x < 10) {
      this.player.x = 10;
      this.player.vx = 0;
    }
    if (this.player.x > this.level.width - this.player.width - 10) {
      this.player.x = this.level.width - this.player.width - 10;
      this.player.vx = 0;
    }

    // Vertical Movement
    this.player.y += this.player.vy;
    this.player.isGrounded = false;

    // Platform collisions
    for (const plat of this.level.platforms) {
      if (plat.isHazard) {
        // Hazard collision (acid / spikes)
        if (
          this.player.x + this.player.width > plat.x &&
          this.player.x < plat.x + plat.width &&
          this.player.y + this.player.height > plat.y &&
          this.player.y < plat.y + plat.height
        ) {
          if (this.player.invulnerableTimer <= 0 && this.player.shieldTimer <= 0) {
            this.handlePlayerDamage(35);
            this.player.vy = -7;
          }
        }
        continue;
      }

      if (plat.isOneWay) {
        // One-way platform: only land on top when falling downward
        const prevY = this.player.y - this.player.vy;
        if (
          this.player.vy > 0 &&
          prevY + this.player.height <= plat.y + 4 &&
          this.player.y + this.player.height >= plat.y &&
          this.player.x + this.player.width > plat.x + 4 &&
          this.player.x < plat.x + plat.width - 4
        ) {
          this.player.y = plat.y - this.player.height;
          this.player.vy = 0;
          this.player.isGrounded = true;
        }
      } else {
        // Solid block collision
        if (
          this.player.x + this.player.width > plat.x &&
          this.player.x < plat.x + plat.width &&
          this.player.y + this.player.height > plat.y &&
          this.player.y < plat.y + plat.height
        ) {
          // Landing on top
          if (this.player.vy > 0 && this.player.y + this.player.height - this.player.vy <= plat.y + 12) {
            this.player.y = plat.y - this.player.height;
            this.player.vy = 0;
            this.player.isGrounded = true;
          }
          // Hitting ceiling
          else if (this.player.vy < 0 && this.player.y - this.player.vy >= plat.y + plat.height - 12) {
            this.player.y = plat.y + plat.height;
            this.player.vy = 0;
          }
          // Side collision
          else if (this.player.vx > 0) {
            this.player.x = plat.x - this.player.width;
            this.player.vx = 0;
          } else if (this.player.vx < 0) {
            this.player.x = plat.x + plat.width;
            this.player.vx = 0;
          }
        }
      }
    }
  }

  private checkEnemySpawns() {
    this.level.spawns.forEach((spawn, idx) => {
      if (!this.triggeredSpawns.has(idx) && this.player.x >= spawn.triggerX) {
        this.triggeredSpawns.add(idx);
        this.spawnEnemy(spawn.type, spawn.relX, spawn.relY, spawn.patrolRange);
      }
    });

    // Check boss room activation
    if (!this.activeBoss && !this.level.boss.defeated && this.player.x >= this.level.boss.x - 550) {
      this.activeBoss = { ...this.level.boss, active: true };
      sound.playBossAlarm();
      this.screenShake = 16;
    }
  }

  private spawnEnemy(type: Enemy['type'], x: number, y: number, patrolRange: number = 180) {
    let width = 28;
    let height = 44;
    let hp = 45;
    let scoreVal = 100;
    let xpVal = 25;
    let color = '#00f0ff';
    let isShielded = false;

    if (type === 'DRONE') {
      width = 32;
      height = 24;
      hp = 35;
      scoreVal = 150;
      xpVal = 30;
      color = '#ff007f';
    } else if (type === 'TURRET') {
      width = 30;
      height = 30;
      hp = 60;
      scoreVal = 200;
      xpVal = 40;
      color = '#ffb703';
    } else if (type === 'MECH') {
      width = 44;
      height = 54;
      hp = 160;
      scoreVal = 400;
      xpVal = 80;
      color = '#c084fc';
      isShielded = true;
    } else if (type === 'CRAWLER') {
      width = 32;
      height = 20;
      hp = 40;
      scoreVal = 120;
      xpVal = 30;
      color = '#39ff14';
    }

    if (this.difficulty === 'ARCADE') {
      hp = Math.round(hp * 1.35);
    } else if (this.difficulty === 'RECRUIT') {
      hp = Math.round(hp * 0.75);
    }

    this.enemies.push({
      id: ++this.nextEntityId,
      type,
      x,
      y,
      vx: type === 'GRUNT' ? -1.8 : 0,
      vy: 0,
      width,
      height,
      health: hp,
      maxHealth: hp,
      shootCooldown: Math.floor(Math.random() * 60) + 40,
      facing: -1,
      isGrounded: false,
      patrolMinX: x - patrolRange,
      patrolMaxX: x + patrolRange,
      scoreValue: scoreVal,
      xpValue: xpVal,
      color,
      isShielded,
      hitFlashTimer: 0,
      animFrame: 0,
    });
  }

  private updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hitFlashTimer && e.hitFlashTimer > 0) e.hitFlashTimer--;

      // Remove distant enemies
      if (e.x < this.cameraX - 400 || e.x > this.cameraX + 1600) {
        this.enemies.splice(i, 1);
        continue;
      }

      // AI Behaviors
      switch (e.type) {
        case 'GRUNT': {
          e.x += e.vx;
          if (e.x <= e.patrolMinX) {
            e.vx = Math.abs(e.vx);
            e.facing = 1;
          } else if (e.x >= e.patrolMaxX) {
            e.vx = -Math.abs(e.vx);
            e.facing = -1;
          }

          // Shoot at player when within range
          e.shootCooldown--;
          if (e.shootCooldown <= 0 && Math.abs(e.x - this.player.x) < 550) {
            e.shootCooldown = 90 + Math.floor(Math.random() * 40);
            const aimAngle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
            this.bullets.push({
              id: ++this.nextEntityId,
              x: e.x + (e.facing === 1 ? e.width : 0),
              y: e.y + e.height / 2,
              vx: Math.cos(aimAngle) * 6,
              vy: Math.sin(aimAngle) * 6,
              width: 8,
              height: 8,
              radius: 4,
              damage: 15,
              color: '#ff0055',
              isPlayer: false,
              pierce: 1,
              homing: false,
              life: 120,
              type: 'ENEMY_BOLT',
            });
            sound.playLaser(1);
          }
          break;
        }

        case 'DRONE': {
          // Sinusoidal hover towards player
          e.animFrame = (e.animFrame || 0) + 0.05;
          e.vy = Math.sin(e.animFrame) * 1.5;
          const dx = this.player.x - e.x;
          e.vx = dx > 0 ? 1.2 : -1.2;
          e.x += e.vx;
          e.y += e.vy;

          e.shootCooldown--;
          if (e.shootCooldown <= 0 && Math.abs(dx) < 400) {
            e.shootCooldown = 110;
            // Drop bomb downward
            this.bullets.push({
              id: ++this.nextEntityId,
              x: e.x + e.width / 2,
              y: e.y + e.height,
              vx: e.vx * 0.5,
              vy: 4.5,
              width: 10,
              height: 10,
              radius: 5,
              damage: 18,
              color: '#ffb703',
              isPlayer: false,
              pierce: 1,
              homing: false,
              life: 100,
              type: 'ENEMY_BOLT',
            });
          }
          break;
        }

        case 'TURRET': {
          e.shootCooldown--;
          const dist = Math.hypot(this.player.x - e.x, this.player.y - e.y);
          if (e.shootCooldown <= 0 && dist < 600) {
            e.shootCooldown = 80;
            const ang = Math.atan2(this.player.y - e.y, this.player.x - e.x);
            this.bullets.push({
              id: ++this.nextEntityId,
              x: e.x + e.width / 2,
              y: e.y + e.height / 2,
              vx: Math.cos(ang) * 6.5,
              vy: Math.sin(ang) * 6.5,
              width: 10,
              height: 10,
              radius: 5,
              damage: 20,
              color: '#ff007f',
              isPlayer: false,
              pierce: 1,
              homing: false,
              life: 110,
              type: 'ENEMY_BOLT',
            });
          }
          break;
        }

        case 'MECH': {
          // Slow stomping forward, occasionally launches mortar
          e.facing = this.player.x > e.x ? 1 : -1;
          e.x += e.facing * 0.8;

          e.shootCooldown--;
          if (e.shootCooldown <= 0 && Math.abs(this.player.x - e.x) < 550) {
            e.shootCooldown = 130;
            // High lob mortar
            this.bullets.push({
              id: ++this.nextEntityId,
              x: e.x + e.width / 2,
              y: e.y + 10,
              vx: e.facing * 5,
              vy: -7,
              width: 12,
              height: 12,
              radius: 6,
              damage: 25,
              color: '#c084fc',
              isPlayer: false,
              pierce: 1,
              homing: false,
              life: 120,
              type: 'ENEMY_MISSILE',
            });
          }
          break;
        }

        case 'CRAWLER': {
          // Fast skittering
          e.facing = this.player.x > e.x ? 1 : -1;
          e.x += e.facing * 3.4;
          break;
        }
      }

      // Check player body contact with enemy
      if (
        this.player.invulnerableTimer <= 0 &&
        this.player.shieldTimer <= 0 &&
        this.checkAABB(this.player, e)
      ) {
        this.handlePlayerDamage(22);
        this.player.vx = (this.player.x > e.x ? 1 : -1) * 7;
        this.player.vy = -5;
      }
    }
  }

  private updateBoss(dt: number) {
    if (!this.activeBoss || this.activeBoss.defeated) return;

    const boss = this.activeBoss;
    if (boss.hitFlashTimer > 0) boss.hitFlashTimer--;

    boss.attackTimer += dt;

    // Boss Phase Transitions
    const hpRatio = boss.health / boss.maxHealth;
    if (hpRatio < 0.5 && boss.phase === 1) {
      boss.phase = 2;
      this.screenShake = 20;
      sound.playBossAlarm();
      this.createLevelUpParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, '#ff0055');
    } else if (hpRatio < 0.25 && boss.phase === 2 && boss.maxPhases >= 3) {
      boss.phase = 3;
      this.screenShake = 25;
      sound.playBossAlarm();
    }

    // Stage 1 Boss: Hex-Walker
    if (boss.id === 'boss_walker') {
      boss.x += Math.sin(this.gameTimeSeconds * 1.5) * 1.2;

      if (boss.attackTimer > 2.8) {
        boss.attackTimer = 0;
        const attackRoll = Math.random();

        if (attackRoll < 0.45) {
          // Ground Stomp Shockwave
          this.screenShake = 12;
          sound.playExplosion('large');
          [-7, 7].forEach((vx) => {
            this.bullets.push({
              id: ++this.nextEntityId,
              x: boss.x + boss.width / 2,
              y: boss.y + boss.height - 10,
              vx,
              vy: 0,
              width: 22,
              height: 28,
              radius: 12,
              damage: 28,
              color: '#00f0ff',
              isPlayer: false,
              pierce: 1,
              homing: false,
              life: 140,
              type: 'ENEMY_BOLT',
            });
          });
        } else {
          // Dual Missile Barrage
          sound.playMissile();
          for (let m = 0; m < 3; m++) {
            const ang = -Math.PI / 2 + (m - 1) * 0.35;
            this.bullets.push({
              id: ++this.nextEntityId,
              x: boss.x + boss.width / 2,
              y: boss.y + 20,
              vx: Math.cos(ang) * 6,
              vy: Math.sin(ang) * 6,
              width: 14,
              height: 14,
              radius: 7,
              damage: 22,
              color: '#ff007f',
              isPlayer: false,
              pierce: 1,
              homing: true,
              life: 130,
              type: 'ENEMY_MISSILE',
            });
          }
        }
      }
    }

    // Stage 2 Boss: Chitinous Leviathan
    else if (boss.id === 'boss_leviathan') {
      boss.x += Math.sin(this.gameTimeSeconds * 2.2) * 2.0;

      if (boss.attackTimer > 2.4) {
        boss.attackTimer = 0;
        // 5-way Acid Spit Spray
        sound.playSpread();
        const baseAng = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
        for (let s = -2; s <= 2; s++) {
          const ang = baseAng + s * 0.18;
          this.bullets.push({
            id: ++this.nextEntityId,
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height / 2,
            vx: Math.cos(ang) * 5.8,
            vy: Math.sin(ang) * 5.8,
            width: 12,
            height: 12,
            radius: 6,
            damage: 24,
            color: '#39ff14',
            isPlayer: false,
            pierce: 1,
            homing: false,
            life: 110,
            type: 'ENEMY_ACID',
          });
        }
      }
    }

    // Stage 3 Boss: Cyber-Alien Overmind
    else if (boss.id === 'boss_overmind') {
      boss.shieldAngle = (boss.shieldAngle || 0) + dt * 2.5;

      if (boss.attackTimer > 1.8) {
        boss.attackTimer = 0;

        // Circular Bullet Spiral
        sound.playLaser(3);
        const count = boss.phase === 3 ? 12 : 8;
        for (let i = 0; i < count; i++) {
          const ang = (i / count) * Math.PI * 2 + (boss.shieldAngle || 0);
          this.bullets.push({
            id: ++this.nextEntityId,
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height / 2,
            vx: Math.cos(ang) * 4.8,
            vy: Math.sin(ang) * 4.8,
            width: 12,
            height: 12,
            radius: 6,
            damage: 25,
            color: '#ff007f',
            isPlayer: false,
            pierce: 1,
            homing: false,
            life: 120,
            type: 'BOSS_BEAM',
          });
        }
      }
    }
  }

  private updateBullets() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life--;

      // Homing logic
      if (b.homing) {
        if (b.isPlayer) {
          // Seek nearest enemy or boss
          let targetX = 0;
          let targetY = 0;
          let found = false;
          let minDist = 700;

          if (this.activeBoss && !this.activeBoss.defeated) {
            targetX = this.activeBoss.x + this.activeBoss.width / 2;
            targetY = this.activeBoss.y + this.activeBoss.height / 2;
            found = true;
          } else {
            this.enemies.forEach((e) => {
              const d = Math.hypot(e.x - b.x, e.y - b.y);
              if (d < minDist) {
                minDist = d;
                targetX = e.x + e.width / 2;
                targetY = e.y + e.height / 2;
                found = true;
              }
            });
          }

          if (found) {
            const desiredAng = Math.atan2(targetY - b.y, targetX - b.x);
            const currentSpeed = Math.hypot(b.vx, b.vy);
            b.vx = b.vx * 0.88 + Math.cos(desiredAng) * currentSpeed * 0.12;
            b.vy = b.vy * 0.88 + Math.sin(desiredAng) * currentSpeed * 0.12;
          }
        } else {
          // Enemy homing bullet seeking player
          const desiredAng = Math.atan2(this.player.y - b.y, this.player.x - b.x);
          const currentSpeed = Math.hypot(b.vx, b.vy);
          b.vx = b.vx * 0.94 + Math.cos(desiredAng) * currentSpeed * 0.06;
          b.vy = b.vy * 0.94 + Math.sin(desiredAng) * currentSpeed * 0.06;
        }

        // Rocket smoke trail
        if (Math.random() < 0.6) {
          this.particles.push({
            x: b.x,
            y: b.y,
            vx: -b.vx * 0.2 + (Math.random() - 0.5),
            vy: -b.vy * 0.2 + (Math.random() - 0.5),
            size: 3,
            color: b.color,
            alpha: 0.8,
            decay: 0.04,
            shape: 'circle',
          });
        }
      }

      // Parabolic ballistic trajectory for enemy mortars
      if (b.type === 'ENEMY_MISSILE') {
        b.vy += 0.22;
      }

      b.x += b.vx;
      b.y += b.vy;

      // Despawn bullet
      if (
        b.life <= 0 ||
        b.x < this.cameraX - 100 ||
        b.x > this.cameraX + 1300 ||
        b.y < -100 ||
        b.y > this.level.height + 100
      ) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Player Bullet Collisions
      if (b.isPlayer) {
        let hit = false;

        // Check boss collision
        if (this.activeBoss && !this.activeBoss.defeated && this.checkPointInRect(b.x, b.y, this.activeBoss)) {
          this.activeBoss.health -= b.damage;
          this.activeBoss.hitFlashTimer = 5;
          sound.playHit();
          this.createHitSparks(b.x, b.y, b.color);
          hit = true;

          if (this.activeBoss.health <= 0) {
            this.handleBossDefeated();
          }
        }

        // Check enemies collision
        if (!hit) {
          for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
            const e = this.enemies[eIdx];
            if (this.checkPointInRect(b.x, b.y, e)) {
              // Mech frontal shield check
              if (e.isShielded && ((e.facing === -1 && b.vx > 0) || (e.facing === 1 && b.vx < 0))) {
                // Deflected!
                sound.playHit();
                this.createHitSparks(b.x, b.y, '#ffffff');
                hit = true;
                break;
              }

              e.health -= b.damage;
              e.hitFlashTimer = 6;
              sound.playHit();
              this.createHitSparks(b.x, b.y, b.color);

              if (e.health <= 0) {
                this.handleEnemyDeath(e);
                this.enemies.splice(eIdx, 1);
              }

              hit = true;
              break;
            }
          }
        }

        if (hit) {
          b.pierce--;
          if (b.pierce <= 0) {
            this.bullets.splice(i, 1);
          }
        }
      }
      // Enemy Bullet Collisions against Player
      else {
        if (
          this.player.invulnerableTimer <= 0 &&
          this.player.shieldTimer <= 0 &&
          this.checkPointInRect(b.x, b.y, this.player)
        ) {
          this.handlePlayerDamage(b.damage);
          this.createHitSparks(b.x, b.y, '#ff0055');
          this.bullets.splice(i, 1);
        }
      }
    }
  }

  private updateDrops() {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.timer--;

      // Magnetic attraction to player
      const dist = Math.hypot(this.player.x + this.player.width / 2 - drop.x, this.player.y + this.player.height / 2 - drop.y);
      if (dist < 140) {
        const ang = Math.atan2(this.player.y + this.player.height / 2 - drop.y, this.player.x + this.player.width / 2 - drop.x);
        drop.vx = drop.vx * 0.8 + Math.cos(ang) * 9 * 0.2;
        drop.vy = drop.vy * 0.8 + Math.sin(ang) * 9 * 0.2;
      } else {
        drop.vx *= 0.95;
        drop.vy *= 0.95;
      }

      drop.x += drop.vx;
      drop.y += drop.vy;

      // Pickup collision
      if (dist < 32) {
        this.collectDrop(drop);
        this.drops.splice(i, 1);
        continue;
      }

      if (drop.timer <= 0) {
        this.drops.splice(i, 1);
      }
    }
  }

  private collectDrop(drop: DropItem) {
    if (drop.type === 'XP_CORE') {
      sound.playPowerup();
      this.player.weaponXp += drop.value;
      this.checkWeaponUpgrade();
    } else if (drop.type === 'HEALTH') {
      sound.playPowerup();
      this.player.health = Math.min(this.player.maxHealth, this.player.health + drop.value);
      this.createLevelUpParticles(this.player.x, this.player.y, '#39ff14');
    } else if (drop.type === 'BOMB') {
      sound.playPowerup();
      this.player.bombs = Math.min(5, this.player.bombs + 1);
      this.createLevelUpParticles(this.player.x, this.player.y, '#ffb703');
    } else if (drop.type === 'SHIELD') {
      sound.playPowerup();
      this.player.shieldTimer = 360; // 6 seconds shield
      this.createLevelUpParticles(this.player.x, this.player.y, '#00f0ff');
    }
  }

  private checkWeaponUpgrade() {
    const currentTier = this.player.weaponTier;
    if (currentTier < 5) {
      const nextConfig = WEAPON_CONFIGS[(currentTier + 1) as WeaponTier];
      if (this.player.weaponXp >= WEAPON_CONFIGS[currentTier].xpRequired) {
        this.player.weaponTier = (currentTier + 1) as WeaponTier;
        this.player.nextTierXp = nextConfig.xpRequired;
        this.stats.highestWeaponTier = Math.max(this.stats.highestWeaponTier, this.player.weaponTier) as WeaponTier;
        
        // Upgrade fanfare & particle blast
        sound.playLevelUp();
        this.screenShake = 14;
        this.createLevelUpParticles(
          this.player.x + this.player.width / 2,
          this.player.y + this.player.height / 2,
          nextConfig.color
        );
      }
    }
  }

  private triggerSuperBomb() {
    this.player.bombs--;
    this.stats.bombsUsed++;
    sound.playBomb();
    this.flashAlpha = 0.85;
    this.screenShake = 24;

    // Clear all enemy bullets on screen
    this.bullets = this.bullets.filter((b) => b.isPlayer);

    // Blast all enemies on screen
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.x >= this.cameraX - 100 && e.x <= this.cameraX + 1300) {
        e.health -= 220;
        e.hitFlashTimer = 12;
        if (e.health <= 0) {
          this.handleEnemyDeath(e);
          this.enemies.splice(i, 1);
        }
      }
    }

    // Blast Boss
    if (this.activeBoss && !this.activeBoss.defeated) {
      this.activeBoss.health -= 280;
      this.activeBoss.hitFlashTimer = 15;
      if (this.activeBoss.health <= 0) {
        this.handleBossDefeated();
      }
    }
  }

  private handleEnemyDeath(e: Enemy) {
    this.stats.kills++;
    sound.playExplosion(e.type === 'MECH' ? 'large' : 'small');
    this.createExplosionParticles(e.x + e.width / 2, e.y + e.height / 2, e.color);

    // Multiplier combo
    this.player.multiplier = Math.min(3.0, Number((this.player.multiplier + 0.1).toFixed(1)));
    this.player.multiplierTimer = 3.5;
    const addedScore = Math.round(e.scoreValue * this.player.multiplier);
    this.player.score += addedScore;
    this.stats.score = this.player.score;

    // Spawn Drops
    // 1. Guaranteed XP core
    this.drops.push({
      id: ++this.nextEntityId,
      type: 'XP_CORE',
      x: e.x + e.width / 2,
      y: e.y + e.height / 2,
      vx: (Math.random() - 0.5) * 4,
      vy: -3 - Math.random() * 2,
      value: e.xpValue,
      timer: 450,
    });

    // 2. Chance for Health or Bomb
    const rand = Math.random();
    if (rand < 0.16) {
      this.drops.push({
        id: ++this.nextEntityId,
        type: 'HEALTH',
        x: e.x + e.width / 2,
        y: e.y + e.height / 2,
        vx: (Math.random() - 0.5) * 3,
        vy: -4,
        value: 30,
        timer: 450,
      });
    } else if (rand < 0.22) {
      this.drops.push({
        id: ++this.nextEntityId,
        type: 'BOMB',
        x: e.x + e.width / 2,
        y: e.y + e.height / 2,
        vx: (Math.random() - 0.5) * 3,
        vy: -4,
        value: 1,
        timer: 450,
      });
    }
  }

  private handleBossDefeated() {
    if (!this.activeBoss) return;
    this.activeBoss.defeated = true;
    this.stats.bossDefeated = true;
    sound.playExplosion('boss');
    sound.playStageClear();
    this.screenShake = 30;

    // Chained boss explosions
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        if (!this.activeBoss) return;
        this.createExplosionParticles(
          this.activeBoss.x + Math.random() * this.activeBoss.width,
          this.activeBoss.y + Math.random() * this.activeBoss.height,
          '#ff007f'
        );
      }, i * 140);
    }

    this.player.score += 5000 * (this.currentStageIndex + 1);
    this.stats.score = this.player.score;

    setTimeout(() => {
      if (this.currentStageIndex >= LEVELS.length - 1) {
        this.onVictoryCallback(this.stats);
      } else {
        this.onStageClearCallback(this.currentStageIndex + 1, this.stats);
      }
    }, 2200);
  }

  private handlePlayerDamage(amount: number) {
    if (this.player.invulnerableTimer > 0 || this.player.shieldTimer > 0) return;

    this.player.health -= amount;
    this.stats.damageTaken += amount;
    this.player.invulnerableTimer = 55;
    this.screenShake = 12;
    sound.playPlayerHurt();

    if (this.player.health <= 0) {
      this.handlePlayerDeath('health');
    }
  }

  private handlePlayerDeath(cause: 'pit' | 'health') {
    sound.playPlayerDeath();
    this.createExplosionParticles(this.player.x + 14, this.player.y + 24, '#00f0ff');
    this.player.lives--;

    if (this.player.lives <= 0) {
      this.stop();
      sound.playGameOver();
      this.onGameOverCallback(this.stats);
      return;
    }

    // Respawn at last reached checkpoint
    let respawnX = this.level.playerStartX;
    let respawnY = this.level.playerStartY;
    this.level.checkpoints.forEach((cp) => {
      if (cp.reached && cp.x > respawnX) {
        respawnX = cp.x;
        respawnY = cp.y;
      }
    });

    const maxHp = this.difficulty === 'RECRUIT' ? 140 : this.difficulty === 'ARCADE' ? 70 : 100;
    this.player.x = respawnX;
    this.player.y = respawnY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.health = maxHp;
    this.player.invulnerableTimer = 110;
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateCamera() {
    // Center camera on player
    const viewWidth = this.canvas.width;
    let targetX = this.player.x - viewWidth * 0.35;

    // Lock camera when boss is active
    if (this.activeBoss && this.activeBoss.active) {
      const bossRoomX = this.level.width - viewWidth;
      targetX = Math.max(targetX, bossRoomX);
    }

    targetX = Math.max(0, Math.min(this.level.width - viewWidth, targetX));
    this.cameraX += (targetX - this.cameraX) * 0.12;
  }

  // --- Rendering Pipeline ---
  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    // Screen Shake Offset
    if (this.screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Sky & Parallax Cyber Background
    this.renderParallaxBackground(ctx, w, h);

    ctx.save();
    ctx.translate(-this.cameraX, -this.cameraY);

    // 2. Platforms & Hazards
    this.renderPlatforms(ctx);

    // 3. Drops & Pickups
    this.renderDrops(ctx);

    // 4. Enemies
    this.renderEnemies(ctx);

    // 5. Boss
    this.renderBoss(ctx);

    // 6. Player
    this.renderPlayer(ctx);

    // 7. Bullets
    this.renderBullets(ctx);

    // 8. Particles
    this.renderParticles(ctx);

    ctx.restore();

    // 9. Super Bomb Whiteout Flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  // Static templates for parallax skyline (guarantees rock-solid vertical stability and zero jitter)
  private static readonly DISTANT_BUILDING_TEMPLATES = [
    { width: 95, height: 260, spireHeight: 30, hasAntennaLight: true, windowRows: 6 },
    { width: 110, height: 320, spireHeight: 0, hasAntennaLight: false, windowRows: 8 },
    { width: 85, height: 210, spireHeight: 20, hasAntennaLight: true, windowRows: 5 },
    { width: 125, height: 370, spireHeight: 45, hasAntennaLight: true, windowRows: 9 },
    { width: 100, height: 280, spireHeight: 0, hasAntennaLight: false, windowRows: 7 },
    { width: 90, height: 230, spireHeight: 15, hasAntennaLight: false, windowRows: 5 },
    { width: 115, height: 340, spireHeight: 40, hasAntennaLight: true, windowRows: 8 },
    { width: 130, height: 290, spireHeight: 0, hasAntennaLight: false, windowRows: 7 },
  ];

  private static readonly MIDGROUND_TEMPLATES = [
    { width: 140, height: 290, hasBillboard: true, billboardText: 'NEO-STRIKE', billboardColor: '#00f0ff' },
    { width: 160, height: 340, hasBillboard: false, billboardText: '', billboardColor: '' },
    { width: 130, height: 270, hasBillboard: true, billboardText: 'CORP.09', billboardColor: '#ff007f' },
    { width: 175, height: 380, hasBillboard: false, billboardText: '', billboardColor: '' },
    { width: 150, height: 310, hasBillboard: true, billboardText: 'CYBER', billboardColor: '#39ff14' },
    { width: 165, height: 360, hasBillboard: false, billboardText: '', billboardColor: '' },
    { width: 140, height: 280, hasBillboard: true, billboardText: 'NEXUS', billboardColor: '#ffb703' },
  ];

  private renderParallaxBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const palette = this.level.palette;

    // 1. Sky Gradient (Static vertical fill)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, palette.skyTop);
    skyGrad.addColorStop(1, palette.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Distant Cyber City Skyline (Smooth, stable horizontal parallax at 0.12x speed)
    const distantTemplates = GameEngine.DISTANT_BUILDING_TEMPLATES;
    const distantCycleWidth = distantTemplates.reduce((sum, b) => sum + b.width, 0);
    const distantScroll = this.cameraX * 0.12;
    const distantOffset = ((distantScroll % distantCycleWidth) + distantCycleWidth) % distantCycleWidth;

    let startX = -distantOffset - 50;
    let bIndex = 0;
    while (startX < w + 200) {
      const template = distantTemplates[bIndex % distantTemplates.length];
      const bldgH = template.height;
      const bldgY = h - bldgH;

      // Building Silhouette
      ctx.fillStyle = '#080c16';
      ctx.fillRect(startX, bldgY, template.width - 4, bldgH);

      // Spire / Antenna
      if (template.spireHeight > 0) {
        ctx.strokeStyle = '#080c16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX + template.width / 2, bldgY);
        ctx.lineTo(startX + template.width / 2, bldgY - template.spireHeight);
        ctx.stroke();

        if (template.hasAntennaLight) {
          ctx.fillStyle = 'rgba(255, 0, 85, 0.7)';
          ctx.beginPath();
          ctx.arc(startX + template.width / 2, bldgY - template.spireHeight, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Static Window Grid (fixed Y coordinates relative to building top)
      ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
      for (let r = 0; r < template.windowRows; r++) {
        const wy = bldgY + 24 + r * 28;
        if (wy < h - 40) {
          ctx.fillRect(startX + 14, wy, 14, 10);
          ctx.fillRect(startX + template.width - 32, wy, 14, 10);
        }
      }

      startX += template.width;
      bIndex++;
    }

    // 3. Midground Towers & Scaffolding (Smooth horizontal parallax at 0.28x speed)
    const midTemplates = GameEngine.MIDGROUND_TEMPLATES;
    const midCycleWidth = midTemplates.reduce((sum, b) => sum + b.width, 0);
    const midScroll = this.cameraX * 0.28;
    const midOffset = ((midScroll % midCycleWidth) + midCycleWidth) % midCycleWidth;

    let midStartX = -midOffset - 60;
    let mIndex = 0;
    while (midStartX < w + 250) {
      const template = midTemplates[mIndex % midTemplates.length];
      const bldgH = template.height;
      const bldgY = h - bldgH;

      // Midground Structure
      ctx.fillStyle = '#0e1422';
      ctx.fillRect(midStartX, bldgY, template.width - 6, bldgH);

      // Roof Trim
      ctx.fillStyle = '#172033';
      ctx.fillRect(midStartX, bldgY, template.width - 6, 6);

      // Static Billboard (only scrolls horizontally with the structure)
      if (template.hasBillboard) {
        ctx.fillStyle = template.billboardColor;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(midStartX + 16, bldgY + 36, template.width - 38, 16);
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          template.billboardText,
          midStartX + (template.width - 6) / 2,
          bldgY + 48
        );
      }

      midStartX += template.width;
      mIndex++;
    }
  }

  private renderPlatforms(ctx: CanvasRenderingContext2D) {
    for (const plat of this.level.platforms) {
      // Cull out-of-screen platforms
      if (plat.x + plat.width < this.cameraX - 100 || plat.x > this.cameraX + this.canvas.width + 100) {
        continue;
      }

      if (plat.isHazard) {
        // Acid or Plasma pit
        ctx.fillStyle = this.level.palette.hazardColor;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

        // Bubbling hazard surface
        ctx.fillStyle = '#ffffff';
        for (let bx = plat.x + 10; bx < plat.x + plat.width; bx += 28) {
          const bubbleY = plat.y + Math.sin(this.gameTimeSeconds * 6 + bx) * 6;
          ctx.beginPath();
          ctx.arc(bx, bubbleY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (plat.isOneWay) {
        // High-tech suspended gantry
        ctx.fillStyle = '#27354a';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

        // Neon Edge Strip
        ctx.fillStyle = this.level.palette.cityGlow;
        ctx.fillRect(plat.x, plat.y, plat.width, 3);

        // Support Brackets
        ctx.fillStyle = '#17202e';
        ctx.fillRect(plat.x + 8, plat.y + plat.height, 10, 16);
        ctx.fillRect(plat.x + plat.width - 18, plat.y + plat.height, 10, 16);
      } else {
        // Solid ground platform with cyber grid lines
        ctx.fillStyle = this.level.palette.groundColor;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

        // Top hazard/walkway border
        ctx.fillStyle = '#2a3a52';
        ctx.fillRect(plat.x, plat.y, plat.width, 8);

        // Grid lines
        ctx.strokeStyle = '#1b2636';
        ctx.lineWidth = 1;
        for (let gx = plat.x; gx < plat.x + plat.width; gx += 40) {
          ctx.beginPath();
          ctx.moveTo(gx, plat.y);
          ctx.lineTo(gx, plat.y + plat.height);
          ctx.stroke();
        }
      }
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;

    // Invulnerability blink
    if (p.invulnerableTimer > 0 && Math.floor(p.invulnerableTimer / 4) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
    ctx.scale(p.facing, 1);

    // Energy Shield Bubble if active
    if (p.shieldTimer > 0) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.fill();
    }

    // Dash Ghost Trail
    if (p.isDashing) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.fillRect(-p.width / 2 - 12, -p.height / 2, p.width, p.height);
    }

    // Cyber Commando Sprite (Pixel-rendered vector geometry)
    if (p.isDucking) {
      // Ducking stance
      ctx.fillStyle = '#1e293b'; // Legs / body
      ctx.fillRect(-12, 2, 24, 12);

      // Cyber Visor / Helmet
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(4, -8, 8, 4);

      // Gun
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 4, 18, 5);
    } else {
      // Standing / Running
      const legOffset = p.isGrounded && Math.abs(p.vx) > 0.5 ? Math.sin(p.runFrame * 3) * 6 : 0;

      // Legs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10, 8 + legOffset, 8, 16);
      ctx.fillRect(2, 8 - legOffset, 8, 16);

      // Tactical Armor Torso
      ctx.fillStyle = '#334155';
      ctx.fillRect(-11, -12, 22, 22);

      // Armor Chestplate Accent
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-4, -8, 8, 10);

      // Helmet & Neon Visor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-9, -24, 18, 12);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(0, -20, 10, 4);

      // Arm & Weapon Aiming
      ctx.save();
      const aimRel = p.aimAngle;
      ctx.rotate(p.facing === 1 ? aimRel : Math.PI - aimRel);

      // Cyber Rifle
      const wpnColor = WEAPON_CONFIGS[p.weaponTier].color;
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, -3, 22, 6);
      ctx.fillStyle = wpnColor;
      ctx.fillRect(14, -4, 8, 8); // glowing barrel
      ctx.restore();
    }

    ctx.restore();
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
      ctx.scale(e.facing, 1);

      // Hit Flash (white)
      if (e.hitFlashTimer && e.hitFlashTimer > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
        ctx.restore();
        continue;
      }

      if (e.type === 'DRONE') {
        // Flying Alien Scout Drone
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Neon Eye Sensor
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(4, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Rotor Blades
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-18, -10);
        ctx.lineTo(18, -10);
        ctx.stroke();
      } else if (e.type === 'MECH') {
        // Heavy Mech Brute
        ctx.fillStyle = '#312e81';
        ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);

        // Armor Plate
        ctx.fillStyle = e.color;
        ctx.fillRect(-e.width / 2 + 4, -e.height / 2 + 6, e.width - 8, 14);

        // Front Energy Shield
        if (e.isShielded) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(e.width / 2, 0, 24, -Math.PI / 3, Math.PI / 3);
          ctx.stroke();
        }
      } else if (e.type === 'TURRET') {
        // Fixed Turret
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'CRAWLER') {
        // Bio Crawler
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = e.color;
        ctx.fillRect(6, -4, 6, 4); // glowing eyes
      } else {
        // Bio Soldier Grunt
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-10, -18, 20, 36);
        ctx.fillStyle = e.color;
        ctx.fillRect(0, -14, 8, 4); // eye visor
        ctx.fillStyle = '#64748b';
        ctx.fillRect(4, -2, 14, 5); // rifle
      }

      ctx.restore();
    }
  }

  private renderBoss(ctx: CanvasRenderingContext2D) {
    if (!this.activeBoss || this.activeBoss.defeated) return;

    const b = this.activeBoss;
    ctx.save();
    ctx.translate(b.x + b.width / 2, b.y + b.height / 2);

    // Hit Flash
    if (b.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
      ctx.restore();
      return;
    }

    if (b.id === 'boss_walker') {
      // Hex-Walker Titan
      // Walker Main Hull
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-55, -60, 110, 80);

      // Glowing Armor Plating
      ctx.fillStyle = b.phase === 2 ? '#ff0055' : b.color;
      ctx.fillRect(-45, -50, 90, 20);

      // Central Plasma Core Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -15, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = b.phase === 2 ? '#ff0055' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, -15, 9, 0, Math.PI * 2);
      ctx.fill();

      // Hydraulic Legs
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-45, 10);
      ctx.lineTo(-65, 80);
      ctx.moveTo(45, 10);
      ctx.lineTo(65, 80);
      ctx.stroke();
    } else if (b.id === 'boss_leviathan') {
      // Chitinous Leviathan (Alien Broodmother)
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 70, 55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mandibles & Spines
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(60, -20);
      ctx.lineTo(95, 0);
      ctx.lineTo(60, 20);
      ctx.fill();

      // Bio-Glow Sacs
      ctx.fillStyle = b.phase === 2 ? '#ff0055' : '#39ff14';
      ctx.beginPath();
      ctx.arc(-25, -15, 16, 0, Math.PI * 2);
      ctx.arc(15, -15, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.id === 'boss_overmind') {
      // Cyber-Alien Overmind
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.arc(0, 0, 65, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing Brain Tendrils & Core
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Energy Shield Nodes
      const shieldAng = b.shieldAngle || 0;
      for (let i = 0; i < 3; i++) {
        const ang = shieldAng + (i * Math.PI * 2) / 3;
        const nx = Math.cos(ang) * 90;
        const ny = Math.sin(ang) * 90;

        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(nx, ny, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private renderBullets(ctx: CanvasRenderingContext2D) {
    for (const b of this.bullets) {
      ctx.fillStyle = b.color;

      if (b.homing) {
        // Rocket / Missile sprite
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.fillRect(-8, -4, 16, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, -3, 5, 6);
        ctx.restore();
      } else if (b.type === 'BEAM') {
        // Continuous dense energy beam
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-12, -3, 24, 6);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(-12, -3, 24, 6);
        ctx.restore();
      } else {
        // Glowing round / pellet bullet
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright white core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderDrops(ctx: CanvasRenderingContext2D) {
    for (const d of this.drops) {
      ctx.save();
      ctx.translate(d.x, d.y);

      if (d.type === 'XP_CORE') {
        // Glowing Bio-Core Diamond
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(9, 0);
        ctx.lineTo(0, 9);
        ctx.lineTo(-9, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'HEALTH') {
        // Green Nanite Cross
        ctx.fillStyle = '#39ff14';
        ctx.fillRect(-8, -3, 16, 6);
        ctx.fillRect(-3, -8, 6, 16);
      } else if (d.type === 'BOMB') {
        // Gold EMP Bomb icon
        ctx.fillStyle = '#ffb703';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'spark') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
    }
  }

  // --- Particle Creators ---
  private createMuzzleSparks() {
    const originX = this.player.x + (this.player.facing === 1 ? this.player.width : 0);
    const originY = this.player.isDucking ? this.player.y + this.player.height - 12 : this.player.y + 18;
    const ang = this.player.aimAngle;

    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(ang) * 4 + (Math.random() - 0.5) * 3,
        vy: Math.sin(ang) * 4 + (Math.random() - 0.5) * 3,
        size: 3,
        color: '#ffffff',
        alpha: 0.9,
        decay: 0.12,
        shape: 'spark',
      });
    }
  }

  private createHitSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      const spd = 2 + Math.random() * 4;
      const ang = Math.random() * Math.PI * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 2.5,
        color,
        alpha: 1,
        decay: 0.08,
        shape: 'spark',
      });
    }
  }

  private createExplosionParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 18; i++) {
      const spd = 2 + Math.random() * 6;
      const ang = Math.random() * Math.PI * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 3 + Math.random() * 4,
        color: i % 2 === 0 ? color : '#ffb703',
        alpha: 1,
        decay: 0.04,
        shape: 'circle',
      });
    }
  }

  private createDashGhostParticles() {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 10,
        y: this.player.y + Math.random() * this.player.height,
        vx: -this.player.facing * (2 + Math.random() * 2),
        vy: (Math.random() - 0.5) * 2,
        size: 3,
        color: '#00f0ff',
        alpha: 0.8,
        decay: 0.06,
        shape: 'spark',
      });
    }
  }

  private createLevelUpParticles(x: number, y: number, color: string) {
    // Nova expanding ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 15,
      color,
      alpha: 1,
      decay: 0.03,
      shape: 'ring',
    });

    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const spd = 4 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 4,
        color,
        alpha: 1,
        decay: 0.03,
        shape: 'spark',
      });
    }
  }

  // --- Collision Math Helpers ---
  private checkAABB(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  private checkPointInRect(
    px: number,
    py: number,
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      px >= rect.x &&
      px <= rect.x + rect.width &&
      py >= rect.y &&
      py <= rect.y + rect.height
    );
  }
}
