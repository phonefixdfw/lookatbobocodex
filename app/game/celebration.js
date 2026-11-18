import { random } from './rules.js';

const RINGS={
  found:[{x:.50,y:.39,count:14,radius:.064,delay:0}],
  patriot:[
    {x:.27,y:.32,count:24,radius:.15,delay:0},
    {x:.73,y:.31,count:26,radius:.16,delay:160},
    {x:.50,y:.23,count:30,radius:.18,delay:340},
  ],
};
const PATRIOT_COLORS=['#d95053','#fff0dc','#658fdf','#f4b765'];

export function makeCelebration(canvas){
  const ctx=canvas?.getContext('2d');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,clearTimer=0,sequence=0;

  function clear(){
    cancelAnimationFrame(frame);
    clearTimeout(clearTimer);
    if(!canvas)return;
    canvas.hidden=true;
    delete canvas.dataset.effect;
  }

  function play(kind){
    if(!ctx)return;
    clear();
    canvas.hidden=false;
    canvas.dataset.effect=kind;
    const {width,height}=canvas.getBoundingClientRect();
    const ratio=Math.min(devicePixelRatio,1.5);
    canvas.width=Math.max(1,Math.round(width*ratio));
    canvas.height=Math.max(1,Math.round(height*ratio));
    ctx.setTransform(ratio,0,0,ratio,0,0);
    const patriotic=kind==='patriot';
    const lifetime=patriotic?1070:580;
    const radius=Math.min(width,height);
    const rng=random(++sequence*0x5b0b);
    const colors=patriotic?PATRIOT_COLORS:['#e5a951','#f9e2a9','#fff2d4'];
    const bursts=RINGS[kind].map(burst=>({...burst, sparks:Array.from({length:burst.count},(_,i)=>({
      angle:Math.PI*2*(i+rng()*.56)/burst.count,
      reach:radius*burst.radius*(.54+rng()*.55),
      size:1.2+rng()*1.7,
      color:colors[i%colors.length],
    }))}));

    function paint(elapsed,still){
      ctx.clearRect(0,0,width,height);
      for(const burst of bursts){
        const t=still?.58:(elapsed-burst.delay)/lifetime;
        if(t<=0||t>=1)continue;
        const progress=1-(1-t)**2;
        ctx.globalAlpha=(1-t)*Math.min(1,t*9)*.92;
        for(const spark of burst.sparks){
          const x=burst.x*width+Math.cos(spark.angle)*spark.reach*progress;
          const y=burst.y*height+Math.sin(spark.angle)*spark.reach*progress+radius*.042*t*t;
          const tail=still?0:Math.max(0,1-t)*spark.size*4;
          ctx.strokeStyle=spark.color;
          ctx.lineWidth=spark.size;
          ctx.lineCap='round';
          ctx.beginPath();
          ctx.moveTo(x-tail*Math.cos(spark.angle),y-tail*Math.sin(spark.angle));
          ctx.lineTo(x+.25,y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha=1;
    }

    if(motion.matches){
      paint(0,true);
      clearTimer=setTimeout(clear,patriotic?1350:500);
      return;
    }
    const start=performance.now();
    function step(now){
      const elapsed=now-start;
      if(elapsed>=lifetime+bursts.at(-1).delay){clear();return;}
      paint(elapsed,false);
      frame=requestAnimationFrame(step);
    }
    frame=requestAnimationFrame(step);
  }

  return {play,clear};
}
