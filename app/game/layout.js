export const DRAW_CAP = 250;
export const PLAYER_RADIUS = 0.24;
export const EYE = 1.63;
export const WALK_SPEED = 2.2;
export const VACUUM_SPEED = 0.18;
export const START = { x: 3.36, z: 3.94 };
export const playerSpawns = [
  { id:'living-entry', x:3.14, z:2.00, yaw:1.27, pitch:-.13 },
  { id:'dining-entry', x:6.53, z:2.52, yaw:.73, pitch:-.12 },
  { id:'kitchen-entry', x:9.19, z:3.82, yaw:.20, pitch:-.12 },
  { id:'landing-entry', x:5.38, z:3.78, yaw:-.64, pitch:-.10 },
  { id:'hall-entry', x:5.08, z:5.16, yaw:1.52, pitch:-.06 },
  { id:'bedroom-entry', x:3.53, z:6.67, yaw:2.12, pitch:-.13 },
  { id:'bath-entry', x:5.72, z:6.69, yaw:3.03, pitch:-.11 },
  { id:'patio-entry', x:3.72, z:-.81, yaw:1.12, pitch:-.09 },
];

export const rooms = {
  living: [0, 0, 4.60, 4.55],
  dining: [4.60, 0, 7.40, 3.10],
  kitchen: [7.40, 0, 10.35, 4.55],
  landing: [4.60, 3.10, 7.40, 4.55],
  hall: [3.50, 4.55, 7.20, 5.77],
  bedroom: [0, 5.77, 4.75, 9.55],
  bath: [4.75, 5.77, 7.20, 8.30],
  patio: [0, -1.70, 4.60, 0],
};

export const doors = {
  patio: {room:'living', left:3.10, right:4.32, z:0},
  hall: {room:'landing', left:6.00, right:7.18, z:4.55},
  bedroom: {room:'bedroom', left:3.52, right:4.69, z:5.77},
  bath: {room:'bath', left:5.02, right:6.17, z:5.77},
};

export const frontWindows = {
  living:[1.57,1.57,2.23,1.44],
  dining:[5.64,1.73,1.62,1.22],
};

const wall = (room, x1, z1, x2, z2) => ({ room, x1, z1, x2, z2 });
const northWall = (door, left, right) => [
  wall(door.room,left,door.z,door.left,door.z),
  wall(door.room,door.right,door.z,right,door.z),
];
export const walls = [
  wall('living',0,0,0,4.55),
  ...northWall(doors.patio,0,4.60),
  wall('dining',4.60,0,7.40,0),
  wall('kitchen',7.40,0,10.35,0),
  wall('kitchen',10.35,0,10.35,4.55),
  wall('living',4.60,0,4.60,1.12),
  wall('living',4.60,2.53,4.60,3.38),
  wall('kitchen',7.40,0,7.40,1.49),
  wall('living',0,4.55,4.60,4.55),
  ...northWall(doors.hall,4.60,7.40),
  wall('kitchen',7.40,4.55,10.35,4.55),
  wall('hall',3.50,4.55,3.50,5.77),
  wall('hall',7.20,4.55,7.20,5.77),
  ...northWall(doors.bedroom,0,4.75),
  ...northWall(doors.bath,4.75,7.20),
  wall('bedroom',0,5.77,0,9.55),
  wall('bedroom',0,9.55,4.75,9.55),
  wall('bedroom',4.75,5.77,4.75,9.55),
  wall('bath',4.75,8.30,7.20,8.30),
  wall('bath',7.20,5.77,7.20,8.30),
];

