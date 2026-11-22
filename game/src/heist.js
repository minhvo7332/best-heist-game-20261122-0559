// The heist itself: the rules that turn rooms, watchers and the thief into a
// game — alarm, loot pickup, tools, the vault crack, the getaway, and the
// particles that make it all read. One fixed step at a time, no frame-rate
// dependence.

import {
  ALARM,
  EMP_SECONDS,
  LOOT_VALUE,
  SMOKE_RADIUS,
  SMOKE_SECONDS,
  STEP,
  THIEF,
  VAULT,
} from './tuning.js';
import { ROOMS, roomWalls, vaultDiamond } from './floors.js';
import { makeCamera, makeGuard, stepCamera, stepGuard, alarmRate } from './watchers.js';
import { makeThief, stepThief } from './thief.js';
import { createRng } from './rng.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_PAUSED = 'paused';
export const PHASE_BUSTED = 'busted';
export const PHASE_WIN = 'win';

export const EVENT_PICKUP = 1;
export const EVENT_DENIED = 2;
export const EVENT_CRACK_DONE = 4;
export const EVENT_BUSTED = 8;
export const EVENT_WIN = 16;
export const EVENT_ROOM = 32;
export const EVENT_TOOL = 64;

function freshRoom(index) {
  const def = ROOMS[index];
  return {
    index,
    def,
    walls: roomWalls(def),
    loot: def.loot.map((l) => ({ ...l, taken: false })),
    guards: def.guards.map(makeGuard),
    cameras: def.cameras.map(makeCamera),
    crack: 0,
    vaultOpen: false,
    diamond: null,
  };
}

