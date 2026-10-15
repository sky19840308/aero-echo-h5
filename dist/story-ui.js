import {STORY,PILOT_TEXT,STORY_UI} from './story-content.js?v=23';
import {CHAPTERS,SHIPS} from './data.js?v=23';
import {getLocale} from './i18n.js?v=23';

export const storyText=value=>value?.[getLocale()]||value?.zh||'';
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const pilotForShip=index=>PILOT_TEXT.find(p=>p.shipId===SHIPS[index].id);
export const pilotImage=(pilot,manifest)=>manifest?.pilots?.[pilot.shipId]?.fallback||manifest?.pilots?.[pilot.shipId]?.src||'';
export function pilotChoices(manifest,selected){return PILOT_TEXT.map((pilot,index)=>`<button class="pilot-choice ${selected===index?'active':''}" data-action="ship" data-value="${index}" aria-pressed="${selected===index}" aria-label="${escape(storyText(pilot.name))}"><img src="${pilotImage(pilot,manifest)}" alt="${escape(storyText(pilot.name))}"><span>${escape(storyText(pilot.name))}</span></button>`).join('');}
export function pilotBiography(index,manifest){const pilot=pilotForShip(index);return `<div class="pilot-biography"><img src="${pilotImage(pilot,manifest)}" alt="${escape(storyText(pilot.name))}"><div><small>${escape(storyText(STORY_UI.pilot))}</small><h3>${escape(storyText(pilot.name))}</h3><p>${escape(storyText(pilot.bio))}</p></div></div>`;}

export function storyPages(kind,chapter=0){
 const narrative=STORY.chapters[chapter],make=(lines,title,kicker)=>lines.map(entry=>({...entry,chapter,title,kicker}));
 if(kind==='prologue')return make([{speaker:'narrator',text:STORY.prologue.text},...STORY.prologue.lines],STORY.prologue.title,STORY_UI.opening);
 if(kind==='ending')return make([{speaker:'narrator',text:STORY.ending.text},...STORY.ending.lines],STORY.ending.title,STORY_UI.ending);
 const lines=kind==='boss'?narrative.bossIntro:kind==='victory'?narrative.victory:narrative.intro;
 return make(lines,narrative.subtitle,kind==='boss'?STORY_UI.bossArrival:kind==='victory'?STORY_UI.victory:STORY_UI.chapterIntro);
}
export function storySceneHtml(context,manifest){
 const page=context.pages[context.index],pilot=PILOT_TEXT.find(p=>p.id===page.speaker),boss=page.speaker==='boss';
 const name=pilot?storyText(pilot.name):boss?storyText(STORY.chapters[page.chapter].leader):'AERO ECHO';
 const src=pilot?pilotImage(pilot,manifest):boss?manifest.story?.bossPortraitFallbacks?.[page.chapter]||manifest.story?.bossPortraits?.[page.chapter]:'';
 const backup=boss?manifest.story?.bossPortraitFallbacks?.[page.chapter]:'';
 return `<article class="story-scene"><div class="story-visual ${pilot||boss?'portrait':'landscape'}">${src?`<img src="${src}" alt="${escape(name)}" ${backup?`data-fallback="${backup}"`:''}>`:''}</div><div class="story-caption"><small>${escape(storyText(page.kicker))} · ${context.index+1} / ${context.pages.length}</small><h3>${escape(storyText(page.title))}</h3><b>${escape(name)}</b><p>${escape(storyText(page.text))}</p></div></article><button class="primary" data-action="story-next">${escape(storyText(STORY_UI.next))} ↗</button><button class="secondary" data-action="story-skip">${escape(storyText(STORY_UI.skip))}</button>`;
}
export function storyArchiveHtml(manifest){return `<p class="modal-note">${escape(storyText(STORY.prologue.text))}</p><button class="secondary" data-action="story-replay" data-value="prologue">${escape(storyText(STORY_UI.opening))} ↗</button>${STORY.chapters.map((chapter,index)=>`<article class="story-card story-chapter"><img src="${manifest.story?.bossPortraits?.[index]||''}" data-fallback="${manifest.story?.bossPortraitFallbacks?.[index]||''}" alt="${escape(storyText(chapter.leader))}" loading="lazy"><small>${String(index+1).padStart(2,'0')} / ${escape(CHAPTERS[index].name)}</small><h3>${escape(storyText(chapter.leader))}</h3><p>${escape(storyText(chapter.theme))}</p>${chapter.missionText.map((text,i)=>`<p><span>${index+1}-${i+1}</span> ${escape(storyText(text))}</p>`).join('')}<button class="secondary small" data-action="story-replay" data-value="chapter-${index}">${escape(storyText(STORY_UI.replay))} ↗</button></article>`).join('')}<div class="story-card"><h3>${escape(storyText(STORY.ending.title))}</h3><p>${escape(storyText(STORY.ending.text))}</p><button class="secondary small" data-action="story-replay" data-value="ending">${escape(storyText(STORY_UI.ending))} ↗</button></div>`;}
export function storyGalleryHtml(manifest){return `<p class="modal-note">${escape(storyText(STORY_UI.conceptArt))} · ${manifest.story?.gallery?.length||0}</p><div class="story-gallery">${(manifest.story?.gallery||[]).map(art=>`<button class="gallery-card" data-action="story-art" data-value="${art.id}"><img src="${art.thumb}" alt="${escape(storyText(art.title))}" loading="lazy"><small>${escape(storyText(art.category))}</small><span>${escape(storyText(art.title))}</span></button>`).join('')}</div>`;}
export function storyArtHtml(art){if(!art)return '';return `<figure class="story-art"><img src="${art.src}" alt="${escape(storyText(art.title))}"><figcaption>${escape(storyText(art.title))}</figcaption></figure><button class="secondary" data-action="story-art-back">${escape(storyText(STORY_UI.back))}</button>`;}
