/**
 * Core type definitions for Neo-Strike Platformer
 */

export type Difficulty = 'RECRUIT' | 'VETERAN' | 'ARCADE';

export type GameScreen = 'TITLE' | 'PLAYING' | 'PAUSED' | 'STAGE_CLEAR' | 'GAME_OVER' | 'VICTORY';

export type WeaponTier = 1 | 2 | 3 | 4 | 5;

export type WeaponType = 'PULSE' | 'SPREAD' | 'BEAM' | 'HOMING' | 'OVERCHARGE';

export interface WeaponInfo {
  tier: WeaponTier;
  type: WeaponType;
  name: string;
  tagline: string;
  color: string;
  fireRate: number; // shots per second or frames between shots
  damage: number;
  bulletSpeed: number;
  xpRequired: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  aimAngle: number; // in radians: 0 is right, -PI/2 is straight up, PI is left, etc.
  isGrounded: boolean;
  isDucking: boolean;
  isDashing: boolean;
  dashTimer: number;
  dashCooldown: number;
  invulnerableTimer: number;
  health: number;
  maxHealth: number;
  lives: number;
  weaponTier: WeaponTier;
  weaponXp: number;
  nextTierXp: number;
  bombs: number;
  shieldTimer: number;
  score: number;
  multiplier: number;
  multiplierTimer: number;
  shootCooldown: number;
  runFrame: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  radius: number;
  damage: number;
  color: string;
  isPlayer: boolean;
  pierce: number;
  homing: boolean;
  life: number;
  type: WeaponType | 'ENEMY_BOLT' | 'ENEMY_MISSILE' | 'ENEMY_ACID' | 'BOSS_BEAM';
}

export type EnemyType = 'DRONE' | 'GRUNT' | 'TURRET' | 'MECH' | 'CRAWLER';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  shootCooldown: number;
  facing: 1 | -1;
  isGrounded: boolean;
  patrolMinX: number;
  patrolMaxX: number;
  scoreValue: number;
  xpValue: number;
  color: string;
  isShielded?: boolean;
  hitFlashTimer?: number;
  animFrame?: number;
}

export interface Boss {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  phase: number;
  maxPhases: number;
  attackTimer: number;
  attackState: string;
  hitFlashTimer: number;
  active: boolean;
  defeated: boolean;
  color: string;
  coreExposed: boolean;
  shieldAngle?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape: 'spark' | 'circle' | 'square' | 'ring';
}

export type DropType = 'XP_CORE' | 'HEALTH' | 'BOMB' | 'SHIELD';

export interface DropItem {
  id: number;
  type: DropType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  timer: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isHazard?: boolean;
  isOneWay?: boolean;
  theme?: string;
}

export interface Checkpoint {
  x: number;
  y: number;
  reached: boolean;
}

export interface EnemySpawnRule {
  triggerX: number;
  type: EnemyType;
  relX: number;
  relY: number;
  patrolRange?: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  playerStartX: number;
  playerStartY: number;
  checkpoints: Checkpoint[];
  platforms: Platform[];
  spawns: EnemySpawnRule[];
  boss: Boss;
  palette: {
    skyTop: string;
    skyBottom: string;
    cityGlow: string;
    groundColor: string;
    hazardColor: string;
  };
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  shoot: boolean;
  dash: boolean;
  bomb: boolean;
  // Aim overrides if using analog stick or touch
  hasAimVector: boolean;
  aimX: number;
  aimY: number;
}

export interface GameStats {
  kills: number;
  score: number;
  timeSeconds: number;
  highestWeaponTier: WeaponTier;
  bossDefeated: boolean;
  bombsUsed: number;
  damageTaken: number;
}
