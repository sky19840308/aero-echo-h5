import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AssetStore} from '../dist/asset-loader.js?v=33';
import {resourceUrl,imageSources,imageKey,indexImageSources,installImageRecovery} from '../dist/image-sources.js?v=33';
import {stageConfig,SHIPS} from '../dist/data.js?v=33';
import {gameIcon} from '../dist/ui-art.js?v=33';

assert.deepEqual(imageSources({src:'full.png',fallback:'preview.png',originalSrc:'original.jpg'}),['preview.png','full.png','original.jpg']);
assert.deepEqual(imageSources({src:'full.png',fallback:'undefined'}),['full.png']);
assert.equal(imageKey('full.png?v=24'),imageKey('full.png?v=33&retry=1'));
assert.equal(new URL(resourceUrl('full.png?v=24')).searchParams.get('v'),'32');

const manifest=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url)));
const requested=[],blocked=new Set(),badDecode=new Set();
globalThis.Image=class{
 constructor(){this.naturalWidth=0;this.naturalHeight=0;this.complete=false;}
 set src(value){this.value=value;if(!value)return;const pathname=new URL(value).pathname;requested.push(pathname);queueMicrotask(()=>{if(this.value!==value)return;if([...blocked].some(s=>pathname.endsWith(s)))this.onerror?.();else{this.complete=true;this.onload?.();}});}
 get src(){return this.value;}
 async decode(){await Promise.resolve();if([...badDecode].some(s=>new URL(this.value).pathname.endsWith(s)))throw new Error('Decode failed');this.naturalWidth=240;this.naturalHeight=240;}
};

for(let shipIndex=0;shipIndex<3;shipIndex++){
 const ship=SHIPS[shipIndex].id,meta=manifest.players[ship][0];blocked.clear();blocked.add(meta.fallback);
 const assets=new AssetStore(manifest,{retries:0,timeoutMs:1000});
 await assets.forStage(stageConfig(0,0,'campaign','quick'),ship,0);
 assert.equal(assets.get(meta.src)?.naturalWidth,240,'failed aircraft preview falls back to the full PNG before flight');
 assert.ok(requested.some(p=>p.endsWith(meta.src)));
 await Promise.all([assets.essentialReady,assets.effectsReady,assets.backgroundReady]);
}
blocked.clear();badDecode.add('preview.png');
const assets=new AssetStore(manifest,{retries:0,timeoutMs:1000});
const recovered=await assets.loadTexture({src:'full.png',fallback:'preview.png'});
assert.ok(recovered.src.includes('full.png'),'an undecodable image must not become a usable Canvas texture');
assert.equal(recovered.naturalWidth,240,'preflight awaits decode, not just onload');
badDecode.clear();blocked.add('preview.png');blocked.add('full.png');
assert.equal(await assets.loadTexture({src:'full.png',fallback:'preview.png'}),recovered,'a decoded cache remains usable when the network goes down');
blocked.add('missing-full.png');blocked.add('missing-preview.png');
const unavailable=new AssetStore(manifest,{retries:0,timeoutMs:1000});
await assert.rejects(()=>unavailable.loadTexture({src:'missing-full.png',fallback:'missing-preview.png'}));

globalThis.MutationObserver=class{observe(){}disconnect(){}};
class DOMImage{
 constructor(src,backup){this.tagName='IMG';this.dataset={fallback:backup};this.attributes={src};this.assignments=[];this.complete=false;this.naturalWidth=0;}
 getAttribute(name){return this.attributes[name]??null;}
 setAttribute(name,value){this.attributes[name]=value;this.assignments.push(value);}
}
const photo=new DOMImage(manifest.pilots.Dawn7.fallback),icon=new DOMImage('icon-without-backup.png','undefined'),events=new Map();
const doc={documentElement:{},defaultView:{addEventListener(){},removeEventListener(){}},querySelectorAll:()=>[photo,icon],addEventListener:(type,fn)=>events.set(type,fn),removeEventListener:(type)=>events.delete(type)};
const index=indexImageSources(manifest);
assert.ok(index.get(imageKey(manifest.pilots.Dawn7.fallback)).includes(manifest.pilots.Dawn7.src),'preview-to-original lookup exists for pilot portraits');
const recovery=installImageRecovery(manifest,doc);
events.get('error')({target:photo});
assert.equal(photo.getAttribute('src'),resourceUrl(manifest.pilots.Dawn7.src));
events.get('error')({target:photo});
assert.equal(photo.getAttribute('src'),resourceUrl(manifest.pilots.Dawn7.originalSrc));
events.get('error')({target:photo});const count=photo.assignments.length;
for(let i=0;i<10;i++)events.get('error')({target:photo});
assert.equal(photo.assignments.length,count,'broken sources never reassign themselves in an error loop');
assert.equal(photo.dataset.imageState,'failed');
events.get('error')({target:icon});
assert.equal(icon.assignments.length,1,'a missing fallback never requests the literal undefined URL');
assert.equal(icon.dataset.imageState,'failed');
photo.naturalWidth=720;events.get('load')({target:photo});assert.equal(photo.dataset.imageState,'ready');
recovery.disconnect();
assert.ok(!gameIcon({menuArt:{icons:{test:{src:'icon.png'}}}},'test').includes('data-fallback="undefined"'));
console.log('Passed: 3 aircraft recover before flight, decoded textures, reverse pilot fallbacks, bounded DOM recovery, invalid fallback rejection.');
