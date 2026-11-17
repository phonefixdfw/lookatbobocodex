import { canvas, texture } from './geometry.js';
import { random } from './rules.js';

const columns=4, rows=5;
const swatches=['wood','rug','wall','tile','art','linen','quilt','towel','pot','stone','street','windows',
  'skyline','glass','road','green','wetTile','mirror','artAlt','walnut'];
export const tile=Object.fromEntries(swatches.map((key,i)=>
  [key,[(i%columns)/columns,(rows-1-Math.floor(i/columns))/rows,1/columns,1/rows]],
));

function planks(ctx,s,rng,dark){
  const shades=dark?['#bd966e','#b28b65','#a77b57','#b68d63']:['#d6b38e','#d2a981','#e1bd98','#c9a47f'];
  for(let row=0;row<8;row++){
    const top=row*s/8, height=s/8;
    const seam=(row*49+27)%s;
    ctx.fillStyle=shades[row%4];
    ctx.fillRect(0,top,s,height);
    ctx.fillStyle='#51403219';
    ctx.fillRect(seam,top,s-seam,height);
    for(let mark=0;mark<24;mark++){
      const y=top+rng()*height;
      ctx.strokeStyle=mark%3===0?'#f9dbb742':'#6c49301f';
      ctx.lineWidth=.24+rng()*.5;
      ctx.beginPath();
      ctx.moveTo(-2,y);
      ctx.bezierCurveTo(s*.28,y-2+rng()*4,s*.65,y-1.5+rng()*3,s+2,y);
      ctx.stroke();
    }
    ctx.fillStyle='#faf1d763';ctx.fillRect(0,top,s,.65);
    ctx.fillStyle='#4d382b48';ctx.fillRect(0,top+height-1,s,.75);ctx.fillRect(seam,top,.8,height);
  }
}
function ceramic(ctx,s,wet){
  const columns=wet?5:4, rows=wet?3:4;
  const shades=wet?['#84a397','#8dab9d','#95ad9e','#7e9c90']:['#e3d9c7','#ded4c1','#ece1d1','#d9ccba'];
  const gap=wet?1.5:1.2;
  ctx.fillStyle=wet?'#e3dfcc':'#ad9c88';ctx.fillRect(0,0,s,s);
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const x=col*s/columns,y=row*s/rows,w=s/columns,h=s/rows;
    ctx.fillStyle=shades[(col+row*3)%shades.length];ctx.fillRect(x+gap,y+gap,w-gap,h-gap);
    ctx.fillStyle='#fff9e560';ctx.fillRect(x+gap,y+gap,w-gap,1);
    ctx.fillStyle='#2d39301d';ctx.fillRect(x+gap,y+h-1,w-gap,1);
  }
}

