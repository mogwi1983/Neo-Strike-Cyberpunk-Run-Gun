# Neo-Strike: Cyberpunk Run & Gun Platformer

A fast-paced, 60FPS retro arcade run-and-gun platformer inspired by Contra and Metal Slug, set in a neon-drenched cyberpunk metropolis overrun by bio-mechanical alien invaders. Players run, jump, duck, dodge enemy volleys, and defeat waves of alien invaders to level up their arsenal from standard pulse rifles to devastating spread lasers and homing swarms across multi-stage campaigns with epic end-level bosses.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core design decisions were established through the interview and will guide the architecture:

- **Confirmed Aesthetic**: Cyberpunk neon alien invasion with retro arcade pixel art, dark industrial backdrops, glowing neon cyan/magenta/amber projectiles, dynamic particle sparks, and authentic synth arcade audio via the Web Audio API.
- **Confirmed Weapon System**: Progressive weapon leveling up as you eliminate enemies. Collecting alien bio-cores and racking up kills feeds an active Overdrive weapon meter, upgrading weapon tiers (Lv1 Rapid Pulse $\rightarrow$ Lv2 Tri-Spread Blaster $\rightarrow$ Lv3 Plasma Beam $\rightarrow$ Lv4 Homing Swarm $\rightarrow$ Lv5 Overcharge Nova), with special super-bomb clears.
- **Confirmed Mission Structure**: Multi-stage mission campaign featuring checkpoints and multi-phase end-level bosses:
  - **Stage 1: Neon Rooftops**: Flying alien drones, sniper turrets, crumbling walkways, and the *Acro-Mech Stalker* boss.
  - **Stage 2: Cyber Sewers & Slums**: Toxic hazards, tunneling xenomorph worms, laser barricades, and the *Bio-Organic Broodmother* boss.
  - **Stage 3: Mothership Core**: Zero-g elevator shafts, bullet-hell defense grids, and the *Cyber-Alien Overmind* final encounter.
- **Confirmed Input Matrix**: Triple-input support:
  - **Keyboard**: WASD / Arrow keys for 8-directional movement & aiming; J / Space to shoot; K to jump; L to dash/dodge roll; E to fire Super Bomb.
  - **Gamepad**: Native HTML5 Gamepad API integration (D-pad/Stick to move & aim, A to jump, X to shoot, B to dash, Y/RB to bomb).
  - **Mobile Touch**: Virtual floating thumbstick / D-pad + tactile fire, jump, and dash buttons with haptic-ready visual feedback.

---

## 1. Overview & Core Concept

- **What It Does**: Neo-Strike delivers authentic 90s side-scrolling run-and-gun arcade action directly in the browser. Players control a cyber-commando sprinting through parallax-scrolling dystopian cityscapes, jumping between platforms, ducking under incoming plasma fire, dodging rolling bio-mines, and leveling up weaponry on the fly as kill counts rise.
- **Target Audience**: Retro arcade fans, platformer enthusiasts, and action gamers wanting high-responsiveness, tight controls, crunchy particle feedback, and intense boss battles without installation or latency.
- **Key Value**: Delivers console-grade input feel and authentic arcade physics (variable jump height, 8-way directional firing while running or jumping, invincibility dash rolls, screen shake, and synthesized chip-tune sound effects) paired with progressive upgrade satisfaction.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Title & Briefing Screen**: High-energy retro arcade title card with animated city skyline, difficulty selection (Recruit, Veteran, Arcade), mission briefing overview, and persistent high score tracking.
2. **In-Game Action View**: Smooth 60FPS rendering on an HTML5 `<canvas>` with dual-layer parallax backgrounds, reactive camera scrolling, floating HUD displaying Health, Lives, Active Weapon Tier & XP progress bar, Score, and Stage Checkpoints.
3. **Mid-Game Progression**: Slaying enemies drops luminous bio-energy cores that magnetically pull toward the player, filling the Weapon Upgrade Gauge. Reaching tier thresholds triggers an immediate visual transformation, audio fanfare, and amplified firepower.
4. **Boss Climax**: Dynamic boss warnings (`ALERT // BIO-SIGNATURE DETECTED`), screen shake, multi-phase boss attack patterns (bullet volleys, leaping ground pounds, sweeping laser beams), and destructible weak points.
5. **Stage Clear & Victory / Game Over**: Stat breakdown (Kills, Accuracy, Weapon Max Tier, Time, Checkpoints Used) with seamless `"Next Stage"` or `"Play Again"` state transitions without page reloads.

