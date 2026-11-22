// The night-bank look: checkerboard marble, the red carpet runner, gold-trimmed
// walls, desks and planters for cover, amber vision cones, red camera arcs,
// glowing loot, the steel vault door and the green getaway van. Everything is
// drawn with canvas paths — no image assets, nothing loaded over the network.

import { CAMERA, FIELD, GUARD, PALETTE, SMOKE_SECONDS, VAULT } from './tuning.js';

const TILE = 80;

function drawCone(ctx, x, y, angle, range, halfAngle, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawWalls(ctx, room) {
  const m = FIELD.margin;
  ctx.fillStyle = PALETTE.wallFace;
  ctx.fillRect(0, 0, FIELD.width, m);
  ctx.fillRect(0, FIELD.height - m, FIELD.width, m);
  ctx.fillRect(0, 0, m, FIELD.height);
  ctx.fillRect(FIELD.width - m, 0, m, FIELD.height);
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, m - 4, FIELD.width, 4);
  ctx.fillRect(0, FIELD.height - m, FIELD.width, 4);
  ctx.fillRect(m - 4, 0, 4, FIELD.height);
  ctx.fillRect(FIELD.width - m, 0, 4, FIELD.height);
  for (const w of room.walls) {
    ctx.fillStyle = PALETTE.wallFace;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
  }
}