const item = (room, x, z, width, depth, height, kind) => ({ room, x, z, width, depth, height, kind });
export const furniture = {
  sofa: item('living',1.53,1.13,2.48,.92,.85,'sofa'),
  coffee: item('living',1.53,2.52,1.28,.60,.43,'coffee'),
  media: item('living',1.79,4.29,1.98,.42,.55,'media'),
  lounge: item('living',4.15,3.00,.69,.70,.85,'lounge'),
  bayPlant: item('living',2.83,.34,.36,.37,.70,'plant'),
  floorPlant: item('living',.39,3.69,.45,.43,.80,'plant'),
  shelf: item('living',.31,2.26,.44,.80,.84,'shelf'),
  dining: item('dining',5.87,1.21,.88,.88,.75,'dining'),
  northChair: item('dining',5.87,.53,.39,.38,.84,'chair'),
  southChair: item('dining',5.87,1.89,.39,.38,.84,'chair'),
  westChair: item('dining',5.18,1.21,.38,.39,.84,'chair'),
  eastChair: item('dining',6.55,1.21,.38,.39,.84,'chair'),
  buffet: item('dining',6.69,.29,1.08,.40,.81,'buffet'),
  counter: item('kitchen',8.49,.37,2.01,.62,.92,'counter'),
  fridge: item('kitchen',9.91,.43,.68,.70,2.01,'fridge'),
  island: item('kitchen',8.77,2.20,1.22,.62,.92,'island'),
  stoolA: item('kitchen',8.57,2.95,.34,.34,.62,'stool'),
  trash: item('kitchen',9.99,3.47,.38,.40,.71,'trash'),
  console: item('hall',6.66,5.60,.70,.18,.77,'buffet'),
  bed: item('bedroom',1.58,8.30,1.62,2.23,1.11,'bed'),
  nightWest: item('bedroom',.33,9.19,.43,.45,.58,'night'),
  nightEast: item('bedroom',2.81,9.19,.48,.45,.58,'night'),
  desk: item('bedroom',3.90,9.23,1.19,.47,.75,'desk'),
  deskChair: item('bedroom',3.86,8.59,.49,.49,.87,'lounge'),
  chest: item('bedroom',.34,6.82,.55,1.11,.99,'shelf'),
  tub: item('bath',5.68,7.86,1.64,.74,.58,'tub'),
  bathLinen: item('bath',4.99,6.48,.30,.39,1.58,'linen-cabinet'),
  vanity: item('bath',6.74,6.09,.68,.49,.89,'vanity'),
  toilet: item('bath',6.76,6.85,.65,.45,.77,'toilet'),
  litter: item('bath',6.79,7.94,.43,.43,.25,'litter'),
  garden: item('patio',.49,-1.22,.56,.46,.50,'plant'),
  patioChair: item('patio',1.69,-1.10,.66,.61,.80,'lounge'),
  patioTable: item('patio',2.53,-1.23,.48,.46,.46,'stool'),
};

export const television = {x:furniture.media.x-.18,z:furniture.media.z,width:1.42};

