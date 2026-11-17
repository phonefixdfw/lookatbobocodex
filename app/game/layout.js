export const DRAW_CAP = 250;
export const PLAYER_RADIUS = 0.24;
export const EYE = 1.63;
export const WALK_SPEED = 2.2;
export const VACUUM_SPEED = 0.18;
export const START = { x: 4.95, z: 5.05 };
export const playerSpawns = [
  { id:'living-entry', x:4.44, z:4.65, yaw:1.28, pitch:-.13 },
  { id:'dining-entry', x:9.91, z:3.14, yaw:1.06, pitch:-.12 },
  { id:'kitchen-entry', x:11.12, z:2.02, yaw:-1.43, pitch:-.12 },
  { id:'landing-entry', x:7.75, z:4.92, yaw:-.31, pitch:-.10 },
  { id:'hall-entry', x:8.92, z:7.50, yaw:-1.57, pitch:-.06 },
  { id:'bedroom-entry', x:6.04, z:10.11, yaw:2.18, pitch:-.13 },
  { id:'bath-entry', x:11.98, z:10.08, yaw:2.96, pitch:-.11 },
  { id:'patio-entry', x:4.57, z:-1.27, yaw:1.12, pitch:-.09 },
];

export const rooms = {
  living: [0, 0, 6.4, 6.4],
  dining: [6.4, 0, 10.4, 3.8],
  kitchen: [10.4, 0, 15.6, 6.4],
  landing: [6.4, 3.8, 10.4, 6.4],
  hall: [0, 6.4, 15.6, 8.8],
  bedroom: [0, 8.8, 8, 13.6],
  bath: [8, 8.8, 15.6, 13.6],
  patio: [0, -2.7, 6.4, 0],
};

const wall = (room, x1, z1, x2, z2) => ({ room, x1, z1, x2, z2 });
export const walls = [
  wall('living', 0, 0, 0, 6.4),
  wall('living', 0, 0, 4.02, 0), wall('living', 5.55, 0, 6.4, 0),
  wall('dining', 6.4, 0, 10.4, 0), wall('kitchen', 10.4, 0, 15.6, 0),
  wall('kitchen', 15.6, 0, 15.6, 6.4),
  wall('living', 0, 6.4, 4.15, 6.4),
  wall('hall', 0, 6.4, 0, 8.8), wall('hall', 15.6, 6.4, 15.6, 8.8),
  wall('kitchen', 8.15, 6.4, 15.6, 6.4),
  wall('bedroom', 0, 8.8, 5.45, 8.8), wall('bedroom', 6.7, 8.8, 8, 8.8),
  wall('bath', 8, 8.8, 11.5, 8.8), wall('bath', 12.8, 8.8, 15.6, 8.8),
  wall('bedroom', 0, 8.8, 0, 13.6), wall('bedroom', 0, 13.6, 8, 13.6),
  wall('bath', 8, 8.8, 8, 13.6), wall('bath', 8, 13.6, 15.6, 13.6),
  wall('bath', 15.6, 8.8, 15.6, 13.6),
];

const item = (room, x, z, width, depth, height, kind) => ({ room, x, z, width, depth, height, kind });
export const furniture = {
  sofa: item('living', 1.77, 1.53, 2.73, 1.05, .85, 'sofa'),
  coffee: item('living', 2.08, 3.22, 1.55, .74, .43, 'coffee'),
  media: item('living', 2.16, 5.99, 2.56, .55, .55, 'media'),
  lounge: item('living', 5.42, 2.62, .90, .92, .85, 'lounge'),
  bayPlant: item('living', 3.49, .52, .48, .48, .72, 'plant'),
  floorPlant: item('living', .47, 4.58, .54, .54, .83, 'plant'),
  shelf: item('living', .33, 3, .46, .97, .84, 'shelf'),
  dining: item('dining', 8.45, 2.04, 1.34, 1.34, .75, 'dining'),
  northChair: item('dining', 8.45, 1.04, .48, .48, .87, 'chair'),
  southChair: item('dining', 8.45, 3.02, .48, .48, .87, 'chair'),
  westChair: item('dining', 7.46, 2.04, .48, .48, .87, 'chair'),
  eastChair: item('dining', 9.44, 2.04, .48, .48, .87, 'chair'),
  buffet: item('dining', 8.26, .30, 1.98, .49, .81, 'buffet'),
  counter: item('kitchen', 12.30, .37, 3.63, .68, .92, 'counter'),
  fridge: item('kitchen', 14.84, .45, .86, .81, 2.01, 'fridge'),
  island: item('kitchen', 12.84, 3.54, 2.52, .92, .92, 'island'),
  stoolA: item('kitchen', 12.40, 4.48, .39, .39, .62, 'stool'),
  stoolB: item('kitchen', 13.40, 4.48, .39, .39, .62, 'stool'),
  trash: item('kitchen', 15.22, 4.96, .46, .46, .71, 'trash'),
  console: item('hall', 3.44, 8.55, 1.68, .37, .77, 'buffet'),
  bed: item('bedroom', 2.47, 12.24, 1.95, 2.34, 1.11, 'bed'),
  nightWest: item('bedroom', .87, 13.03, .57, .49, .58, 'night'),
  nightEast: item('bedroom', 4.07, 13.03, .57, .49, .58, 'night'),
  desk: item('bedroom', 6.02, 13.06, 1.65, .61, .75, 'desk'),
  deskChair: item('bedroom', 6.2, 12.29, .55, .55, .87, 'lounge'),
  chest: item('bedroom', .35, 10.42, .56, 1.56, .99, 'shelf'),
  tub: item('bath', 9.02, 12.92, 1.76, .76, .58, 'tub'),
  vanity: item('bath', 14.46, 13.15, 1.54, .62, .89, 'vanity'),
  toilet: item('bath', 15.01, 10.46, .59, .72, .77, 'toilet'),
  litter: item('bath', 8.49, 10.38, .52, .68, .25, 'litter'),
  garden: item('patio', .65, -1.95, .69, .59, .56, 'plant'),
  patioChair: item('patio', 2.15, -1.8, .76, .79, .80, 'lounge'),
  patioTable: item('patio', 3.36, -1.85, .58, .58, .46, 'stool'),
};