function drawLoot(ctx, loot, time) {
  const bob = Math.sin(time * 3 + loot.x) * 2;
  const glow = ctx.createRadialGradient(loot.x, loot.y + bob, 2, loot.x, loot.y + bob, 26);
  if (loot.kind === 'cash') {
    glow.addColorStop(0, 'rgba(88, 214, 141, 0.55)');
    glow.addColorStop(1, 'rgba(88, 214, 141, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(loot.x - 26, loot.y + bob - 26, 52, 52);
    ctx.fillStyle = PALETTE.cash;
    ctx.fillRect(loot.x - 9, loot.y + bob - 6, 18, 12);
    ctx.fillStyle = '#1f3d2b';
    ctx.fillRect(loot.x - 9, loot.y + bob - 2, 18, 4);
  } else if (loot.kind === 'gold') {
    glow.addColorStop(0, 'rgba(242, 201, 76, 0.55)');
    glow.addColorStop(1, 'rgba(242, 201, 76, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(loot.x - 26, loot.y + bob - 26, 52, 52);
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.moveTo(loot.x - 11, loot.y + bob + 6);
    ctx.lineTo(loot.x - 7, loot.y + bob - 7);
    ctx.lineTo(loot.x + 7, loot.y + bob - 7);
    ctx.lineTo(loot.x + 11, loot.y + bob + 6);
    ctx.closePath();
    ctx.fill();
  } else {
    glow.addColorStop(0, 'rgba(127, 231, 242, 0.6)');
    glow.addColorStop(1, 'rgba(127, 231, 242, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(loot.x - 30, loot.y + bob - 30, 60, 60);
    ctx.fillStyle = PALETTE.diamond;
    ctx.beginPath();
    ctx.moveTo(loot.x, loot.y + bob - 13);
    ctx.lineTo(loot.x + 11, loot.y + bob);
    ctx.lineTo(loot.x, loot.y + bob + 13);
    ctx.lineTo(loot.x - 11, loot.y + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(loot.x, loot.y + bob - 13);
    ctx.lineTo(loot.x + 11, loot.y + bob);
    ctx.lineTo(loot.x, loot.y + bob);
    ctx.lineTo(loot.x - 11, loot.y + bob);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawRoom(ctx, state) {
  const room = state.room;
  const time = state.time;
  // Marble floor.
  for (let ty = 0; ty < FIELD.height / TILE; ty += 1) {
    for (let tx = 0; tx < FIELD.width / TILE; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  // The red carpet runner down the middle of the hall.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(FIELD.width / 2 - 46, FIELD.margin, 92, FIELD.height - FIELD.margin * 2);
  ctx.fillStyle = PALETTE.carpetEdge;
  ctx.fillRect(FIELD.width / 2 - 46, FIELD.margin, 3, FIELD.height - FIELD.margin * 2);
  ctx.fillRect(FIELD.width / 2 + 43, FIELD.margin, 3, FIELD.height - FIELD.margin * 2);

  // Exit door and getaway van, before the walls so their frames sit on top.
  if (room.def.exit) {
    const e = room.def.exit;
    ctx.fillStyle = '#0d1017';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = PALETTE.wallTop;
    ctx.lineWidth = 3;
    ctx.strokeRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 13px ' + 'system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(e.label, 0, 5);
    ctx.restore();
  }
  if (room.def.van) {
    const v = room.def.van;
    const ready = room.vaultOpen && room.diamond && room.diamond.taken;
    ctx.fillStyle = ready ? '#2e7d46' : '#24382c';
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = ready ? PALETTE.ok : PALETTE.muted;
    ctx.lineWidth = 3;
    ctx.strokeRect(v.x + 2, v.y + 2, v.w - 4, v.h - 4);
    ctx.fillStyle = '#0d1017';
    ctx.beginPath();
    ctx.arc(v.x + 22, v.y + v.h - 8, 10, 0, Math.PI * 2);
    ctx.arc(v.x + v.w - 22, v.y + v.h - 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VAN', v.x + v.w / 2, v.y + 24);
    if (ready) {
      ctx.fillStyle = PALETTE.ok;
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText('GO!', v.x + v.w / 2, v.y + 44);
    }
  }

  // The vault door: steel, gold frame, and a crack ring while it is being opened.
  if (room.def.vault) {
    const d = room.def.vault;
    ctx.fillStyle = room.vaultOpen ? '#3a4358' : '#4a5468';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = PALETTE.wallTop;
    ctx.lineWidth = 4;
    ctx.strokeRect(d.x + 2, d.y + 2, d.w - 4, d.h - 4);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VAULT', d.x + d.w / 2, d.y + d.h / 2 + 6);
    if (!room.vaultOpen && room.crack > 0) {
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(d.x + d.w / 2, d.y + d.h + 18, 16, -Math.PI / 2, -Math.PI / 2 + room.crack * Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.gold;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText(`${Math.round(room.crack * 100)}%`, d.x + d.w / 2, d.y + d.h + 44);
    }
    if (room.vaultOpen) {
      ctx.fillStyle = '#0d1017';
      ctx.fillRect(d.x + 14, d.y + 14, d.w - 28, d.h - 28);
    }
  }

  drawWalls(ctx, room);

  // Desks and planters: the cover the thief hides behind.
  for (const w of room.walls) {
    if (w.h <= 40) {
      ctx.fillStyle = PALETTE.desk;
      ctx.fillRect(w.x + 4, w.y + 4, w.w - 8, w.h - 8);
    }
  }
  for (const p of room.def.planters) {
    ctx.fillStyle = PALETTE.planter;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.leaf;
    ctx.beginPath();
    ctx.arc(p.x - 8, p.y - 6, 10, 0, Math.PI * 2);
    ctx.arc(p.x + 9, p.y - 7, 11, 0, Math.PI * 2);
    ctx.arc(p.x, p.y + 8, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Loot, glowing on the floor.
  for (const loot of room.loot) {
    if (!loot.taken) drawLoot(ctx, loot, time);
  }
  if (room.diamond && !room.diamond.taken) drawLoot(ctx, room.diamond, time);

  // Camera arcs first (under the guards), then the camera bodies.
  for (const c of room.cameras) {
    if (c.offFor > 0 || c.blindFor > 0) continue;
    drawCone(ctx, c.x, c.y, c.angle, CAMERA.range, CAMERA.halfAngle, PALETTE.cameraArc);
  }
  // Guard cones, hot amber when the guard is alerted.
  for (const g of room.guards) {
    if (g.blindFor > 0) continue;
    drawCone(ctx, g.x, g.y, g.facing, GUARD.coneRange, GUARD.coneHalfAngle, g.alert ? PALETTE.coneHot : PALETTE.cone);
  }
  for (const c of room.cameras) {
    ctx.fillStyle = c.offFor > 0 || c.blindFor > 0 ? PALETTE.cameraOff : PALETTE.cameraBody;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d1017';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smoke clouds drift over everything they blind.
  for (const s of state.smokes) {
    ctx.fillStyle = PALETTE.smoke;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * (0.6 + 0.4 * (s.t / SMOKE_SECONDS)), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s.x - 40, s.y + 25, s.r * 0.5, 0, Math.PI * 2);
    ctx.arc(s.x + 45, s.y - 20, s.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // Guards: red coats, white caps, an exclamation when they chase.
  for (const g of room.guards) {
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guardCap;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 6, 0, Math.PI * 2);
    ctx.fill();
    if (g.mode === 'chase') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 20);
    }
  }

  // The thief: a dark figure with a gold trim and a facing tick.
  const t = state.thief;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(t.x, t.y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(t.x, t.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.thiefTrim;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = PALETTE.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.facing) * 16, t.y + Math.sin(t.facing) * 16);
  ctx.stroke();

  // Click-to-move marker.
  if (t.clickX !== null) {
    ctx.strokeStyle = 'rgba(238,241,245,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(t.clickX, t.clickY, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Particles: pickup sparkles, crack sparks.
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Vault crack hint while the thief stands at the door.
  if (room.def.vault && !room.vaultOpen) {
    const d = room.def.vault;
    const cx = d.x + d.w / 2;
    const cy = d.y + d.h / 2;
    if (Math.hypot(cx - t.x, cy - t.y) < VAULT.reach + 60) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.crackHeld ? 'CRACKING…' : 'HOLD E TO CRACK', cx, d.y + d.h + 64);
    }
  }
}

export { VAULT };
