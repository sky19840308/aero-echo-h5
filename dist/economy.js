// First-clear rewards define a complete nine-chapter journey. Replays cannot
// bypass training, technology or the two talent points per major chapter.
export const ECONOMY_VERSION=1;
export const CHAPTER_REWARDS=[
 {level:5,experience:440,credits:2000,blueprint:12,data:3},
 {level:10,experience:820,credits:7600,blueprint:18,data:5},
 {level:15,experience:1120,credits:13900,blueprint:24,data:6},
 {level:20,experience:1420,credits:22600,blueprint:30,data:8},
 {level:26,experience:2100,credits:37200,blueprint:36,data:9},
 {level:32,experience:2532,credits:51000,blueprint:42,data:11},
 {level:38,experience:2964,credits:63300,blueprint:36,data:12},
 {level:44,experience:3396,credits:79500,blueprint:30,data:12},
 {level:50,experience:3828,credits:93800,blueprint:30,data:12}
];
const SHIP_IDS=['Dawn7','Bastion3','WraithX'];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Math.floor(Number(n)):min));
export function levelExperience(level){const n=clamp(level,1,50)-1;return 92*n+6*n*(n-1);}
export function trainingLevel(profile){const xp=clamp(profile?.experience,0,levelExperience(50));let level=1;while(level<50&&xp>=levelExperience(level+1))level++;return level;}
export function completedChapters(profile){let count=0;for(let c=1;c<=9;c++)if([1,2,3].every(s=>profile?.clears?.[`${c}-${s}`]>0))count++;return count;}
// Technology depends on consecutive major chapters, not on an imported final
// clear or a Boss challenge. These gates are also enforced by upgrade actions.
export function campaignMilestone(profile){let count=0;for(let c=1;c<=9;c++){if(![1,2,3].every(s=>profile?.clears?.[`${c}-${s}`]>0))break;count++;}return count;}
export const weaponUnlockChapter=tier=>[0,1,3,5,9][clamp(tier,0,4)];
export const researchUnlockChapter=level=>[0,3,6,9][clamp(level,0,3)];
export const weaponCap=profile=>campaignMilestone(profile)>=8&&trainingLevel(profile)>=45?4:[0,1,1,2,2,3,3,3,3,3][campaignMilestone(profile)];
export const researchCap=profile=>campaignMilestone(profile)>=8&&trainingLevel(profile)>=47?3:[0,0,0,1,1,1,2,2,2,2][campaignMilestone(profile)];
export function missionReward(chapter,substage){
 const r=CHAPTER_REWARDS[clamp(chapter,0,8)],s=clamp(substage,0,2),out={};
 for(const key of ['experience','credits','blueprint','data']){const quarter=Math.floor(r[key]/4);out[key]=s===2?r[key]-quarter*2:quarter;}
 return out;
}
export const upgradeCost=level=>Math.round(200+100*(clamp(level,1,50)-1)**1.3);
export function fleetLevel(profile){return Math.max(1,...SHIP_IDS.map(id=>clamp(profile?.levels?.[id],1,50)));}
export function canUpgradeHull(profile){return fleetLevel(profile)<Math.min(50,trainingLevel(profile))&&profile.credits>=upgradeCost(fleetLevel(profile));}
export function upgradeHull(profile,steps=1){
 let purchased=0;while(purchased<clamp(steps,1,5)&&canUpgradeHull(profile)){const level=fleetLevel(profile);profile.credits-=upgradeCost(level);for(const id of SHIP_IDS)profile.levels[id]=level+1;purchased++;}return purchased;
}
export function normalizeEconomy(profile,raw){
 const migrated=raw?.economyVersion!==ECONOMY_VERSION;
 const validIds=[];for(let c=0;c<9;c++)for(let s=0;s<3;s++)if(profile.clears[`${c+1}-${s+1}`])validIds.push(`${c+1}-${s+1}`);
 // A claimed mission is a completed mission. Old saves seed this durable ledger
 // so switching hero, difficulty or replay mode cannot pay the same reward again.
 profile.rewardedMissions=validIds;
 const inferred=profile.rewardedMissions.reduce((xp,id)=>{const[c,s]=id.split('-').map(Number);return xp+missionReward(c-1,s-1).experience;},0);
 profile.experience=inferred;
 profile.rewardedChapters=[];for(let c=1;c<=9;c++)if([1,2,3].every(s=>profile.clears[`${c}-${s}`]))profile.rewardedChapters.push(c);
 if(migrated){const invested=Object.values(profile.talents).reduce((sum,n)=>sum+n,0);profile.points=Math.max(0,profile.rewardedChapters.length*2-invested);}
 // Completed upgrades survive migration; the fleet shares the strongest hull.
 const level=fleetLevel(profile);for(const id of SHIP_IDS)profile.levels[id]=level;
 profile.economyVersion=ECONOMY_VERSION;return profile;
}
export function settleEconomy(profile,result){
 const stage=result.stage,id=stage.id,chapter=stage.chapter,substage=stage.substage;
 const campaign=stage.mode!=='boss',clears=campaign?profile.clears:profile.bossClears,key=campaign?id:String(chapter);
 const first=result.win&&campaign&&!profile.rewardedMissions.includes(id);
 const grant=first?missionReward(chapter,substage):{experience:0,credits:0,blueprint:0,data:0};
 if(first){grant.credits+=Math.min(Math.floor(grant.credits*.05),clamp(result.coins,0,1e9));grant.blueprint+=clamp(result.materials?.blueprint,0,2);grant.data+=clamp(result.materials?.data,0,1);}
 if(!first){const salvageLimit=result.win?80+chapter*15:25;grant.credits=Math.min(salvageLimit,clamp(result.coins,0,salvageLimit));}
 if(result.win)clears[key]=Math.max(clears[key]||0,clamp(result.stars,1,3));
 if(first){profile.rewardedMissions.push(id);profile.experience=Math.min(levelExperience(50),profile.experience+grant.experience);}
 let points=0;if(result.win&&campaign&&!profile.rewardedChapters.includes(chapter+1)&&[1,2,3].every(s=>profile.clears[`${chapter+1}-${s}`])){profile.rewardedChapters.push(chapter+1);points=2;profile.points+=points;}
 profile.credits+=grant.credits;profile.materials.blueprint+=grant.blueprint;profile.materials.data+=grant.data;
 return {reward:grant.credits,points,experience:grant.experience,materials:{blueprint:grant.blueprint,data:grant.data},first,trainingLevel:trainingLevel(profile)};
}
// Keep normal chapter combat close to its established pace at the expected
// loadout, instead of stacking free chapter damage with a fully upgraded hull.
export function hullPower(level){const n=clamp(level,1,50)-1;return 1+.030*n+.00055*n*n;}
export const REFERENCE_LOADOUTS=[{level:1,tier:0},{level:5,tier:1},{level:10,tier:1},{level:15,tier:2},{level:20,tier:2},{level:26,tier:3},{level:32,tier:3},{level:38,tier:3},{level:44,tier:3}];
export function chapterCalibration(chapter){const r=REFERENCE_LOADOUTS[clamp(chapter,0,8)];return hullPower(r.level)*[1,1.35,1.9,2.65,3.6][r.tier];}
