import * as T from 'three';
import { Batch, canvas, texture } from './geometry.js';
import { random } from './rules.js';

export function catMaterials(low, shadow) {
  const fur=canvas(low?64:128,low?64:128);
  const ctx=fur.getContext('2d');
  const size=fur.width;
  const rng=random(491);
  ctx.fillStyle='#f3ece5';ctx.fillRect(0,0,size,size);
  for(let i=0;i<size*42;i++){
    ctx.strokeStyle=rng()<.58?'#fffdf0a0':'#8f82734d';
    ctx.lineWidth=.55+rng()*.6;
    const x=rng()*size,y=rng()*size;
    ctx.beginPath(); ctx.moveTo(x,y);ctx.lineTo(x+(rng()-.5)*3,y+1+rng()*4);ctx.stroke();
  }
  const Material=low?T.MeshLambertMaterial:T.MeshStandardMaterial;
  return {
    fur: new Material({map:texture(fur,!low),vertexColors:true}),
    solid: new Material({vertexColors:true}),
    shadow,
  };
}

const ear = new T.ConeGeometry(1,1,5);
const dark='#26252b';
const light='#f9eddf';
const toes='#e9dcd0';
const furPart={key:'fur'};
const snout='#f4e6dc';
const pink='#bd807e';

export function headY(pose, decoy=false) {
  return pose==='sit' ? (decoy?.376:.358) : pose==='roll' ? .151 : .206;
}

export function makeCat(materials,low,decoy=false,pose='sit',patriot=false) {
  const root=new T.Group(), breathe=new T.Group(), head=new T.Group(), eyes=new T.Group();
  root.name=decoy?'decoy':'bobo';
  root.add(breathe);
  const body=new Batch(materials,low);
  const face=new Batch(materials,low);
  const fur=decoy?'#201f26':dark;
  const h=headY(pose,decoy);
  const shape=decoy?1.14:1;
  const sitting=pose==='sit', rolling=pose==='roll';
  const length=sitting?.46:.58;
  const mass=decoy?.302:sitting?.25:.227;
  const chest=sitting?.36:rolling?.157:.213;
  const spread=rolling?.20:sitting?.13:.18;
  body.oval(0,chest*.48,-.102,mass,chest,length,fur,furPart);
  body.oval(0,chest*.66,.061,mass*.84,chest*.84,sitting?.218:.27,fur,furPart);
  if(!decoy){
    body.oval(0,chest*.69,.126,.137,chest*.61,sitting?.107:.148,light,furPart);
    body.oval(.024,chest*.42,.147,.101,chest*.25,.067,'#e8ded6',furPart);
    if(rolling) body.oval(.035,.124,-.054,.167,.095,.318,light,furPart);
  }
  for(const side of [-1,1]){
    body.oval(side*spread*.50,.052,.142,.065,.089,.19,fur,furPart);
    body.oval(side*spread*.50,.027,.215,.077,.055,.124,light,furPart);
    body.oval(side*mass*.40,.063,-.178,.098,.116,.221,fur,furPart);
    body.oval(side*mass*.42,.03,-.131,.084,.058,.124,toes,furPart);
    if(!low)for(let toe=-1;toe<=1;toe++)body.oval(side*spread*.50+toe*.019,.025,.265,.025,.029,.028,light,furPart);
  }
  const curve=new T.CatmullRomCurve3([
    [0,.083,-.315],[.093,.06,-.381],[.237,.047,-.33],[.258,.042,-.198],[.222,.042,-.121],
  ].map(points=>new T.Vector3(...points)));
  const tail=new T.TubeGeometry(curve,low?9:17,decoy?.034:.027,low?6:9,false);
  body.add(tail,0,0,0,1,1,1,fur,furPart);
  tail.dispose();
  body.oval(.222,.043,-.122,.053,.052,.061,fur,furPart);
  body.finish(breathe,root.name);
  breathe.add(head);
  head.position.set(rolling?-.065:0,h,.115);
  head.rotation.z=rolling?.26:0;
  head.scale.setScalar(shape);
  face.oval(0,0,0,.217,.188,.178,fur,furPart);
  face.oval(0,-.04,.020,.194,.105,.159,fur,furPart);
  for(const side of [-1,1]){
    face.add(ear,side*.077,.088,-.017,.064,.158,.050,fur,{key:'fur',rz:side*-.18,ry:.65});
    face.add(ear,side*.081,.104,.012,.043,.101,.022,'#a67676',{rz:side*-.23,ry:.68});
    face.oval(side*.039,-.035,.082,.078,.060,.059,decoy?'#343038':snout,furPart);
    face.oval(side*.053,.017,.077,.066,.051,.019,'#14161c',{ry:side*.30});
    const eye=new T.Group();
    eye.position.set(side*.053,.017,.084);
    const iris=new Batch(materials,low);
    iris.oval(0,0,0,.054,.040,.018,decoy?'#cda45b':'#bac984',{ry:side*.18});
    iris.oval(-side*.003,0,.010,.017,.035,.011,'#101818');
    iris.oval(-.009,.010,.014,.012,.012,.005,'#fff5df');
    iris.finish(eye,root.name);
    eyes.add(eye);
    if(!low)for(let line=0;line<3;line++){
      face.line([side*.051,-.035-line*.011,.104],
        [side*(.151+line*.003),-.029-line*.027,.111-line*.004],.0028,decoy?'#999091':'#ded2c7');
    }
  }
  face.oval(0,-.062,.086,.096,.043,.041,decoy?'#302c30':light,furPart);
  face.oval(0,-.030,.116,.036,.023,.026,pink);
  face.line([0,-.042,.12],[0,-.055,.108],.004,'#544043');
  if(!decoy){
    face.oval(-.010,.068,.071,.035,.034,.018,light,furPart);
    face.oval(.003,.052,.079,.018,.028,.014,light,furPart);
  }
  if(patriot){
    face.oval(0,.102,.005,.176,.085,.169,'#bf342f');
    face.oval(0,.104,.094,.180,.022,.122,'#982621');
    // A stitched campaign slogan on a canvas, painted in code.
    const graphic=canvas(128,44);
    const ctx=graphic.getContext('2d');
    ctx.fillStyle='#b42c29';ctx.fillRect(0,0,128,44);
    ctx.fillStyle='#fff4dd';ctx.font='800 29px system-ui';ctx.textAlign='center';ctx.fillText('MAGA',64,32);
    const badge=new T.Mesh(new T.PlaneGeometry(.105,.036),new T.MeshBasicMaterial({map:texture(graphic)}));
    badge.position.set(0,.124,.083);
    badge.name=root.name;
    head.add(badge);
  }
  face.finish(head,root.name);
  head.add(eyes);
  const s=new T.Mesh(new T.PlaneGeometry(decoy?.79:.66,decoy?.82:.72),materials.shadow);
  s.geometry.setAttribute('color',new T.BufferAttribute(new Float32Array(s.geometry.attributes.position.count*3).fill(.16),3));
  s.rotation.x=-Math.PI/2;s.position.set(0,.003,-.046);s.userData.surface='shadow';
  root.add(s);
  root.userData.animate=(t,x,z)=>{
    const dx=x-root.position.x,dz=z-root.position.z;
    root.rotation.y=Math.atan2(dx,dz);
    breathe.scale.y=1+Math.sin(t*3.4)*.026;
    const cycle=(t+(decoy?1.67:.61))%(decoy?4.91:4.13);
    const blink=cycle<.16 ? Math.max(.08,Math.abs(cycle-.08)/.08) : 1;
    for(const eye of eyes.children)eye.scale.y=blink;
    head.rotation.x=-.17+Math.sin(t*1.03)*.036;
  };
  return root;
}

