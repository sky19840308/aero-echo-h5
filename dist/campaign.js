// Progress is driven by successful mission clears, never by the selected card.
export const MISSION_COUNT=27;
export const missionIndex=(chapter,substage)=>Number.isInteger(chapter)&&chapter>=0&&chapter<9&&Number.isInteger(substage)&&substage>=0&&substage<3?chapter*3+substage:-1;
export const missionAt=index=>Number.isInteger(index)&&index>=0&&index<MISSION_COUNT?{chapter:Math.floor(index/3),substage:index%3}:null;
export const missionId=(chapter,substage)=>`${chapter+1}-${substage+1}`;
export const missionCleared=(profile,chapter,substage)=>missionIndex(chapter,substage)>=0&&Boolean(profile.clears?.[missionId(chapter,substage)]);
export const bossUnlocked=(profile,chapter)=>Number.isInteger(chapter)&&chapter>=0&&chapter<9&&(missionCleared(profile,chapter,2)||Boolean(profile.bossClears?.[chapter]));
export function storyFrontier(profile){for(let i=0;i<MISSION_COUNT;i++){const m=missionAt(i);if(!missionCleared(profile,m.chapter,m.substage))return i;}return MISSION_COUNT;}
export function storyUnlocked(profile,chapter,substage){const index=missionIndex(chapter,substage);if(index<0)return false;if(index===0)return true;const previous=missionAt(index-1);return missionCleared(profile,chapter,substage)||missionCleared(profile,previous.chapter,previous.substage);}
export function storyTarget(profile){const index=Number.isInteger(profile.storyNext)?profile.storyNext:storyFrontier(profile),m=missionAt(index);if(!m)return null;return storyUnlocked(profile,m.chapter,m.substage)?m:missionAt(storyFrontier(profile));}
export function latestClear(profile){
 for(let i=MISSION_COUNT-1;i>=0;i--){const m=missionAt(i);if(!missionCleared(profile,m.chapter,m.substage))continue;
  const checkpoint=profile.checkpoint,record=profile.records?.find(r=>r.win&&r.mode!=='boss'&&r.id===missionId(m.chapter,m.substage));
  const source=checkpoint&&checkpoint.chapter===m.chapter&&checkpoint.substage===m.substage?checkpoint:record||profile.selection||{};
  return {...m,difficulty:['easy','normal','hard'].includes(source.difficulty)?source.difficulty:'normal',pace:source.pace==='full'?'full':'quick'};
 }return null;
}
export function canLaunch(profile,selection,flow){return flow==='boss'?selection.mode==='boss'&&bossUnlocked(profile,selection.chapter):selection.mode==='campaign'&&(flow==='replay'?missionCleared(profile,selection.chapter,selection.substage):storyUnlocked(profile,selection.chapter,selection.substage));}
export function rememberClear(profile,result){
 if(!result.win||result.stage.mode==='boss')return;
 const m=result.stage,index=missionIndex(m.chapter,m.substage),previous=profile.checkpoint;
 if(!previous||index>=missionIndex(previous.chapter,previous.substage))profile.checkpoint={chapter:m.chapter,substage:m.substage,difficulty:result.difficulty,pace:result.pace};
}
const names=[
 ['首次出击','初陣','First Flight'],['静默海岸解放','静寂の海岸を解放','Silent Coast Liberated'],['赤沙熔城解放','赤砂の熔城を解放','Red Sand Forge Liberated'],['云墓峡谷解放','雲墓の峡谷を解放','Cloud Tomb Liberated'],['极夜冰原解放','極夜の氷原を解放','Polar Night Liberated'],['浮空都环解放','浮遊都市環を解放','Sky City Liberated'],['雷暴天井解放','雷嵐の天井を解放','Thunder Well Liberated'],['月影轨道解放','月影の軌道を解放','Moon Orbit Liberated'],['断层星门解放','断層の星門を解放','Rift Gate Liberated'],['回声核心解放','エコーコアを解放','Echo Core Liberated'],['三位英雄','三人の英雄','Three Heroes'],['三星飞行员','三つ星のパイロット','Three-Star Pilot'],['机体工程师','機体エンジニア','Aircraft Engineer'],['敌机观察者','敵機の観測者','Enemy Observer'],['九域征服者','九領域の征服者','Nine Realms Conqueror'],['首领猎手','ボスハンター','Boss Hunter']
];
export const ACHIEVEMENTS=Object.freeze(names.map((name,i)=>({id:['first-flight',...Array.from({length:9},(_,c)=>`chapter-${c+1}`),'three-heroes','three-stars','engineer','observer','campaign-complete','boss-hunter'][i],name,note:i===0?['完成一个小关','小ミッションを1つクリア','Clear one mission']:i<=9?['完成本章三个小关','この章の3ミッションをクリア','Clear all three missions in this chapter']:i===10?['三位英雄各通关一次','3人の英雄でそれぞれクリア','Win a mission with each hero']:i===11?['取得一次三星通关','三つ星でクリア','Earn a three-star clear']:i===12?['任一机体强化至10级','いずれかの機体をレベル10に強化','Upgrade any aircraft to level 10']:i===13?['发现全部30种敌机','全30種の敵機を発見','Discover all 30 enemy types']:i===14?['完成全部27个小关','全27ミッションをクリア','Clear all 27 missions']:['完成九场首领挑战','9つのボスチャレンジをクリア','Win all nine Boss Challenges']})));
export function unlockAchievements(profile){
 const won=new Set(profile.achievements||[]),clears=Object.keys(profile.clears||{});
 if(clears.length)won.add('first-flight');
 for(let c=0;c<9;c++)if([0,1,2].every(s=>missionCleared(profile,c,s)))won.add(`chapter-${c+1}`);
 if(new Set((profile.records||[]).filter(r=>r.win).map(r=>r.ship)).size===3)won.add('three-heroes');
 if(Object.values(profile.clears||{}).some(stars=>stars===3))won.add('three-stars');
 if(Object.values(profile.levels||{}).some(level=>level>=10))won.add('engineer');
 if(profile.discovered?.length===30)won.add('observer');
 if(clears.length===MISSION_COUNT)won.add('campaign-complete');
 if(Object.keys(profile.bossClears||{}).length===9)won.add('boss-hunter');
 profile.achievements=ACHIEVEMENTS.filter(a=>won.has(a.id)).map(a=>a.id);return profile.achievements;
}
