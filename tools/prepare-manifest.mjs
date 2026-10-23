import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Keep every reviewed fallback, but load it on demand with its chapter/ship.
// The entry manifest no longer downloads and parses several MB of base64.
export function prepareManifest(dist){
 const filename=path.join(dist,'assets/manifest.json');
 const original=fs.readFileSync(filename),manifest=JSON.parse(original);
 const folder=path.join(dist,'assets/fallbacks');fs.mkdirSync(folder,{recursive:true});
 const files=new Set();let references=0;
 function visit(value){
  if(!value||typeof value!=='object')return;
  for(const [key,item] of Object.entries(value)){
   if(typeof item==='string'&&item.startsWith('data:image/')){
    const match=/^data:image\/(png|jpeg|webp|svg\+xml);base64,([A-Za-z0-9+/=\s]+)$/.exec(item);
    if(!match)throw new Error('Unsupported embedded image');
    const data=Buffer.from(match[2],'base64'),hash=crypto.createHash('sha256').update(data).digest('hex');
    const ext=match[1]==='jpeg'?'jpg':match[1]==='svg+xml'?'svg':match[1];
    const src='assets/fallbacks/'+hash+'.'+ext;
    if(!files.has(src))fs.writeFileSync(path.join(dist,src),data);
    files.add(src);references++;value[key]=src;
   }else visit(item);
  }
 }
 visit(manifest);const content=JSON.stringify(manifest);fs.writeFileSync(filename,content);
 const result={beforeBytes:original.byteLength,afterBytes:Buffer.byteLength(content),references,images:files.size};
 console.log('Manifest prepared: '+JSON.stringify(result));return result;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 if(!process.argv[2])throw new Error('Usage: node tools/prepare-manifest.mjs <dist>');
 prepareManifest(path.resolve(process.argv[2]));
}
