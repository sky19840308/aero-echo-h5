import {SHIPS,DIFFICULTIES,TALENTS,SKINS} from './data.js?v=25';
import {weaponTier,researchLevel,RESEARCH} from './progression.js?v=25';
import {AUDIO_DEFAULTS,audioVolume} from './audio-levels.js?v=25';
import {ECONOMY_VERSION,normalizeEconomy} from './economy.js?v=25';
import {ACHIEVEMENTS,latestClear,storyFrontier,storyUnlocked,missionAt,unlockAchievements} from './campaign.js?v=25';

export const STORAGE='aero-echo.h5.v1',BACKUP_STORAGE=STORAGE+'.previous';
export const SENSITIVITIES=[.75,1,1.25,1.5];
export function createProfile(){return {version:1,economyVersion:ECONOMY_VERSION,audioDefaultsVersion:2,experience:0,rewardedMissions:[],rewardedChapters:[],language:null,credits:250,points:0,levels:{Dawn7:1,Bastion3:1,WraithX:1},skins:{Dawn7:0,Bastion3:0,WraithX:0},weapons:{Dawn7:0,Bastion3:0,WraithX:0},research:{charge:0,supply:0,magnet:0},materials:{blueprint:0,data:0},talents:{},clears:{},bossClears:{},records:[],discovered:[],checkpoint:null,storyNext:null,achievements:[],selection:{chapter:0,substage:0,ship:0,difficulty:'normal',pace:'quick',mode:'campaign'},settings:{sound:true,music:true,effects:true,...AUDIO_DEFAULTS,shake:true,flash:true,detail:true,contrast:false,numbers:true,haptic:false,sensitivity:1,handedness:'right'}};}
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const integer=(value,min,max,fallback=min)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Math.floor(Number(value)))):fallback;
export function normalizeProfile(value){
 if(!object(value)||value.version!==1)return createProfile();const result=createProfile();
 result.language=['zh','ja','en'].includes(value.language)?value.language:null;
 result.credits=integer(value.credits,0,1e12,250);result.points=integer(value.points,0,18,0);
 for(const ship of SHIPS){result.levels[ship.id]=integer(value.levels?.[ship.id],1,50,1);result.skins[ship.id]=integer(value.skins?.[ship.id],0,SKINS.length-1);result.weapons[ship.id]=weaponTier(value,ship.id);}
 for(const node of RESEARCH)result.research[node.id]=researchLevel(value,node.id);
 for(const talent of TALENTS)result.talents[talent.id]=integer(value.talents?.[talent.id],0,talent.max);
 for(const key of ['blueprint','data'])result.materials[key]=integer(value.materials?.[key],0,1e9);
 for(let c=1;c<=9;c++)for(let s=1;s<=3;s++){const id=`${c}-${s}`;if(Number(value.clears?.[id])>0)result.clears[id]=integer(value.clears[id],1,3);}
 for(let c=0;c<9;c++)if(Number(value.bossClears?.[c])>0)result.bossClears[c]=integer(value.bossClears[c],1,3);
 result.discovered=Array.isArray(value.discovered)?[...new Set(value.discovered.filter(id=>Number.isInteger(id)&&id>=1&&id<=30))]:[];
 const selection=value.selection||{};for(const [key,max] of [['chapter',8],['substage',2],['ship',2]])result.selection[key]=integer(selection[key],0,max);
 if(DIFFICULTIES.some(d=>d.id===selection.difficulty))result.selection.difficulty=selection.difficulty;
 for(const [key,choices] of [['pace',['quick','full']],['mode',['campaign','boss']]])if(choices.includes(selection[key]))result.selection[key]=selection[key];
 for(const key of Object.keys(result.settings))if(typeof result.settings[key]==='boolean'&&typeof value.settings?.[key]==='boolean')result.settings[key]=value.settings[key];
 for(const key of Object.keys(AUDIO_DEFAULTS))result.settings[key]=audioVolume(value.settings,key);
 if(value.audioDefaultsVersion!==2&&value.settings?.musicVolume===.65&&value.settings?.effectsVolume===.35)Object.assign(result.settings,AUDIO_DEFAULTS);
 if(SENSITIVITIES.includes(value.settings?.sensitivity))result.settings.sensitivity=value.settings.sensitivity;
 if(['left','right'].includes(value.settings?.handedness))result.settings.handedness=value.settings.handedness;
 if(Array.isArray(value.records))result.records=value.records.filter(record=>object(record)&&/^[1-9]-[1-3]$/.test(record.id)&&Number.isFinite(record.score)).slice(0,60).map(record=>{const [c,s]=record.id.split('-').map(Number);return {id:record.id,chapter:c-1,substage:s-1,mode:record.mode==='boss'?'boss':'campaign',score:integer(record.score,0,1e12),win:record.win===true,stars:record.win?integer(record.stars,1,3,1):0,difficulty:DIFFICULTIES.some(d=>d.id===record.difficulty)?record.difficulty:'normal',pace:record.pace==='full'?'full':'quick',ship:SHIPS.some(ship=>ship.id===record.ship)?record.ship:'Dawn7',time:integer(record.time,0,86400),date:typeof record.date==='string'&&Number.isFinite(Date.parse(record.date))?new Date(record.date).toISOString():'1970-01-01T00:00:00.000Z'};});
 const checkpoint=value.checkpoint;if(object(checkpoint)&&Number.isInteger(checkpoint.chapter)&&Number.isInteger(checkpoint.substage)&&result.clears[`${checkpoint.chapter+1}-${checkpoint.substage+1}`])result.checkpoint={chapter:checkpoint.chapter,substage:checkpoint.substage,difficulty:DIFFICULTIES.some(d=>d.id===checkpoint.difficulty)?checkpoint.difficulty:'normal',pace:checkpoint.pace==='full'?'full':'quick'};
 result.checkpoint=latestClear(result);
 if(Number.isInteger(value.storyNext)&&value.storyNext>=0&&value.storyNext<=27){const m=missionAt(value.storyNext),valid=m?storyUnlocked(result,m.chapter,m.substage):storyFrontier(result)===27;result.storyNext=valid?value.storyNext:null;}
 if(Array.isArray(value.achievements))result.achievements=ACHIEVEMENTS.filter(a=>value.achievements.includes(a.id)).map(a=>a.id);unlockAchievements(result);
 return normalizeEconomy(result,value);
}
export function exportProfile(profile){return JSON.stringify({format:'aero-echo-save',formatVersion:1,exportedAt:new Date().toISOString(),profile:normalizeProfile(profile)},null,2);}
export function parseBackup(text){
 if(typeof text!=='string'||text.length>1024*1024)throw new Error('invalid-save');let data;try{data=JSON.parse(text);}catch{throw new Error('invalid-save');}
 if(data?.format!==undefined){if(data.format!=='aero-echo-save'||data.formatVersion!==1)throw new Error('invalid-save');data=data.profile;}
 if(!object(data)||data.version!==1||!Number.isFinite(data.credits)||!object(data.levels)||!object(data.selection)||!object(data.clears))throw new Error('invalid-save');
 return normalizeProfile(data);
}