function spot(id, room, x, y, z, pose = 'sit', extras = {}) {
  return { id, room, x, y, z, pose, ...extras };
}
export const spots = [
  spot('heat-pad', 'living', 2.23, .49, 1.65, 'loaf'),
  spot('sofa-left', 'living', 1.13, .49, 1.65, 'roll'),
  spot('sofa-arm', 'living', .50, .69, 1.55, 'loaf'),
  spot('coffee-table', 'living', 2.26, .43, 3.23, 'roll'),
  spot('living-rug', 'living', 3.63, .016, 3.83, 'loaf'),
  spot('window-sill', 'living', 2.78, .81, .15, 'loaf'),
  spot('by-the-window-plant', 'living', 3.65, .016, .95, 'sit', { partial: true }),
  spot('behind-the-curtain', 'living', .49, .016, .50, 'sit', { partial: true }),
  spot('green-chair', 'living', 5.42, .49, 2.65, 'loaf'),
  spot('media-console', 'living', 3.22, .55, 5.92),
  spot('bookshelf', 'living', .34, .84, 3.02, 'loaf'),
  spot('behind-the-coffee-table', 'living', 1.63, .016, 2.57, 'loaf', { partial: true }),
  spot('dining-table', 'dining', 8.33, .75, 1.91, 'roll'),
  spot('dining-chair-north', 'dining', 8.45, .46, 1.13, 'loaf'),
  spot('dining-chair-south', 'dining', 8.45, .46, 2.93, 'loaf'),
  spot('dining-chair-west', 'dining', 7.55, .46, 2.04, 'loaf'),
  spot('dining-chair-east', 'dining', 9.35, .46, 2.04, 'loaf'),
  spot('dining-sideboard', 'dining', 7.69, .81, .31, 'loaf'),
  spot('dining-edge', 'dining', 9.97, .016, 1.24),
  spot('island-west', 'kitchen', 12.00, .92, 3.49, 'roll'),
  spot('island-east', 'kitchen', 13.47, .92, 3.55),
  spot('counter', 'kitchen', 11.30, .92, .41, 'loaf'),
  spot('by-the-sink', 'kitchen', 13.73, .92, .36),
  spot('fridge-top', 'kitchen', 14.85, 2.01, .56, 'loaf'),
  spot('kitchen-stool', 'kitchen', 12.40, .62, 4.48, 'loaf'),
  spot('food-mat', 'kitchen', 14.52, .018, 5.72),
  spot('trash-can', 'kitchen', 15.22, .71, 4.96, 'loaf'),
  spot('hall-runner-west', 'hall', 1.44, .019, 7.49, 'roll'),
  spot('hall-runner-east', 'hall', 10.42, .019, 7.63, 'loaf'),
  spot('hall-console', 'hall', 3.82, .77, 8.5),
  spot('bedroom-door', 'hall', 6.93, .017, 8.15),
  spot('bed-corner', 'bedroom', 1.86, .63, 11.38, 'roll'),
  spot('on-the-duvet', 'bedroom', 2.96, .67, 12.15, 'loaf'),
  spot('by-the-pillows', 'bedroom', 2.46, .67, 12.83),
  spot('nightstand-west', 'bedroom', .87, .58, 13.02, 'loaf'),
  spot('nightstand-east', 'bedroom', 4.07, .58, 13.03),
  spot('desk', 'bedroom', 6.63, .75, 12.99, 'loaf'),
  spot('desk-chair', 'bedroom', 6.20, .49, 12.28, 'loaf'),
  spot('dresser', 'bedroom', .38, .99, 10.65),
  spot('bathtub', 'bath', 9.42, .35, 12.87, 'loaf', { partial: true }),
  spot('shower-curtain', 'bath', 8.55, .015, 12.13, 'sit', { partial: true }),
  spot('vanity', 'bath', 14.93, .89, 13.13, 'loaf'),
  spot('bath-mat', 'bath', 11.12, .018, 12.25, 'roll'),
  spot('litter-box', 'bath', 8.96, .017, 10.61),
  spot('patio-chair', 'patio', 2.15, .49, -1.79, 'loaf'),
  spot('patio-table', 'patio', 3.36, .46, -1.85, 'loaf'),
  spot('patio-planter', 'patio', 1.09, .016, -1.92, 'sit', { partial: true }),
  spot('patio-rail', 'patio', 5.18, .016, -2.17, 'roll'),
];
export const special = {
  vacuum: spot('roomba', 'landing', 7.0, .115, 4.7, 'loaf', { moving: true }),
  lap: spot('owners-lap', 'living', 1.37, .86, 1.92, 'loaf', { lap: true }),
};
export const decoySpots = spots.filter(s => !s.partial && s.y < .93 && !s.id.includes('chair'))
  .concat([
    spot('under-the-dining-window', 'dining', 9.76, .017, .56),
    spot('kitchen-floor', 'kitchen', 14.72, .017, 2.39),
    spot('hall-east', 'hall', 13.32, .017, 7.59),
    spot('bedroom-floor', 'bedroom', 4.4, .017, 10.51),
    spot('bathroom-floor', 'bath', 13.76, .017, 11.52),
  ]);