### Visual Identity & Theme
- **Aesthetic Direction**: Neo-Tokyo arcade pixel styling meets high-contrast dark synth atmosphere. Crisp silhouette sprites, high-energy neon color pops, and particle-based muzzle flashes and explosions.
- **Color Palette**:
  - *Dominant Canvas (60%)*: Deep midnight slate `#0A0D14`, dark metallic girder textures `#131926`, deep twilight purple `#1E1233`.
  - *Structural Surfaces & Platforms (30%)*: Gunmetal walkways `#1F293D`, weathered hazard plating `#2A344A`, neon signage frames `#3B4252`.
  - *High-Intent Accent Budget (10%)*: Neon Cyan `#00F0FF` (pulse bullets / tech), Radiant Amber `#FFB703` (explosions / XP orbs), Acid Green `#39FF14` (alien bio-slime), Hot Pink / Magenta `#FF007F` (boss lasers and super bombs).
- **Typography & HUD**:
  - *Display / Titles*: `Press Start 2P` or geometric athletic sans (`Outfit` / `Barlow Condensed`) with retro pixel-styled text rendering.
  - *Telemetry & Numbers*: `font-mono tabular-nums` for precise timer, score, ammo count, and health readouts.
- **Motion & Audio Feedback**:
  - Screen shake intensity proportional to blast radius.
  - Web Audio API synthesizer for laser blasts, metallic impacts, alien screeches, level-up arpeggios, and low-frequency bass rumble.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: HTML5 Canvas 2D Engine with Delta-Time Physics vs DOM-based Rendering**
  - *Chosen Approach*: Pure Canvas 2D game loop with fixed-step accumulator and delta-time compensation (`requestAnimationFrame`).
  - *Why*: Run-and-gun platformers require hundreds of active bullets, particle emitters, animated enemy hitboxes, and 60FPS frame pacing that cause heavy DOM thrashing if rendered via React elements. React wraps the outer HUD, settings, touch controls, and modal menus, while the core action runs directly on canvas.
  - *Trade-Off*: Requires custom sprite rendering and geometry collision logic, but guarantees rock-solid 60FPS arcade performance even on mobile devices.
- **Decision 2: In-Run Kill Progression & Weapon Tier Evolution**
  - *Chosen Approach*: Direct kill XP bar that automatically upgrades the weapon across 5 tiers (Rapid $\rightarrow$ Spread $\rightarrow$ Beam $\rightarrow$ Swarm $\rightarrow$ Overcharge), accompanied by collectible temporary power badges that grant shields, speed boosts, or super bombs.
  - *Why*: Satisfies the user's explicit preference for progressive leveling while keeping the immediate thrill of picking up tactical utility drops during intense firefights.
- **Decision 3: Triple-Input Support with Virtual On-Screen Gamepad & Native Controller API**
  - *Chosen Approach*: Unified input abstraction layer that aggregates keyboard keystrokes, standard HTML5 Gamepad poll events, and responsive on-screen virtual touch sticks/buttons simultaneously.
  - *Why*: Ensures anyone can play comfortably on desktop (keyboard or Xbox/PS controller) or smartphone/tablet (touch thumb-zones) with zero configuration needed.

---

## 4. Technical Architecture & Data Strategy

### System Architecture & Game Loop Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              React Shell                               │
│  ┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────┐ │
│  │ Top HUD Bar           │ │ Mobile Touch HUD  │ │ Settings / Pause  │ │
│  │ (HP, Score, Wpn Tier) │ │ (D-Pad, Fire, Jmp)│ │ & Victory Modals  │ │
│  └───────────▲───────────┘ └─────────▲─────────┘ └─────────▲─────────┘ │
└──────────────┼───────────────────────┼─────────────────────┼───────────┘
               │                       │                     │
