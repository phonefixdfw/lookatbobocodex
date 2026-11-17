import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { DRAW_CAP, START, canStand, decoySpots, rooms, roomAt, roomLinks, spots, vacuumAt, vacuumLength, VACUUM_SPEED } from '../app/game/layout.js';
import { BREEZE_WIN, GOAL, LEADERBOARD, Run, options, readTimes, saveTime } from '../app/game/rules.js';
import { navigation } from './navigation.mjs';

const fault=process.argv[2];
const capture=options('?gate=off&seed=42&quality=low&touch=on&cull=off&roomba=off&music=off&patriot=off&lap=off&stamp=on', false,123);
assert.deepEqual(capture,{test:false,capture:true,seed:11,low:true,cull:false,touch:true,patriot:'off',roomba:false,music:false,lap:'off',stamp:true});
assert.equal(options('?touch=off&seed=9',true,5).touch,false);
assert.equal(options('?seed=12',false,5).seed,12);
assert.equal(options('',false,5).seed,5);
assert.equal(options('?lap=4',false,5).lap,4);
assert.equal(GOAL,10);
assert.equal(BREEZE_WIN,'your did it! you wind');

const run=new Run(capture);
function shout(scoring,target){
  const outcome=scoring.shout(target);
  if(fault==='wrong-cat-reward' && target==='decoy')scoring.score+=2;
  return outcome;
}
assert.equal(shout(run,'decoy'),'dag');
assert.equal(run.score,-1,'wrong cat must cost one point');
assert.equal(run.dags,1);
assert.equal(run.time,5);
run.tick(12.25);
assert.equal(run.time,17.25);
const first=run.spot.id;
assert.equal(run.shout(null),'miss');
assert.equal(run.spot.id,first);
while(!run.won)run.shout('bobo');
assert.equal(run.found,11);
assert.equal(run.shout('decoy'),'ended');
assert.equal(run.time,17.25);

const forced=new Run(options('?seed=11&lap=1&patriot=on',false,0));
assert.equal(forced.spot.lap,undefined);
assert.equal(forced.shout('bobo'),'found');
assert.equal(forced.spot.lap,true);
assert.equal(forced.patriot,true);
assert.equal(forced.shout('bobo'),'patriot');
assert.equal(forced.score,4);
assert.equal(DRAW_CAP,250,'shared draw cap changed');
const storage=new Map();
const fakeStorage={getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)};
storage.set(LEADERBOARD,'["bad",null]');
assert.deepEqual(readTimes(fakeStorage),[]);
for(let i=0;i<12;i++){run.elapsed=i;saveTime(fakeStorage,run);}
assert.deepEqual(readTimes(fakeStorage).map(entry=>entry.time),Array.from({length:10},(_,i)=>i+5));

const nav=navigation();
assert(canStand(START.x,START.z));
assert.deepEqual(new Set(nav.reachable.map(({x,z})=>roomAt(x,z))),new Set(Object.keys(rooms)),'every named room must have a walkable path');
for(const [from,to] of Object.entries(roomLinks))for(const room of to)assert(roomLinks[room].includes(from),'room link must work both ways');
function connects(from,to,standing){
  for(let z=.5;z<=3.28;z+=.04){
    if(Array.from({length:31},(_,n)=>from+(to-from)*n/30).every(x=>standing(x,z,.45)))return true;
  }
  return false;
}
const testCanStand=fault==='blocked-dining'?(x,z,r)=>x<6.36||x>6.44?canStand(x,z,r):false:canStand;
assert(connects(5.75,7, testCanStand),'living-to-dining route must clear 0.90 m');
assert(connects(9.83,11.05,canStand),'kitchen-to-dining route must clear 0.90 m');
assert.equal(rooms.hall[3]-rooms.hall[1],2.4000000000000004);
for(let distance=0;distance<vacuumLength;distance+=.05){
  const current=vacuumAt(distance/VACUUM_SPEED,0);
  assert(canStand(current.x,current.z,.19),'vacuum route obstructed at '+JSON.stringify(current));
}

assert.equal(spots.length,48);
assert.equal(new Set(spots.map(spot=>spot.id)).size,spots.length);
const regular=new Map(spots.map(spot=>[spot.id,0]));
const decoys=new Map(decoySpots.map(spot=>[spot.id,0]));
let lapCount=0,patriotCount=0,vacuumCount=0;
for(let seed=1;seed<=800;seed++){
  const game=new Run(options('?seed='+seed,false,0));
  let previous=null,other=null;
  assert(!game.spot.lap,'lap before first find');
  while(!game.won){
    const active=fault==='repeat-spot' && previous?previous:game.spot.id;
    assert.notEqual(active,previous,'Bobo spot repeated');
    assert.notEqual(game.decoySpot.id,other,'decoy spot repeated');
    if(game.spot.lap)lapCount++;
    if(game.patriot)patriotCount++;
    if(game.spot.moving)vacuumCount++;
    if(regular.has(active))regular.set(active,regular.get(active)+1);
    decoys.set(game.decoySpot.id,decoys.get(game.decoySpot.id)+1);
    previous=active;other=game.decoySpot.id;
    game.shout('bobo');
  }
}
function even(counts){
  const values=[...counts.values()];
  assert(Math.min(...values)>Math.max(...values)*.55,'spot coverage is too uneven');
}
even(regular);even(decoys);
assert(lapCount>120&&lapCount<205,'lap frequency outside expected 20% range');
assert(patriotCount>90&&patriotCount<169,'Patriot frequency outside expected range');
assert(vacuumCount>230&&vacuumCount<329,'Roomba ride frequency outside expected range');
const dry = new Run(capture);
for(let i=0;i<9;i++){
  assert(!dry.spot.moving&&!dry.spot.lap&&!dry.patriot);
  dry.shout('bobo');
}
if(!fault){
  for(const [name, message] of [['wrong-cat-reward','wrong cat must cost one point'],['blocked-dining','living-to-dining route'],['repeat-spot','Bobo spot repeated']]){
    const child=spawnSync(process.execPath,[import.meta.filename,name],{encoding:'utf8'});
    assert.equal(child.status,1,'planted fault unexpectedly passed: '+name);
    assert(child.stderr.includes(message),'planted fault failed for the wrong reason: '+name);
  }
  console.log('Gate passed: scoring, local records, room connectivity, walkways, Roomba clearance, spot-pool coverage and 3 planted faults.');
}
