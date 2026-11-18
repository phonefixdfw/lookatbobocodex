import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium, devices } from 'playwright';
import { decoySpots, DRAW_CAP, EYE, spots, special, vacuumAt, vacuumLength, VACUUM_SPEED } from '../app/game/layout.js';
import { LEADERBOARD, BREEZE_WIN } from '../app/game/rules.js';
import { serve } from '../scripts/serve.mjs';
import { navigation } from './navigation.mjs';

const {server,url}=await serve();
const output=process.env.BOBO_ARTIFACTS??'artifacts';
const executable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=await chromium.launch({
  channel:process.env.PLAYWRIGHT_CHROME_CHANNEL??(existsSync(executable)?'chrome':undefined),
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'],
});
const errors=[];
const desktop={viewport:{width:1280,height:800},deviceScaleFactor:1,reducedMotion:'reduce'};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const exact='?gate=off&test=on&music=off&lap=2&patriot=on&stamp=on';
const nav=navigation();

async function pageFor(params,viewport=desktop) {
  const page=await browser.newPage(viewport);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
  await page.goto(url+params);
  await page.waitForFunction(()=>Boolean(window.boboTest),null,{timeout:12000});
  return page;
}
async function start(page){
  await page.getByRole('button',{name:'Play game'}).click();
  await page.waitForFunction(()=>boboTest.read().mode==='playing');
}
async function screenshot(page,name){
  return page.screenshot(name?{path:output+'/'+name+'.png'}:{});
}

function entry(spot,which) {
  return {spot,which,points:nav.witnesses(spot)};
}

async function findWitnesses(page,checks){
  return page.evaluate(({checks})=>{
    const results=[];
    for(const {spot,which,points} of checks){
      boboTest.spot(which==='bobo'?spot:{id:'unused',x:40,y:0,z:40,pose:'loaf'},
        which==='decoy'?spot:null,Boolean(spot.patriot));
      let best=0;
      let witness=null;
      for(const [x,z] of points){
        const result=boboTest.probe(which,x,z);
        best=Math.max(best,result.visible);
        if(result.visible>=.25 && result.aimable && result.facing>.99){
          witness=[x,z];
          break;
        }
      }
      results.push({id:spot.id,which,witness,best});
    }
    return results;
  },{checks});
}

async function approach(page,spot,which,live=false){
  const from=await page.evaluate(()=>boboTest.read().pose);
  let witness=(which==='bobo'?boboWitness:decoyWitness).get(spot.id);
  if(!witness || spot.moving || live){
    const actual=await page.evaluate(()=>boboTest.read().bobo);
    const target=which==='bobo'&&spot.moving?{x:actual[0],z:actual[2]}:spot;
    const attempts=[...(witness?[witness]:[]),...nav.witnesses(target)];
    witness=await page.evaluate(({which,attempts})=>{
      for(const [x,z] of attempts){
        const result=boboTest.probe(which,x,z);
        if(result.aimable && result.visible>=.25)return [x,z];
      }
      return null;
    },{which,attempts});
  }
  assert(witness,'No reachable aim witness for '+which+' at '+spot.id);
  const route=nav.route(from,{x:witness[0],z:witness[1]});
  return page.evaluate(({route,which})=>{
    for(const [x,z] of route){
      const {pose}=boboTest.read();
      const moved=boboTest.move(x-pose.x,z-pose.z);
      if(Math.hypot(moved.x-x,moved.z-z)>.05)return {error:'Movement did not reach '+x+','+z,pose:moved};
    }
    const pose=boboTest.read().pose;
    return {pose,hit:boboTest.aim(which),result:boboTest.shout()};
  },{route,which});
}

