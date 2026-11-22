// The thief: keyboard movement (WASD or arrows), click-to-move, sneak, and the
// two tools. The thief is a circle that slides along walls instead of sticking.

import { FIELD, LOOT_VALUE, THIEF, TOOL_PRICE } from './tuning.js';

export function makeThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    facing: -Math.PI / 2,
    sneaking: false,
    moving: false,
    clickX: null,
    clickY: null,
    haul: 0,
    smokes: 0,
    emps: 0,
  };
}

/** Push a circle out of every wall rect it overlaps; returns true if it hit one. */
export function collideCircle(px, py, radius, walls) {
  let hit = false;
  for (const w of walls) {
    const cx = Math.max(w.x, Math.min(px, w.x + w.w));
    const cy = Math.max(w.y, Math.min(py, w.y + w.h));
    const dx = px - cx;
    const dy = py - cy;
    const dSq = dx * dx + dy * dy;
    if (dSq >= radius * radius) continue;
    hit = true;
    if (dSq < 1e-6) {
      // Centre inside the rect: shove out along the shallowest side.
      const left = px - w.x;
      const right = w.x + w.w - px;
      const top = py - w.y;
      const bottom = w.y + w.h - py;
      const m = Math.min(left, right, top, bottom);
      if (m === left) px = w.x - radius;
      else if (m === right) px = w.x + w.w + radius;
      else if (m === top) py = w.y - radius;
      else py = w.y + w.h + radius;
    } else {
      const d = Math.sqrt(dSq);
      px = cx + (dx / d) * radius;
      py = cy + (dy / d) * radius;
    }
  }
  return { x: px, y: py, hit };
}

/**
 * Move the thief one fixed step. `move` is {x, y} from the keys (-1..1 each);
 * a click target overrides the keys until reached or a key is pressed.
 */
export function stepThief(t, dt, move, walls) {
  let mx = move.x;
  let my = move.y;
  if ((mx !== 0 || my !== 0) && t.clickX !== null) {
    t.clickX = null;
    t.clickY = null;
  }
  if (mx === 0 && my === 0 && t.clickX !== null) {
    const dx = t.clickX - t.x;
    const dy = t.clickY - t.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      t.clickX = null;
      t.clickY = null;
    } else {
      mx = dx / dist;
      my = dy / dist;
    }
  }
  const len = Math.hypot(mx, my);
  if (len > 0) {
    mx /= len;
    my /= len;
  }
  const speed = t.sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed;
  const nx = t.x + mx * speed * dt;
  const ny = t.y + my * speed * dt;
  t.moving = len > 0;
  if (t.moving) t.facing = Math.atan2(my, mx);
  // Slide along walls: try the full step, then each axis alone.
  let out = collideCircle(nx, ny, THIEF.radius, walls);
  if (out.hit) {
    const xOnly = collideCircle(nx, t.y, THIEF.radius, walls);
    const yOnly = collideCircle(t.x, ny, THIEF.radius, walls);
    if (!xOnly.hit) out = xOnly;
    else if (!yOnly.hit) out = yOnly;
    else out = collideCircle(t.x, t.y, THIEF.radius, walls);
  }
  t.x = Math.max(FIELD.margin + THIEF.radius, Math.min(FIELD.width - FIELD.margin - THIEF.radius, out.x));
  t.y = Math.max(FIELD.margin + THIEF.radius, Math.min(FIELD.height - FIELD.margin - THIEF.radius, out.y));
}

/** Try to buy a tool out of the haul. Returns 'ok' or 'poor'. */
export function buyTool(t, tool) {
  const price = TOOL_PRICE[tool];
  if (t.haul < price) return 'poor';
  t.haul -= price;
  if (tool === 'smoke') t.smokes += 1;
  else t.emps += 1;
  return 'ok';
}

export { LOOT_VALUE };
