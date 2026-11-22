// Vision cones and line of sight. A watcher sees the thief when the thief is
// inside the cone (close enough, inside the half-angle) and no wall stands
// between them. Walls are axis-aligned rectangles; the segment test below is
// exact, not sampled.

/** Smallest absolute angle between two headings, in radians. */
export function angleGap(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** Whether point (px, py) lies inside a cone from (ox, oy) facing `angle`. */
export function insideCone(ox, oy, angle, range, halfAngle, px, py) {
  const dx = px - ox;
  const dy = py - oy;
  const distSq = dx * dx + dy * dy;
  if (distSq > range * range) return false;
  if (distSq < 1) return true;
  return angleGap(Math.atan2(dy, dx), angle) <= halfAngle;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: the segment enters the rectangle's x-span and y-span at the same time.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  const spans = [
    [dx, x1, r.x, r.x + r.w],
    [dy, y1, r.y, r.y + r.h],
  ];
  for (const [d, origin, lo, hi] of spans) {
    if (Math.abs(d) < 1e-9) {
      if (origin < lo || origin > hi) return false;
    } else {
      let t1 = (lo - origin) / d;
      let t2 = (hi - origin) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

/** Whether any wall blocks the straight line from (x1, y1) to (x2, y2). */
export function blockedByWalls(x1, y1, x2, y2, walls) {
  for (const wall of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, wall)) return true;
  }
  return false;
}

/** Whether a watcher at (ox, oy) facing `angle` can see point (px, py). */
export function canSee(ox, oy, angle, range, halfAngle, px, py, walls) {
  if (!insideCone(ox, oy, angle, range, halfAngle, px, py)) return false;
  return !blockedByWalls(ox, oy, px, py, walls);
}
