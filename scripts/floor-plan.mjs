import { writeFile } from 'node:fs/promises';
import { rooms, walls, furniture, START } from '../app/game/layout.js';

const floorWidth=rooms.kitchen[2];
const floorEnd=rooms.bedroom[3];
const patioStart=rooms.patio[1];
const floorArea=Object.entries(rooms).reduce((total,[key,[x0,z0,x1,z1]])=>
  total+(key==='patio'?0:(x1-x0)*(z1-z0)),0);
const scale=56;
const width=Math.ceil(floorWidth*scale+84);
const height=Math.ceil((floorEnd-patioStart)*scale+140);
const x=value=>42+value*scale;
const y=value=>57+(value-patioStart)*scale;
const rect=(x0,z0,w,h,attrs)=>'<rect x="'+x(x0)+'" y="'+y(z0)+'" width="'+w*scale+'" height="'+h*scale+'" '+attrs+'/>';
const line=(x0,z0,x1,z1,attrs)=>'<line x1="'+x(x0)+'" y1="'+y(z0)+'" x2="'+x(x1)+'" y2="'+y(z1)+'" '+attrs+'/>';
const label=(text,x0,z0,attrs='')=>'<text x="'+x(x0)+'" y="'+y(z0)+'" '+attrs+'>'+text+'</text>';
const colors={living:'#ead8be',dining:'#eedfc6',kitchen:'#d8e1d2',landing:'#e8e0cc',hall:'#ead5c1',bedroom:'#e1dacd',bath:'#dce4da',patio:'#ead5bf'};
const labels={
  living:['LIVING',1.69,3.66],dining:['DINING',5.93,2.69],kitchen:['KITCHEN',8.89,1.40],
  landing:['ENTRY',5.80,3.86],hall:['PRIVATE HALL',5.33,5.22],
  bedroom:['BEDROOM',2.26,6.72],bath:['BATH',5.76,6.45],patio:['BALCONY',1.95,-.50],
};
const parts=['<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'" role="img" aria-labelledby="title"><title id="title">Look at Bobo compact one-bedroom floor plan</title>',
  '<rect width="'+width+'" height="'+height+'" rx="16" fill="#f6eee2"/><g font-family="system-ui,sans-serif" fill="#342d25">',
  label('One-bedroom apartment · '+Math.round(floorArea*10.76391)+' sq ft indoors',0,patioStart-.43,'font-size="16" font-weight="700"'),
  label('↑ N',floorWidth,patioStart-.43,'text-anchor="end" font-size="13" font-weight="700"')];
for(const [name,[x0,z0,x1,z1]] of Object.entries(rooms)){
  parts.push(rect(x0,z0,x1-x0,z1-z0,'fill="'+colors[name]+'" stroke="#9e8d78" stroke-width=".55"'));
  for(let n=Math.ceil(x0);n<x1;n++)parts.push(line(n,z0,n,z1,'stroke="#9b887c" stroke-opacity=".28" stroke-dasharray="2 4"'));
  for(let n=Math.ceil(z0);n<z1;n++)parts.push(line(x0,n,x1,n,'stroke="#9b887c" stroke-opacity=".28" stroke-dasharray="2 4"'));
}
for(const {x:fx,z,width:wide,depth,kind} of Object.values(furniture)){
  if(['dining','stool','plant','trash'].includes(kind)){
    parts.push('<ellipse cx="'+x(fx)+'" cy="'+y(z)+'" rx="'+wide*scale/2+'" ry="'+depth*scale/2+'" fill="#ac987b" opacity=".67"/>');
  }else parts.push(rect(fx-wide/2,z-depth/2,wide,depth,'rx="3" fill="#ac987b" opacity=".67"'));
}
for(const {x1,z1,x2,z2} of walls)parts.push(line(x1,z1,x2,z2,'stroke="#524639" stroke-width="5" stroke-linecap="square"'));
for(const [text,x0,z0] of Object.values(labels))parts.push(label(text,x0,z0,'text-anchor="middle" font-size="10" letter-spacing="1.1" font-weight="750"'));
parts.push('<circle cx="'+x(START.x)+'" cy="'+y(START.z)+'" r="5" fill="#345144"/>',
  label('Start',START.x,START.z+.28,'text-anchor="middle" font-size="9" fill="#345144"'));
const ruler=floorEnd+.70;
parts.push(line(0,ruler,2,ruler,'stroke="#524639" stroke-width="2"'));
for(const [meters,text] of [[0,'0'],[.90,'0.90'],[1,'1'],[2,'2 m']]){
  const highlight=meters===.90;
  parts.push(line(meters,ruler-.12,meters,ruler+.14,'stroke="'+(highlight?'#a15c3c':'#524639')+'" stroke-width="2"'));
  parts.push(label(text,meters,ruler+(highlight?-.32:.41),'font-size="10" text-anchor="middle"'));
}
parts.push(label('1 m grid · 0.90 m minimum tested clearance',floorWidth,ruler+.15,'text-anchor="end" font-size="11"'),'</g></svg>');
await writeFile(new URL('../docs/floor-plan.svg',import.meta.url),parts.join('\n')+'\n');
