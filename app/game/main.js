import { DRAW_CAP, WALK_SPEED, movePlayer } from './layout.js';
import { BREEZE_WIN, GOAL, Run, options, formatTime, readTimes, saveTime } from './rules.js';
import { makeScene } from './scene.js';
import { makeAudio } from './audio.js';
import { makeCelebration } from './celebration.js';

const el=id=>document.getElementById(id);
const shell=el('shell'), game=el('game'), stage=el('stage'), canvas=el('world');
const release=new URL(import.meta.url).pathname.match(/\/release\/([a-f0-9]{20})\/game\/main\.js$/)?.[1];
if(release){
  const version=el('build-version');
  if(version){
    version.textContent='Build '+release.slice(0,8);
    version.title=release;
    version.hidden=false;
  }
}
const panel=el('panel'), body=el('panel-body'), status=el('status'), reticle=el('reticle');
const coarse=matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints>1;
const query=options(location.search,coarse,crypto.getRandomValues(new Uint32Array(1))[0]);
const manualClock=query.capture || (query.test && new URLSearchParams(location.search).get('clock')==='manual');
const seedOverride=new URLSearchParams(location.search).has('seed') || query.capture || query.test;
const prefs={volume:.65,voice:true,music:query.music,sensitivity:1};
const audio=makeAudio(prefs.music,query.capture);
const celebration=makeCelebration(el('fireworks'));
const keys=new Set();
const stick={x:0,y:0,id:null};
let drag=null, run=null, scene, mode='home', panelKind='', sound=true, lastFrame=0, lastHero=0;
let lastShout=-Infinity, statusSince=-Infinity, activeAt=0, wasLocked=false;
let missedWebGL=false;

for(let n=0;n<GOAL;n++)el('ticks').append(document.createElement('i'));
el('touch-controls').hidden=!query.touch;
el('desktop-hint').hidden=query.touch;
if(query.touch)el('controls-copy').textContent='Joystick to move · Drag to aim · Tap to shout';

function drawHome(){
  if(!scene)return;
  scene.resize();
  scene.heroView();
  scene.render(0);
}

try{
  scene=makeScene(canvas,query);
  drawHome();
}catch(error){
  console.error(error);
  el('error').hidden=false;
  el('play').disabled=true;
  missedWebGL=true;
}

function updateAudio(){
  audio.settings({ ...prefs, volume:sound?prefs.volume:0, active:mode==='playing' });
}

function button(text,action,primary=false){
  const node=document.createElement('button');
  node.type='button'; node.className=primary?'primary':'outline'; node.textContent=text;
  node.addEventListener('click',action);
  return node;
}
function paragraph(text){
  const p=document.createElement('p');
  p.textContent=text;
  return p;
}
function actions(...buttons){
  const wrapper=document.createElement('div');
  wrapper.className='actions';wrapper.append(...buttons);
  return wrapper;
}
function openPanel(kind,title){
  panelKind=kind;
  el('panel-title').textContent=title;
  body.replaceChildren();
  if(!panel.open)panel.showModal();
}
function dismiss(){
  if(panel.open)panel.close();
  panelKind='';
}
function goHome(){
  celebration.clear();
  dismiss();
  mode='home';
  game.hidden=true;
  shell.hidden=false;
  el('picture').prepend(stage);
  updateAudio();
  drawHome();
  el('play').focus();
}

function lockPointer(){
  if(query.touch || query.test || query.capture || document.pointerLockElement || !canvas.requestPointerLock)return;
  try{canvas.requestPointerLock()?.catch(()=>{});}catch{/* drag to look works without lock */}
}
function unlockPointer(){
  if(document.pointerLockElement)document.exitPointerLock();
}
function clearInput(){
  keys.clear();drag=null;
  stick.id=null;stick.x=0;stick.y=0;
  el('stick-thumb').style.transform='';
}

function start(){
  if(missedWebGL)return;
  celebration.clear();
  const actual=seedOverride?query.seed:crypto.getRandomValues(new Uint32Array(1))[0];
  run=new Run({...query,seed:actual});
  mode='playing';
  dismiss();
  clearInput();
  lastShout=-Infinity;
  statusSince=-Infinity;
  status.textContent='';
  status.className='status';
  shell.hidden=true;
  game.hidden=false;
  el('desktop-hint').hidden=query.touch;
  el('touch-hint').hidden=!query.touch;
  el('world-slot').append(stage);
  scene.reset(run);
  scene.resize();
  scene.render(0);
  if(query.stamp){el('stamp').hidden=false;el('desktop-hint').style.bottom='42px';}
  updateHud();
  lastFrame=performance.now();
  activeAt=lastFrame;
  audio.unlock();
  updateAudio();
  lockPointer();
}

