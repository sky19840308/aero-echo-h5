import {packager} from '@electron/packager';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),source=path.resolve(process.argv[2]||path.join(dir,'../dist')),out=path.resolve(process.argv[3]||path.join(dir,'../../output/build33/windows'));
fs.rmSync(path.join(dir,'game'),{recursive:true,force:true});fs.cpSync(source,path.join(dir,'game'),{recursive:true,filter:f=>!/(?:qa33-|\.qa-assets|runtime-build[0-9]+\.sha256)/.test(path.basename(f))});
fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'aero-echo',productName:'AERO ECHO',version:'1.33.0',private:true,main:'main.cjs',description:'AERO ECHO desktop shooting game',license:'UNLICENSED',devDependencies:{'@electron/packager':'20.3.0'}},null,2)+'\n');
const result=await packager({dir,out,platform:'win32',arch:'x64',electronVersion:'45.2.2',name:'AERO ECHO',appVersion:'1.33.0',buildVersion:'1.33.0',overwrite:true,asar:true,prune:true,ignore:[/node_modules/,/build\.mjs/,/package-lock\.json/],win32metadata:{CompanyName:'AERO ECHO',FileDescription:'AERO ECHO',ProductName:'AERO ECHO',InternalName:'AERO ECHO'}});
console.log(JSON.stringify({windows:result}));
