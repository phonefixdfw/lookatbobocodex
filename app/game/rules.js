import { decoySpots, playerSpawns, START, spots, special, vacuumAt, vacuumLength } from './layout.js';

export const GOAL = 10;
export const BREEZE_WIN = 'your did it! you wind';
export const DAG_SECONDS = 5;
export const PATRIOT_CHANCE = .40;
export const LEADERBOARD = 'look-at-bobo.times.v1';
const finiteInt = (raw, fallback) => raw !== null && /^-?\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : fallback;

export function options(search, touchDefault, randomSeed) {
  const query = new URLSearchParams(search);
  const test = query.get('test') === 'on';
  const capture = query.get('gate') === 'off';
  const lap = query.get('lap');
  const seed = capture ? 11 : finiteInt(query.get('seed'), randomSeed);
  return {
    test, capture, seed, low: query.get('quality') === 'low',
    cull: query.get('cull') !== 'off', touch: query.has('touch') ? query.get('touch') === 'on' : touchDefault,
    patriot: query.get('patriot'), roomba: query.get('roomba') !== 'off', music: query.get('music') !== 'off',
    lap: ['on','off'].includes(lap) ? lap : finiteInt(lap, null),
    stamp: query.get('stamp') === 'on',
  };
}

export function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let n = Math.imul(state ^ state >>> 15, 1 | state);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

export function shuffle(items, rng) {
  const bag = [...items];
  for (let i = bag.length-1; i > 0; i--) {
    const j = Math.floor(rng()*(i+1));
    [bag[i],bag[j]] = [bag[j],bag[i]];
  }
  return bag;
}

class SpotBag {
  constructor(pool, rng) {
    this.pool = pool;
    this.rng = rng;
    this.queue = [];
  }
  take(acceptable) {
    if (!this.queue.some(acceptable)) this.queue = shuffle(this.pool, this.rng);
    return this.queue.splice(this.queue.findIndex(acceptable), 1)[0];
  }
}

export class Run {
  constructor(config) {
    this.config = config;
    this.rng = random(config.seed);
    this.phase = this.rng() * vacuumLength;
    this.bobo = new SpotBag(spots, this.rng);
    this.decoy = new SpotBag(decoySpots, this.rng);
    this.player = new SpotBag(playerSpawns, random(config.seed ^ 0x5b0b09));
    this.playerSpawn = START;
    const lapChance = this.rng();
    this.lapAt = config.lap === 'off' ? 0 : Number.isInteger(config.lap)
      ? Math.max(2, config.lap) : config.lap === 'on' || lapChance < .20 ? 2+Math.floor(this.rng()*4) : 0;
    this.patriotAt = config.patriot === 'off' ? 0 : config.patriot === 'on'
      ? 2 : this.rng() < PATRIOT_CHANCE ? 2+Math.floor(this.rng()*7) : 0;
    this.vacuumAt = config.roomba && this.rng() < .35 ? 3+Math.floor(this.rng()*5) : 0;
    this.score = 0;
    this.dags = 0;
    this.found = 0;
    this.elapsed = 0;
    this.won = false;
    this.spawn();
  }
  spawn(origin) {
    const previous = this.spot?.id;
    const lastDecoy = this.decoySpot?.id;
    const number = this.found+1;
    let event = number === this.lapAt ? special.lap : null;
    if (!event && this.vacuumAt && (number === this.vacuumAt || (this.vacuumAt === this.lapAt && number === this.vacuumAt+1))) {
      event = special.vacuum;
    }
    this.spot = event ?? this.bobo.take(candidate => candidate.id !== previous);
    this.patriot = number === this.patriotAt;
    this.decoySpot = this.decoy.take(candidate => candidate.id !== lastDecoy
      && (Math.hypot(candidate.x-this.spot.x, candidate.z-this.spot.z) > 1.05)
      && !(this.spot.lap && candidate.id.startsWith('sofa')));
    if(this.found){
      const boboPosition = this.spot.moving ? vacuumAt(this.elapsed, this.phase) : this.spot;
      const blocks = [origin ?? this.playerSpawn, boboPosition, this.decoySpot];
      this.playerSpawn = this.player.take(candidate => candidate.id !== this.playerSpawn.id
        && blocks.every(({x,z}) => Math.hypot(candidate.x-x,candidate.z-z) >= 1.65));
    }
  }
  tick(seconds) {
    if (!this.won) this.elapsed += seconds;
  }
  shout(target, origin) {
    if (this.won) return 'ended';
    if (target === 'decoy') {
      this.score--;
      this.dags++;
      return 'dag';
    }
    if (target !== 'bobo') return 'miss';
    const patriot = this.patriot;
    this.score += patriot ? 3 : 1;
    this.found++;
    this.won = this.score >= GOAL;
    if (!this.won) this.spawn(origin);
    return this.won ? 'win' : patriot ? 'patriot' : 'found';
  }
  get time() { return this.elapsed + this.dags * DAG_SECONDS; }
}

export function formatTime(seconds, precise = false) {
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const fraction = precise ? '.' + String(Math.floor((seconds-whole)*10)) : '';
  return String(minutes).padStart(2,'0') + ':' + String(whole%60).padStart(2,'0') + fraction;
}

export function readTimes(storage) {
  try {
    const saved = JSON.parse(storage.getItem(LEADERBOARD) ?? '[]');
    return Array.isArray(saved) ? saved.filter(t => Number.isFinite(t?.time) && t.time >= 0) : [];
  } catch {
    return [];
  }
}

export function saveTime(storage, run) {
  const record = { time: run.time, dags: run.dags, seed: run.config.seed };
  const entries = readTimes(storage).concat(record).sort((a,b) => a.time-b.time).slice(0,10);
  try { storage.setItem(LEADERBOARD, JSON.stringify(entries)); } catch { /* private storage */ }
}
