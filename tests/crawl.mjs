import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { serve } from '../scripts/serve.mjs';

const routes=(await readdir(resolve('dist'),{recursive:true,withFileTypes:true}))
  .filter(entry=>entry.isFile()).map(entry=>resolve(entry.parentPath,entry.name).slice(resolve('dist').length+1));
const {server,url}=await serve();
try{
  const index=await fetch(url);
  assert(index.ok);
  const html=await index.text();
  assert.match(html,/<title>Look at Bobo!<\/title>/);
  const manifest=await (await fetch(new URL('manifest.webmanifest',url))).json();
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.scope,'./');
  for(const icon of manifest.icons){
    const response=await fetch(new URL(icon.src,url));
    assert(response.ok);
    assert.equal(response.headers.get('content-type'),'image/png');
    const header=Buffer.from(await response.arrayBuffer());
    assert.equal(header.readUInt32BE(16),Number(icon.sizes.split('x')[0]));
  }
  for(const [,target] of html.matchAll(/(?:href|src)="(\.\/[^"]+)"/g)){
    assert((await fetch(new URL(target,url))).ok,'broken HTML link '+target);
  }
  await Promise.all(routes.map(async path=>{
    const response=await fetch(new URL(path,url));
    assert(response.ok,'missing '+path);
    const bytes=Buffer.from(await response.arrayBuffer());
    assert(bytes.length>0 || path==='.nojekyll','empty file '+path);
    if(path.endsWith('.wav')){
      assert.equal(bytes.toString('ascii',0,4),'RIFF');
      assert(bytes.length>10000,'silent or empty generated voice '+path);
    }
    if(path.endsWith('.js') && !path.startsWith('vendor/')){
      for(const [,entry] of bytes.toString().matchAll(/from ['"](\.[^'"]+)['"]/g)){
        assert((await fetch(new URL(entry,new URL(path,url)))).ok,'broken module import '+entry);
      }
    }
  }));
  assert.equal((await fetch(new URL('missing-file',url))).status,404);
  console.log('Crawled '+routes.length+' static files, manifest icons, HTML links, module imports and voice assets.');
} finally{await new Promise(done=>server.close(done));}
