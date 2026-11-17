import { canStand, START } from '../app/game/layout.js';

const step=.20;
const startX=.10;
const startZ=-2.50;
const key=(column,row)=>column+','+row;

export function navigation() {
  const grid=new Map();
  for(let column=0;column<78;column++)for(let row=0;row<81;row++){
    const x=startX+column*step,z=startZ+row*step;
    if(canStand(x,z))grid.set(key(column,row),{x,z,column,row});
  }
  function nearest(position){
    return [...grid.values()].reduce((closest,point)=>{
      const d=Math.hypot(point.x-position.x,point.z-position.z);
      return !closest || d<closest.d ? {point,d} : closest;
    },null).point;
  }
  function search(from){
    const origin=nearest(from);
    const queue=[origin];
    const visited=new Map([[origin,null]]);
    for(let index=0;index<queue.length;index++){
      const here=queue[index];
      for(const [dc,dr] of [[0,1],[1,0],[0,-1],[-1,0]]){
        const adjacent=grid.get(key(here.column+dc,here.row+dr));
        if(adjacent && !visited.has(adjacent) && canStand((here.x+adjacent.x)/2,(here.z+adjacent.z)/2)){
          visited.set(adjacent,here);
          queue.push(adjacent);
        }
      }
    }
    return visited;
  }
  const reachable = [...search(START).keys()];
  function route(from,to){
    const tree=search(from);
    let cursor=nearest(to);
    if(!tree.has(cursor))throw Error('No route to '+JSON.stringify(to));
    const path=[];
    while(cursor){
      path.unshift([cursor.x,cursor.z]);
      cursor=tree.get(cursor);
    }
    return path;
  }
  function witnesses(spot){
    const slices = new Set();
    const angular=[];
    const nearby=reachable.map(({x,z})=>({x,z,d:Math.hypot(x-spot.x,z-spot.z)}))
      .filter(({d})=>d>.65&&d<5).sort((a,b)=>a.d-b.d);
    for(const point of nearby){
      const angle=Math.atan2(point.z-spot.z,point.x-spot.x);
      const slice=Math.round(angle*4);
      if(!slices.has(slice)){
        slices.add(slice);
        angular.push(point);
      }
    }
    return [...angular,...nearby.slice(0,115)].map(({x,z})=>[x,z]);
  }
  return {reachable,route,witnesses};
}
