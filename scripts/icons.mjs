import { deflateSync } from 'node:zlib';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

function crc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes){
    crc^=byte;
    for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data){
  const name=Buffer.from(type);
  const result=Buffer.alloc(data.length+12);
  result.writeUInt32BE(data.length); name.copy(result,4);data.copy(result,8);
  result.writeUInt32BE(crc32(Buffer.concat([name,data])),data.length+8);
  return result;
}
const oval=(x,y,a,b,w,h)=>((x-a)/w)**2+((y-b)/h)**2<=1;
function triangle(x,y,a,b,c){
  const cross=(p,q)=> (x-q[0])*(p[1]-q[1])-(p[0]-q[0])*(y-q[1]);
  const side=cross(a,b)<0;
  return (cross(b,c)<0)===side && (cross(c,a)<0)===side;
}
function pixel(x,y){
  const colors={green:[51,75,63], cream:[247,228,199], black:[40,38,43], pink:[205,142,133], eye:[186,200,126], gold:[237,185,107]};
  let color=colors.green;
  if(oval(x,y,.5,.50,.348,.348))color=colors.gold;
  if(oval(x,y,.5,.70,.187,.118))color=colors.black;
  if(oval(x,y,.50,.71,.11,.086))color=colors.cream;
  if(oval(x,y,.5,.536,.205,.171))color=colors.black;
  if(triangle(x,y,[.30,.52],[.30,.294],[.465,.451]) || triangle(x,y,[.70,.52],[.70,.294],[.535,.451]))color=colors.black;
  if(triangle(x,y,[.332,.449],[.331,.348],[.404,.433]) || triangle(x,y,[.668,.449],[.669,.348],[.596,.433]))color=colors.pink;
  if(oval(x,y,.452,.596,.056,.041)||oval(x,y,.548,.596,.056,.041)||oval(x,y,.50,.619,.064,.032))color=colors.cream;
  if(oval(x,y,.493,.462,.018,.042))color=colors.cream;
  for(const ex of [.415,.585]){
    if(oval(x,y,ex,.526,.040,.032)) color=colors.eye;
    if(oval(x,y,ex,.526,.012,.026)) color=colors.black;
    if(oval(x,y,ex-.012,.517,.007,.007)) color=colors.cream;
  }
  if(oval(x,y,.50,.578,.022,.013))color=colors.pink;
  return color;
}

export async function makeIcons(directory){
  await mkdir(directory,{recursive:true});
  for(const [name,size] of [['apple-touch-icon',180],['icon-192',192],['icon-512',512]]){
    const rows=Buffer.alloc(size*(1+3*size));
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const aa=[[.25,.25],[.75,.25],[.25,.75],[.75,.75]].map(([ox,oy])=>pixel((x+ox)/size,(y+oy)/size));
      for(let c=0;c<3;c++)rows[y*(1+3*size)+1+x*3+c]=Math.round(aa.reduce((sum,p)=>sum+p[c],0)/aa.length);
    }
    const header=Buffer.alloc(13);
    header.writeUInt32BE(size);header.writeUInt32BE(size,4);
    header[8]=8;header[9]=2;
    const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
      chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
    await writeFile(resolve(directory,name+'.png'),png);
  }
}
