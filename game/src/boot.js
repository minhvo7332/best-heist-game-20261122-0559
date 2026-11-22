// Boot and the one loop: input is read every frame, the heist advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the painter
// draws what is there. The game moves between five screens: title, play,
// paused, busted and win.
//
// ?seed=N fixes the jitter. ?shot=cover|gallery|vault|getaway (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, FIELD, STEP } from './tuning.js';
import { createHeist, EVENT_BUSTED, EVENT_CRACK_DONE, EVENT_PICKUP, EVENT_DENIED, EVENT_ROOM, EVENT_TOOL, EVENT_WIN, PHASE_BUSTED, PHASE_PAUSED, PHASE_PLAY, PHASE_TITLE, PHASE_WIN } from './heist.js';
import { createKeys, PRESS_CONFIRM, PRESS_EMP, PRESS_PAUSE, PRESS_SMOKE } from './keys.js';
import { createBeeps } from './beeps.js';
import { drawHud, drawScreen } from './panel.js';
import { drawRoom as paintRoom } from './paint.js';
import { stageShot } from './stage.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
const heist = createHeist(seed);
const beeps = createBeeps();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best haul then lasts this visit only.
  }
}

function runShot(name) {
  const screen = stageShot(name, heist);
  const state = heist.state;
  let painted = 0;
  function paint() {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    paintRoom(ctx, state);
    drawHud(ctx, state, readBest());
    if (screen !== PHASE_PLAY) drawScreen(ctx, state, screen, readBest());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const keys = createKeys(canvas);
  let screen = PHASE_TITLE;
  let best = readBest();
  let accumulator = 0;
  let pendingPresses = 0;
  let last = performance.now();
  let lastAlarmTick = 0;

  // Screen readers (and anyone watching the page's text) hear the screen changes and each pickup.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    heist.start();
    screen = PHASE_PLAY;
    announce('Playing. Cross the lobby, grab the loot, reach the door.');
  }

  function endBusted() {
    screen = PHASE_BUSTED;
    beeps.busted();
    if (heist.state.haul > best) {
      best = heist.state.haul;
      saveBest(best);
    }
    announce(`Busted by ${heist.state.bustedBy}. Haul $${heist.state.haul}.`);
  }

  function endWin() {
    screen = PHASE_WIN;
    beeps.win();
    if (heist.state.haul > best) {
      best = heist.state.haul;
      saveBest(best);
    }
    announce(`Clean getaway. Final haul $${heist.state.haul}.`);
  }

  function handlePresses() {
    const presses = keys.takePresses();
    const click = keys.takeClick();
    if (click && screen === PHASE_PLAY) {
      heist.state.thief.clickX = click.x;
      heist.state.thief.clickY = click.y;
    }
    if (presses & PRESS_CONFIRM) {
      beeps.unlock();
      if (screen === PHASE_TITLE || screen === PHASE_BUSTED || screen === PHASE_WIN) startGame();
      else if (screen === PHASE_PAUSED) screen = PHASE_PLAY;
    }
    if (presses & PRESS_PAUSE) {
      if (screen === PHASE_PLAY) {
        screen = PHASE_PAUSED;
        announce('Paused.');
      } else if (screen === PHASE_PAUSED) {
        screen = PHASE_PLAY;
        announce('Playing.');
      }
    }
    return presses;
  }

  function step(presses) {
    const state = heist.state;
    const input = {
      move: keys.move(),
      sneak: keys.sneak,
      crack: keys.crack,
      smoke: Boolean(presses & PRESS_SMOKE),
      emp: Boolean(presses & PRESS_EMP),
    };
    const events = heist.step(STEP, input);
    if (events & EVENT_PICKUP) beeps.pickup(state.room.diamond && state.room.diamond.taken ? 'diamond' : 'loot');
    if (events & EVENT_DENIED) beeps.denied();
    if (events & EVENT_TOOL) beeps.tool();
    if (events & EVENT_ROOM) {
      beeps.room();
      announce(`${state.room.def.name}. ${state.room.def.objective}`);
    }
    if (events & EVENT_CRACK_DONE) beeps.pickup('diamond');
    if (state.crackHeld) beeps.crackTick();
    if (state.alarm > 70 && state.time - lastAlarmTick > 0.5) {
      lastAlarmTick = state.time;
      beeps.alarmTick();
    }
    if (events & EVENT_BUSTED) endBusted();
    else if (events & EVENT_WIN) endWin();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    pendingPresses |= handlePresses();
    if (screen === PHASE_PLAY) {
      let first = true;
      while (accumulator >= STEP && screen === PHASE_PLAY) {
        step(first ? pendingPresses : 0);
        pendingPresses = 0;
        first = false;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
      pendingPresses = 0;
    }
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    paintRoom(ctx, heist.state);
    drawHud(ctx, heist.state, best);
    if (screen !== PHASE_PLAY) drawScreen(ctx, heist.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting the alarm climb unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === PHASE_PLAY) {
      screen = PHASE_PAUSED;
      announce('Paused.');
    }
  });

  // The playtest and the screenshot scenes drive the same state the game does.
  window.__heist = heist;
  window.__screen = () => screen;

  announce('Crack the Meridian Vault. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
