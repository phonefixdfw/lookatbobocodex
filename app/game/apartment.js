import * as T from 'three';
import { Batch, canvas, texture } from './geometry.js';
import { apartmentAtlas, tile } from './atlases.js';
import { doors, frontWindows, furniture, heatPad, rooms, television, walls } from './layout.js';
import { random } from './rules.js';

const ink = '#2e2726';
const walnut = '#865939';
const cream = '#f5e8d6';
const bone = '#ddd0b9';
const olive = '#687966';
const coral = '#976650';
const plaster = '#f4ecdc';
const porcelain = {key:'glaze'};
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
  const {ry=0,flipped=false,alternate=false}=options;
  b.box(x,y,z,w+.045,h+.045,.045,walnut,{ry});
  const side=flipped?-1:1;
  b.box(x+Math.sin(ry)*.028*side,y,z+Math.cos(ry)*.028*side,w,h,.014,'#fffbef',surface(alternate?'artAlt':'art',{ry}));
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
    glaze: low?new Material({vertexColors:true}):new Material({vertexColors:true,roughness:.28}),
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
    const opening=z1===0&&z2===0?frontWindows[room]:null;
    if(opening && x1<=opening[0]-opening[2]/2 && x2>=opening[0]+opening[2]/2){
      const [wx,wy,ww,wh]=opening;
      const left=wx-ww/2,right=wx+ww/2,under=wy-wh/2,over=wy+wh/2;
      for(const [cx,cy,width,height] of [
        [(x1+left)/2,1.4,left-x1,2.8],[(right+x2)/2,1.4,x2-right,2.8],
        [wx,under/2,ww,under],[wx,(over+2.8)/2,ww,2.8-over],
      ]) b.box(cx,cy,0,width,height,.12,plaster,surface('wall'));
    }else{
      b.box(x,1.40,z,w||.12,2.8,d||.12,room==='bedroom'?'#e7d7be':room==='bath'?'#f4efe2':plaster,surface('wall'));
    }
    b.box(x,.058,z,w||.148,.116,d||.148,'#eee1cf');
  }

  const living=batches.living;
  const dining=batches.dining;
  const kitchen=batches.kitchen;
  const entry=batches.landing;
  const hall=batches.hall;
  const bedroom=batches.bedroom;
  const bath=batches.bath;
  const patio=batches.patio;

  rug(living,1.77,2.56,3.17,2.34,'#f2d2b4');
  rug(dining,5.87,1.25,2.10,2.22);
  rug(hall,4.93,5.16,2.57,.65,'#e2ae94');
  rug(bedroom,1.61,8.14,2.55,2.48,'#f1debd');
  rug(bath,5.77,7.12,.84,.53,'#becab9');
  rug(kitchen,9.64,4.14,.76,.50,'#ab9a72');
  const [bathLeft,bathNorth,bathRight,bathSouth]=rooms.bath;
  const bathWidth=bathRight-bathLeft,bathDepth=bathSouth-bathNorth;
  for(let part=0;part<2;part++){
    bath.box(bathLeft+(part+.5)*bathWidth/2,.63,bathSouth-.081,bathWidth/2,1.24,.031,'#f3f4e6',surface('wetTile'));
    for(const x of [bathLeft+.075,bathRight-.075]){
      bath.box(x,.63,bathNorth+(part+.5)*bathDepth/2,.031,1.24,bathDepth/2,'#e2e9d8',surface('wetTile'));
    }
  }
  bath.box((bathLeft+bathRight)/2,1.262,bathSouth-.088,bathWidth,.022,.047,'#899d8e');

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
        const pad=heatPad;
        b.box(pad.x,.492,pad.z,.60,.026,.52,'#f5bd56',surface('linen'));
        for(let i=0;i<5;i++)b.box(pad.x-.224+i*.112,.507,pad.z,.008,.002,.43,'#d79739');
        b.line([pad.x+.29,.493,pad.z+.05],[pad.x+.53,.36,pad.z+.28],.014,ink);
        break;
      }
      case 'coffee':
        fourLegs(b,x,z,w,d,.40,ink);
        b.box(x,h-.029,z,w,.058,d,walnut,surface('walnut'));
        b.box(x-.49,h+.024,z-.08,.28,.048,.18,'#b47659', {ry:.15});
        b.box(x-.45,h+.051,z-.08,.21,.017,.15,'#e8d4ab',{ry:-.12});
        break;
      case 'media':
        b.box(x,h/2+.043,z,w,h-.086,d,walnut,surface('wood'));
        fourLegs(b,x,z,w,d,.12);
        for(const side of [-1,1])b.box(x+side*w*.25,.31,z-d/2,w*.43,.26,.015,'#b08b6c',surface('walnut'));
        b.box(television.x,.89,television.z,television.width,.83,.065,ink);
        b.box(television.x,.56,television.z,.42,.08,.25,ink);
        break;
      case 'lounge': {
        const sideways=room==='living';
        const yaw=sideways?Math.PI/2:room==='bedroom'?0:Math.PI;
        const across=sideways?d:w, depth=sideways?w:d;
        const sin=Math.sin(yaw), cos=Math.cos(yaw);
        fourLegs(b,x,z,w,d,.44);
        b.cushion(x,.42,z,across*.88,.157,depth*.95,olive,surface('linen',{ry:yaw}));
        b.cushion(x+sin*depth*.40,.67,z+cos*depth*.40,across*.88,.44,.13,'#6a806e',surface('linen',{ry:yaw,rx:cos*.15}));
        for(const sign of [-1,1]){
          const arm=across*.44*sign;
          b.box(x+cos*arm,.63,z-sin*arm,.073,.075,depth*.92,walnut,surface('wood',{ry:yaw}));
        }
        break;
      }
      case 'plant': plant(b,x,z,w,d,h,low,0,Math.round(x*117)); break;
      case 'dining':
        b.cyl(x,.72,z,w,.060,d,walnut,surface('wood'));
        b.cyl(x,.36,z,.19,.72,.19,'#62402e');
        b.cyl(x,.038,z,.58,.06,.58,walnut);
        b.cyl(x+.24,.79,z+.04,.14,.069,.14,'#8b725e');
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
        const front=kind==='night'||room==='hall'?-1:1;
        b.box(x,h/2-.009,z,w-.042,h-.105,d-.028,tint,surface(kitchenUnit?'wall':'walnut'));
        b.box(x,h-.029,z,w,.058,d,kitchenUnit||kind==='vanity'?'#efe5d4':'#ad825d',surface(kitchenUnit||kind==='vanity'?'stone':'walnut'));
        for(let i=0;i<n;i++){
          const xx=x+w*((i+.5)/n-.5);
          b.box(xx,h*.49,z+front*(d/2-.011),w/n-.021,h*.67,.033,tint);
          b.box(xx,h*.68,z+front*(d/2+.020),w/n*.32,.019,.030,'#d1ad7c');
        }
        if(kind==='counter') {
          const basin=x+w*.13;
          b.box(basin,.924,z,.55,.025,.40,'#7b8684');
          b.box(basin,.941,z,.45,.009,.29,'#56605d');
          b.line([basin,.925,z-.19],[basin,1.19,z-.19],.026,'#a6a8a0');
          b.line([basin,1.19,z-.19],[basin,1.19,z-.05],.026,'#a6a8a0');
        }
        if(kind==='island'){
          b.box(x,.948,z-.06,.28,.03,.18,'#b98159',surface('wood'));
          b.cyl(x,.968,z-.06,.12,.059,.12,'#b07555');
        }
        if(kind==='vanity'){
          const basin=x-.09;
          b.oval(basin,h+.023,z,.41,.082,.34,'#f0ecd9',porcelain);
          b.oval(basin,h+.052,z,.32,.012,.24,'#cad3ca',porcelain);
          b.ring(basin,h+.064,z,.35,.12,.28,'#fffbec',porcelain);
          b.cyl(basin,h+.063,z,.035,.005,.035,'#998d72');
          b.line([basin,h+.025,z-.175],[basin,h+.205,z-.175],.032,'#af9b73','glaze');
          b.line([basin,h+.205,z-.175],[basin,h+.205,z-.081],.030,'#af9b73','glaze');
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
        for(const side of [-1,1])b.oval(x+side*w*.24,.662,z+d*.37,w*.44,.16,.41,'#eddfcb',{rx:.18});
        b.box(x,.685,z-.65,w+.07,.024,.47,'#ba7863',surface('towel'));
        break;
      case 'desk':
        fourLegs(b,x,z,w,d,.72);
        b.box(x,h-.035,z,w,.07,d,walnut,surface('wood'));
        b.box(x-.31,h+.015,z,.36,.03,.24,'#81786f');
        b.box(x-.31,h+.14,z+.12,.36,.26,.025,ink,{rx:-.18});
        break;
      case 'tub':
        b.cushion(x,.173,z,w,.322,d,'#f4e8d5',porcelain);
        b.oval(x,.329,z,w*.87,.053,d*.73,'#ded8c9',porcelain);
        for(const sign of [-1,1]){
          b.cushion(x,.455,z+sign*(d/2-.054),w,.234,.108,'#faf4e4',porcelain);
          b.cushion(x+sign*(w/2-.066),.455,z,.135,.234,d-.12,'#faf4e4',porcelain);
        }
        b.cyl(x-w*.35,h+.13,z+d*.33,.036,.26,.036,'#b7a37d',porcelain);
        b.line([x-w*.35,h+.247,z+d*.33],[x-w*.35,h+.247,z+d*.13],.032,'#b7a37d','glaze');
        for(const offset of [0,.056]){
          b.cushion(x+w*.34,.605+offset,z+.25,.23,.044,.16,'#d8bda5',surface('towel'));
        }
        break;
      case 'toilet':
        b.oval(x-.1,.245,z,w*.64,.43,d*.75,'#f3e8d8',porcelain);
        b.oval(x-.1,.481,z,w*.73,.105,d,'#f2ecdc',porcelain);
        b.oval(x-.1,.528,z,w*.51,.019,d*.69,'#9eb0ab',porcelain);
        b.ring(x-.1,.548,z,w*.69,.11,d*.90,'#f9f2dd',porcelain);
        b.cushion(x+w*.31,.52,z,.22,.50,d*.89,'#f3ead5',porcelain);
        b.cyl(x+w*.29,.785,z,.041,.013,.062,'#a89572',porcelain);
        break;
      case 'linen-cabinet':
        b.cushion(x,h/2+.025,z,w,h-.05,d,'#ab8a6b',surface('walnut'));
        for(let i=0;i<3;i++){
          b.box(x+w*.50,.32+i*.45,z,.034,.407,d-.05,'#bd9a76',surface('walnut'));
          b.box(x+w*.56,.40+i*.45,z,.031,.021,.16,'#c6ae87');
        }
        break;
      case 'litter':
        b.box(x,.09,z,w,.16,d,'#9e8f81');
        b.box(x,.18,z,w*.82,.022,d*.84,'#ceb696');
        for(const side of [-1,1])b.box(x+side*w*.44,.19,z,.055,.12,d,'#a79587');
        break;
    }
  }

  for(const [room,opening] of Object.entries(frontWindows)){
    const [x,y,w,h]=opening;
    windowFrame(batches[room],x,y,.079,w,h,true);
  }
  const [wx,,ww]=frontWindows.living;
  living.box(wx,.80,.141,ww+.15,.045,.235,walnut);
  living.line([wx-ww*.59,2.45,.18],[wx+ww*.59,2.45,.18],.026,ink);
  for(const x of [wx-ww*.55,wx+ww*.55])for(let i=0;i<6;i++){
    living.box(x+(i-2.5)*.061,1.26,.22+.035*Math.cos(i*2),.067,2.35,.047,i%2?'#e4d1b6':'#fbe8cf',surface('linen'));
  }
  for(const {room,left,right,z} of Object.values(doors)){
    const batch=batches[room];
    const middle=(left+right)/2;
    batch.box(middle,2.522,z,right-left,.556,.12,plaster,surface('wall'));
    batch.box(middle,2.244,z,right-left+.06,.050,.167,walnut);
    for(const x of [left,right])batch.box(x,1.114,z,.048,2.228,.166,walnut);
    batch.box(middle,.013,z,right-left-.06,.026,.12,walnut);
  }
  entry.box(5.31,1.10,4.484,1.03,2.20,.055,walnut);
  entry.box(5.31,1.08,4.450,.92,2.14,.037,'#a07858',surface('walnut',{ry:Math.PI}));
  entry.box(5.62,1.03,4.416,.14,.028,.067,'#c6aa76');
  windowFrame(bedroom,1.58,1.99,9.47,1.88,1.1);
  artwork(living,.094,1.64,1.83,.48,.63,{ry:Math.PI/2});
  artwork(living,.094,1.63,2.67,.51,.63,{ry:Math.PI/2,alternate:true});
  artwork(living,.094,1.43,3.45,.35,.41,{ry:Math.PI/2});
  artwork(dining,6.91,1.56,.091,.48,.66);
  artwork(hall,6.66,1.55,5.68,.44,.59,{flipped:true});
  artwork(bedroom,3.02,1.88,9.46,.48,.67,{flipped:true});
  artwork(bedroom,3.88,1.94,9.46,.52,.71,{flipped:true,alternate:true});
  lamp(living,.49,.64,0,1.60);
  lamp(bedroom,furniture.nightWest.x,9.24,.58,.40);
  lamp(bedroom,furniture.nightEast.x,9.25,.58,.40);
  plant(dining,6.92,.29,.15,.16,.22,low,.814);
  plant(hall,6.85,5.61,.13,.10,.20,low,.773);
  plant(living,2.32,4.25,.18,.16,.23,low,.554);

  for(const x of [7.84,8.49,9.14]){
    kitchen.box(x,2.00,.24,.61,.59,.34,'#858a79',surface('wall'));
    kitchen.box(x+.12,1.83,.42,.028,.15,.023,'#bb9470');
  }
  for(const x of [9.39,9.70]){
    kitchen.cyl(x,.047,4.19,.23,.070,.23,x<9.55?'#718679':'#b87965');
    kitchen.cyl(x,.086,4.19,.164,.014,.164,x<9.55?'#a4b0a7':'#8a6d4c');
  }
  kitchen.line([8.77,2.8,2.20],[8.77,2.32,2.20],.019,ink);
  kitchen.cyl(8.77,2.25,2.20,.31,.12,.31,'#c59d69');
  kitchen.cyl(8.77,2.184,2.20,.27,.02,.27,'#f3d7a1');
  for(const [b,x,z] of [[dining,5.87,1.21],[bedroom,2.55,7.09],[hall,5.36,5.17],[bath,5.76,6.69]]){
    b.line([x,2.8,z],[x,2.54,z],.02,walnut);
    b.oval(x,2.49,z,.36,.14,.36,'#ffe4b7');
  }

  const tub=furniture.tub;
  const tubFront=tub.z-tub.depth*.54,tubLeft=tub.x-tub.width/2;
  bath.line([tubLeft,2.19,tubFront],[tubLeft+tub.width,2.19,tubFront],.023,'#9b8c76');
  for(let i=0;i<11;i++){
    bath.box(tubLeft+.03+i*.038,1.28,tubFront+.024*Math.cos(i*2),.045,1.78,.044,i%2?'#d0cfba':'#f0e6cc',surface('towel'));
  }
  const mirrorX=furniture.vanity.x-.07,mirrorZ=bathNorth+.09;
  bath.cushion(mirrorX,1.61,mirrorZ,.53,.68,.055,'#91755a');
  bath.cushion(mirrorX,1.61,mirrorZ+.035,.47,.62,.044,'#e7f1eb',surface('mirror'));
  bath.cushion(mirrorX,2.045,mirrorZ+.054,.31,.079,.10,'#fff2c8',porcelain);
  bath.cyl(tub.x+.42,2.06,bathSouth-.28,.13,.023,.18,'#b4a07d',porcelain);
  bath.line([tub.x+.42,2.072,bathSouth-.08],[tub.x+.42,2.072,bathSouth-.28],.022,'#ae9977','glaze');
  bath.line([7.12,1.12,7.26],[7.12,1.12,7.70],.027,walnut);
  bath.box(7.09,.97,7.48,.067,.31,.37,'#c39f87',surface('towel'));

  const [,patioNorth,patioRight]=rooms.patio;
  const outer=patioNorth+.045,depth=-outer;
  for(const [x,z,w,d] of [[patioRight/2,outer,patioRight,.07],[.041,outer/2,.07,depth],[patioRight-.041,outer/2,.07,depth]]){
    patio.box(x,.99,z,w,.052,d,ink);
    patio.box(x,.135,z,w,.040,d,ink);
  }
  for(let x=.06;x<patioRight;x+=.26)patio.box(x,.55,outer,.024,.87,.024,'#65513d');
  for(let z=outer;z<0;z+=.24)for(const x of [.041,patioRight-.041])patio.box(x,.55,z,.025,.87,.025,'#65513d');

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