┌──────────────┴───────────────────────┴─────────────────────┴───────────┐
│                          Game Controller Engine                        │
│                                                                        │
│  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────┐ │
│  │ Input Manager    │  │ Audio Synthesizer │  │ State Machine        │ │
│  │ (Keys/Pad/Touch) │  │ (Web Audio API)   │  │ TITLE/PLAY/DEAD/WIN  │ │
│  └────────┬─────────┘  └─────────▲─────────┘  └──────────┬───────────┘ │
│           │                      │                       │             │
│  ┌────────▼──────────────────────┴───────────────────────▼───────────┐ │
│  │                      60FPS Canvas Game Engine                     │ │
│  │                                                                   │ │
│  │  • Player Controller (Run, Jump, Duck, 8-way Aim, Dash Roll)      │ │
│  │  • Weapon System (5 Tiers: Pulse, Spread, Beam, Swarm, Nova)      │ │
│  │  • Enemy Subsystem (Patrol Drones, Grunts, Turrets, Heavy Mechs)  │ │
│  │  • Boss Engine (Multi-Phase Patterns, Weak Points, Bullet Hell)   │ │
│  │  • Particle & Camera System (Parallax, Shakes, Muzzle Flashes)    │ │
│  │  • Physics & Tilemap Collision (Platforms, Ramps, Hazards)        │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Data Structures & Models
- **Player State**:
  ```typescript
  interface Player {
    x: number; y: number; vx: number; vy: number;
    width: number; height: number;
    facing: 1 | -1; aimAngle: number; // 8-way aim (-90 to +90 deg)
    isGrounded: boolean; isDucking: boolean; isDashing: boolean;
    dashCooldown: number; invulnerableTimer: number;
    health: number; maxHealth: number; lives: number;
    weaponTier: 1 | 2 | 3 | 4 | 5;
    weaponXp: number; nextTierXp: number;
    bombs: number; score: number;
  }
  ```
- **Weapon Tier Catalog**:
  1. *Tier 1: Plasma Pulse Rifle* (Fast single-shot piercing bolts, high velocity).
  2. *Tier 2: Tri-Spread Blaster* (3-way fan spread, excellent crowd control).
  3. *Tier 3: Continuous Laser Beam* (Penetrating continuous energy ray with heat buildup).
  4. *Tier 4: Micro-Missile Swarm* (Multiple tracking rockets that seek nearest alien targets).
  5. *Tier 5: Overcharge Nova Blaster* (Full 5-way spread + explosive plasma bursts on impact).
  6. *Special: EMP Super Bomb* (Screen-wide bullet wipe + massive boss chunk damage).

- **Stages & Boss Campaign**:
  - **Stage 1 (City Outskirts / Neon Skyline)**: Low-gravity jumps, rooftop snipers, drone swarms $\rightarrow$ Boss: *Vanguard Hex-Walker* (Leg stomps, missile pods, exposed core).
  - **Stage 2 (Bio-Tech Slums & Sewers)**: Collapsing catwalks, acid geysers, stealth creepers $\rightarrow$ Boss: *Chitinous Leviathan* (Spit volleys, wall-crawling, tail sweep).
  - **Stage 3 (Alien Mothership Breach)**: Electric forcefields, gravity elevators, elite commandos $\rightarrow$ Boss: *Apex Brain Core* (Tri-phase: shield barriers, laser sweep, bullet hell spiral).

### Component Breakdown
- `App.tsx`: Main application frame, orchestrating Game canvas, React HUD overlays, difficulty selection, audio master switch, and responsive layout.
- `src/game/GameEngine.ts`: Canvas loop, delta-time updater, entity management (player, enemies, projectiles, pickups, particles), and camera tracker.
- `src/game/AudioSystem.ts`: Zero-dependency Web Audio API sound synthesizer for laser shots, explosions, jump whooshes, hit markers, and ambient retro arpeggios.
- `src/game/InputManager.ts`: Unified keyboard, touch gestures, and Gamepad API polling with customizable sensitivity.
- `src/game/levels/`: Stage tilemaps, platform geometries, enemy spawn triggers, and boss state routines.
- `src/components/HUD.tsx`: Clean, unboxed cyber HUD showing health bar, lives, weapon tier indicator with XP fill, score, bomb counter, and boss health bar.
- `src/components/TouchControls.tsx`: Responsive on-screen virtual d-pad and action buttons optimized for touch targets ($\ge 44\text{px}$) with natural thumb ergonomics.
