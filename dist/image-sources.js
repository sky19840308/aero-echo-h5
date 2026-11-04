// Image URLs are anchored to the game modules, including account-hosted pages.
export const IMAGE_VERSION='33.2';
export function validImageSource(value){return typeof value==='string'&&!!value.trim()&&!['undefined','null'].includes(value.trim())&&!/^javascript:/i.test(value);}
export function resourceUrl(src){const url=new URL(src,import.meta.url);if(url.protocol!=='data:'&&/\.(png|jpe?g|webp|svg)$/i.test(url.pathname))url.searchParams.set('v',IMAGE_VERSION);return url.href;}
export function imageSources(meta){return [...new Set([meta?.fallback,meta?.src,meta?.originalSrc].filter(validImageSource))];}
export function imageKey(src){if(!validImageSource(src))return '';const url=new URL(resourceUrl(src));url.searchParams.delete('v');url.searchParams.delete('retry');return url.href;}
export function indexImageSources(manifest){
 const index=new Map();
 function visit(value){if(!value||typeof value!=='object')return;const sources=imageSources(value);if(sources.length>1)for(const source of sources){const key=imageKey(source),group=index.get(key)||[];index.set(key,[...new Set([...group,...sources])]);}for(const child of Object.values(value))if(child&&typeof child==='object')visit(child);}
 visit(manifest);return index;
}

// DOM images also start with lightweight previews. If that preview fails, the
// full image must be tried in the reverse direction, without an error loop.
export function installImageRecovery(manifest,doc=globalThis.document){
 const index=indexImageSources(manifest),states=new WeakMap();
 function prepare(image){
  if(image?.tagName?.toUpperCase()!=='IMG')return null;
  const source=image.getAttribute('src');if(!validImageSource(source))return null;
  const current=resourceUrl(source),old=states.get(image);if(old?.requested===current)return old;
  const sources=[source,image.dataset.fallback,...(index.get(imageKey(source))||[])].filter(validImageSource).map(resourceUrl);
  const state={sources:[...new Set(sources)],tried:new Set([current]),requested:current,failed:false};states.set(image,state);
  image.dataset.imageState='loading';
  if(image.getAttribute('src')!==current)image.setAttribute('src',current);
  else if(image.complete&&image.naturalWidth>0)image.dataset.imageState='ready';
  return state;
 }
 function failed(event){const image=event.target,state=prepare(image);if(!state)return;const next=state.sources.find(src=>!state.tried.has(src));if(next){state.tried.add(next);state.requested=next;image.dataset.imageState='loading';image.setAttribute('src',next);}else{state.failed=true;image.dataset.imageState='failed';}}
 function loaded(event){const image=event.target;if(image?.tagName?.toUpperCase()!=='IMG')return;const state=prepare(image);if(state&&image.naturalWidth>0){state.failed=false;image.dataset.imageState='ready';}}
 function scan(node){if(node?.tagName?.toUpperCase()==='IMG')prepare(node);for(const image of node?.querySelectorAll?.('img')||[])prepare(image);}
 const observer=new MutationObserver(records=>{for(const record of records)if(record.type==='attributes')prepare(record.target);else for(const node of record.addedNodes)scan(node);});
 doc.addEventListener('error',failed,true);doc.addEventListener('load',loaded,true);scan(doc);
 observer.observe(doc.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','data-fallback']});
 const retry=()=>{for(const image of doc.querySelectorAll('img'))if(states.get(image)?.failed){states.delete(image);const state=prepare(image);if(state){state.requested=state.sources[0];image.setAttribute('src',state.requested);}}};
 doc.defaultView?.addEventListener('online',retry);
 return {retry,disconnect(){observer.disconnect();doc.removeEventListener('error',failed,true);doc.removeEventListener('load',loaded,true);doc.defaultView?.removeEventListener('online',retry);}};
}
