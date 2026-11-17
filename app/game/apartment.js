import * as T from 'three';
import { Batch, canvas, texture } from './geometry.js';
import { apartmentAtlas, tile } from './atlases.js';
import { furniture, rooms, walls } from './layout.js';
import { random } from './rules.js';

const ink = '#2e2726';
const walnut = '#865939';
const cream = '#f5e8d6';
const bone = '#ddd0b9';
const olive = '#687966';
const coral = '#976650';
const plaster = '#f3e2cb';
const surface = (name, extra={}) => ({key:'atlas',uv:tile[name],...extra});
const leg = (b,x,z,top,thickness=.048, tint=walnut) => b.box(x,top/2,z,thickness,top,thickness,tint);
const fourLegs = (b,x,z,w,d,h,tint) => {
  for(const dx of [-1,1])for(const dz of [-1,1])leg(b,x+dx*w*.37,z+dz*d*.36,h,.046,tint);
};

function windowFrame(b,x,y,z,w,h,clear=false) {
  if(!clear)b.box(x,y,z,w,h,.045,'#afc5be',surface('glass'));
  for(const side of [-1,1]){
    b.box(x+side*w/2,y,z+.025,.044,h+.05,.07,walnut);
    b.box(x,y+side*h/2,z+.025,w+.05,.044,.07,walnut);
  }
  b.box(x,y,z+.028,.027,h,.07,walnut);
  b.box(x,y+.13,z+.03,w,.025,.072,walnut);
}

function plant(b,x,z,w,d,h,low=false,y=0, seed=42) {
  b.cyl(x,y+h*.26,z,w*.74,h*.51,d*.74,'#d8a38b',surface('pot'));
  b.cyl(x,y+h*.52,z,w*.80,.042,d*.80,coral);
  b.cyl(x,y+h*.545,z,w*.65,.014,d*.65,'#30271d');
  const rng=random(seed);
  for(let i=0;i<(low?8:15);i++){
    const angle=i*2.4;
    const radius=w*(.26+rng()*.64);
    const x2=x+Math.cos(angle)*radius;
    const z2=z+Math.sin(angle)*radius;
    const y2=y+h*(.69+rng()*.84);
    b.line([x,y+h*.52,z],[x2,y2,z2],.012,'#556947');
    b.oval(x2,y2,z2,.12+rng()*.11,.24+rng()*.24,.043,i%3===0?'#758963':i%3===1?'#486b52':'#577754',{rz:Math.cos(angle)*.85,rx:Math.sin(angle)*.72});
  }
}

function artwork(b,x,y,z,w,h,options={}) {
  const {ry=0,flipped=false}=options;
  b.box(x,y,z,w+.045,h+.045,.045,walnut,{ry});
  const side=flipped?-1:1;
  b.box(x+Math.sin(ry)*.028*side,y,z+Math.cos(ry)*.028*side,w,h,.014,'#fffbef',surface('art',{ry}));
}
function rug(b,x,z,w,d,tint='#fff5e2') {
  b.box(x,.009,z,w,.014,d,tint,surface('rug'));
}
function lamp(b,x,z,y, height) {
  b.cyl(x,y+.015,z,.21,.028,.21,walnut);
  b.cyl(x,y+height*.47,z,.024,height*.89,.024,walnut);
  b.cyl(x,y+height*.87,z,.31,height*.23,.31,'#fff3ca',surface('linen'));
}
function shade(b,x,z,w,d) {
  b.box(x,.018,z,w*1.32,.001,d*1.48,'#3a2720',{key:'shadow'});
}
function chair(b,x,z,w,d,swivel=0) {
  const vx=Math.sin(swivel), vz=Math.cos(swivel);
  fourLegs(b,x,z,w,d,.44, '#725039');
  b.oval(x,.43,z,w,.12,d,olive);
  b.box(x+vx*.18,.665,z+vz*.18,.39,.35,.07,'#71836b', {ry:swivel});
}

