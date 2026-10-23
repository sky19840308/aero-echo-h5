// A repeatable route vocabulary: learn a formation, then recognize its variation.
// The three allowed enemy types and the original clear conditions stay intact.
export function missionWavePlan(stage,wave,width=450){
 const route=stage.chapter*3+stage.substage,index=Math.max(0,wave-1),order=[0,1,2,3];
 let state=Math.imul(route+1,2654435761)>>>0;
 for(let i=3;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=state%(i+1);[order[i],order[j]]=[order[j],order[i]];}
 const lane=(index+stage.chapter+stage.substage)%3;
 return {formation:order[index%4],center:width*[5/18,.5,13/18][lane],spread:stage.substage===1?.82:stage.substage===2?.94:1,stagger:[30,40,27][stage.substage],tempo:[1.16,1.04,1.1][stage.substage]};
}

const briefs={
 zh:['突破封锁 · 在移动中瞄准，抵达航线终点。','穿越炮阵 · 留意侧翼与激光预警，存活至航线终点。','首领突袭 · 突破护航编队，攻击发光部件。'],
 ja:['封鎖突破・移動しながら狙い、航路の終点へ。','砲陣通過・側面とレーザー予告に注意し、航路の終点まで生存。','ボス急襲・護衛編隊を突破し、光る部位を攻撃。'],
 en:['Break the blockade. Aim while moving and reach the end of the route.','Cross the batteries. Watch the flanks and laser warnings; survive to the route end.','Assault the leader. Break through escorts and target glowing parts.']
};
export const missionBrief=(stage,locale='zh')=>(briefs[locale]||briefs.zh)[stage.mode==='boss'?2:stage.substage];

const hints={
 zh:[['WASD / 方向键移动 · 主炮自动开火','拖拽战场移动 · 主炮自动开火'],['机身中央光点是受击核心 · 红色航线先预警再冲撞'],['Q 主动技 · 冷却后可再次使用','点击左侧技能按钮 · 冷却后可再次使用'],['R 呼叫联军 · 集结期间保护 5 秒','点击火苗呼叫联军 · 集结保护 5 秒'],['E 爆弹 · 清除敌弹并召唤英雄','点击爆弹 · 清除敌弹并召唤英雄'],['空格终极技 · 命中和擦弹积累能量','终极技充满后发光 · 命中和擦弹积累能量']],
 ja:[['WASD / 方向キーで移動・主砲は自動発射','画面をドラッグして移動・主砲は自動発射'],['機体中央の光点が当たり判定・赤い線は突進予告'],['Qでスキル・クールダウン後に再使用','左のスキルボタン・クールダウン後に再使用'],['Rで援軍・集結中は5秒間無敵','炎のボタンで援軍・集結中は5秒間無敵'],['Eでボム・敵弾を消して英雄を召喚','ボムで敵弾を消して英雄を召喚'],['Spaceで必殺技・命中とかすりでチャージ','命中とかすりでチャージ・発光したら必殺技']],
 en:[['WASD / arrows to move · automatic fire','Drag the battlefield to move · automatic fire'],['Your glowing center is the hitbox · red lines warn of dives'],['Q: skill · reusable after cooldown','Tap the left skill button · reusable after cooldown'],['R: wingmen · 5 seconds of protection while assembling','Tap the flames: wingmen · 5 seconds of protection'],['E: bomb · clear bullets and summon your hero','Tap Bomb to clear bullets and summon your hero'],['Space: ultimate · charge it with hits and grazes','Hits and grazes charge your ultimate · use it when glowing']]
};
export function missionHint(game,{locale='zh',duo=false,coarse=false}={}){
 if(!game||game.stage.chapter!==0||game.stage.substage!==0||game.time>=42)return '';
 if(duo)return locale==='en'?'P1: WASD · P2: arrows · automatic fire':locale==='ja'?'P1: WASD · P2: 方向キー · 自動発射':'P1: WASD · P2: 方向键 · 主炮自动开火';
 const item=(hints[locale]||hints.zh)[Math.min(5,Math.floor(game.time/7))];
 return Array.isArray(item)?item[coarse?1:0]:item;
}
