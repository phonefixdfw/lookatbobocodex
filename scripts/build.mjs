import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { relative, resolve, sep } from 'node:path';
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
const files=(await readdir(output,{withFileTypes:true,recursive:true})).filter(entry=>entry.isFile())
  .map(entry=>relative(output,resolve(entry.parentPath,entry.name)).split(sep).join('/')).sort();
const worker=await readFile(path('scripts/service-worker.js'),'utf8');
const hash=createHash('sha256').update(worker);
for(const file of files)hash.update(file).update(await readFile(resolve(output,file)));
const build=hash.digest('hex').slice(0,20);
await writeFile(path('dist/sw.js'),'const BUILD = '+JSON.stringify(build)+';\nconst FILES = '+JSON.stringify(files)+';\n'+worker);
console.log('Built dist/ ('+build+')');
