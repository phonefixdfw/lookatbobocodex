import { writeFile } from 'node:fs/promises';
import { rooms, walls, furniture, START } from '../app/game/layout.js';

const scale=43;
const x=value=>42+value*scale;
const y=value=>142+value*scale;
const rect=(x0,z0,w,h,attrs)=>'<rect x="'+x(x0)+'" y="'+y(z0)+'" width="'+w*scale+'" height="'+h*scale+'" '+attrs+'/>';
const line=(x0,z0,x1,z1,attrs)=>'<line x1="'+x(x0)+'" y1="'+y(z0)+'" x2="'+x(x1)+'" y2="'+y(z1)+'" '+attrs+'/>';
const label=(text,x0,z0,attrs='')=>'<text x="'+x(x0)+'" y="'+y(z0)+'" '+attrs+'>'+text+'</text>';
const colors={living:'#ead8be',dining:'#eedfc6',kitchen:'#d8e1d2',landing:'#e8e0cc',hall:'#ead5c1',bedroom:'#e1dacd',bath:'#dce4da',patio:'#ead5bf'};
const labels={
  living:['LIVING',1.50,5.09],dining:['DINING',8.60,.83],kitchen:['KITCHEN',13.0,2.07],landing:['LANDING',8.55,5.66],
  hall:['HALL · 2.40 m',8.2,7.16],bedroom:['BEDROOM',4.28,10.03],bath:['BATH',11.60,10.49],patio:['PATIO',4.87,-1.48],
};
const parts=['<svg xmlns="http://www.w3.org/2000/svg" width="758" height="810" viewBox="0 0 758 810" role="img" aria-labelledby="title"><title id="title">Look at Bobo scale apartment plan</title>',
  '<rect width="758" height="810" rx="16" fill="#f6eee2"/><g font-family="system-ui,sans-serif" fill="#342d25">',
  label('Apartment plan · metres',0,-2.96,'font-size="16" font-weight="700"'),
  label('↑ N',14.68,-2.96,'font-size="13" font-weight="700"')];
for(const [name,[x0,z0,x1,z1]] of Object.entries(rooms))parts.push(rect(x0,z0,x1-x0,z1-z0,'fill="'+colors[name]+'" stroke="#9e8d78" stroke-width=".55"'));
for(let n=0;n<16;n++)parts.push(line(n,0,n,13.6,'stroke="#9b887c" stroke-opacity=".32" stroke-dasharray="2 4"'));
for(let n=0;n<14;n++)parts.push(line(0,n,15.6,n,'stroke="#9b887c" stroke-opacity=".32" stroke-dasharray="2 4"'));
for(const f of Object.values(furniture)){
  const {x:fx,z,width,depth,kind}=f;
  if(['dining','stool','plant','trash'].includes(kind)){
    parts.push('<ellipse cx="'+x(fx)+'" cy="'+y(z)+'" rx="'+width*scale/2+'" ry="'+depth*scale/2+'" fill="#ac987b" opacity=".67"/>');
  }else parts.push(rect(fx-width/2,z-depth/2,width,depth,'rx="3" fill="#ac987b" opacity=".67"'));
}
for(const {x1,z1,x2,z2} of walls)parts.push(line(x1,z1,x2,z2,'stroke="#524639" stroke-width="5" stroke-linecap="square"'));
for(const [text,x0,z0] of Object.values(labels))parts.push(label(text,x0,z0,'text-anchor="middle" font-size="10" letter-spacing="1.2" font-weight="750"'));
parts.push('<circle cx="'+x(START.x)+'" cy="'+y(START.z)+'" r="5" fill="#345144"/>',label('Entry spawn',5.02,5.42,'text-anchor="middle" font-size="8" fill="#345144"'));
parts.push(line(0,14.52,2,14.52,'stroke="#524639" stroke-width="2"'));
for(const [meters,text] of [[0,'0'],[.90,'0.90'],[1,'1'],[2,'2 m']]){
  const highlight=meters===.90;
  parts.push(line(meters,14.4,meters,14.66,'stroke="'+(highlight?'#a15c3c':'#524639')+'" stroke-width="2"'));
  parts.push(label(text,meters,highlight?14.20:14.93,'font-size="10" text-anchor="middle"'));
}
parts.push(label('15.60 m east–west · 13.60 m interior north–south',15.6,14.71,'text-anchor="end" font-size="11"'),'</g></svg>');
await writeFile(new URL('../docs/floor-plan.svg',import.meta.url),parts.join('\n')+'\n');
