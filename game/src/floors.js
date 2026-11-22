// The three rooms of the Meridian Bank: walls, loot, patrols, cameras, the vault
// door and the getaway van. Every room has several routes — the main hall, the
// side corridors, and cover behind desks and planters — so no patrol is a wall
// the thief cannot walk around.
//
// Coordinates are in the 1280x720 logical field. The outer wall is the field
// margin; interior obstacles are listed per room. The exit of a room is the
// door the thief walks through to reach the next one.

function rect(x, y, w, h) {
  return { x, y, w, h };
}

export const ROOMS = [
  {
    name: 'PHASE 1 — THE MERIDIAN LOBBY',
    objective: 'Cross the lobby. Grab the loot, reach the door top right.',
    spawn: { x: 90, y: 620 },
    exit: { ...rect(1180, 60, 46, 90), label: 'GALLERY' },
    vault: null,
    van: null,
    // Long desks and planters split the hall into a main route and two side routes.
    walls: [
      rect(300, 150, 150, 34),
      rect(300, 520, 150, 34),
      rect(830, 150, 150, 34),
      rect(830, 520, 150, 34),
      rect(560, 300, 160, 40),
      rect(180, 330, 60, 60),
      rect(1040, 330, 60, 60),
    ],
    planters: [
      { x: 210, y: 360, r: 26 },
      { x: 1070, y: 360, r: 26 },
    ],
    loot: [
      { x: 150, y: 120, kind: 'cash' },
      { x: 375, y: 90, kind: 'gold' },
      { x: 640, y: 150, kind: 'cash' },
      { x: 905, y: 90, kind: 'gold' },
      { x: 1120, y: 640, kind: 'cash' },
    ],
    guards: [
      { path: [[300, 280], [700, 280], [700, 440], [300, 440]], pause: 1.4 },
      { path: [[980, 200], [980, 520], [1120, 520], [1120, 200]], pause: 1.2 },
    ],
    cameras: [
      { x: 640, y: 48, base: Math.PI / 2, sweep: 0.9 },
      { x: 1228, y: 380, base: Math.PI, sweep: 0.7 },
    ],
  },
  {
    name: 'PHASE 2 — THE GILDED GALLERY',
    objective: 'Slip past the gallery patrols. The vault door is ahead.',
    spawn: { x: 90, y: 110 },
    exit: { ...rect(1180, 570, 46, 90), label: 'VAULT' },
    vault: null,
    van: null,
    // Pillars and display cases make a zig-zag of cover down the gallery.
    walls: [
      rect(260, 120, 40, 180),
      rect(260, 420, 40, 180),
      rect(560, 200, 160, 36),
      rect(560, 480, 160, 36),
      rect(860, 120, 40, 180),
      rect(860, 420, 40, 180),
    ],
    planters: [
      { x: 430, y: 360, r: 26 },
      { x: 850, y: 360, r: 26 },
      { x: 640, y: 90, r: 22 },
    ],
    loot: [
      { x: 150, y: 360, kind: 'cash' },
      { x: 400, y: 120, kind: 'gold' },
      { x: 640, y: 360, kind: 'gold' },
      { x: 640, y: 600, kind: 'cash' },
      { x: 980, y: 360, kind: 'gold' },
      { x: 1120, y: 120, kind: 'cash' },
    ],
    guards: [
      { path: [[200, 180], [640, 180], [640, 540], [200, 540]], pause: 1.3 },
      { path: [[1080, 180], [1080, 540]], pause: 1.6 },
      { path: [[430, 640], [850, 640], [850, 130], [430, 130]], pause: 1.1 },
    ],
    cameras: [
      { x: 48, y: 360, base: 0, sweep: 0.8 },
      { x: 640, y: 672, base: -Math.PI / 2, sweep: 0.9 },
    ],
  },
  {
    name: 'PHASE 3 — THE VAULT',
    objective: 'Hold E at the vault door to crack it. Take the Meridian Diamond, reach the van.',
    spawn: { x: 90, y: 620 },
    exit: null,
    vault: { ...rect(560, 48, 160, 110), label: 'VAULT' },
    van: { ...rect(1130, 570, 96, 90), label: 'GETAWAY' },
    // The vault room is guarded tight: two pillars and a low counter by the door.
    walls: [
      rect(300, 200, 40, 200),
      rect(940, 200, 40, 200),
      rect(520, 300, 240, 34),
    ],
    planters: [
      { x: 180, y: 150, r: 24 },
      { x: 1100, y: 150, r: 24 },
    ],
    loot: [
      { x: 150, y: 360, kind: 'cash' },
      { x: 400, y: 90, kind: 'gold' },
      { x: 880, y: 90, kind: 'gold' },
      { x: 1120, y: 360, kind: 'cash' },
      { x: 640, y: 520, kind: 'gold' },
    ],
    guards: [
      { path: [[240, 500], [640, 500], [1040, 500]], pause: 1.2 },
      { path: [[240, 150], [240, 560]], pause: 1.5 },
      { path: [[1040, 150], [1040, 560]], pause: 1.5 },
    ],
    cameras: [
      { x: 640, y: 180, base: Math.PI / 2, sweep: 1.0 },
      { x: 1228, y: 120, base: Math.PI * 0.75, sweep: 0.8 },
    ],
  },
];

/** The solid rectangles a room blocks movement and sight with: its interior walls. */
export function roomWalls(room) {
  return room.walls;
}

/** The diamond the vault hides; it only exists once the vault is cracked open. */
export function vaultDiamond(room) {
  return { x: room.vault.x + room.vault.w / 2, y: room.vault.y + room.vault.h / 2, kind: 'diamond' };
}
