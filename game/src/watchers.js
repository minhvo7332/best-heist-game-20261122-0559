// Guards and cameras: the watchers. A guard walks a patrol loop, pauses at
// each waypoint to scan, and chases when it spots the thief; a camera sweeps
// a red arc back and forth. Smoke blinds both while it lasts; EMP kills the
// cameras for a while. Neither sees through walls.

import { ALARM, CAMERA, GUARD } from './tuning.js';
import { angleGap, canSee } from './sight.js';

export function makeGuard(def) {
  return {
    path: def.path,
    pause: def.pause,
    x: def.path[0][0],
    y: def.path[0][1],
    leg: 0,
    facing: 0,
    mode: 'patrol', // patrol | scan | chase | return | blind
    wait: 0,
    scanT: 0,
    scanBase: 0,
    lastSeenX: 0,
    lastSeenY: 0,
    lostFor: 0,
    blindFor: 0,
    alert: false,
  };
}

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    angle: def.base,
    phase: Math.random() * Math.PI * 2,
    offFor: 0,
    blindFor: 0,
  };
}

function stepToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const move = Math.min(dist, speed * dt);
  g.x += (dx / dist) * move;
  g.y += (dy / dist) * move;
  g.facing = Math.atan2(dy, dx);
  return move >= dist;
}

/** Advance one guard one fixed step. Returns true when it can see the thief. */
export function stepGuard(g, dt, time, thief, walls) {
  if (g.blindFor > 0) {
    g.blindFor -= dt;
    g.alert = false;
    return false;
  }
  const seen = canSee(g.x, g.y, g.facing, GUARD.coneRange, GUARD.coneHalfAngle, thief.x, thief.y, walls);

  if (g.mode === 'patrol' || g.mode === 'scan') {
    if (seen) {
      g.mode = 'chase';
      g.lastSeenX = thief.x;
      g.lastSeenY = thief.y;
      g.lostFor = 0;
      g.alert = true;
      return true;
    }
    if (g.mode === 'patrol') {
      const target = g.path[(g.leg + 1) % g.path.length];
      if (stepToward(g, target[0], target[1], GUARD.patrolSpeed, dt)) {
        g.leg = (g.leg + 1) % g.path.length;
        g.mode = 'scan';
        g.wait = g.pause;
        g.scanT = 0;
        g.scanBase = g.facing;
      }
    } else {
      g.wait -= dt;
      g.scanT += dt;
      g.facing = g.scanBase + Math.sin(g.scanT * 2.2) * GUARD.scanSwing;
      if (g.wait <= 0) g.mode = 'patrol';
    }
    g.alert = false;
    return false;
  }

  if (g.mode === 'chase') {
    if (seen) {
      g.lastSeenX = thief.x;
      g.lastSeenY = thief.y;
      g.lostFor = 0;
    } else {
      g.lostFor += dt;
    }
    const arrived = stepToward(g, g.lastSeenX, g.lastSeenY, GUARD.chaseSpeed, dt);
    if (g.lostFor >= GUARD.memorySeconds || arrived) {
      g.mode = 'return';
    }
    g.alert = true;
    return seen;
  }

  // return: walk back to the nearest waypoint, then resume the patrol.
  let nearest = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < g.path.length; i += 1) {
    const d = Math.hypot(g.path[i][0] - g.x, g.path[i][1] - g.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = i;
    }
  }
  if (stepToward(g, g.path[nearest][0], g.path[nearest][1], GUARD.patrolSpeed, dt)) {
    g.leg = nearest;
    g.mode = 'patrol';
  }
  if (seen) {
    g.mode = 'chase';
    g.lastSeenX = thief.x;
    g.lastSeenY = thief.y;
    g.lostFor = 0;
    g.alert = true;
    return true;
  }
  g.alert = false;
  return false;
}

/** Advance one camera one fixed step. Returns true when it can see the thief. */
export function stepCamera(c, dt, time, thief, walls) {
  c.angle = c.base + Math.sin(time * CAMERA.sweepSpeed + c.phase) * c.sweep;
  if (c.offFor > 0) {
    c.offFor -= dt;
    return false;
  }
  if (c.blindFor > 0) {
    c.blindFor -= dt;
    return false;
  }
  return canSee(c.x, c.y, c.angle, CAMERA.range, CAMERA.halfAngle, thief.x, thief.y, walls);
}

/** How fast the alarm climbs right now: guards and cameras that see the thief. */
export function alarmRate(guardSeen, cameraSeen, sneaking) {
  let rate = 0;
  if (guardSeen) rate += GUARD.alarmPerSecond;
  if (cameraSeen) rate += CAMERA.alarmPerSecond;
  if (sneaking) rate *= ALARM.sneakFactor;
  return rate;
}

export { angleGap };
