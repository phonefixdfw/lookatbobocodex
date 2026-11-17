import * as T from 'three';
import { makeApartment } from './apartment.js';
import { catMaterials, makeCat, makeOwner, makeVacuum, headY } from './characters.js';
import { makeKart } from './kart.js';
import { DRAW_CAP, EYE, START, vacuumAt } from './layout.js';

const FOV=67;

export function makeScene(canvas, config) {
  const renderer=new T.WebGLRenderer({canvas,antialias:!config.low,alpha:false,powerPreference:config.low?'low-power':'default'});
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.16;
  const scene=new T.Scene();
  scene.background=new T.Color('#dfb79d');
  scene.fog=new T.Fog('#e9c5ab',20,57);
  const camera=new T.PerspectiveCamera(FOV,1,.027,65);
  const frustum=new T.Frustum();
  const vp=new T.Matrix4();
  const ray=new T.Raycaster();
  const forward=new T.Vector3();
  const target=new T.Vector3();
  const center=new T.Vector3();
  const view=new T.Vector3();
  const hemisphere=new T.HemisphereLight('#fff0d8','#cbb6a8',2.06);
  scene.add(hemisphere);
  const sun=new T.DirectionalLight('#ffdeaa',2.38);
  sun.position.set(3.5,3.9,-4.0);
  sun.target.position.set(2.8,0,3.4);
  scene.add(sun,sun.target);
  const fill=new T.DirectionalLight('#c6d5df',.91);
  fill.position.set(5,3,7);
  scene.add(fill);
  const {groups,city,materials}=makeApartment(scene,config.low);
  const bodyMaterials=catMaterials(config.low,materials.shadow);
  const owner=makeOwner(bodyMaterials,config.low);
  const vacuum=makeVacuum(bodyMaterials,config.low);
  const kart=makeKart();
  const castMeshes=Object.values(groups).flatMap(group=>group.children.filter(mesh=>mesh.userData.surface!=='shadow'));
  const bounds=Object.fromEntries(Object.entries(groups).map(([id,group])=>[id,new T.Box3().setFromObject(group)]));
  for(const group of [...Object.values(groups),city]){
    group.children.forEach(mesh=>{mesh.frustumCulled=config.cull;});
  }
  scene.add(owner,vacuum,kart.monitor);
  const cats=new Map();
  let bobo, decoy, modelSpot, modelDecoy, isPatriot, hero = false;
  let tvFrame=0,lastTV=-Infinity, overshoot=0;
  const player={...START,yaw:1.07,pitch:-.17};

  function getCat(pose, isDecoy=false, patriot=false){
    const key=JSON.stringify([pose,isDecoy,patriot]);
    if(!cats.has(key)){
      const cat=makeCat(bodyMaterials,config.low,isDecoy,pose,patriot);
      cats.set(key,cat);
      cat.visible=false;
      scene.add(cat);
    }
    return cats.get(key);
  }

  function apply(spot, other, patriot){
    if(bobo) bobo.visible=false;
    if(decoy) decoy.visible=false;
    modelSpot=spot;
    modelDecoy=other;
    isPatriot=patriot;
    bobo=getCat(spot.pose,false,patriot);
    bobo.visible=true;
    bobo.position.set(spot.x,spot.y,spot.z);
    decoy=other?getCat(other.pose,true):null;
    if(decoy){
      decoy.visible=true;
      decoy.position.set(other.x,other.y,other.z);
    }
    owner.visible=Boolean(spot.lap);
  }

  function heroView(){
    hero=true;
    const width=camera.aspect;
    camera.fov=width<.85?72:55;
    camera.position.set(3.20,1.24,2.85);
    camera.lookAt(1.80,.79,1.34);
    apply({x:2.23,y:.509,z:1.65,pose:'sit',room:'living'},null,false);
    vacuum.visible=false;
  }

  function reset(run){
    hero=false;
    Object.assign(player,START,{yaw:1.07,pitch:-.17});
    camera.fov=FOV;
    sync(run);
  }

  function respawn(run){
    const {x,z,yaw,pitch}=run.playerSpawn;
    Object.assign(player,{x,z,yaw,pitch});
    sync(run);
  }

  function sync(run){
    if(modelSpot!==run.spot || modelDecoy!==run.decoySpot || isPatriot!==run.patriot)apply(run.spot,run.decoySpot,run.patriot);
    vacuum.visible=config.roomba;
    if(config.roomba){
      const position=vacuumAt(run.elapsed,run.phase);
      vacuum.position.set(position.x,0,position.z);
      vacuum.rotation.y=position.yaw;
      if(run.spot.moving)bobo.position.set(position.x,run.spot.y+.009,position.z);
    }
  }

  function updatePose(time){
    if(!hero){
      camera.position.set(player.x,EYE,player.z);
      camera.rotation.set(player.pitch,player.yaw,0,'YXZ');
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    bobo?.userData.animate(time,camera.position.x,camera.position.z);
    decoy?.userData.animate(time,camera.position.x,camera.position.z);
    scene.updateMatrixWorld(true);
  }

  function prepareVisibility(){
    vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(vp);
    for(const [name,group] of Object.entries(groups)){
      // A far room can be visible through two doorways. Cull only batches outside the camera frustum.
      group.visible=!config.cull || frustum.intersectsBox(bounds[name]);
    }
    city.visible=!config.cull || frustum.intersectsObject(city.children[0]);
  }

  function clearTo(to,from=camera.position){
    forward.copy(to).sub(from);
    const distance=forward.length();
    ray.set(from,forward.normalize());
    ray.far=Math.max(0,distance-.005);
    return ray.intersectObjects(castMeshes,false).length===0;
  }

  function render(time){
    updatePose(time);
    prepareVisibility();
    const living=groups.living.visible;
    const monitor=kart.monitor;
    monitor.visible=living;
    if(living && camera.position.z<monitor.position.z && time >= lastTV+1/11 && frustum.intersectsObject(monitor) && clearTo(monitor.position)){
      lastTV=time; tvFrame++;
      kart.draw(time);
    }
    renderer.render(scene,camera);
    overshoot=Math.max(overshoot,renderer.info.render.calls-DRAW_CAP);
  }

  function resize(){
    const box=canvas.parentElement.getBoundingClientRect();
    const ratio=config.low?Math.min(devicePixelRatio,1):Math.min(devicePixelRatio,1.65);
    renderer.setPixelRatio(ratio);
    renderer.setSize(Math.max(1,Math.round(box.width)),Math.max(1,Math.round(box.height)),false);
    camera.aspect=Math.max(1,box.width)/Math.max(1,box.height);
    if(hero)heroView();
    camera.updateProjectionMatrix();
  }

  function meshes(cat) {
    const found=[];
    cat?.traverse(object=>{
      if(object.isMesh && object.userData.surface!=='shadow')found.push(object);
    });
    return found;
  }

  const hitRay=new T.Raycaster();
  function hit(origin=camera.position,direction=camera.getWorldDirection(view),max=7) {
    hitRay.set(origin,direction);
    hitRay.far=max;
    const cats=hitRay.intersectObjects([...meshes(bobo),...meshes(decoy)],false);
    if(!cats[0])return null;
    hitRay.far=cats[0].distance-.002;
    if(hitRay.intersectObjects(owner.visible?[...castMeshes,...owner.children]:castMeshes,false).length)return null;
    return cats[0].object.name;
  }

  function aim(x,y,z){
    const dx=x-player.x, dy=y-EYE, dz=z-player.z;
    player.yaw=Math.atan2(-dx,-dz);
    player.pitch=Math.atan2(dy,Math.hypot(dx,dz));
    updatePose(0);
  }

  function catTarget(which='bobo'){
    const cat=which==='decoy'?decoy:bobo;
    if(!cat)return null;
    const head=cat.children[0].children.find(child=>child.isGroup);
    center.copy(head.position).add(new T.Vector3(0,-.01,.102));
    return cat.localToWorld(center).clone();
  }

  function probe(which,x,z){
    const cat=which==='decoy'?decoy:bobo;
    if(!cat)return null;
    const from=new T.Vector3(x,EYE,z);
    cat.userData.animate(1,x,z);
    cat.updateMatrixWorld(true);
    const goal=catTarget(which);
    const ideal = target.set(x-cat.position.x,0,z-cat.position.z).normalize();
    const facing = forward.set(0,0,1).applyQuaternion(cat.quaternion).dot(ideal);
    const head=cat.children[0].children.find(child=>child.isGroup);
    const points=[];
    for(const yy of [-.055,0,.055])for(const xx of [-.065,0,.065]){
      points.push(head.localToWorld(new T.Vector3(xx,yy,.063)));
    }
    let visible=0;
    for(const p of points){
      if(hit(from,p.sub(from).normalize())===which)visible++;
    }
    const aimable=hit(from,goal.clone().sub(from).normalize())===which;
    return {visible:visible/points.length,aimable,facing,goal:goal.toArray()};
  }

  return {
    player,resize,render,reset,respawn,sync,heroView,hit,aim,probe,apply,updatePose,catTarget,
    unobstructed(x,y,z){return clearTo(target.set(x,y,z));},
    look(dx,dy,sensitivity=1){
      player.yaw-=dx*.0026*sensitivity;
      player.pitch=T.MathUtils.clamp(player.pitch-dy*.0026*sensitivity,-1.42,1.42);
    },
    get bobo(){return bobo;},
    get decoy(){return decoy;},
    get metrics(){return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,overshoot,tvFrame,
      visibleRooms:Object.entries(groups).filter(([,g])=>g.visible).map(([name])=>name)};},
    get hudPose(){return {x:player.x,z:player.z,yaw:player.yaw,pitch:player.pitch};},
    get catY(){return headY(modelSpot.pose);},
  };
}
