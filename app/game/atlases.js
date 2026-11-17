import { canvas, texture } from './geometry.js';
import { random } from './rules.js';

export const tile = Object.fromEntries(
  ['wood','rug','wall','tile','art','linen','quilt','towel','pot','stone','street','windows','skyline','glass','road','green']
    .map((key,i) => [key, [(i%4)/4, (3-Math.floor(i/4))/4, .25, .25]]),
);

export function apartmentAtlas(low) {
  const s = low ? 104 : 160;
  const sheet = canvas(s*4,s*4);
  const ctx = sheet.getContext('2d');
  const rng = random(417);
  const pigments=['#dbb790','#e3dbc9','#f8f4e9','#e8e4d9','#eddfcc','#e2dfce','#d1d9c7','#e9e0c8','#c77b61','#e8dbca','#c5ab93','#c7b5a2','#aa9da4','#cedbdd','#74696a','#829170'];
  Object.keys(tile).forEach((key, i) => {
    ctx.save();
    ctx.translate(i%4*s, Math.floor(i/4)*s);
    ctx.beginPath(); ctx.rect(0,0,s,s); ctx.clip();
    ctx.fillStyle = pigments[i]; ctx.fillRect(0,0,s,s);
    for (let n=0; n<(low ? 480 : 1250); n++) {
      ctx.globalAlpha = rng()*.13;
      ctx.fillStyle = rng()<.48 ? '#29251d' : '#fffaf0';
      ctx.fillRect(rng()*s,rng()*s,key==='wood' ? 8+rng()*40 : 1+rng()*3, .35+rng());
    }
    ctx.globalAlpha=1;
    if (key==='wood') {
      for(let p=0;p<8;p++) {
        ctx.fillStyle=p%2?'#9c684844':'#fff4d06b'; ctx.fillRect(0,p*s/8,s,.9);
        ctx.fillStyle='#99653c44'; ctx.fillRect((p*43)%s,p*s/8,1,s/8);
      }
    }
    if (key==='tile') {
      ctx.strokeStyle='#b4a798'; ctx.lineWidth=1.4;
      for (let p=0;p<=4;p++) { const at=p*s/4; ctx.beginPath(); ctx.moveTo(at,0); ctx.lineTo(at,s); ctx.moveTo(0,at); ctx.lineTo(s,at); ctx.stroke(); }
    }
    if (key==='rug' || key==='towel' || key==='quilt') {
      ctx.lineWidth=1;
      ctx.strokeStyle='#71685435';
      for(let p=0;p<s;p+=5) {
        ctx.beginPath(); ctx.moveTo(p,0); ctx.lineTo(p,s); ctx.stroke();
        if(key==='quilt'){ ctx.beginPath(); ctx.moveTo(0,p); ctx.lineTo(s,p); ctx.stroke(); }
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
