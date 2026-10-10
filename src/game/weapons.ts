import { WeaponInfo, WeaponTier, Bullet, Player } from '../types/game';

export const WEAPON_CONFIGS: Record<WeaponTier, WeaponInfo> = {
  1: {
    tier: 1,
    type: 'PULSE',
    name: 'Pulse Rifle',
    tagline: 'High-velocity plasma rounds',
    color: '#00f0ff',
    fireRate: 9, // frames between shots (approx 6.6 shots/sec at 60fps)
    damage: 26,
    bulletSpeed: 14,
    xpRequired: 100,
  },
  2: {
    tier: 2,
    type: 'SPREAD',
    name: 'Tri-Spread Blaster',
    tagline: '3-way fan pattern crowd-control',
    color: '#39ff14',
    fireRate: 11,
    damage: 22,
    bulletSpeed: 13,
    xpRequired: 260,
  },
  3: {
    tier: 3,
    type: 'BEAM',
    name: 'Hyper Plasma Beam',
    tagline: 'Penetrating dense energy beam',
    color: '#ffb703',
    fireRate: 6, // rapid stream
    damage: 18,
    bulletSpeed: 16,
    xpRequired: 480,
  },
  4: {
    tier: 4,
    type: 'HOMING',
    name: 'Micro-Missile Swarm',
    tagline: 'Smart tracking explosive payload',
    color: '#ff007f',
    fireRate: 13,
    damage: 48,
    bulletSpeed: 10,
    xpRequired: 800,
  },
  5: {
    tier: 5,
    type: 'OVERCHARGE',
    name: 'Overcharge Nova',
    tagline: '5-way devastating nova barrage',
    color: '#c084fc',
    fireRate: 10,
    damage: 38,
    bulletSpeed: 15,
    xpRequired: 999999, // Max tier
  },
};

let bulletIdCounter = 0;

export function createPlayerBullets(player: Player): Bullet[] {
  const config = WEAPON_CONFIGS[player.weaponTier];
  const bullets: Bullet[] = [];

  // Muzzle origin calculated from player center & aim
  const originX = player.x + (player.facing === 1 ? player.width - 4 : 4);
  const originY = player.isDucking ? player.y + player.height - 14 : player.y + player.height / 2 - 2;

  const baseAngle = player.aimAngle;
  const speed = config.bulletSpeed;

  switch (config.type) {
    case 'PULSE': {
      bullets.push({
        id: ++bulletIdCounter,
        x: originX,
        y: originY,
        vx: Math.cos(baseAngle) * speed,
        vy: Math.sin(baseAngle) * speed,
        width: 14,
        height: 6,
        radius: 5,
        damage: config.damage,
        color: config.color,
        isPlayer: true,
        pierce: 1,
        homing: false,
        life: 80,
        type: 'PULSE',
      });
      break;
    }

    case 'SPREAD': {
      const angles = [baseAngle - 0.22, baseAngle, baseAngle + 0.22];
      angles.forEach((ang) => {
        bullets.push({
          id: ++bulletIdCounter,
          x: originX,
          y: originY,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          width: 12,
          height: 8,
          radius: 5,
          damage: config.damage,
          color: config.color,
          isPlayer: true,
          pierce: 1,
          homing: false,
          life: 75,
          type: 'SPREAD',
        });
      });
      break;
    }

    case 'BEAM': {
      // Beam projectile: larger and pierces through enemies
      bullets.push({
        id: ++bulletIdCounter,
        x: originX,
        y: originY,
        vx: Math.cos(baseAngle) * speed,
        vy: Math.sin(baseAngle) * speed,
        width: 24,
        height: 10,
        radius: 6,
        damage: config.damage,
        color: config.color,
        isPlayer: true,
        pierce: 3,
        homing: false,
        life: 70,
        type: 'BEAM',
      });
      break;
    }

    case 'HOMING': {
      // Launch 2 homing missiles with spread angle
      [-0.28, 0.28].forEach((offset) => {
        const ang = baseAngle + offset;
        bullets.push({
          id: ++bulletIdCounter,
          x: originX,
          y: originY,
          vx: Math.cos(ang) * (speed * 0.7),
          vy: Math.sin(ang) * (speed * 0.7),
          width: 16,
          height: 10,
          radius: 6,
          damage: config.damage,
          color: config.color,
          isPlayer: true,
          pierce: 1,
          homing: true,
          life: 120,
          type: 'HOMING',
        });
      });
      break;
    }

    case 'OVERCHARGE': {
      // 5-way spread with high velocity
      const angles = [
        baseAngle - 0.35,
        baseAngle - 0.17,
        baseAngle,
        baseAngle + 0.17,
        baseAngle + 0.35,
      ];
      angles.forEach((ang) => {
        bullets.push({
          id: ++bulletIdCounter,
          x: originX,
          y: originY,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          width: 16,
          height: 8,
          radius: 6,
          damage: config.damage,
          color: config.color,
          isPlayer: true,
          pierce: 2,
          homing: false,
          life: 80,
          type: 'OVERCHARGE',
        });
      });
      break;
    }
  }

  return bullets;
}
