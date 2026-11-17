import * as T from 'three';
import { canvas, texture } from './geometry.js';

export function makeKart() {
  const image = canvas(384,216);
  const ctx=image.getContext('2d');
  const map=texture(image);
  const monitor=new T.Mesh(new T.PlaneGeometry(1.55,.792),new T.MeshBasicMaterial({map}));
  monitor.position.set(1.90,.885,5.922);
  monitor.rotation.y=Math.PI;
  monitor.name='KART DASH';
  const hills=(color,horizon,peaks)=>{
    ctx.fillStyle=color;
    ctx.beginPath();ctx.moveTo(0,horizon);
    for(const [x,y] of peaks)ctx.lineTo(x,y);
    ctx.lineTo(384,horizon);ctx.closePath();ctx.fill();
  };
  function draw(t){
    const sky=ctx.createLinearGradient(0,0,0,104);
    sky.addColorStop(0,'#282755'); sky.addColorStop(1,'#f6a476');
    ctx.fillStyle=sky;ctx.fillRect(0,0,384,216);
    ctx.fillStyle='#ffd59b';ctx.beginPath();ctx.arc(270,69,37,0,Math.PI*2);ctx.fill();
    hills('#795e82',121,[[0,100],[57,60],[109,103],[153,53],[194,104],[260,79],[325,109],[373,70],[384,75]]);
    hills('#43486c',127,[[0,100],[48,95],[84,77],[134,114],[188,71],[228,110],[337,100],[372,83],[384,90]]);
    const phase=t*34;
    for(let y=96;y<216;y++){
      const p=(y-95)/120;
      const center=192+Math.sin(t*.42+p*2.8)*47*p;
      const width=12+210*p;
      const stripe=Math.floor(27/(p+.08)+phase)%2===0;
      ctx.fillStyle=stripe?'#495b67':'#415360';ctx.fillRect(0,y,384,1);
      ctx.fillStyle=stripe?'#f5c290':'#da765e';ctx.fillRect(center-width-9*p,y,2*(width+9*p),1);
      ctx.fillStyle=stripe?'#504263':'#4b3e5e';ctx.fillRect(center-width,y,width*2,1);
      if(stripe){
        ctx.fillStyle='#f3dbad';
        ctx.fillRect(center-width*.32-2*p,y,4*p,1);
        ctx.fillRect(center+width*.32-2*p,y,4*p,1);
      }
    }
    for(let i=0;i<4;i++){
      const z=((t*.19+i*.23)%1);
      const x=192+(i%2?-1:1)*(15+160*z);
      const y=97+112*z;
      const h=28*z+5;
      ctx.fillStyle='#e8bea3';ctx.fillRect(x,y-h,3*z+1,h);
      ctx.fillStyle='#eba44d';ctx.fillRect(x-3*z,y-h-5,18*z+2,9*z+2);
    }
    const k=192+Math.sin(t*1.3)*37;
    ctx.fillStyle='#191829';ctx.fillRect(k-28,185,56,13);ctx.fillRect(k-22,174,44,21);
    ctx.fillStyle='#d67d46';ctx.fillRect(k-19,174,38,16);
    ctx.fillStyle='#6db3ab';ctx.fillRect(k-15,158,30,15);
    ctx.fillStyle='#ecbd82';ctx.fillRect(k-9,159,16,6);
    ctx.fillStyle='#ffda9b';ctx.fillRect(k-16,179,8,5);ctx.fillRect(k+8,179,8,5);
    ctx.fillStyle='#2c2345';ctx.fillRect(12,12,140,24);ctx.fillRect(305,12,66,24);
    ctx.fillStyle='#ffe0aa';ctx.font='bold italic 18px monospace';ctx.fillText('KART DASH',20,30);
    ctx.font='bold 12px monospace';ctx.fillText('LAP 2/3',311,28);
    map.needsUpdate=true;
  }
  draw(0);
  return {monitor,draw};
}