function spot(id, room, x, y, z, pose = 'sit', extras = {}) {
  return { id, room, x, y, z, pose, ...extras };
}
export const heatPad = spot('heat-pad','living',1.94,.51,1.26,'loaf');
export const spots = [
  heatPad,
  spot('sofa-left','living',.88,.50,1.25,'roll'),
  spot('sofa-arm','living',.38,.68,1.16,'loaf'),
  spot('coffee-table','living',1.76,.43,2.53,'roll'),
  spot('living-rug','living',2.67,.016,3.19,'loaf'),
  spot('window-sill','living',2.19,.825,.14,'loaf'),
  spot('by-the-window-plant','living',2.86,.016,.68,'sit',{partial:true}),
  spot('behind-the-curtain','living',.26,.016,.42,'sit',{partial:true}),
  spot('green-chair','living',4.07,.499,3.00,'loaf'),
  spot('media-console','living',2.60,.55,4.22),
  spot('bookshelf','living',.31,.84,2.36,'loaf'),
  spot('behind-the-coffee-table','living',1.49,.016,2.07,'loaf',{partial:true}),
  spot('dining-table','dining',5.77,.75,1.22,'roll'),
  spot('dining-chair-north','dining',5.87,.49,.59,'loaf'),
  spot('dining-chair-south','dining',5.87,.49,1.84,'loaf'),
  spot('dining-chair-west','dining',5.22,.49,1.21,'loaf'),
  spot('dining-chair-east','dining',6.50,.49,1.21,'loaf'),
  spot('dining-sideboard','dining',6.50,.81,.29,'loaf'),
  spot('dining-edge','dining',7.01,.016,2.27),
  spot('island-west','kitchen',8.40,.92,2.20,'roll'),
  spot('island-east','kitchen',9.15,.92,2.20),
  spot('counter','kitchen',7.76,.92,.39,'loaf'),
  spot('by-the-sink','kitchen',9.24,.92,.38),
  spot('fridge-top','kitchen',9.91,2.01,.52,'loaf'),
  spot('kitchen-stool','kitchen',8.57,.62,2.95,'loaf'),
  spot('food-mat','kitchen',9.66,.016,4.12),
  spot('trash-can','kitchen',9.99,.71,3.47,'loaf'),
  spot('hall-runner-west','hall',4.32,.019,5.12,'roll'),
  spot('hall-runner-east','hall',6.40,.019,4.96,'loaf'),
  spot('hall-console','hall',6.68,.77,5.58),
  spot('bedroom-door','hall',3.97,.016,5.60),
  spot('bed-corner','bedroom',1.14,.63,7.41,'roll'),
  spot('on-the-duvet','bedroom',1.95,.67,8.23,'loaf'),
  spot('by-the-pillows','bedroom',1.58,.68,8.85),
  spot('nightstand-west','bedroom',.33,.58,9.16,'loaf'),
  spot('nightstand-east','bedroom',2.81,.58,9.14),
  spot('desk','bedroom',4.14,.75,9.22,'loaf'),
  spot('desk-chair','bedroom',3.86,.49,8.59,'loaf'),
  spot('dresser','bedroom',.34,.99,6.90),
  spot('bathtub','bath',5.71,.35,7.85,'loaf',{partial:true}),
  spot('shower-curtain','bath',4.98,.015,7.30,'sit',{partial:true}),
  spot('vanity','bath',6.96,.89,6.08,'loaf'),
  spot('bath-mat','bath',5.71,.018,7.18,'roll'),
  spot('litter-box','bath',6.69,.20,7.91),
  spot('patio-chair','patio',1.69,.49,-1.09,'loaf'),
  spot('patio-table','patio',2.53,.46,-1.23,'loaf'),
  spot('patio-planter','patio',.85,.016,-1.30,'sit',{partial:true}),
  spot('patio-rail','patio',3.78,.016,-1.26,'roll'),
];

export const special = {
  vacuum: spot('roomba','landing',5.45,.115,4.11,'loaf',{moving:true}),
  lap: spot('owners-lap','living',1.19,.86,1.50,'loaf',{lap:true}),
};
export const decoySpots = spots.filter(s=>!s.partial&&s.y<.93&&!s.id.includes('chair'))
  .concat([
    spot('under-the-dining-window','dining',4.97,.017,.42),
    spot('kitchen-floor','kitchen',9.83,.017,2.46),
    spot('hall-east','hall',6.85,.017,5.05),
    spot('bedroom-floor','bedroom',2.43,.017,6.80),
    spot('bathroom-floor','bath',6.05,.017,6.74),
  ]);
export const vacuumRoute = [
  [3.17,3.92],[4.35,3.98],[5.47,4.09],[6.60,4.11],[6.60,5.10],[5.31,5.08],
  [6.52,5.03],[6.62,4.02],[7.66,3.92],[7.79,2.48],[7.16,2.42],
  [6.23,2.38],[5.01,2.16],[4.27,2.12],[3.31,2.19],[3.17,3.92],
];
export const roomLinks = {
  living:['patio','dining','landing'], patio:['living'],
  dining:['living','landing','kitchen'], kitchen:['dining','landing'],
  landing:['living','dining','kitchen','hall'],
  hall:['landing','bedroom','bath'], bedroom:['hall'], bath:['hall'],
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
  [0,rooms.patio[1],rooms.patio[2],rooms.patio[1]+.09],
  [0,rooms.patio[1],.09,0], [rooms.patio[2]-.09,rooms.patio[1],rooms.patio[2],0],
];

export function canStand(x, z, radius = PLAYER_RADIUS) {
  if (!roomAt(x,z)) return false;
  return !obstacles.some(([left, top, right, bottom]) => {
    const dx = x - Math.max(left, Math.min(right, x));
    const dz = z - Math.max(top, Math.min(bottom, z));
    // Avoid trapping movement at a doorway when rounded coordinates touch a jamb.
    return dx * dx + dz * dz + 1e-9 < radius * radius;
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
