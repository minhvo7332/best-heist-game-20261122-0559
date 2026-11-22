// The HUD and the screens around the game: the top bar (phase, alarm meter,
// haul and tools), the message toast, and the title, pause, busted and win
// screens. All of it is canvas text — no DOM, no assets.

import { ALARM, FIELD, PALETTE, TOOL_PRICE } from './tuning.js';
import { PHASE_BUSTED, PHASE_PAUSED, PHASE_TITLE, PHASE_WIN } from './heist.js';

const BAR_W = 300;
const BAR_H = 16;

export function drawHud(ctx, state, best) {
  const t = state.thief;
  // Top bar.
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, FIELD.width, 64);
  ctx.fillStyle = PALETTE.hudEdge;
  ctx.fillRect(0, 64, FIELD.width, 2);

  // Left: phase name and objective.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText(state.room.def.name, 20, 26);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(state.room.def.objective, 20, 48);

  // Centre: the alarm meter.
  const ax = FIELD.width / 2 - BAR_W / 2;
  const ratio = state.alarm / ALARM.max;
  ctx.fillStyle = '#232a3c';
  ctx.fillRect(ax, 16, BAR_W, BAR_H);
  ctx.fillStyle = ratio > 0.66 ? PALETTE.alarmHigh : PALETTE.alarmLow;
  ctx.fillRect(ax, 16, BAR_W * ratio, BAR_H);
  ctx.strokeStyle = PALETTE.hudEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 16, BAR_W, BAR_H);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ALARM ${Math.round(state.alarm)}%`, FIELD.width / 2, 50);
  if (t.sneaking) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('SNEAKING', FIELD.width / 2, 62);
  }

  // Right: haul, tools, best.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`HAUL $${state.haul}`, FIELD.width - 20, 26);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '13px system-ui, sans-serif';
  const smoke = t.smokes > 0 ? `SMOKE x${t.smokes}` : `SMOKE $${TOOL_PRICE.smoke}`;
  const emp = t.emps > 0 ? `EMP x${t.emps}` : `EMP $${TOOL_PRICE.emp}`;
  ctx.fillText(`[1] ${smoke}   [2] ${emp}`, FIELD.width - 20, 48);

  // Message toast, under the bar.
  if (state.messageT > 0 && state.message) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px system-ui, sans-serif';
    const w = ctx.measureText(state.message).width + 28;
    ctx.fillStyle = 'rgba(13,16,23,0.85)';
    ctx.fillRect(FIELD.width / 2 - w / 2, 76, w, 30);
    ctx.strokeStyle = PALETTE.hudEdge;
    ctx.strokeRect(FIELD.width / 2 - w / 2, 76, w, 30);
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(state.message, FIELD.width / 2, 96);
  }

  // Bottom hint.
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(238,241,245,0.55)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('WASD / arrows or click to move · Shift sneak · 1 smoke · 2 EMP · E crack vault · P pause', FIELD.width / 2, FIELD.height - 8);
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(8, 10, 16, 0.82)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function bigTitle(ctx, y) {
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('CRACK THE', FIELD.width / 2, y);
  ctx.fillText('MERIDIAN VAULT', FIELD.width / 2, y + 58);
}

export function drawScreen(ctx, state, screen, best) {
  if (screen === PHASE_TITLE) {
    dim(ctx);
    bigTitle(ctx, 210);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('A 3-room stealth heist. Read the patrols, grab the loot,', FIELD.width / 2, 320);
    ctx.fillText('crack the vault, and reach the getaway van before the alarm hits 100.', FIELD.width / 2, 346);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('WASD / arrows or click to move · Shift sneak · 1 smoke ($400) · 2 EMP ($600)', FIELD.width / 2, 400);
    ctx.fillText('Hold E at the vault door to crack it · P pause · Space restart', FIELD.width / 2, 424);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('PRESS SPACE OR CLICK TO START', FIELD.width / 2, 490);
    if (best > 0) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`Best haul: $${best}`, FIELD.width / 2, 530);
    }
    return;
  }
  if (screen === PHASE_PAUSED) {
    dim(ctx);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('PAUSED', FIELD.width / 2, 340);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Press P or Space to keep going', FIELD.width / 2, 380);
    return;
  }
  if (screen === PHASE_BUSTED) {
    dim(ctx);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.danger;
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillText('BUSTED!', FIELD.width / 2, 320);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(`Spotted by ${state.bustedBy}. The alarm hit 100.`, FIELD.width / 2, 360);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(`Haul kept: $${state.haul}`, FIELD.width / 2, 400);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Press Space to try again', FIELD.width / 2, 450);
    return;
  }
  if (screen === PHASE_WIN) {
    dim(ctx);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.ok;
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillText('CLEAN GETAWAY!', FIELD.width / 2, 300);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('The Meridian Diamond is yours. The van is already gone.', FIELD.width / 2, 345);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(`Final haul: $${state.haul}   ·   ${Math.round(state.wonAt)}s`, FIELD.width / 2, 395);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Press Space to run it again', FIELD.width / 2, 445);
  }
}
