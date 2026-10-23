// Reproduce the Pages media assembly without writing generated files into source.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {prepareManifest} from './prepare-manifest.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const option=name=>args[args.indexOf(name)+1];
if(!args.includes('--base')||!args.includes('--out'))throw new Error('Usage: node tools/assemble-runtime.mjs --base <extracted bundle root> --out <runtime root>');
const base=path.resolve(option('--base')),out=path.resolve(option('--out'));
if(base===out||out===root)throw new Error('Use a separate output directory');
fs.mkdirSync(out,{recursive:true});
fs.cpSync(path.join(base,'dist'),path.join(out,'dist'),{recursive:true});
fs.cpSync(path.join(root,'dist'),path.join(out,'dist'),{recursive:true});
let skins;
const transport=JSON.parse(fs.readFileSync(path.join(root,'tools/github/binary-manifest15.json'),'utf8'));
for(const entry of transport.files){
 const data=Buffer.from(entry.parts.map(part=>fs.readFileSync(path.join(root,part),'utf8')).join(''),'base64');
 if(crypto.createHash('sha256').update(data).digest('hex')!==entry.sha256)throw new Error('Invalid transport: '+entry.target);
 if(entry.target==='tools/github/skin-manifest15.json'){skins=JSON.parse(data.toString('utf8'));continue;}
 if(!entry.target.startsWith('dist/')||entry.target.includes('..'))throw new Error('Invalid runtime target');
 const target=path.join(out,entry.target);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);
}
const target=path.join(out,'dist/assets/manifest.json');
const manifest=JSON.parse(fs.readFileSync(target,'utf8'));Object.assign(manifest,skins);
fs.writeFileSync(target,JSON.stringify(manifest));
if(args.includes('--optimize'))prepareManifest(path.join(out,'dist'));
fs.cpSync(path.join(root,'tests'),path.join(out,'tests'),{recursive:true});
console.log('Assembled runtime: '+out);
