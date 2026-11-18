import * as T from 'three';
import { Batch, canvas, texture } from './geometry.js';

function flagTexture() {
  const image=canvas(190,100);
  const ctx=image.getContext('2d');
  const stripe=image.height/13;
  for(let i=0;i<13;i++){
    ctx.fillStyle=i%2?'#fff7e8':'#ba3b43';
    ctx.fillRect(0,i*stripe,image.width,stripe+.5);
  }
  const cantonWidth=76, cantonHeight=stripe*7;
  ctx.fillStyle='#243d65';
  ctx.fillRect(0,0,cantonWidth,cantonHeight);
  ctx.fillStyle='#fff7e8';
  for(let row=0;row<9;row++){
    const offset=row%2?.5:0;
    for(let column=0;column<6-row%2;column++){
      const x=(column+1+offset)*cantonWidth/7;
      const y=(row+1)*cantonHeight/10;
      ctx.beginPath();
      for(let point=0;point<10;point++){
        const angle=point*Math.PI/5-Math.PI/2;
        const radius=point%2?1:2.35;
        ctx.lineTo(x+radius*Math.cos(angle),y+radius*Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  return texture(image);
}

let flagMaterial;
export function addPatriotAccessories(parent,materials,low,headHeight) {
  const kit=new T.Group();
  kit.name='Patriot Bobo accessories';
  parent.add(kit);
  flagMaterial??=new T.MeshBasicMaterial({map:flagTexture(),side:T.DoubleSide,toneMapped:false});
  const geometry=new T.PlaneGeometry(.176,.102,low?4:10,1);
  const vertices=geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const progress=vertices.getX(i)/.176+.5;
    vertices.setZ(i,.019*progress*Math.sin(progress*Math.PI*2.2));
    vertices.setY(i,vertices.getY(i)-progress*.017);
  }
  geometry.computeVertexNormals();

  const detail=new Batch(materials,low);
  for(const side of [-1,1]){
    const top=headHeight+.218;
    detail.line([side*.076,.09,-.11],[side*.175,top,-.10],.008,'#ba8c4e');
    detail.oval(side*.175,top,-.10,.021,.021,.021,'#f1c371');
    const flag=new T.Mesh(geometry,flagMaterial);
    flag.name='American flag';
    flag.position.set(side*.251,top-.062,-.10);
    if(side===-1)flag.rotation.y=Math.PI;
    kit.add(flag);
  }

  // A small sculpted eagle perched beside Bobo's shoulder.
  const x=.198, y=headHeight-.082, z=.064;
  detail.oval(x,y-.018,z,.111,.122,.114,'#4d3125');
  detail.oval(x,y+.054,z+.026,.091,.082,.078,'#fff3db');
  detail.oval(x,y+.042,z+.065,.047,.032,.046,'#eead46',{rx:-.29});
  detail.oval(x,y+.033,z+.079,.026,.026,.024,'#c98829',{rx:-.5});
  detail.oval(x,y-.069,z-.049,.065,.042,.064,'#f0dfc4',{rx:-.42});
  for(const side of [-1,1]){
    detail.oval(x+side*.027,y+.066,z+.054,.016,.015,.012,'#231b1c');
    detail.oval(x+side*.023,y-.079,z+.038,.025,.023,.039,'#d49339');
    detail.oval(x+side*.052,y+.012,z-.017,.051,.142,.074,'#5b3a29',{rz:side*-.60,rx:.20});
    for(let feather=0;feather<3;feather++){
      detail.oval(x+side*(.062+feather*.015),y-.006+feather*.015,z-.035,
        .019,.068,.027,feather%2?'#634632':'#443020',{rz:side*-.63});
    }
  }
  detail.finish(kit,'Bald eagle and flagpoles');
  // Decorations are visible but only the cat and cap can score a hit.
  kit.children.forEach(mesh=>{mesh.userData.aimable=false;});
}