export function createHeist(seed) {
  const rng = createRng(seed);
  const state = {
    phase: PHASE_TITLE,
    roomIndex: 0,
    room: freshRoom(0),
    thief: makeThief(ROOMS[0].spawn),
    alarm: 0,
    time: 0,
    haul: 0,
    message: '',
    messageT: 0,
    particles: [],
    smokes: [],
    crackHeld: false,
    wonAt: 0,
    bustedBy: '',
  };

  function say(text, seconds = 2.5) {
    state.message = text;
    state.messageT = seconds;
  }

  function burst(x, y, color, count, speed = 120) {
    for (let i = 0; i < count; i += 1) {
      const a = rng() * Math.PI * 2;
      const v = speed * (0.4 + rng() * 0.8);
      state.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + rng() * 0.4, max: 0.9, color, size: 2 + rng() * 3 });
    }
  }

  function loadRoom(index) {
    state.roomIndex = index;
    state.room = freshRoom(index);
    state.thief.x = ROOMS[index].spawn.x;
    state.thief.y = ROOMS[index].spawn.y;
    state.thief.clickX = null;
    state.thief.clickY = null;
    state.smokes = [];
    state.crackHeld = false;
  }

  function start() {
    state.phase = PHASE_PLAY;
    state.roomIndex = 0;
    state.room = freshRoom(0);
    state.thief = makeThief(ROOMS[0].spawn);
    state.alarm = 0;
    state.time = 0;
    state.haul = 0;
    state.particles = [];
    state.smokes = [];
    state.message = '';
    state.messageT = 0;
    state.wonAt = 0;
    state.bustedBy = '';
    say('Cross the lobby. Grab the loot, reach the door.', 4);
  }

  function useSmoke() {
    if (state.thief.smokes <= 0) {
      // No smoke on hand: buy one out of the haul, then throw it with the next press.
      if (state.thief.haul < 400) {
        say('Smoke costs $400 — you have $' + state.thief.haul + '.');
        return EVENT_DENIED;
      }
      state.thief.haul -= 400;
      state.thief.smokes += 1;
      state.haul = state.thief.haul;
      say('Smoke bomb bought ($400). Press 1 again to throw it.');
      return EVENT_TOOL;
    }
    state.thief.smokes -= 1;
    state.smokes.push({ x: state.thief.x, y: state.thief.y, r: SMOKE_RADIUS, t: SMOKE_SECONDS });
    for (const g of state.room.guards) {
      if (Math.hypot(g.x - state.thief.x, g.y - state.thief.y) < SMOKE_RADIUS) {
        g.blindFor = SMOKE_SECONDS;
        if (g.mode === 'chase') g.mode = 'return';
      }
    }
    for (const c of state.room.cameras) {
      if (Math.hypot(c.x - state.thief.x, c.y - state.thief.y) < SMOKE_RADIUS) c.blindFor = SMOKE_SECONDS;
    }
    burst(state.thief.x, state.thief.y, '#c8cdd7', 14, 60);
    say('Smoke out — watchers nearby are blind.');
    return EVENT_TOOL;
  }

  function useEmp() {
    if (state.thief.emps <= 0) {
      if (state.thief.haul < 600) {
        say('EMP costs $600 — you have $' + state.thief.haul + '.');
        return EVENT_DENIED;
      }
      state.thief.haul -= 600;
      state.thief.emps += 1;
      state.haul = state.thief.haul;
      say('EMP bought ($600). Press 2 again to fire it.');
      return EVENT_TOOL;
    }
    state.thief.emps -= 1;
    for (const c of state.room.cameras) c.offFor = EMP_SECONDS;
    burst(state.thief.x, state.thief.y, '#7fe7f2', 14, 90);
    say('EMP fired — cameras down for 6 seconds.');
    return EVENT_TOOL;
  }

  function step(dt, input) {
    if (state.phase !== PHASE_PLAY) return 0;
    state.time += dt;
    if (state.messageT > 0) state.messageT -= dt;
    const room = state.room;
    const thief = state.thief;
    thief.sneaking = input.sneak;

    stepThief(thief, dt, input.move, room.walls);

    // Watchers: who sees the thief right now.
    let guardSeen = false;
    let cameraSeen = false;
    for (const g of room.guards) {
      if (stepGuard(g, dt, state.time, thief, room.walls)) guardSeen = true;
    }
    for (const c of room.cameras) {
      if (stepCamera(c, dt, state.time, thief, room.walls)) cameraSeen = true;
    }

    // The alarm climbs while anyone sees the thief, cools when nobody does.
    const rate = alarmRate(guardSeen, cameraSeen, thief.sneaking);
    if (rate > 0) state.alarm += rate * dt;
    else state.alarm = Math.max(0, state.alarm - ALARM.coolPerSecond * dt);
    if (state.alarm >= ALARM.max) {
      state.alarm = ALARM.max;
      state.phase = PHASE_BUSTED;
      state.bustedBy = guardSeen ? 'a guard' : 'a camera';
      return EVENT_BUSTED;
    }

    // Loot: walk over it to pocket it.
    let events = 0;
    for (const loot of room.loot) {
      if (loot.taken) continue;
      if (Math.hypot(loot.x - thief.x, loot.y - thief.y) < THIEF.pickupRadius) {
        loot.taken = true;
        thief.haul += LOOT_VALUE[loot.kind];
        state.haul = thief.haul;
        burst(loot.x, loot.y, loot.kind === 'cash' ? '#58d68d' : loot.kind === 'gold' ? '#f2c94c' : '#7fe7f2', 12);
        say(loot.kind === 'diamond' ? 'The Meridian Diamond is yours — reach the van!' : `+$${LOOT_VALUE[loot.kind]} ${loot.kind}.`);
        events |= EVENT_PICKUP;
      }
    }
    if (room.diamond && !room.diamond.taken && Math.hypot(room.diamond.x - thief.x, room.diamond.y - thief.y) < THIEF.pickupRadius) {
      room.diamond.taken = true;
      thief.haul += LOOT_VALUE.diamond;
      state.haul = thief.haul;
      burst(room.diamond.x, room.diamond.y, '#7fe7f2', 20, 160);
      say('The Meridian Diamond is yours — reach the van!');
      events |= EVENT_PICKUP;
    }

    // Tools, on a fresh press.
    if (input.smoke) events |= useSmoke();
    if (input.emp) events |= useEmp();

    // The vault: hold E beside the steel door to crack it.
    if (room.def.vault) {
      const door = room.def.vault;
      const cx = door.x + door.w / 2;
      const cy = door.y + door.h / 2;
      const near = Math.hypot(cx - thief.x, cy - thief.y) < VAULT.reach + 60;
      if (!room.vaultOpen && near && input.crack) {
        room.crack += dt / VAULT.crackSeconds;
        state.crackHeld = true;
        if (rng() < 0.35) burst(cx + (rng() - 0.5) * 60, cy + door.h / 2, '#f2c94c', 1, 70);
        if (room.crack >= 1) {
          room.crack = 1;
          room.vaultOpen = true;
          room.diamond = vaultDiamond(room.def);
          say('Vault open — take the Meridian Diamond!');
          events |= EVENT_CRACK_DONE;
        }
      } else {
        state.crackHeld = false;
      }
    }

    // Doors: the exit leads on, the van ends the job — with the diamond.
    if (room.def.exit) {
      const e = room.def.exit;
      if (thief.x > e.x - 6 && thief.x < e.x + e.w + 6 && thief.y > e.y - 6 && thief.y < e.y + e.h + 6) {
        loadRoom(state.roomIndex + 1);
        say(ROOMS[state.roomIndex].objective, 4);
        return events | EVENT_ROOM;
      }
    }
    if (room.def.van && room.vaultOpen && room.diamond && room.diamond.taken) {
      const v = room.def.van;
      if (thief.x > v.x - 6 && thief.x < v.x + v.w + 6 && thief.y > v.y - 6 && thief.y < v.y + v.h + 6) {
        state.phase = PHASE_WIN;
        state.wonAt = state.time;
        return events | EVENT_WIN;
      }
    }

    // Smoke clouds and particles fade.
    for (const s of state.smokes) s.t -= dt;
    state.smokes = state.smokes.filter((s) => s.t > 0);
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    return events;
  }

  return {
    state,
    start,
    step,
    loadRoom,
    say,
    burst,
    // Test and staging hooks: the screenshot scenes and the playtest drive the
    // same state the game does, never a second copy of it.
    setAlarm(value) {
      state.alarm = value;
    },
    setHaul(value) {
      state.thief.haul = value;
      state.haul = value;
    },
    openVaultForShot() {
      state.room.crack = 1;
      state.room.vaultOpen = true;
      state.room.diamond = vaultDiamond(state.room.def);
    },
  };
}

export { STEP };
