import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const matrix = new T.Matrix4();
const point = new T.Vector3();
const scale = new T.Vector3();
const rotation = new T.Quaternion();
const euler = new T.Euler();
const color = new T.Color();
const boxGeometry = new T.BoxGeometry(1,1,1);

export function transformed(base, x,y,z, sx,sy,sz, rx=0,ry=0,rz=0) {
  point.set(x,y,z);
  scale.set(sx,sy,sz);
  rotation.setFromEuler(euler.set(rx,ry,rz));
  return base.clone().applyMatrix4(matrix.compose(point,rotation,scale));
}

export function paint(geometry, tint, region = null) {
  const positions = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  const colors = new Float32Array(positions.count*3);
  color.set(tint);
  for (let i=0; i<positions.count; i++) {
    colors.set([color.r,color.g,color.b], i*3);
    if (region) {
      const [u,v,w,h] = region;
      uv.setXY(i, u+w*(.009+.982*uv.getX(i)), v+h*(.009+.982*uv.getY(i)));
    }
  }
  geometry.setAttribute('color', new T.BufferAttribute(colors,3));
  return geometry;
}

export class Batch {
  constructor(materials, low = false) {
    this.materials = materials;
    this.parts = new Map();
    this.soft = low ? boxGeometry : new RoundedBoxGeometry(1,1,1,2,.095);
    this.ball = new T.SphereGeometry(1,low ? 9 : 16,low ? 6 : 10);
    this.round = new T.CylinderGeometry(.5,.5,1,low ? 12 : 26);
  }
  add(base, x,y,z, w,h,d, tint, { rx=0,ry=0,rz=0, key='solid', uv } = {}) {
    const raw = transformed(base,x,y,z,w,h,d,rx,ry,rz);
    const geo = raw.index ? raw.toNonIndexed() : raw;
    if (raw !== geo) raw.dispose();
    if (!this.parts.has(key)) this.parts.set(key,[]);
    this.parts.get(key).push(paint(geo,tint,uv));
  }
  box(x,y,z,w,h,d,tint,opts) { this.add(boxGeometry,x,y,z,w,h,d,tint,opts); }
  cushion(x,y,z,w,h,d,tint,opts) { this.add(this.soft,x,y,z,w,h,d,tint,opts); }
  oval(x,y,z,w,h,d,tint,opts) { this.add(this.ball,x,y,z,w/2,h/2,d/2,tint,opts); }
  cyl(x,y,z,w,h,d,tint,opts) { this.add(this.round,x,y,z,w,h,d,tint,opts); }
  line(a,b,diameter,tint,key='solid') {
    const start = new T.Vector3(...a);
    const end = new T.Vector3(...b);
    const delta = end.clone().sub(start);
    const middle = start.addScaledVector(delta,.5);
    const pose = new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize()));
    this.cyl(...middle,diameter,delta.length(),diameter,tint,{rx:pose.x,ry:pose.y,rz:pose.z,key});
  }
  finish(group, tagging) {
    for (const [key, parts] of this.parts) {
      const mesh = new T.Mesh(mergeGeometries(parts), this.materials[key]);
      mesh.geometry.computeBoundingBox();
      mesh.name = tagging ?? '';
      mesh.userData.surface = key;
      group.add(mesh);
      for (const part of parts) part.dispose();
    }
    this.parts.clear();
    return group;
  }
}

export function canvas(width,height) {
  const image = document.createElement('canvas');
  image.width=width;
  image.height=height;
  return image;
}

export function texture(image, filtering = true) {
  const map = new T.CanvasTexture(image);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = filtering ? 4 : 1;
  return map;
}
