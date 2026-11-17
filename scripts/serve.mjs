import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.png':'image/png','.wav':'audio/wav','.webmanifest':'application/manifest+json','.txt':'text/plain'};

export function serve({port=0,dir='dist'}={}){
  const root=resolve(dir);
  const server=http.createServer(async (request,response)=>{
    try{
      const route=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
      let file=resolve(root,'.'+route);
      if(file!==root && !file.startsWith(root+sep)){response.writeHead(403).end();return;}
      let info=await stat(file);
      if(info.isDirectory()){file=resolve(file,'index.html');info=await stat(file);}
      if(!info.isFile()){response.writeHead(404).end();return;}
      response.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-cache'});
      if(request.method==='HEAD')response.end();
      else createReadStream(file).pipe(response);
    }catch{
      response.writeHead(404).end('Not found');
    }
  });
  return new Promise((success,failure)=>{
    server.once('error',failure);
    server.listen(port,'127.0.0.1',()=>{
      success({server,url:'http://127.0.0.1:'+server.address().port+'/'});
    });
  });
}
if(pathToFileURL(process.argv[1]).href===import.meta.url){
  const {url}=await serve({port:Number(process.env.PORT??4173)});
  console.log('Local '+url);
}
