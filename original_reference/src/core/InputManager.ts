export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  dash: boolean;
  shoot: boolean;
  aim: boolean;
  melee: boolean;
  reload: boolean;
  interact: boolean;
  switchPrev: boolean;
  switchNext: boolean;
  slot1: boolean;
  slot2: boolean;
  slot3: boolean;
  slot4: boolean;
  slot5: boolean;
  toggleLighting: boolean;
  pause: boolean;

  // Analog movement for virtual joystick and gamepad
  moveX: number;
  moveY: number;
  hasAnalogMove: boolean;
}

export function createEmptyInputState(): InputState {
  return {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    dash: false,
    shoot: false,
    aim: false,
    melee: false,
    reload: false,
    interact: false,
    switchPrev: false,
    switchNext: false,
    slot1: false,
    slot2: false,
    slot3: false,
    slot4: false,
    slot5: false,
    toggleLighting: false,
    pause: false,
    moveX: 0,
    moveY: 0,
    hasAnalogMove: false,
  };
}

export class InputManager {
  public stateP1: InputState = createEmptyInputState();
  public stateP2: InputState = createEmptyInputState();

  // Backward compatibility alias for single player
  public get state(): InputState {
    return this.stateP1;
  }

  public mouseDeltaX = 0;
  public mouseDeltaY = 0;
  public p2DeltaX = 0;
  public p2DeltaY = 0;

  public isLocked = false;
  public canLock = false; // Only allow locking during active PLAYING state

  public gameMode: 'SOLO' | 'LOCAL_COOP' | 'ONLINE_COOP' = 'SOLO';

  public onPauseToggle?: () => void;
  public onLightingToggle?: () => void;
  public onVisibilityChange?: (visible: boolean) => void;

  private domElement: HTMLElement;
  public sensitivity = 1.0;
  public touchSensitivity = 1.2;
  public invertY = false;

  // Gamepad state tracking
  public gamepadConnected = false;
  public gamepadCount = 0;
  private gamepadIndex: number | null = null;
  private lastGamepadPause = false;
  private lastGamepadSwitchNext = false;
  private lastGamepadSwitchPrev = false;
  private lastGamepadLighting = false;

