// Keyboard and pointer input. Held keys give a steering vector and the sneak
// and crack states; one-shot presses (start, pause, tools, buys) are queued as
// flags and taken once by the loop, so a press between two frames is never
// lost and never counted twice.

export const PRESS_CONFIRM = 1;
export const PRESS_PAUSE = 2;
export const PRESS_SMOKE = 4;
export const PRESS_EMP = 8;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const SNEAK = new Set(['ShiftLeft', 'ShiftRight']);
const CRACK = new Set(['KeyE']);

export function createKeys(canvas) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let sneak = false;
  let crack = false;
  let presses = 0;
  let click = null;

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (SNEAK.has(event.code)) sneak = true;
    else if (CRACK.has(event.code)) crack = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) presses |= PRESS_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) presses |= PRESS_PAUSE;
    } else if (event.code === 'Digit1') {
      if (!event.repeat) presses |= PRESS_SMOKE;
    } else if (event.code === 'Digit2') {
      if (!event.repeat) presses |= PRESS_EMP;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
    else if (SNEAK.has(event.code)) sneak = false;
    else if (CRACK.has(event.code)) crack = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    up = down = left = right = sneak = crack = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    click = {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
    presses |= PRESS_CONFIRM;
  });

  return {
    /** The steering vector this frame, from the held movement keys. */
    move() {
      return { x: (right ? 1 : 0) - (left ? 1 : 0), y: (down ? 1 : 0) - (up ? 1 : 0) };
    },
    get sneak() {
      return sneak;
    },
    get crack() {
      return crack;
    },
    /** The click-to-move target since the last take, or null. */
    takeClick() {
      const c = click;
      click = null;
      return c;
    },
    /** The one-shot presses since the last call, as PRESS_* flags. */
    takePresses() {
      const taken = presses;
      presses = 0;
      return taken;
    },
  };
}