export function apartmentAtlas(low) {
  const s = low ? 104 : 176;
  const sheet = canvas(s*columns,s*rows);
  const ctx = sheet.getContext('2d');
  const rng = random(417);
  const pigments=['#dbb790','#e3dbc9','#f8f4e9','#e8e4d9','#eddfcc','#e2dfce','#d1d9c7','#e9e0c8','#c77b61','#e8dbca','#c5ab93','#c7b5a2','#aa9da4','#cedbdd','#74696a','#829170','#96aea2','#ced8d2','#ebe2d4','#a58364'];
  Object.keys(tile).forEach((key, i) => {
    ctx.save();
    ctx.translate(i%columns*s, Math.floor(i/columns)*s);
    ctx.beginPath(); ctx.rect(0,0,s,s); ctx.clip();
    ctx.fillStyle=pigments[i];ctx.fillRect(0,0,s,s);
    if(key==='wood'||key==='walnut')planks(ctx,s,rng,key==='walnut');
    if(key==='tile'||key==='wetTile')ceramic(ctx,s,key==='wetTile');
    for (let n=0; n<(low ? 480 : 1250); n++) {
      ctx.globalAlpha=rng()*(key==='wall'?.085:.106);
      ctx.fillStyle = rng()<.48 ? '#29251d' : '#fffaf0';
      ctx.fillRect(rng()*s,rng()*s,.45+rng()*1.7,.35+rng()*.9);
    }
    ctx.globalAlpha=1;
    if (['rug','linen','towel','quilt'].includes(key)) {
      ctx.lineWidth=1;
      ctx.strokeStyle='#71685435';
      for(let p=0;p<s;p+=5) {
        ctx.beginPath(); ctx.moveTo(p,0); ctx.lineTo(p,s); ctx.stroke();
        if(key!=='towel'){ ctx.beginPath(); ctx.moveTo(0,p); ctx.lineTo(s,p); ctx.stroke(); }
      }
      if(key==='rug') {
        ctx.strokeStyle='#74644b82'; ctx.strokeRect(5,5,s-10,s-10); ctx.strokeRect(9,9,s-18,s-18);
        ctx.strokeStyle='#926f5e50';
        for(let j=1;j<5;j++) for(let p=1;p<5;p++){
          const x=p*s/5,y=j*s/5; ctx.beginPath(); ctx.moveTo(x-10,y); ctx.lineTo(x,y-10);ctx.lineTo(x+10,y);ctx.lineTo(x,y+10);ctx.closePath(); ctx.stroke();
        }
      }
    }
    if(key==='art'){
      ctx.fillStyle='#282322'; ctx.beginPath(); ctx.ellipse(s*.53,s*.58,s*.26,s*.32,-.48,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#f8edda';ctx.beginPath();ctx.ellipse(s*.63,s*.37,s*.17,s*.26,.65,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#332a27';ctx.lineWidth=1.5;for(let n=0;n<5;n++){ctx.beginPath();ctx.arc(s*.44,s*.53,s*(.26+n*.026),2.8,5.6);ctx.stroke();}
      ctx.fillStyle='#a88d77';ctx.beginPath();ctx.arc(s*.71,s*.70,s*.08,0,Math.PI*2);ctx.fill();
    }
    if(key==='artAlt'){
      ctx.fillStyle='#363331';ctx.fillRect(s*.31,s*.38,s*.44,s*.35);
      ctx.fillStyle='#363331';ctx.beginPath();ctx.arc(s*.53,s*.39,s*.221,Math.PI,0);ctx.fill();
      ctx.strokeStyle='#e8dcc7';
      ctx.lineWidth=s*.05;
      for(let i=0;i<3;i++){
        ctx.beginPath();ctx.arc(s*.53,s*.42,s*(.06+.06*i),Math.PI,0);ctx.stroke();
      }
      ctx.fillStyle='#a5856f';ctx.beginPath();ctx.arc(s*.71,s*.23,s*.068,0,Math.PI*2);ctx.fill();
    }
    if(key==='mirror'){
      const reflected=ctx.createLinearGradient(0,s,s,0);
      for(const [at,color] of [[0,'#879e9c'],[.32,'#cad6ce'],[.49,'#aabfb9'],[.75,'#deded1'],[1,'#a9b7ac']]){
        reflected.addColorStop(at,color);
      }
      ctx.fillStyle=reflected;ctx.fillRect(0,0,s,s);
    }
    if (key==='windows' || key==='skyline' || key==='glass') {
      for(let y=3;y<s-4;y+=s/8) for(let x=4;x<s-4;x+=s/6){
        ctx.fillStyle=rng()<.22?'#ecd7a0':key==='glass'?'#f6eae0':'#617582';
        ctx.fillRect(x,y,s/11,s/16);
      }
    }
    if(key==='road'){
      ctx.fillStyle='#d9b391';
      for(let x=4;x<s;x+=s/6)ctx.fillRect(x,s/2,s/12,1.5);
    }
    ctx.restore();
  });
  return texture(sheet,!low);
}