  // Device capability
  public isTouchDevice = false;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.isTouchDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    this.bindEvents();
  }

  public setGameMode(mode: 'SOLO' | 'LOCAL_COOP' | 'ONLINE_COOP') {
    this.gameMode = mode;
  }

  public setPointerLockAllowed(allowed: boolean) {
    this.canLock = allowed;
    if (!allowed && this.isLocked) {
      this.releaseLock();
    }
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('wheel', this.handleWheel, { passive: true });
    window.addEventListener('contextmenu', this.handleContextMenu);

    document.addEventListener('pointerlockchange', this.handlePointerLockChange);

    // Window focus and visibility for auto-pause and auto-mute
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Gamepad connection
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
  }

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private handlePointerLockChange = () => {
    this.isLocked = document.pointerLockElement === this.domElement;
  };

  private handleWindowBlur = () => {
    if (this.onVisibilityChange) {
      this.onVisibilityChange(false);
    }
  };

  private handleWindowFocus = () => {
    if (this.onVisibilityChange && !document.hidden) {
      this.onVisibilityChange(true);
    }
  };

  private handleVisibilityChange = () => {
    if (this.onVisibilityChange) {
      this.onVisibilityChange(!document.hidden);
    }
  };

  private handleGamepadConnected = (e: GamepadEvent) => {
    this.gamepadConnected = true;
    this.gamepadIndex = e.gamepad.index;
  };

  private handleGamepadDisconnected = (e: GamepadEvent) => {
    if (this.gamepadIndex === e.gamepad.index) {
      this.gamepadConnected = false;
      this.gamepadIndex = null;
    }
  };

  public requestLock() {
    if (!this.canLock) return;
    try {
      this.domElement.requestPointerLock();
    } catch (e) {
      console.warn('Pointer lock request error:', e);
    }
  }

  public releaseLock() {
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch (e) {
      console.warn('Exit pointer lock error:', e);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Escape pauses simulator in any mode
    if (e.code === 'Escape') {
      if (this.onPauseToggle) this.onPauseToggle();
      return;
    }

    // --- PLAYER 1 KEYBOARD MAPPINGS ---
    switch (e.code) {
      case 'KeyW':
        this.stateP1.forward = true;
        break;
      case 'KeyS':
        this.stateP1.backward = true;
        break;
      case 'KeyA':
        this.stateP1.left = true;
        break;
      case 'KeyD':
        this.stateP1.right = true;
        break;
      case 'ShiftLeft':
        this.stateP1.sprint = true;
        break;
      case 'Space':
        this.stateP1.dash = true;
        break;
      case 'KeyR':
        this.stateP1.reload = true;
        break;
      case 'KeyF':
      case 'KeyV':
        this.stateP1.melee = true;
        break;
      case 'KeyT':
        this.stateP1.toggleLighting = true;
        if (this.onLightingToggle) this.onLightingToggle();
        break;
      case 'KeyE':
        this.stateP1.interact = true;
        break;
      case 'Digit1':
        this.stateP1.slot1 = true;
        break;
      case 'Digit2':
        this.stateP1.slot2 = true;
        break;
      case 'Digit3':
        this.stateP1.slot3 = true;
        break;
      case 'Digit4':
        this.stateP1.slot4 = true;
        break;
      case 'Digit5':
        this.stateP1.slot5 = true;
        break;
      case 'KeyQ':
        this.stateP1.switchNext = true;
        break;
    }

    // --- PLAYER 2 OR SOLO SECONDARY MAPPINGS ---
    if (this.gameMode === 'LOCAL_COOP') {
      switch (e.code) {
        case 'ArrowUp':
          this.stateP2.forward = true;
          break;
        case 'ArrowDown':
          this.stateP2.backward = true;
          break;
        case 'ArrowLeft':
          this.stateP2.left = true;
          break;
        case 'ArrowRight':
          this.stateP2.right = true;
          break;
        case 'ShiftRight':
        case 'ControlRight':
          this.stateP2.sprint = true;
          break;
        case 'Numpad0':
          this.stateP2.shoot = true;
          break;
        case 'Numpad1':
          this.stateP2.aim = true;
          break;
        case 'Numpad2':
        case 'KeyO':
          this.stateP2.reload = true;
          break;
        case 'Numpad3':
        case 'KeyP':
          this.stateP2.dash = true;
          break;
        case 'NumpadEnter':
        case 'KeyH':
          this.stateP2.melee = true;
          break;
        case 'Numpad5':
        case 'KeyU':
          this.stateP2.interact = true;
          break;
        case 'Numpad7':
          this.stateP2.switchPrev = true;
          break;
        case 'Numpad8':
          this.stateP2.switchNext = true;
          break;
        // P2 Keyboard Camera Rotation
        case 'Numpad4':
        case 'KeyJ':
          this.p2DeltaX -= 0.05 * this.sensitivity;
          break;
        case 'Numpad6':
        case 'KeyL':
          this.p2DeltaX += 0.05 * this.sensitivity;
          break;
        case 'KeyI':
          this.p2DeltaY -= 0.04 * this.sensitivity;
          break;
        case 'KeyK':
          this.p2DeltaY += 0.04 * this.sensitivity;
          break;
      }
    } else {
      // SOLO MODE: Arrow keys and ShiftRight also control Player 1
      switch (e.code) {
        case 'ArrowUp':
          this.stateP1.forward = true;
          break;
        case 'ArrowDown':
          this.stateP1.backward = true;
          break;
        case 'ArrowLeft':
          this.stateP1.left = true;
          break;
        case 'ArrowRight':
          this.stateP1.right = true;
          break;
        case 'ShiftRight':
          this.stateP1.sprint = true;
          break;
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    // --- PLAYER 1 KEYBOARD RELEASES ---
    switch (e.code) {
      case 'KeyW':
        this.stateP1.forward = false;
        break;
      case 'KeyS':
        this.stateP1.backward = false;
        break;
      case 'KeyA':
        this.stateP1.left = false;
        break;
      case 'KeyD':
        this.stateP1.right = false;
        break;
      case 'ShiftLeft':
        this.stateP1.sprint = false;
        break;
      case 'Space':
        this.stateP1.dash = false;
        break;
      case 'KeyR':
        this.stateP1.reload = false;
        break;
      case 'KeyF':
      case 'KeyV':
        this.stateP1.melee = false;
        break;
      case 'KeyT':
        this.stateP1.toggleLighting = false;
        break;
      case 'KeyE':
        this.stateP1.interact = false;
        break;
      case 'Digit1':
        this.stateP1.slot1 = false;
        break;
      case 'Digit2':
        this.stateP1.slot2 = false;
        break;
      case 'Digit3':
        this.stateP1.slot3 = false;
        break;
      case 'Digit4':
        this.stateP1.slot4 = false;
        break;
      case 'Digit5':
        this.stateP1.slot5 = false;
        break;
      case 'KeyQ':
        this.stateP1.switchNext = false;
        break;
    }

    // --- PLAYER 2 OR SOLO SECONDARY RELEASES ---
    if (this.gameMode === 'LOCAL_COOP') {
      switch (e.code) {
        case 'ArrowUp':
          this.stateP2.forward = false;
          break;
        case 'ArrowDown':
          this.stateP2.backward = false;
          break;
        case 'ArrowLeft':
          this.stateP2.left = false;
          break;
        case 'ArrowRight':
          this.stateP2.right = false;
          break;
        case 'ShiftRight':
        case 'ControlRight':
          this.stateP2.sprint = false;
          break;
        case 'Numpad0':
          this.stateP2.shoot = false;
          break;
        case 'Numpad1':
          this.stateP2.aim = false;
          break;
        case 'Numpad2':
        case 'KeyO':
          this.stateP2.reload = false;
          break;
        case 'Numpad3':
        case 'KeyP':
          this.stateP2.dash = false;
          break;
        case 'NumpadEnter':
        case 'KeyH':
          this.stateP2.melee = false;
          break;
        case 'Numpad5':
        case 'KeyU':
          this.stateP2.interact = false;
          break;
        case 'Numpad7':
          this.stateP2.switchPrev = false;
          break;
        case 'Numpad8':
          this.stateP2.switchNext = false;
          break;
      }
    } else {
      switch (e.code) {
        case 'ArrowUp':
          this.stateP1.forward = false;
          break;
        case 'ArrowDown':
          this.stateP1.backward = false;
          break;
        case 'ArrowLeft':
          this.stateP1.left = false;
          break;
        case 'ArrowRight':
          this.stateP1.right = false;
          break;
        case 'ShiftRight':
          this.stateP1.sprint = false;
          break;
      }
    }
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (this.canLock && !this.isLocked && e.target === this.domElement) {
      this.requestLock();
    }
    if (e.button === 0) {
      this.state.shoot = true;
    } else if (e.button === 2) {
      this.state.aim = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.state.shoot = false;
    } else if (e.button === 2) {
      this.state.aim = false;
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.isLocked) {
      const yFactor = this.invertY ? -1 : 1;
      this.mouseDeltaX += e.movementX * 0.0022 * this.sensitivity;
      this.mouseDeltaY += e.movementY * 0.0022 * this.sensitivity * yFactor;
    }
  };

  private handleWheel = (e: WheelEvent) => {
    if (e.deltaY > 0) {
      this.state.switchNext = true;
      requestAnimationFrame(() => {
        this.state.switchNext = false;
      });
    } else if (e.deltaY < 0) {
      this.state.switchPrev = true;
      requestAnimationFrame(() => {
        this.state.switchPrev = false;
      });
    }
  };

  // --- MOBILE TOUCH METHODS ---

  public setVirtualJoystick(x: number, y: number) {
    const deadZone = 0.1;
    const mag = Math.hypot(x, y);

    if (mag > deadZone) {
      const normalizedMag = Math.min(1.0, (mag - deadZone) / (1.0 - deadZone));
      const nx = (x / mag) * normalizedMag;
      const ny = (y / mag) * normalizedMag;

      this.state.moveX = nx;
      this.state.moveY = ny;
      this.state.hasAnalogMove = true;

      // Also map to discrete flags
      this.state.forward = ny > 0.25;
      this.state.backward = ny < -0.25;
      this.state.right = nx > 0.25;
      this.state.left = nx < -0.25;
    } else {
      this.state.moveX = 0;
      this.state.moveY = 0;
      this.state.hasAnalogMove = false;
      this.state.forward = false;
      this.state.backward = false;
      this.state.left = false;
      this.state.right = false;
    }
  }

  public addTouchLookDelta(dx: number, dy: number) {
    const yFactor = this.invertY ? -1 : 1;
    this.mouseDeltaX += dx * 0.003 * this.touchSensitivity * this.sensitivity;
    this.mouseDeltaY += dy * 0.003 * this.touchSensitivity * this.sensitivity * yFactor;
  }

  public setButtonState(action: keyof InputState, active: boolean) {
    if (action in this.state) {
      (this.state as any)[action] = active;
    }
  }

  // --- GAMEPAD POLLING ---

  public updateGamepad(dt: number) {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    const activePads: Gamepad[] = [];
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) activePads.push(gamepads[i]!);
    }

    this.gamepadCount = activePads.length;
    this.gamepadConnected = activePads.length > 0;

    if (activePads.length === 0) return;

    if (this.gameMode === 'LOCAL_COOP') {
      if (activePads.length >= 2) {
        // Dual controllers: Pad 0 -> P1, Pad 1 -> P2
        this.pollPad(activePads[0], this.stateP1, dt, false);
        this.pollPad(activePads[1], this.stateP2, dt, true);
      } else {
        // Single controller in Co-op: Pad 0 -> P2 (P1 uses Keyboard & Mouse)
        this.pollPad(activePads[0], this.stateP2, dt, true);
      }
    } else {
      // SOLO: Pad 0 -> P1
      this.pollPad(activePads[0], this.stateP1, dt, false);
    }
  }

  private pollPad(pad: Gamepad, state: InputState, dt: number, isP2: boolean) {
    const deadZone = 0.16;

    // 1. Left Stick -> Movement (axes 0 & 1)
    const rawMoveX = pad.axes[0] || 0;
    const rawMoveY = -(pad.axes[1] || 0); // invert Y so forward is positive

    const moveMag = Math.hypot(rawMoveX, rawMoveY);
    if (moveMag > deadZone) {
      const norm = Math.min(1.0, (moveMag - deadZone) / (1.0 - deadZone));
      state.moveX = (rawMoveX / moveMag) * norm;
      state.moveY = (rawMoveY / moveMag) * norm;
      state.hasAnalogMove = true;
      state.forward = state.moveY > 0.25;
      state.backward = state.moveY < -0.25;
      state.right = state.moveX > 0.25;
      state.left = state.moveX < -0.25;
    } else if (!this.isTouchDevice || !state.hasAnalogMove) {
      if (!state.forward && !state.backward && !state.left && !state.right) {
        state.moveX = 0;
        state.moveY = 0;
        state.hasAnalogMove = false;
      }
    }

    // 2. Right Stick -> Camera Look (axes 2 & 3)
    const rawLookX = pad.axes[2] || 0;
    const rawLookY = pad.axes[3] || 0;
    const lookMag = Math.hypot(rawLookX, rawLookY);

    if (lookMag > deadZone) {
      const norm = (lookMag - deadZone) / (1.0 - deadZone);
      const yFactor = this.invertY ? -1 : 1;
      const dX = (rawLookX / lookMag) * norm * dt * 3.5 * this.sensitivity;
      const dY = (rawLookY / lookMag) * norm * dt * 3.5 * this.sensitivity * yFactor;

      if (isP2) {
        this.p2DeltaX += dX;
        this.p2DeltaY += dY;
      } else {
        this.mouseDeltaX += dX;
        this.mouseDeltaY += dY;
      }
    }

    // 3. Triggers & Face Buttons
    const btnA = pad.buttons[0]?.pressed || false; // Dash
    const btnB = pad.buttons[1]?.pressed || false; // Melee
    const btnX = pad.buttons[2]?.pressed || false; // Reload / Interact
    const btnY = pad.buttons[3]?.pressed || false; // Switch Weapon
    const btnLB = pad.buttons[4]?.pressed || false;
    const btnRB = pad.buttons[5]?.pressed || false;
    const btnLT = (pad.buttons[6]?.value || 0) > 0.2 || pad.buttons[6]?.pressed || false; // Aim
    const btnRT = (pad.buttons[7]?.value || 0) > 0.2 || pad.buttons[7]?.pressed || false; // Shoot
    const btnSelect = pad.buttons[8]?.pressed || false; // Lighting mode
    const btnStart = pad.buttons[9]?.pressed || false; // Pause
    const btnL3 = pad.buttons[10]?.pressed || false; // Sprint
    const btnR3 = pad.buttons[11]?.pressed || false; // Melee click
    const dpadUp = pad.buttons[12]?.pressed || false;
    const dpadDown = pad.buttons[13]?.pressed || false;
    const dpadLeft = pad.buttons[14]?.pressed || false;
    const dpadRight = pad.buttons[15]?.pressed || false;

    if (btnRT) state.shoot = true;
    else state.shoot = false;

    if (btnLT) state.aim = true;
    else state.aim = false;

    if (btnA) state.dash = true;
    else state.dash = false;

    if (btnX) {
      state.reload = true;
      state.interact = true;
    } else {
      state.reload = false;
      state.interact = false;
    }

    if (btnB || btnR3) state.melee = true;
    else state.melee = false;

    if (btnL3) state.sprint = true;
    else state.sprint = false;

    // Edge triggers for weapon cycle
    if ((btnY || btnRB) && !this.lastGamepadSwitchNext) {
      state.switchNext = true;
    }
    this.lastGamepadSwitchNext = btnY || btnRB;

    if (btnLB && !this.lastGamepadSwitchPrev) {
      state.switchPrev = true;
    }
    this.lastGamepadSwitchPrev = btnLB;

    // Edge trigger for Lighting
    if (btnSelect && !this.lastGamepadLighting) {
      if (this.onLightingToggle) this.onLightingToggle();
    }
    this.lastGamepadLighting = btnSelect;

    // Edge trigger for Pause
    if (btnStart && !this.lastGamepadPause) {
      if (this.onPauseToggle) this.onPauseToggle();
    }
    this.lastGamepadPause = btnStart;

    // D-Pad Slots
    if (dpadUp) state.slot1 = true;
    if (dpadRight) state.slot2 = true;
    if (dpadDown) state.slot3 = true;
    if (dpadLeft) state.slot4 = true;
  }

  public consumeDeltas(playerId: 'P1' | 'P2' = 'P1') {
    if (playerId === 'P2') {
      const dx = this.p2DeltaX;
      const dy = this.p2DeltaY;
      this.p2DeltaX = 0;
      this.p2DeltaY = 0;
      return { dx, dy };
    }
    const dx = this.mouseDeltaX;
    const dy = this.mouseDeltaY;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return { dx, dy };
  }

  public dispose() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);

    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
  }
}
