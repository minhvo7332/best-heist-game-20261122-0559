// Every tuning number and colour for Crack the Meridian Vault, in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720, margin: 28 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const THIEF = {
  radius: 13,
  walkSpeed: 205,
  sneakSpeed: 112,
  pickupRadius: 26,
};

export const LOOT_VALUE = { cash: 250, gold: 500, diamond: 2000 };

export const TOOL_PRICE = { smoke: 400, emp: 600 };
export const SMOKE_RADIUS = 175;
export const SMOKE_SECONDS = 4;
export const EMP_SECONDS = 6;

export const GUARD = {
  radius: 13,
  patrolSpeed: 72,
  chaseSpeed: 138,
  coneRange: 215,
  coneHalfAngle: 0.56,
  scanPause: 1.4,
  scanSwing: 0.7,
  memorySeconds: 2.5,
  alarmPerSecond: 55,
};

export const CAMERA = {
  range: 265,
  halfAngle: 0.44,
  sweepSpeed: 0.55,
  alarmPerSecond: 40,
};

export const ALARM = {
  max: 100,
  coolPerSecond: 10,
  sneakFactor: 0.5,
};

export const VAULT = { crackSeconds: 4, reach: 78 };

export const PALETTE = {
  floorA: '#171c2b',
  floorB: '#1b2133',
  carpet: '#5c2430',
  carpetEdge: '#8a6d3b',
  wall: '#2b3247',
  wallTop: '#c9a227',
  wallFace: '#232a3c',
  desk: '#3a2f22',
  deskTop: '#c9a227',
  planter: '#1f3d2b',
  leaf: '#3f7a4e',
  pillar: '#39415a',
  guard: '#d84a3a',
  guardCap: '#f2ede4',
  cone: 'rgba(242, 192, 74, 0.20)',
  coneHot: 'rgba(242, 192, 74, 0.38)',
  cameraArc: 'rgba(216, 74, 58, 0.22)',
  cameraBody: '#e5534b',
  cameraOff: '#5a6274',
  cash: '#58d68d',
  gold: '#f2c94c',
  diamond: '#7fe7f2',
  thief: '#20242e',
  thiefTrim: '#f2c94c',
  smoke: 'rgba(200, 205, 215, 0.28)',
  hud: '#0d1017',
  hudEdge: '#c9a227',
  text: '#eef1f5',
  muted: '#9aa3b5',
  alarmLow: '#f2c94c',
  alarmHigh: '#e5534b',
  danger: '#e5534b',
  ok: '#58d68d',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best haul is kept between visits (this browser only). */
export const BEST_KEY = 'meridian-vault.best-haul';
