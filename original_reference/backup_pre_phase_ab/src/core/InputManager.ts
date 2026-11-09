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
}

export class InputManager {
  public state: InputState = {
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
  };

  public mouseDeltaX = 0;
  public mouseDeltaY = 0;
  public isLocked = false;
  public onPauseToggle?: () => void;
  public onLightingToggle?: () => void;

  private domElement: HTMLElement;
  public sensitivity = 1.0;
  public invertY = false;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('wheel', this.handleWheel, { passive: true });
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });
  }

  public requestLock() {
    try {
      this.domElement.requestPointerLock();
    } catch (e) {
      console.warn('Pointer lock request error:', e);
    }
  }

  public releaseLock() {
    try {
      document.exitPointerLock();
    } catch (e) {
      console.warn('Exit pointer lock error:', e);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.sprint = true;
        break;
      case 'Space':
        this.state.dash = true;
        break;
      case 'KeyR':
        this.state.reload = true;
        break;
      case 'KeyF':
      case 'KeyV':
        this.state.melee = true;
        break;
      case 'KeyT':
        this.state.toggleLighting = true;
        if (this.onLightingToggle) this.onLightingToggle();
        break;
      case 'KeyE':
        this.state.interact = true;
        break;
      case 'Digit1':
        this.state.slot1 = true;
        break;
      case 'Digit2':
        this.state.slot2 = true;
        break;
      case 'Digit3':
        this.state.slot3 = true;
        break;
      case 'Digit4':
        this.state.slot4 = true;
        break;
      case 'Digit5':
        this.state.slot5 = true;
        break;
      case 'KeyQ':
        this.state.switchNext = true;
        break;
      case 'Escape':
        if (this.onPauseToggle) this.onPauseToggle();
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.sprint = false;
        break;
      case 'Space':
        this.state.dash = false;
        break;
      case 'KeyR':
        this.state.reload = false;
        break;
      case 'KeyF':
      case 'KeyV':
        this.state.melee = false;
        break;
      case 'KeyT':
        this.state.toggleLighting = false;
        break;
      case 'KeyE':
        this.state.interact = false;
        break;
      case 'Digit1':
        this.state.slot1 = false;
        break;
      case 'Digit2':
        this.state.slot2 = false;
        break;
      case 'Digit3':
        this.state.slot3 = false;
        break;
      case 'Digit4':
        this.state.slot4 = false;
        break;
      case 'Digit5':
        this.state.slot5 = false;
        break;
      case 'KeyQ':
        this.state.switchNext = false;
        break;
    }
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (!this.isLocked && e.target === this.domElement) {
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
      setTimeout(() => (this.state.switchNext = false), 50);
    } else if (e.deltaY < 0) {
      this.state.switchPrev = true;
      setTimeout(() => (this.state.switchPrev = false), 50);
    }
  };

  public consumeDeltas() {
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
  }
}