const boboWitness=new Map(),decoyWitness=new Map();
try {
  await mkdir(output,{recursive:true});
  const page=await pageFor(exact);
  const same=await pageFor(exact);
  const version=page.locator('#build-version');
  const build=await version.getAttribute('data-build');
  assert.match(build,/^[a-f0-9]{20}$/);
  assert.equal(await version.textContent(),'Build '+build.slice(0,8));
  assert.equal(await version.getAttribute('title'),build);
  assert(await version.isVisible());
  const modules=await page.evaluate(()=>performance.getEntriesByType('resource')
    .map(entry=>new URL(entry.name).pathname).filter(path=>path.endsWith('.js')));
  assert(modules.length>10 && modules.every(path=>path.startsWith('/release/'+build+'/')),
    'a fresh game must load its entire module graph under its own release path');
  const splash=digest(await screenshot(page,'splash'));
  assert.equal(splash,digest(await screenshot(same)),'splash frames must be byte-identical');
  await start(page);
  await start(same);
  const playing=digest(await screenshot(page,'desktop'));
  assert.equal(playing,digest(await screenshot(same)),'play frames must be byte-identical');
  const capture=await page.evaluate(()=>boboTest.read());
  assert.equal(capture.elapsed,0);
  assert(capture.metrics.calls>0&&capture.metrics.calls<=DRAW_CAP);
  assert(capture.metrics.visibleRooms.length<8,'culling failed');
  assert.match(await page.locator('#stamp').textContent(),/seed 11/);
  await same.close();
  console.log('Byte-identical splash '+splash.slice(0,16)+' and play '+playing.slice(0,16)+' captures.');

  const viewParams='?gate=off&test=on&roomba=off&patriot=off&lap=off';
  const viewSize={...desktop,viewport:{width:920,height:575}};
  const culled=await pageFor(viewParams,viewSize);
  const unculled=await pageFor(viewParams+'&cull=off',viewSize);
  await start(culled);
  await start(unculled);
  const views=[
    {label:'balcony',position:[4.78,-1.15],lookAt:[6.05,1.28,9.6]},
    {label:'balcony-threshold-outside',position:[4.78,-.14],lookAt:[6.05,1.28,9.6]},
    {label:'balcony-threshold-inside',position:[4.78,.13],lookAt:[6.05,1.28,9.6]},
    {label:'living-to-hall',position:[5.10,5.44],lookAt:[6.05,1.28,9.6]},
    {label:'hall-to-bedroom',position:[6.04,7.07],lookAt:[6.15,1.28,10.9]},
    {label:'hall-to-bath',position:[12.13,7.93],lookAt:[12.09,1.04,13.21]},
    {label:'bath-threshold',position:[12.13,8.94],lookAt:[11.55,1.06,13.14]},
    {label:'bath',position:[12.06,10.63],lookAt:[10.75,.98,13.15]},
    {label:'bath-vanity',position:[12.03,11.09],lookAt:[14.32,1.13,13.18]},
  ];
  for(const shot of views){
    const aim=view=>view.evaluate(({position,lookAt})=>{
      boboTest.pose(...position);
      boboTest.point(...lookAt);
      boboTest.render();
      return {rooms:boboTest.read().metrics.visibleRooms,clear:boboTest.unobstructed(...lookAt)};
    },shot);
    const [visible]=await Promise.all([aim(culled),aim(unculled)]);
    if(shot.label==='balcony')assert(visible.rooms.includes('bedroom'),'balcony view must keep the room behind the hall doorway');
    if(!['bath','bath-vanity'].includes(shot.label))assert(visible.clear,'doorway should be open in '+shot.label);
    const captureNames=['balcony','bath','bath-vanity'];
    const [rendered,reference]=await Promise.all([
      screenshot(culled,captureNames.includes(shot.label)?shot.label:undefined),
      screenshot(unculled),
    ]);
    assert.equal(digest(rendered),digest(reference),'culling changed visible geometry at '+shot.label);
  }
  const sampledFrames=await culled.evaluate(()=>{
    const sightline=[6.23,1.20,12.80];
    boboTest.pose(6.25,6.10);
    const sampled=[];
    for(let step=0;step<=12;step++){
      boboTest.point(...sightline);
      boboTest.render();
      const {pose,metrics}=boboTest.read();
      sampled.push({z:pose.z,bedroom:metrics.visibleRooms.includes('bedroom'),clear:boboTest.unobstructed(...sightline)});
      boboTest.move(0,.04);
    }
    return sampled;
  });
  assert(sampledFrames[0].z<6.4&&sampledFrames.at(-1).z>6.4,'approach must cross the living room–hall boundary');
  assert(sampledFrames.every(frame=>frame.bedroom&&frame.clear),
    'the bedroom doorway must remain visible while walking from the living room into the hall');
  await culled.close();
  await unculled.close();
  console.log('Culling matches the unculled scene from nine real views, including the balcony-to-hall sightline.');

  // Geometry is checked by aiming real rendered cat meshes from collision-reachable coordinates.
  const movingChecks=Array.from({length:24},(_,i)=>{
    const {x,z}=vacuumAt(vacuumLength*i/(24*VACUUM_SPEED),0);
    return entry({...special.vacuum,id:'vacuum-'+i,x,z},'bobo');
  });
  const checks=[...spots.map(spot=>entry(spot,'bobo')),entry(special.lap,'bobo'),...movingChecks,
    ...decoySpots.map(spot=>entry(spot,'decoy')),entry({...spots[0],id:'patriot-heat-pad',patriot:true},'bobo')];
  const witnesses=await findWitnesses(page,checks);
  assert.deepEqual(witnesses.filter(item=>!item.witness),[],'missing reachable, visible, player-facing hit targets');
  for(const {id,which,witness} of witnesses)(which==='bobo'?boboWitness:decoyWitness).set(id,witness);

  // A planted target behind the apartment shell must be rejected by the same witness check.
  const planted=await findWitnesses(page,[{spot:{...special.lap,lap:false,id:'sealed-cat',x:18,z:11},which:'bobo',points:[[14.1,11.9]]}]);
  assert.equal(planted[0].witness,null);
  console.log('Reachability and ray tests passed for '+checks.length+' staged cases, plus a planted occlusion fault.');

  await page.evaluate(()=>{
    boboTest.spot({id:'patriot-heat-pad',x:2.23,y:.509,z:1.65,pose:'sit'},null,true);
    boboTest.pose(2.60,2.65);
    boboTest.point(2.23,.83,1.65);
    boboTest.render();
  });
  assert.deepEqual(await page.evaluate(()=>boboTest.costume()),
    ['American flag','American flag','Bald eagle and flagpoles']);
  await screenshot(page,'patriot-bobo');

  await page.reload();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await start(page);
  await page.keyboard.press('KeyP');
  await page.getByRole('heading',{name:'Paused'}).waitFor();
  const paused=await page.evaluate(()=>boboTest.read().time);
  await page.evaluate(()=>boboTest.tick(6));
  assert.equal(await page.evaluate(()=>boboTest.read().time),paused);
  await page.getByRole('button',{name:'Settings'}).click();
  await page.getByRole('heading',{name:'Settings'}).waitFor();
  await page.getByRole('button',{name:'Back'}).click();
  await page.getByRole('button',{name:'Resume'}).click();
  await page.keyboard.press('KeyO');
  await page.getByRole('heading',{name:'Settings'}).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('heading',{name:'Paused'}).waitFor();
  await page.getByRole('button',{name:'Resume'}).click();
  await page.mouse.move(580,370);
  const beforeAim=await page.evaluate(()=>boboTest.read().pose.yaw);
  await page.mouse.move(650,390);
  assert.notEqual(await page.evaluate(()=>boboTest.read().pose.yaw),beforeAim,'desktop aim must work without clicking');
  await page.evaluate(()=>boboTest.point(14,2,9));
  await page.mouse.click(650,390);
  assert((await page.evaluate(()=>boboTest.read().audio.events)).includes('shout'),'left click must shout');
  await page.evaluate(()=>boboTest.tick(.5));
  const target=await page.evaluate(()=>boboTest.read().decoy);
  const first=await approach(page,target,'decoy',true);
  assert.equal(first.result,'dag',JSON.stringify(first));
  const dag=await page.evaluate(()=>boboTest.read());
  assert.equal(dag.score,-1);
  assert.equal(dag.pose.x,first.pose.x,'wrong cat should leave the player in place');
  assert.equal(dag.pose.z,first.pose.z);
  assert.equal(await page.evaluate(()=>boboTest.read().time),5.5);
  const visit=[];
  for(let i=0;i<13;i++){
    await page.evaluate(()=>boboTest.tick(.6));
    const current=await page.evaluate(()=>boboTest.read());
    visit.push(current.spot.id);
    const step=await approach(page,current.spot,'bobo',true);
    assert.equal(step.hit,'bobo',JSON.stringify({current,step}));
    assert(['found','patriot','win'].includes(step.result),JSON.stringify(step));
    if(step.result==='win')break;
    const moved=await page.evaluate(()=>boboTest.read());
    if(current.patriot){
      assert.equal(step.result,'patriot');
      assert.equal(moved.score-current.score,3);
      assert(moved.audio.events.includes('effect:patriot'));
      assert.equal(await page.locator('#fireworks').getAttribute('data-effect'),'patriot');
      assert.match(await page.locator('#status').textContent(),/MAGA Bobo.*\+3/);
      assert(await page.locator('#fireworks').evaluate(async canvas=>{
        const frame=canvas.toDataURL();
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        return frame===canvas.toDataURL();
      }),'Patriot fireworks should freeze for deterministic captures');
    }
    assert.deepEqual([moved.pose.x,moved.pose.z],[moved.spawn.x,moved.spawn.z],'scoring should relocate the player to their new spawn');
    assert(Math.hypot(moved.pose.x-step.pose.x,moved.pose.z-step.pose.z)>=1.65,'scoring should move the player away from the find');
  }
  assert.equal(visit[1],special.lap.id);
  assert.notEqual(visit[0],special.lap.id);
  await page.getByRole('heading',{name:BREEZE_WIN,exact:true}).waitFor();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),LEADERBOARD),null);
  await screenshot(page,'win');
  console.log('Scripted bot reached ten points via collision movement, including a wrong-cat penalty and a Patriot lap find.');

  const bonusWin=await pageFor('?test=on&clock=manual&seed=32&roomba=off&lap=off&music=off',
    {...desktop,reducedMotion:'no-preference'});
  await start(bonusWin);
  await bonusWin.waitForFunction(()=>boboTest.read().audio.loaded.includes('win'));
  for(let n=0;n<8;n++){
    await bonusWin.evaluate(()=>boboTest.tick(.65));
    const before=await bonusWin.evaluate(()=>boboTest.read());
    assert.equal(before.patriot,n===7,'the natural seed should schedule a Patriot winning find');
    const result=await approach(bonusWin,before.spot,'bobo',true);
    assert.equal(result.result,n===7?'win':'found',JSON.stringify(result));
    if(n===7){
      const after=await bonusWin.evaluate(()=>boboTest.read());
      assert.equal(after.score-before.score,3);
      assert(after.audio.events.includes('effect:patriot')&&after.audio.events.includes('win'));
      assert.equal(await bonusWin.locator('#fireworks').getAttribute('data-effect'),'patriot');
    }
  }
  await bonusWin.getByRole('heading',{name:BREEZE_WIN,exact:true}).waitFor();
  await bonusWin.getByText('MAGA Bobo · +3 points').waitFor();
  await screenshot(bonusWin,'patriot-win');
  await bonusWin.close();
  console.log('Natural Patriot final find adds three, fires the larger celebration, and plays the packaged win line.');

  const riding=await pageFor('?test=on&clock=manual&seed=2&lap=off&patriot=off&quality=low');
  await start(riding);
  let caughtRide=false;
  for(let n=0;n<10;n++){
    await riding.evaluate(()=>boboTest.tick(.65));
    const active=await riding.evaluate(()=>boboTest.read());
    if(active.spot.moving){
      await riding.evaluate(()=>boboTest.tick(2));
      const second=await riding.evaluate(()=>boboTest.read());
      assert(Math.hypot(second.bobo[0]-active.bobo[0],second.bobo[2]-active.bobo[2])>.19,'Roomba mount must travel');
      caughtRide=true;
    }
    const outcome=await approach(riding,active.spot,'bobo',true);
    assert.equal(outcome.hit,'bobo',JSON.stringify({active,outcome}));
    assert.equal(outcome.result,n===9?'win':'found');
  }
  assert(caughtRide,'moving-target bot did not encounter a Roomba ride');
  await riding.getByRole('heading',{name:BREEZE_WIN,exact:true}).waitFor();
  assert.equal(await riding.evaluate(key=>localStorage.getItem(key),LEADERBOARD),null);
  await riding.close();
  console.log('Second seeded bot won after tracking an actual moving Roomba ride.');

  const low=await pageFor('?gate=off&test=on&quality=low&cull=off&roomba=off&patriot=off&lap=off');
  await start(low);
  const all=await low.evaluate(()=>boboTest.read());
  assert.equal(all.metrics.visibleRooms.length,8);
  assert(all.metrics.calls<=DRAW_CAP && all.metrics.calls>=capture.metrics.calls);
  await low.evaluate(()=>{
    boboTest.pose(2.10,3.95,Math.PI,0);
    boboTest.point(1.9,.885,5.922);
    for(let i=0;i<10;i++)boboTest.tick(.10);
  });
  const seen=await low.evaluate(()=>boboTest.read().metrics.tvFrame);
  assert(seen>=10&&seen<=13,'TV should draw approximately 11 fps while visible: '+seen);
  await low.evaluate(()=>{
    boboTest.point(2.24,1.0,1.5);
    for(let i=0;i<10;i++)boboTest.tick(.1);
  });
  assert.equal(await low.evaluate(()=>boboTest.read().metrics.tvFrame),seen,'TV should stop when out of view');
  await low.close();

  const mobile=await pageFor('?test=on&quality=low&touch=on&music=off',devices['iPhone 13']);
  await screenshot(mobile,'mobile-splash');
  await mobile.setViewportSize({width:320,height:650});
  assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'splash overflows a compact phone');
  await mobile.setViewportSize({width:390,height:664});
  await start(mobile);
  await screenshot(mobile,'mobile-play');
  const layout=await mobile.evaluate(()=>{
    const ids=['score-card','run-tools','stick','shout','reticle'].map(name=>document.querySelector('.'+name).getBoundingClientRect().toJSON());
    return {width:innerWidth,height:innerHeight,ids};
  });
  for(const bounds of layout.ids){
    assert(bounds.width>=24&&bounds.height>=24);
    assert(bounds.x>=0&&bounds.right<=layout.width&&bounds.y>=0&&bounds.bottom<=layout.height);
  }
  const touch=await mobile.context().newCDPSession(mobile);
  const startTouch=({x,y})=>touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  const moveTouch=({x,y})=>touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
  const endTouch=()=>touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const beforeMove=await mobile.evaluate(()=>boboTest.read().pose);
  const joystick=layout.ids[2];
  await startTouch({x:joystick.x+joystick.width/2,y:joystick.y+joystick.height/2});
  await moveTouch({x:joystick.x+joystick.width*.8,y:joystick.y+joystick.height*.5});
  await mobile.waitForFunction(start=>Math.hypot(boboTest.read().pose.x-start.x,boboTest.read().pose.z-start.z)>.09,beforeMove);
  await endTouch();
  await startTouch({x:299,y:347});
  await moveTouch({x:231,y:336});
  await endTouch();
  assert.notEqual(await mobile.evaluate(()=>boboTest.read().pose.yaw),beforeMove.yaw);
  const shoutControl=layout.ids[3];
  await startTouch({x:shoutControl.x+shoutControl.width/2,y:shoutControl.y+shoutControl.height/2});
  await mobile.waitForFunction(()=>boboTest.read().audio.events.includes('shout'),null,{timeout:4500});
  await endTouch();
  assert.equal(await mobile.evaluate(()=>boboTest.read().audio.notes),0);
  await mobile.setViewportSize({width:844,height:390});
  await screenshot(mobile,'mobile-landscape');
  assert(await mobile.locator('#shout').isVisible());
  const tablet=await pageFor('?gate=off&test=on&touch=on&quality=low',devices['iPad (gen 7)']);
  await start(tablet);
  await screenshot(tablet,'tablet');
  assert(await tablet.locator('#stick').isVisible());
  await tablet.close();
  await mobile.close();
  console.log('Phone portrait and landscape, tablet, touch joystick, drag aiming and touch shout passed.');

  const audio=await pageFor('?test=on&seed=11&quality=low&lap=off&patriot=off');
  await start(audio);
  await audio.waitForFunction(()=>boboTest.read().audio.loaded.length===3&&boboTest.read().audio.notes>0,null,{timeout:7000});
  const audioTarget=await audio.evaluate(()=>boboTest.read().decoy);
  assert.equal((await approach(audio,audioTarget,'decoy',true)).result,'dag');
  const spoken=await audio.evaluate(()=>boboTest.read().audio.events);
  assert(spoken.includes('midi')&&spoken.includes('shout')&&spoken.includes('dag')&&spoken.includes('effect:dag'));
  await audio.keyboard.press('KeyP');
  const audioNotes=await audio.evaluate(()=>boboTest.read().audio.notes);
  await new Promise(resolve=>setTimeout(resolve,330));
  assert.equal(await audio.evaluate(()=>boboTest.read().audio.notes),audioNotes);
  await audio.close();
  console.log('Three recorded lines decoded; bardcore sequencing, shout, DAG! and pause audio checks passed.');

  const subsite=await serve({basePath:'/lookatbobocodex/'});
  try{
    const offline=await browser.newPage(desktop);
    const path=subsite.url+'?test=on&quality=low';
    await offline.goto(path);
    await offline.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:12000});
    const cached=await offline.evaluate(async()=>{
      const registration=await navigator.serviceWorker.ready;
      return {scope:registration.scope,script:registration.active.scriptURL,files:await caches.keys()};
    });
    assert.equal(cached.scope,subsite.url);
    assert.equal(new URL(cached.script).searchParams.get('v'),build,'worker request must bypass an older CDN entry');
    assert(cached.files.some(name=>name.startsWith('look-at-bobo:/lookatbobocodex/:')));
    await offline.context().setOffline(true);
    await offline.goto(path);
    await offline.waitForFunction(()=>Boolean(window.boboTest));
    await start(offline);
    assert((await offline.evaluate(()=>boboTest.read().metrics.calls))>0);
    await offline.close();
  } finally {
    await new Promise(done=>subsite.server.close(done));
  }
  console.log('Versioned service worker installed and booted a playable game offline under the GitHub Pages project path.');

  const stress=await pageFor('?gate=off&test=on&quality=low&lap=off');
  await start(stress);
  await stress.evaluate(()=>{
    for(let i=0;i<100;i++){
      boboTest.pose(2.5+(i%9)*.5,4+(i%4)*.5,i*Math.PI/11,Math.sin(i)*.54);
      boboTest.tick(.18);
    }
  });
  const metrics=await stress.evaluate(()=>boboTest.read().metrics);
  assert.equal(metrics.overshoot,0);
  assert(metrics.calls>0&&metrics.calls<=DRAW_CAP);
  await stress.close();
  assert.deepEqual(errors,[]);
  console.log('Browser stress passed for 100 rendered frames under '+DRAW_CAP+' calls. No browser or network errors.');
} finally {
  await browser.close();
  await new Promise(done=>server.close(done));
}