export function makeOwner(materials,low) {
  const group=new T.Group();
  group.name='owner';
  const b=new Batch(materials,low);
  const skin='#d7a180', tee='#62756a', jeans='#4d535d';
  // Seated figure, scaled for an approximately 1.91 m standing person.
  b.oval(0,.659,-.155,.43,.34,.27,jeans);
  b.oval(0,1.013,-.16,.48,.57,.28,tee,{rx:-.13});
  b.oval(0,1.271,-.115,.17,.19,.16,skin);
  b.oval(0,1.467,-.10,.236,.284,.219,skin,{rx:-.06});
  b.oval(0,1.406,-.044,.179,.109,.148,'#9e745f');
  b.oval(0,1.450,.009,.053,.067,.055,skin);
  b.oval(0,1.416,.022,.071,.015,.016,'#805947');
  b.oval(0,1.555,-.114,.25,.135,.236,'#6f695f');
  b.oval(0,1.551,-.234,.23,.025,.171,'#514e46');
  for(const side of [-1,1]){
    b.oval(side*.045,1.478,.001,.026,.013,.014,'#493c36');
    b.oval(side*.109,1.455,-.102,.039,.071,.05,skin);
    b.oval(side*.116,.635,.103,.223,.217,.47,jeans,{rx:.11});
    b.oval(side*.122,.365,.237,.169,.57,.164,jeans,{rx:-.11});
    b.oval(side*.122,.098,.326,.166,.132,.27,'#e3dac6');
    b.oval(side*.23,1.026,-.105,.151,.226,.173,tee,{rz:side*.26});
    b.line([side*.242,.99,-.102],[side*.244,.852,.075],.094,skin);
    b.line([side*.244,.852,.075],[side*.116,.901,.21],.079,skin);
    b.oval(side*.114,.905,.21,.093,.069,.082,skin);
  }
  b.oval(0,.911,.212,.221,.055,.113,'#302d33',{rx:.26});
  b.oval(.036,.941,.224,.022,.009,.022,'#72796b');
  group.position.set(1.37,0,1.54);
  return b.finish(group,'owner');
}

export function makeVacuum(materials,low) {
  const group=new T.Group();
  group.name='robot vacuum';
  const b=new Batch(materials,low);
  b.cyl(0,.032,0,.375,.058,.375,'#342d30');
  b.cyl(0,.078,0,.358,.052,.358,'#625e5c');
  b.cyl(0,.108,0,.304,.014,.304,'#746e68');
  b.cyl(-.075,.119,-.03,.082,.018,.082,'#393839');
  b.cyl(.086,.118,.071,.028,.016,.028,'#d5a770');
  b.box(0,.05,.187,.089,.043,.009,'#222226');
  return b.finish(group,'robot vacuum');
}