export function makeApartment(scene, low) {
  const atlas=apartmentAtlas(low);
  const shadow=canvas(64,64);
  const shadowCtx=shadow.getContext('2d');
  const fade=shadowCtx.createRadialGradient(32,32,2,32,32,32);
  fade.addColorStop(0,'#ffffff90'); fade.addColorStop(.58,'#ffffff57'); fade.addColorStop(1,'#ffffff00');
  shadowCtx.fillStyle=fade; shadowCtx.fillRect(0,0,64,64);
  const Material=low ? T.MeshLambertMaterial : T.MeshStandardMaterial;
  const materials={
    solid: new Material({vertexColors:true}),
    atlas: new Material({vertexColors:true,map:atlas}),
    shadow: new T.MeshBasicMaterial({vertexColors:true,map:texture(shadow),transparent:true,depthWrite:false,opacity:.55}),
  };
  const batches={};
  const groups={};
  for(const [name,[x0,z0,x1,z1]] of Object.entries(rooms)){
    const b=batches[name]=new Batch(materials, low);
    groups[name]=new T.Group();
    groups[name].name=name;
    scene.add(groups[name]);
    const floor=name==='bath'||name==='patio'?'tile':'wood';
    const tint=name==='bath'?'#f4e9d6':name==='patio'?'#d4bda6':'#fff0e0';
    for(let x=x0; x<x1-.001; x+=1.6)for(let z=z0;z<z1-.001;z+=2.4){
      const w=Math.min(1.6,x1-x),d=Math.min(2.4,z1-z);
      b.box(x+w/2,-.059,z+d/2,w,.118,d,tint,surface(floor,{ry:0}));
    }
    if(name!=='patio') b.box((x0+x1)/2,2.83,(z0+z1)/2,x1-x0,.08,z1-z0,'#e5d3ba');
  }
  for(const {room,x1,z1,x2,z2} of walls){
    const b=batches[room];
    const x=(x1+x2)/2,z=(z1+z2)/2;
    const w=Math.abs(x2-x1),d=Math.abs(z2-z1);
    if(room==='living' && z1===0 && z2===0 && x1===0){
      for(const [cx,cy,width,height] of [[.418,1.4,.836,2.8],[3.84,1.4,.36,2.8],[2.25,.426,2.83,.852],[2.25,2.54,2.83,.52]]){
        b.box(cx,cy,0,width,height,.12,plaster,surface('wall'));
      }
    }else b.box(x,1.40,z,w||.12,2.8,d||.12,room==='bedroom'?'#e7d7be':room==='bath'?'#e9e4d3':plaster,surface('wall'));
    b.box(x,.058,z,w||.148,.116,d||.148,'#eee1cf');
  }

  const living=batches.living;
  const dining=batches.dining;
  const kitchen=batches.kitchen;
  const hall=batches.hall;
  const bedroom=batches.bedroom;
  const bath=batches.bath;
  const patio=batches.patio;

  rug(living,2.22,2.87,3.88,3.28,'#f2d2b4');
  rug(dining,8.42,2.05,2.93,2.82);
  rug(hall,6.63,7.56,10.3,1.42,'#e2ae94');
  rug(bedroom,2.8,11.56,3.86,3.0,'#f1debd');
  rug(bath,11.20,12.39,1.42,.85,'#b7b5a0');
  rug(kitchen,14.67,5.73,1.06,.64,'#ab9a72');

  for(const [name, f] of Object.entries(furniture)){
    const {room,x,z,width:w,depth:d,height:h,kind}=f;
    const b=batches[room];
    shade(b,x,z,w,d);
    switch(kind){
      case 'sofa': {
        const fabric='#b49b7d';
        b.cushion(x,.246,z,w-.08,.32,d-.04,'#9d8065',surface('linen'));
        b.cushion(x,.62,z-d*.40,w-.04,.53,.22,fabric,surface('linen',{rx:-.10}));
        for(const side of [-1,1]){
          b.cushion(x+w*.465*side,.49,z,.19,.38,d,fabric,surface('linen'));
          for(const v of [-1,1])leg(b,x+w*.40*side,z+d*.38*v,.16,.055,ink);
        }
        for(let i=-1;i<=1;i++) {
          b.cushion(x+i*.79,.432,z+.08,.77,.127,.72,'#cbb196',surface('linen'));
          b.cushion(x+i*.80,.694,z-.29,.78,.39,.176,'#bc9f80',surface('linen',{rx:-.12}));
        }
        b.cushion(x-.94,.669,z-.115,.43,.41,.18,'#b47762',surface('linen',{rz:.18,rx:-.22}));
        b.cushion(x+.92,.672,z-.12,.45,.43,.17,'#6e7a65',surface('quilt',{rz:-.20,rx:-.20}));
        b.box(2.23,.492,1.65,.64,.026,.57,'#f5bd56',surface('linen'));
        for(let i=0;i<5;i++)b.box(2.005+i*.112,.507,1.65,.008,.002,.48,'#d79739');
        b.line([2.53,.493,1.7],[2.81,.36,1.96],.014,ink);
        break;
      }
      case 'coffee':
        fourLegs(b,x,z,w,d,.40,ink);
        b.box(x,h-.029,z,w,.058,d,walnut,surface('wood'));
        b.box(x-.49,h+.024,z-.08,.28,.048,.18,'#b47659', {ry:.15});
        b.box(x-.45,h+.051,z-.08,.21,.017,.15,'#e8d4ab',{ry:-.12});
        break;
      case 'media':
        b.box(x,h/2+.043,z,w,h-.086,d,walnut,surface('wood'));
        fourLegs(b,x,z,w,d,.12);
        for(const side of [-1,1])b.box(x+side*.68,.31,z-.282,1.07,.26,.015,'#9b714d',surface('wood'));
        b.box(1.90,.87,5.96,1.67,.91,.065,ink);
        b.box(1.90,.56,5.96,.42,.08,.25,ink);
        break;
      case 'lounge': {
        const facing=room==='bedroom'?0:Math.PI;
        fourLegs(b,x,z,w,d,.44);
        b.cushion(x,.42,z,w*.88,.157,d*.95,olive,surface('linen'));
        b.cushion(x,.67,z+Math.cos(facing)*d*.40,w*.88,.44,.13,'#6a806e',surface('linen',{rx:Math.cos(facing)*.15}));
        for(const sign of [-1,1])b.box(x+w*.44*sign,.63,z,.073,.075,d*.92,walnut,surface('wood'));
        break;
      }
      case 'plant': plant(b,x,z,w,d,h,low,0,Math.round(x*117)); break;
      case 'dining':
        b.cyl(x,.72,z,w,.060,d,walnut,surface('wood'));
        b.cyl(x,.36,z,.19,.72,.19,'#62402e');
        b.cyl(x,.038,z,.58,.06,.58,walnut);
        b.cyl(x+.38,.79,z+.07,.18,.069,.18,'#8b725e');
        break;
      case 'chair': {
        const direction={northChair:Math.PI, southChair:0, westChair:-Math.PI/2, eastChair:Math.PI/2};
        chair(b,x,z,w,d,direction[name]);
        break;
      }
      case 'shelf':
      case 'buffet':
      case 'night':
      case 'counter':
      case 'island':
      case 'vanity': {
        const kitchenUnit=kind==='island'||kind==='counter';
        const tint=kitchenUnit?'#647467':kind==='vanity'?'#b58367':walnut;
        const n=Math.ceil(w/.65);
        b.box(x,h/2-.009,z,w-.042,h-.105,d-.028,tint,surface(kitchenUnit?'wall':'wood'));
        b.box(x,h-.029,z,w,.058,d,kitchenUnit||kind==='vanity'?'#efe5d4':'#ad825d',surface(kitchenUnit||kind==='vanity'?'stone':'wood'));
        for(let i=0;i<n;i++){
          const xx=x+w*((i+.5)/n-.5);
          b.box(xx,h*.49,z+d/2-.011,w/n-.021,h*.67,.033,tint);
          b.box(xx,h*.68,z+d/2+.020,w/n*.32,.019,.030,'#d1ad7c');
        }
        if(kind==='counter') {
          b.box(12.66,.924,z,.63,.025,.42,'#7b8684');
          b.box(12.66,.941,z,.52,.009,.31,'#56605d');
          b.line([12.66,.925,.15],[12.66,1.19,.15],.026,'#a6a8a0');
          b.line([12.66,1.19,.15],[12.66,1.19,.33],.026,'#a6a8a0');
        }
        if(kind==='island'){
          b.box(12.72,.948,3.44,.33,.03,.23,'#b98159',surface('wood'));
          b.cyl(12.73,.968,3.44,.14,.059,.14,'#b07555');
        }
        if(kind==='vanity'){
          b.oval(x-.38,h+.03,z,.59,.092,.38,'#fffae8');
          b.oval(x-.38,h+.076,z,.46,.019,.28,'#d3c5b4');
          b.cyl(x-.38,h+.12,z+.16,.031,.27,.031,'#a28e71');
        }
        break;
      }
      case 'fridge':
        b.box(x,h/2,z,w,h,d,'#b0aaa0',surface('stone'));
        b.box(x,1.39,z+d/2,w-.035,1.2,.045,'#c8c0af');
        b.box(x,.40,z+d/2,w-.035,.74,.045,'#c3b8aa');
        b.box(x-w*.30,1.37,z+d/2+.04,.035,.47,.047,ink);
        break;
      case 'stool':
        fourLegs(b,x,z,w,d,h-.035);
        b.cyl(x,h-.037,z,w,.074,d,walnut,surface('wood'));
        break;
      case 'trash':
        b.cyl(x,.34,z,w,.68,d,'#9e9b90',surface('stone'));
        b.cyl(x,.68,z,w*.97,.055,d*.97,ink);
        b.box(x,.039,z+.20,.11,.03,.10,ink);
        break;
      case 'bed':
        b.box(x,.23,z,w,.35,d,walnut,surface('wood'));
        b.cushion(x,.488,z,w,.25,d,'#f5e9db',surface('linen'));
        b.cushion(x,.621,z-.28,w+.035,.103,d-.55,'#a4aa91',surface('quilt'));
        b.box(x,.514,z-d/2,w+.04,.22,.066,'#9aab93',surface('quilt'));
        b.box(x,.687,z+d/2-.043,w+.07,.855,.102,walnut,surface('wood'));
        for(const side of [-1,1])b.oval(x+side*.49,.662,z+.86,.84,.16,.41,'#eddfcb',{rx:.18});
        b.box(x,.685,z-.65,w+.07,.024,.47,'#ba7863',surface('towel'));
        break;
      case 'desk':
        fourLegs(b,x,z,w,d,.72);
        b.box(x,h-.035,z,w,.07,d,walnut,surface('wood'));
        b.box(x-.44,h+.015,z,.36,.03,.24,'#81786f');
        b.box(x-.44,h+.14,z+.12,.36,.26,.025,ink,{rx:-.18});
        break;
      case 'tub':
        b.box(x,.20,z,w,.36,d,'#e7ddca',surface('tile'));
        for(const sign of [-1,1]){
          b.box(x,.47,z+sign*(d/2-.047),w,.22,.094,'#fff8df');
          b.box(x+sign*(w/2-.075),.46,z,.15,.24,d-.13,'#fff8df');
        }
        b.cyl(x-w*.34,h+.12,z+.24,.033,.26,.033,'#a49583');
        break;
      case 'toilet':
        b.oval(x,.28,z-.1,w,.43,d*.73,'#ebddd1');
        b.oval(x,.51,z-.1,w,.12,d*.73,'#fff4e5');
        b.box(x,.49,z+d*.31,w*.91,.55,.22,'#e9e1d5');
        break;
      case 'litter':
        b.box(x,.09,z,w,.16,d,'#9e8f81');
        b.box(x,.18,z,w*.82,.022,d*.84,'#ceb696');
        for(const side of [-1,1])b.box(x+side*w*.44,.19,z,.055,.12,d,'#a79587');
        break;
    }
  }

  // Architectural openings and curtains.
  windowFrame(living,2.25,1.57,.079,2.83,1.44,true);
  living.box(2.25,.80,.141,2.98,.045,.235,walnut);
  living.line([.60,2.45,.18],[3.88,2.45,.18],.026,ink);
  for(const x of [.73,3.78])for(let i=0;i<7;i++){
    living.box(x+(i-3)*.067,1.26,.23+.035*Math.cos(i*2),.071,2.35,.047,i%2?'#e4d1b6':'#fbe8cf',surface('linen'));
  }
  for(const x of [4.03,5.55]) living.box(x,1.41,0,.076,2.81,.16,walnut);
  living.box(4.79,2.63,0,1.53,.34,.16,walnut);
  living.box(4.79,.013,0,1.50,.026,.12,walnut);
  windowFrame(dining,8.84,1.73,.079,2.02,1.22);
  windowFrame(bedroom,2.49,1.99,13.525,2.53,1.1);
  artwork(living,.094,1.64,2.17,.56,.70,{ry:Math.PI/2});
  artwork(living,.094,1.63,3.07,.57,.66,{ry:Math.PI/2});
  artwork(living,.094,1.43,3.89,.39,.43,{ry:Math.PI/2});
  artwork(dining,7.01,1.56,.091,.61,.76);
  artwork(hall,3.35,1.53,8.71,.86,.61,{flipped:true});
  artwork(bedroom,4.73,1.97,13.52,.62,.8,{flipped:true});
  artwork(bedroom,5.65,1.98,13.52,.64,.75,{flipped:true});
  lamp(living,.45,1.07,0,1.64);
  lamp(bedroom,.87,13.17,.58,.44);
  lamp(bedroom,4.07,13.17,.58,.44);
  plant(dining,8.81,.33,.23,.19,.28,low,.814);
  plant(hall,3.04,8.53,.26,.23,.30,low,.773);
  plant(living,2.72,5.99,.24,.19,.26,low,.554);
  for(const x of [11.54,12.45,13.37]){
    kitchen.box(x,2.00,.24,.84,.59,.38,'#858a79',surface('wall'));
    kitchen.box(x+.18,1.83,.45,.032,.17,.023,'#bb9470');
  }
  for(const x of [14.27,14.69]){
    kitchen.cyl(x,.048,5.58,.28,.075,.28,x<14.5?'#718679':'#b87965');
    kitchen.cyl(x,.091,5.58,.207,.014,.207,x<14.5?'#a4b0a7':'#8a6d4c');
  }
  for(const x of [12.34,13.38]){
    kitchen.line([x,2.8,3.47],[x,2.27,3.47],.019,ink);
    kitchen.cyl(x,2.21,3.47,.30,.12,.30,'#c59d69');
    kitchen.cyl(x,2.144,3.47,.26,.02,.26,'#f3d7a1');
  }
  for(const [b,x,z] of [[dining,8.45,2.04],[bedroom,4.25,11.2],[hall,7.23,7.58],[bath,11.4,11.33]]){
    b.line([x,2.8,z],[x,2.54,z],.02,walnut);
    b.oval(x,2.49,z,.44,.17,.44,'#ffe4b7');
  }
  bath.line([8.21,2.19,12.47],[9.87,2.19,12.47],.023,'#9b8c76');
  for(let i=0;i<15;i++){
    bath.box(8.19+i*.039,1.28,12.47+.033*Math.cos(i*2),.045,1.78,.053,i%2?'#d7b1a1':'#e7c3ae',surface('towel'));
  }
  bath.box(14.43,1.63,13.505,1.3,.75,.051,walnut);
  bath.box(14.43,1.63,13.471,1.23,.68,.022,'#b8c3bd',surface('stone'));
  bath.line([11.79,1.13,13.43],[12.57,1.13,13.43],.033,walnut);
  bath.box(12.16,.96,13.39,.46,.37,.071,'#c39f87',surface('towel'));
  for(const [x,z,w,d] of [[3.2,-2.65,6.41,.07],[.041,-1.34,.07,2.67],[6.36,-1.34,.07,2.67]]){
    patio.box(x,.99,z,w,.052,d,ink);
    patio.box(x,.135,z,w,.040,d,ink);
  }
  for(let i=0;i<=23;i++)patio.box(i*.277,.55,-2.65,.024,.87,.024,'#65513d');
  for(let i=0;i<=10;i++)for(const x of [.041,6.36])patio.box(x,.55,-i*.265,.025,.87,.025,'#65513d');

  for(const [key,b] of Object.entries(batches))b.finish(groups[key],key);

  // One merged streetscape with a single small tile atlas, including the ground, trees and buildings.
  const cityGroup=new T.Group();
  cityGroup.name='Uptown Dallas';
  const city=new Batch(materials,low);
  const urban=(x,y,z,w,h,d,t,uv)=>city.box(x,y,z,w,h,d,t,surface(uv));
  urban(4,-2.42,-18,105,.2,39,'#d5bfa8','street');
  urban(4,-2.29,-11,105,.045,6.3,'#988d89','road');
  urban(4,-2.25,-6.75,105,.07,1.66,'#d7c0a1','street');
  urban(4,-2.23,-7.65,105,.07,.19,'#eee0cd','stone');
  const cityRng=random(155);
  for(let i=0;i<18;i++){
    const x=-32+i*4.1,z=-19-cityRng()*6,h=2.25+cityRng()*7.0,w=2.6+cityRng()*1.2;
    urban(x,h/2-2.21,z,w,h,2.7,i%3===0?'#ba8d75':i%3===1?'#ccc0a7':'#9b9b9e','windows');
    urban(x,h-2.15,z,w+.15,.12,2.9,'#bba892','stone');
    urban(x,h-1.91,z,w*.46,.36,1.45,'#a9958a','street');
  }
  for(let i=0;i<16;i++){
    const x=-41+i*5.7,z=-35-cityRng()*6,h=5+cityRng()*9;
    urban(x,h/2-2.2,z,3.6,h,3.4,'#cec3bc','skyline');
    if(i%3===0)urban(x,h-1.79,z,2,.82,2,'#cbc0b4','skyline');
  }
  for(let i=0;i<14;i++){
    const x=(i-6)*3.4,z=i%2?-7.2:-14.9;
    urban(x,-1.40,z,.135,1.65,.135,'#876959','wood');
    city.oval(x,-.46,z,1.34,1.89,1.34,'#9baf82',surface('green'));
    city.oval(x-.38,-.77,z+.14,1.1,1.02,1.16,'#909f72',surface('green'));
  }
  for(let i=0;i<7;i++){
    const x=(i-3)*6.5,z=i%2?-10.2:-12.2;
    urban(x,-2.05,z,1.55,.32,.62,['#a46b61','#e5dace','#8e9d97'][i%3],'glass');
    urban(x-.11,-1.86,z,.71,.19,.51,'#88989b','glass');
    for(const offset of [-.51,.51]) urban(x+offset,-2.20,z,.28,.19,.67,'#555055','street');
  }
  city.finish(cityGroup);
  // The streetscape gets its own small atlas generated from the exterior tiles.
  const outdoor=cityGroup.children[0];
  const street=canvas(256,256);
  street.getContext('2d').drawImage(atlas.image,0,0,256,256);
  outdoor.material = materials.atlas.clone();
  outdoor.material.map=texture(street,!low);
  scene.add(cityGroup);
  return { groups, city:cityGroup, materials };
}
