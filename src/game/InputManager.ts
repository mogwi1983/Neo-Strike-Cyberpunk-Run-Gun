import { InputState } from '../types/game';

export class InputManager {
  private state: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    shoot: false,
    dash: false,
    bomb: false,
    hasAimVector: false,
    aimX: 0,
    aimY: 0,
  };

  private keyMap: Record<string, keyof InputState> = {
    // Arrow keys
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',

    // WASD
    KeyA: 'left',
    KeyD: 'right',
    KeyW: 'up',
    KeyS: 'down',
    a: 'left',
    d: 'right',
    w: 'up',
    s: 'down',

    // Action keys
    KeyJ: 'shoot',
    j: 'shoot',
    KeyZ: 'shoot',
    z: 'shoot',
    Space: 'jump',
    KeyK: 'jump',
    k: 'jump',
    KeyX: 'jump',
    x: 'jump',
    KeyL: 'dash',
    l: 'dash',
    KeyC: 'dash',
    c: 'dash',
    ShiftLeft: 'dash',
    ShiftRight: 'dash',
    KeyE: 'bomb',
    e: 'bomb',
    KeyB: 'bomb',
    b: 'bomb',
  };

  private onPauseCallback: (() => void) | null = null;
  private gamepadIndex: number | null = null;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
    this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
  }

  public init(onPause?: () => void) {
    this.onPauseCallback = onPause || null;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
  }

  public destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (this.onPauseCallback) {
        this.onPauseCallback();
      }
      return;
    }

    const mapped = this.keyMap[e.code] || this.keyMap[e.key];
    if (mapped) {
      (this.state as unknown as Record<string, boolean>)[mapped] = true;
      // Prevent default browser scrolling with arrows / space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const mapped = this.keyMap[e.code] || this.keyMap[e.key];
    if (mapped) {
      (this.state as unknown as Record<string, boolean>)[mapped] = false;
    }
  }

  private handleGamepadConnected(e: GamepadEvent) {
    this.gamepadIndex = e.gamepad.index;
  }

  private handleGamepadDisconnected(e: GamepadEvent) {
    if (this.gamepadIndex === e.gamepad.index) {
      this.gamepadIndex = null;
    }
  }

  // Set from on-screen touch virtual controls
  public setVirtualButton(action: 'left' | 'right' | 'up' | 'down' | 'jump' | 'shoot' | 'dash' | 'bomb', isPressed: boolean) {
    this.state[action] = isPressed;
  }

  public setVirtualAim(hasAim: boolean, x: number = 0, y: number = 0) {
    this.state.hasAimVector = hasAim;
    this.state.aimX = x;
    this.state.aimY = y;
  }

  // Poll state (combines keyboard, touch, and Gamepad API)
  public poll(): InputState {
    // Check Gamepad if connected
    if (navigator.getGamepads) {
      const gamepads = navigator.getGamepads();
      const pad = (this.gamepadIndex !== null && gamepads[this.gamepadIndex]) || gamepads[0];
      if (pad && pad.connected) {
        // Standard mapping:
        // Buttons: 0: A (jump), 1: B (dash), 2: X (shoot), 3: Y (bomb), 5: RB (bomb), 9: Start (pause)
        // Dpad: 12: Up, 13: Down, 14: Left, 15: Right
        // Axes: 0: Stick X (-1 to 1), 1: Stick Y (-1 to 1)
        const dpadLeft = pad.buttons[14]?.pressed || false;
        const dpadRight = pad.buttons[15]?.pressed || false;
        const dpadUp = pad.buttons[12]?.pressed || false;
        const dpadDown = pad.buttons[13]?.pressed || false;

        const stickX = pad.axes[0] || 0;
        const stickY = pad.axes[1] || 0;
        const deadzone = 0.25;

        const padLeft = dpadLeft || stickX < -deadzone;
        const padRight = dpadRight || stickX > deadzone;
        const padUp = dpadUp || stickY < -deadzone;
        const padDown = dpadDown || stickY > deadzone;

        const padJump = pad.buttons[0]?.pressed || false;
        const padDash = pad.buttons[1]?.pressed || false;
        const padShoot = pad.buttons[2]?.pressed || pad.buttons[7]?.pressed || false; // X or RT
        const padBomb = pad.buttons[3]?.pressed || pad.buttons[5]?.pressed || false; // Y or RB

        if (pad.buttons[9]?.pressed && this.onPauseCallback) {
          this.onPauseCallback();
        }

        return {
          left: this.state.left || padLeft,
          right: this.state.right || padRight,
          up: this.state.up || padUp,
          down: this.state.down || padDown,
          jump: this.state.jump || padJump,
          shoot: this.state.shoot || padShoot,
          dash: this.state.dash || padDash,
          bomb: this.state.bomb || padBomb,
          hasAimVector: this.state.hasAimVector,
          aimX: this.state.aimX,
          aimY: this.state.aimY,
        };
      }
    }

    return { ...this.state };
  }

  public reset() {
    this.state = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      shoot: false,
      dash: false,
      bomb: false,
      hasAimVector: false,
      aimX: 0,
      aimY: 0,
    };
  }
}