function advanceClock(now){
  if(mode!=='playing' || manualClock)return;
  const dt=Math.max(0,(now-lastFrame)/1000);
  lastFrame=now;
  run.tick(dt);
}

function pause(kind='pause'){
  if(mode!=='playing')return;
  celebration.clear();
  advanceClock(performance.now());
  mode='paused';
  clearInput();
  unlockPointer();
  updateAudio();
  if(kind==='settings')showSettings();
  else showPause();
}
function showPause(){
  openPanel('pause','Paused');
  body.append(paragraph('Bobo can wait.'),actions(
    button('Resume',resume,true),button('Settings',showSettings),button('Main menu',goHome),
  ));
}
function resume(){
  if(mode!=='paused')return;
  dismiss();mode='playing';
  lastFrame=performance.now();activeAt=lastFrame;
  audio.unlock();updateAudio();lockPointer();
}

function field(text,type,value,change,limits={}){
  const label=document.createElement('label');
  const name=document.createElement('span');
  const input=document.createElement('input');
  label.className='setting';name.textContent=text;input.type=type;
  Object.assign(input,limits);
  if(type==='checkbox')input.checked=value;
  else input.value=value;
  input.addEventListener('input',()=>change(type==='checkbox'?input.checked:Number(input.value)));
  label.append(name,input);
  return label;
}
function showSettings(){
  openPanel('settings','Settings');
  body.append(
    field('Volume','range',prefs.volume,value=>{prefs.volume=value;updateAudio();},{min:0,max:1,step:.05}),
    field('Bardcore music','checkbox',prefs.music,value=>{prefs.music=value;updateAudio();},{disabled:!query.music}),
    field('Voice lines','checkbox',prefs.voice,value=>{prefs.voice=value;updateAudio();}),
    field('Look sensitivity','range',prefs.sensitivity,value=>{prefs.sensitivity=value;},{min:.35,max:2,step:.05}),
    paragraph(query.touch?'Use the joystick to move and drag anywhere in the apartment to aim.':'Use WASD or arrow keys to move. Move the mouse to aim. Left-click or press Space to shout.'),
    actions(button('Back',mode==='paused'?showPause:dismiss,true)),
  );
}
function showScores(){
  openPanel('scores','Best times');
  const saved=readTimes(localStorage);
  if(saved.length){
    const list=document.createElement('ol');list.className='records';
    for(const entry of saved){
      const item=document.createElement('li'), details=document.createElement('span');
      item.textContent=formatTime(entry.time,true);
      details.textContent=(entry.dags??0)+' DAG!';
      item.append(details);list.append(item);
    }
    body.append(list);
  }else body.append(paragraph('Finish a run to set your first time.'));
  body.append(paragraph('Times are saved on this browser. Each DAG! adds five seconds.'),actions(button('Done',dismiss,true)));
}
function showInstall(){
  openPanel('install','Install the game');
  body.append(
    paragraph('On iPhone or iPad, open this page in Safari, tap Share, then choose Add to Home Screen. Open the new icon to play in an app window.'),
    paragraph('On Android or desktop, look for Install or Add to Home screen in your browser menu.'),
    actions(button('Done',dismiss,true)),
  );
}
function closeMenu(){
  if(panelKind==='pause')resume();
  else if(panelKind==='settings'&&mode==='paused')showPause();
  else if(panelKind==='win')goHome();
  else dismiss();
}

