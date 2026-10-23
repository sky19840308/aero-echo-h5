import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(process.argv[2]);
function walk(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name)):entry.isFile()?[path.join(folder,entry.name)]:[]);}
for(const filename of walk(path.join(root,'dist')).sort()){
 const hash=crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
 process.stdout.write(hash+'  '+path.relative(root,filename).split(path.sep).join('/')+'\n');
}
