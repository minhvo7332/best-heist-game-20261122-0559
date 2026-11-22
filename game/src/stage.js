// The screenshot scenes behind ?shot=cover|gallery|vault|getaway. Each one puts
// the real game state where a short game really leaves it — the thief mid-room,
// a guard cone crossing the floor, a camera arc, loot on the floor, the alarm
// meter partway up — and then paints it twice and sets window.__shotReady, so
// a screenshot is a frame of the game itself, never a mock-up.
//
// The scenes steer the world with the same rules the player faces: they load
// the room, place the thief and the watchers, and run a few fixed steps so the
// patrols and sweeps are mid-motion when the frame is taken.

import { PHASE_PLAY, PHASE_WIN } from './heist.js';

function placeGuard(room, i, x, y, facing, mode = 'patrol') {
  const g = room.guards[i];
  g.x = x;
  g.y = y;
  g.facing = facing;
  g.mode = mode;
  g.alert = mode === 'chase';
  g.leg = 0;
}

function placeCamera(room, i, angle) {
  room.cameras[i].angle = angle;
}

function setLoot(room, takenIndexes) {
  room.loot.forEach((loot, i) => {
    loot.taken = takenIndexes.includes(i);
  });
}

/**
 * Set `heist` to the named scene and return the screen to draw over it.
 * Any other name stages the cover.
 */
export function stageShot(name, heist) {
  const state = heist.state;
  heist.start();
  state.phase = PHASE_PLAY;

  if (name === 'gallery') {
    heist.loadRoom(1);
    heist.say('Slip past the gallery patrols. The vault door is ahead.', 4);
    state.thief.x = 600;
    state.thief.y = 300;
    state.thief.facing = Math.PI / 4;
    heist.setHaul(1250);
    heist.setAlarm(58);
    setLoot(state.room, [1]);
    placeGuard(state.room, 0, 430, 200, Math.PI / 2);
    placeGuard(state.room, 1, 1080, 360, Math.PI);
    placeGuard(state.room, 2, 640, 620, -Math.PI / 2);
    placeCamera(state.room, 0, 0.5);
    placeCamera(state.room, 1, -Math.PI / 2 + 0.4);
    heist.burst(640, 360, '#f2c94c', 8, 60);
    return PHASE_PLAY;
  }

  if (name === 'vault') {
    heist.loadRoom(2);
    heist.say('', 0); // No toast: it would cover the vault door.
    state.thief.x = 640;
    state.thief.y = 240;
    state.thief.facing = -Math.PI / 2;
    heist.setHaul(1750);
    heist.setAlarm(61);
    setLoot(state.room, [1, 4]);
    heist.openVaultForShot();
    state.room.crack = 0.55;
    state.room.vaultOpen = false;
    state.room.diamond = null;
    state.crackHeld = true;
    placeGuard(state.room, 0, 500, 500, -Math.PI / 2);
    placeGuard(state.room, 1, 200, 300, 0);
    placeGuard(state.room, 2, 1080, 300, Math.PI, 'chase');
    placeCamera(state.room, 0, Math.PI / 2 + 0.5);
    placeCamera(state.room, 1, Math.PI * 0.75 - 0.4);
    heist.burst(640, 165, '#f2c94c', 10, 80);
    return PHASE_PLAY;
  }

  if (name === 'getaway') {
    heist.loadRoom(2);
    heist.say('', 0); // No toast: it would cover the vault door.
    state.thief.x = 1000;
    state.thief.y = 560;
    state.thief.facing = Math.PI / 4;
    heist.setHaul(4250);
    heist.setAlarm(82);
    setLoot(state.room, [0, 1, 2, 3, 4]);
    heist.openVaultForShot();
    state.room.diamond.taken = true;
    placeGuard(state.room, 0, 640, 500, Math.PI / 2, 'chase');
    placeGuard(state.room, 1, 200, 450, 0);
    placeGuard(state.room, 2, 1080, 420, Math.PI, 'chase');
    placeCamera(state.room, 0, Math.PI / 2 - 0.6);
    placeCamera(state.room, 1, Math.PI * 0.75);
    heist.burst(1000, 560, '#7fe7f2', 10, 70);
    return PHASE_PLAY;
  }

  // cover: the lobby, the thief crossing the hall, cones and arcs in frame.
  state.thief.x = 640;
  state.thief.y = 430;
  state.thief.facing = -Math.PI / 2;
  heist.setHaul(750);
  heist.setAlarm(42);
  setLoot(state.room, [2]);
  placeGuard(state.room, 0, 500, 300, Math.PI / 2);
  placeGuard(state.room, 1, 1150, 420, -Math.PI / 2);
  placeCamera(state.room, 0, Math.PI / 2 + 0.6);
  placeCamera(state.room, 1, Math.PI - 0.5);
  heist.burst(640, 150, '#58d68d', 8, 60);
  return PHASE_PLAY;
}