function updateHud(){
  if(!run)return;
  const score=el('points');
  score.firstChild.textContent=Math.min(run.score,GOAL)+' ';
  [...el('ticks').children].forEach((tick,i)=>tick.classList.toggle('active',i<run.score));
  el('timer').textContent=formatTime(run.time);
  if(query.stamp){
    el('stamp').textContent='seed '+run.config.seed+' · '+scene.metrics.calls+'/'+DRAW_CAP+' draws · '+run.spot.id;
  }
}
function notice(message,tone=''){
  statusSince=run.elapsed;
  status.className='status show '+tone;
  status.textContent=message;
}
function win(patriot){
  mode='won';
  clearInput();unlockPointer();updateAudio();
  if(!query.capture && !query.test)saveTime(localStorage,run);
  openPanel('win',BREEZE_WIN);
  if(patriot){
    const award=paragraph('MAGA Bobo · +3 points');
    award.className='patriot-award';
    body.append(award);
  }
  body.append(paragraph('Bobo points '+GOAL+' / '+GOAL+' · '+formatTime(run.time,true)+' · '+run.dags+' DAG!'),
    actions(button('Play again',start,true),button('Best times',showScores),button('Main menu',goHome)));
}
function shout(){
  if(mode!=='playing')return 'inactive';
  advanceClock(performance.now());
  scene.updatePose(run.elapsed);
  if(run.elapsed-lastShout<.43)return 'cooldown';
  lastShout=run.elapsed;
  const result=run.shout(scene.hit(),scene.player);
  audio.speak('shout');
  if(query.touch){
    const control=el('shout');
    control.classList.add('pressed');
    setTimeout(()=>control.classList.remove('pressed'),140);
  }
  if(result==='miss')notice('No cat in sight');
  else if(result==='dag'){
    audio.speak('dag');audio.reward('dag');
    notice('DAG! −1 point · +5 seconds','wrong');
  }else {
    const patriot=result==='patriot' || (result==='win' && run.patriot);
    audio.reward(patriot?'patriot':result);
    celebration.play(patriot?'patriot':'found');
    notice(patriot?'MAGA Bobo! +3 points':'Bobo! +1',patriot?'prize':'');
    if(result==='win'){
      audio.speak('win');
      win(patriot);
    }else{
      scene.respawn(run);
      scene.render(run.elapsed);
    }
  }
  updateHud();
  return result;
}

function walk(dt){
  const horizontal=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+stick.x;
  const depth=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))+stick.y;
  const strength=Math.max(1,Math.hypot(horizontal,depth));
  const {yaw}=scene.player;
  const distance=WALK_SPEED*dt/strength;
  if(horizontal || depth){
    movePlayer(scene.player,(Math.cos(yaw)*horizontal+Math.sin(yaw)*depth)*distance,
      (-Math.sin(yaw)*horizontal+Math.cos(yaw)*depth)*distance);
  }
}
let lastAim=0;
function playFrame(now,dt){
  walk(dt);
  scene.sync(run);
  scene.render(run.elapsed);
  if(now-lastAim>85){
    lastAim=now;
    reticle.classList.toggle('aim',Boolean(scene.hit()));
  }
  if(now-activeAt>4500){
    el('desktop-hint').hidden=true;
    el('touch-hint').hidden=true;
  }
  if(run.elapsed-statusSince>(status.classList.contains('prize')?2.1:1.45))status.className='status';
  updateHud();
}
function frame(now){
  if(mode==='playing' && !manualClock){
    const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000));
    advanceClock(now);
    playFrame(now,dt);
  }else if(mode==='home'&&!query.capture&&!document.hidden&&now-lastHero>=66){
    lastHero=now;scene.render(now/1000);
  }
  requestAnimationFrame(frame);
}
if(scene)requestAnimationFrame(frame);

if('serviceWorker' in navigator && !query.capture){
  // Register only after the page has loaded, so precaching cannot delay the first frame.
  window.addEventListener('load',()=>{
    const worker=new URL('sw.js',document.baseURI);
    if(release)worker.searchParams.set('v',release);
    navigator.serviceWorker.register(worker,{updateViaCache:'none'}).catch(()=>{});
  },{once:true});
}

el('play').addEventListener('click',start);
el('scores').addEventListener('click',showScores);
el('install').addEventListener('click',showInstall);
el('close-panel').addEventListener('click',closeMenu);
el('home-sound').addEventListener('click',()=>{
  sound=!sound;
  el('home-sound').setAttribute('aria-pressed',String(sound));
  el('sound-label').textContent=sound?'Sound on':'Sound off';
  updateAudio();
});
el('pause').addEventListener('click',()=>pause());
el('shout').addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  event.preventDefault();
  shout();
});
el('shout').addEventListener('click',event=>{
  if(event.detail===0)shout(); // Keyboard and assistive technology activation.
});
panel.addEventListener('cancel',event=>{event.preventDefault();closeMenu();});

