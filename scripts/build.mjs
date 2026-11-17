import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { makeIcons } from './icons.mjs';
const path=(value)=>fileURLToPath(new URL('../'+value,import.meta.url));
const output=path('dist');
await rm(output,{recursive:true,force:true});
await cp(path('app'),output,{recursive:true});
await mkdir(path('dist/vendor/addons/utils'),{recursive:true});
for(const file of ['three.module.js','three.core.js']){
  await cp(path('node_modules/three/build/'+file),path('dist/vendor/'+file));
}
for(const file of ['utils/BufferGeometryUtils.js','geometries/RoundedBoxGeometry.js']){
  await cp(path('node_modules/three/examples/jsm/'+file),path('dist/vendor/addons/'+file));
}
await cp(path('node_modules/three/LICENSE'),path('dist/vendor/LICENSE'));
await makeIcons(path('dist/assets'));
console.log('Built dist/');