export const vacuumRoute = [
  [4.78, 5.15], [6.14, 4.45], [7.05, 4.1], [9.9, 4.0], [10.48, 2.54],
  [14.35, 2.43], [14.54, 4.95], [10.50, 5.52], [7.02, 5.5], [6.69, 7.30],
  [5.16, 7.35], [4.78, 5.15],
];
export const roomLinks = {
  living: ['patio', 'dining', 'landing', 'hall'], patio: ['living'],
  dining: ['living', 'landing', 'kitchen'], kitchen: ['dining', 'landing'],
  landing: ['living', 'dining', 'kitchen', 'hall'],
  hall: ['living', 'landing', 'bedroom', 'bath'], bedroom: ['hall'], bath: ['hall'],
};

export function roomAt(x, z) {
  return Object.keys(rooms).find(key => {
    const [left, top, right, bottom] = rooms[key];
    return x >= left && x <= right && z >= top && z <= bottom;
  });
}

const obstacles = [
  ...walls.map(({ x1, z1, x2, z2 }) => [Math.min(x1,x2)-.06, Math.min(z1,z2)-.06, Math.max(x1,x2)+.06, Math.max(z1,z2)+.06]),
  ...Object.values(furniture).map(({ x, z, width, depth }) => [x-width/2,z-depth/2,x+width/2,z+depth/2]),
  [0,-2.7,6.4,-2.60], [0,-2.7,.09,0], [6.31,-2.7,6.4,0],
];

export function canStand(x, z, radius = PLAYER_RADIUS) {
  if (!roomAt(x,z)) return false;
  return !obstacles.some(([left, top, right, bottom]) => {
    const dx = x - Math.max(left, Math.min(right, x));
    const dz = z - Math.max(top, Math.min(bottom, z));
    return dx * dx + dz * dz < radius * radius;
  });
}

export function movePlayer(player, dx, dz) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .12));
  for (let step = 0; step < steps; step++) {
    if (canStand(player.x+dx/steps, player.z)) player.x += dx/steps;
    if (canStand(player.x, player.z+dz/steps)) player.z += dz/steps;
  }
}

const lengths = vacuumRoute.slice(1).map(([x,z], i) => Math.hypot(x-vacuumRoute[i][0], z-vacuumRoute[i][1]));
export const vacuumLength = lengths.reduce((total, n) => total+n, 0);
export function vacuumAt(time, phase) {
  let distance = (time * VACUUM_SPEED + phase) % vacuumLength;
  for (const [i, length] of lengths.entries()) {
    if (distance < length) {
      const [x,z] = vacuumRoute[i];
      const [nextX,nextZ] = vacuumRoute[i+1];
      return { x: x+(nextX-x)*distance/length, z: z+(nextZ-z)*distance/length, yaw: Math.atan2(nextX-x,nextZ-z) };
    }
    distance -= length;
  }
  return { ...START, yaw: 0 };
}