const movement=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
window.addEventListener('keydown',event=>{
  const {code}=event;
  if(mode==='playing'){
    if(movement.has(code)){event.preventDefault();keys.add(code);}
    else if(!event.repeat && code==='Space' && event.target?.id!=='pause'){event.preventDefault();shout();}
    else if(!event.repeat && (code==='Escape'||code==='KeyP')){event.preventDefault();pause();}
    else if(!event.repeat && code==='KeyO'){event.preventDefault();pause('settings');}
  }else if(mode==='paused' && !event.repeat){
    if(code==='KeyP'){event.preventDefault();resume();}
    else if(code==='KeyO'){event.preventDefault();showSettings();}
  }else if(mode==='home'&&!panel.open&&!event.repeat&&code==='KeyO'){event.preventDefault();showSettings();}
});
window.addEventListener('keyup',event=>keys.delete(event.code));
window.addEventListener('blur',()=>{if(mode==='playing'&&!query.test)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing'&&!query.test)pause();});
document.addEventListener('pointerlockchange',()=>{
  const locked=document.pointerLockElement===canvas;
  if(wasLocked && !locked && mode==='playing')pause();
  wasLocked=locked;
});
document.addEventListener('mousemove',event=>{
  if(mode!=='playing' || query.touch || event.sourceCapabilities?.firesTouchEvents)return;
  if(document.pointerLockElement===canvas || event.target===canvas){
    scene.look(event.movementX,event.movementY,prefs.sensitivity);
  }
});
window.addEventListener('resize',()=>{
  if(!scene)return;
  scene.resize();scene.render(mode==='home'?0:run.elapsed);
});

canvas.addEventListener('pointerdown',event=>{
  if(mode!=='playing'||!query.touch||event.button!==0||drag)return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY};
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove',event=>{
  if(mode!=='playing'||drag?.id!==event.pointerId)return;
  scene.look(event.clientX-drag.x,event.clientY-drag.y,prefs.sensitivity*2.15);
  drag.x=event.clientX;drag.y=event.clientY;
});
for(const type of ['pointerup','pointercancel','lostpointercapture']){
  canvas.addEventListener(type,event=>{
    if(drag?.id===event.pointerId){
      drag=null;
    }
  });
}
canvas.addEventListener('click',event=>{
  if(query.touch || mode!=='playing' || event.button!==0)return;
  shout();
  lockPointer();
});
function steer(event){
  const bounds=el('stick').getBoundingClientRect();
  const dx=event.clientX-bounds.x-bounds.width/2,dy=event.clientY-bounds.y-bounds.height/2;
  const limit=bounds.width*.30;
  const scale=Math.max(limit,Math.hypot(dx,dy));
  stick.x=dx/scale; stick.y=dy/scale;
  el('stick-thumb').style.transform='translate('+stick.x*limit+'px,'+stick.y*limit+'px)';
}
el('stick').addEventListener('pointerdown',event=>{
  if(stick.id!==null || mode!=='playing')return;
  el('stick').setPointerCapture(event.pointerId);
  stick.id=event.pointerId;steer(event);
});
el('stick').addEventListener('pointermove',event=>{if(stick.id===event.pointerId)steer(event);});
for(const type of ['pointerup','pointercancel','lostpointercapture']){
  el('stick').addEventListener(type,event=>{
    if(stick.id!==event.pointerId)return;
    stick.id=null;stick.x=0;stick.y=0;
    el('stick-thumb').style.transform='';
  });
}

// Test controls never exist in normal runs and test modes bypass the leaderboard.
if(query.test && scene){
  window.boboTest={
    config:query,start,shout,pause,resume,
    costume:()=>scene.bobo?.getObjectByName('Patriot Bobo accessories')?.children.map(object=>object.name)??[],
    read:()=>({mode,spot:run?.spot,decoy:run?.decoySpot,patriot:run?.patriot,score:run?.score,dags:run?.dags,time:run?.time,
      elapsed:run?.elapsed,phase:run?.phase,found:run?.found,spawn:run?.playerSpawn,pose:scene.hudPose,metrics:scene.metrics,audio:audio.status(),
      bobo:scene.bobo?.position.toArray(), hit:scene.hit()}),
    tick(seconds){if(mode==='playing'){run.tick(seconds);scene.sync(run);scene.render(run.elapsed);}},
    pose(x,z,yaw=0,pitch=0){Object.assign(scene.player,{x,z,yaw,pitch});scene.updatePose(run.elapsed);},
    move(dx,dz){movePlayer(scene.player,dx,dz);scene.updatePose(run.elapsed);return scene.hudPose;},
    spot(spot,decoy=null,patriot=false){scene.apply(spot,decoy,patriot);scene.updatePose(1);},
    probe(which,x,z){return scene.probe(which,x,z);},
    aim(which){const target=scene.catTarget(which);scene.aim(...target);return scene.hit();},
    point(x,y,z){scene.aim(x,y,z);},
    render(){scene.render(run?.elapsed??0);},
    unobstructed(...target){return scene.unobstructed(...target);},
  };
}
