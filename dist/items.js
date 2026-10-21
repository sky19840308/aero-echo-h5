// Artwork IDs follow the supplied item manifest; gameplay IDs retain existing pickups.
export const ITEM_TYPES=[
 {kind:'coin',art:'currency_crystal',label:'金币簇',letter:'C',color:'#ffd585',name:['金币簇','クレジット結晶','Credit Crystals'],note:['拾取获得信用点，可在机库强化机体。','クレジットを獲得。格納庫で機体を強化できます。','Collect credits for aircraft upgrades in the hangar.'],spawn:'pickup_spawn_gold',collect:'pickup_spawn_gold'},
 {kind:'power',art:'weapon_energy',label:'武器能量',letter:'P',color:'#83e9ff',name:['武器能量','武器エネルギー','Weapon Energy'],note:['提高本局火控等级，最高达到五级。','今回の武器レベルを最大 5 まで上げます。','Raise this flight’s weapon level, up to level 5.'],spawn:'pickup_spawn_blue',collect:'pickup_spawn_blue'},
 {kind:'shield',art:'shield_unit',label:'脉冲单元',letter:'E',color:'#72caff',name:['脉冲单元','パルスユニット','Pulse Unit'],note:['清除当前弹幕，并补充少量终极能量。','画面内の弾幕を消し、必殺技エネルギーを少量補充します。','Clear enemy bullets on screen and add a small amount of ultimate energy.'],spawn:'pickup_spawn_blue',collect:'pickup_shield_blue'},
 {kind:'repair',art:'repair_nanite',label:'命数补给',letter:'+',color:'#99ecbc',name:['命数补给','予備ライフ','Spare Life'],note:['恢复 1 条命，最多保留 3 条。','残機を 1 つ回復。最大 3 つまで所持できます。','Restore one life, up to a maximum of three.'],spawn:'pickup_spawn_blue',collect:'pickup_heal_green'},
 {kind:'fragment',art:'bomb_shard',label:'炸弹碎片',letter:'B',color:'#ffad80',name:['炸弹碎片','爆弾のかけら','Bomb Shards'],note:['四枚碎片合成一枚爆弹，受携带上限限制。','かけら 4 個で爆弾 1 個。所持上限があります。','Four shards make one bomb, subject to carrying capacity.'],spawn:'pickup_spawn_gold',collect:'pickup_rare_gold'},
 {kind:'bomb',art:'bomb_full',label:'完整炸弹',letter:'B',color:'#ff9669',name:['完整炸弹','完成した爆弾','Full Bomb'],note:['直接补充一枚爆弹，不超过携带上限。','所持上限まで爆弾を 1 個補充します。','Add one bomb up to your carrying capacity.'],spawn:'pickup_rare_gold',collect:'pickup_rare_gold',single:true},
 {kind:'energy',art:'ultimate_battery',label:'大招电池',letter:'E',color:'#c5a1ff',name:['大招电池','必殺技バッテリー','Ultimate Battery'],note:['补充终极技能量，满能量时可释放大招。','必殺技を充電。満充電で発動できます。','Charge your ultimate; activate it when the gauge is full.'],spawn:'pickup_spawn_blue',collect:'pickup_data_glitch'},
 {kind:'score',art:'score_crystal',label:'分数晶体',letter:'★',color:'#83e9ff',name:['分数晶体','スコア結晶','Score Crystal'],note:['增加本局分数，并受到连击与难度倍率影响。','今回のスコアを加算。コンボと難易度の倍率が適用されます。','Gain score with your current combo and difficulty multipliers.'],spawn:'pickup_spawn_blue',collect:'pickup_spawn_blue'},
 {kind:'blueprint',art:'blueprint_chip',label:'蓝图芯片',letter:'▱',color:'#ffd585',name:['蓝图芯片','設計図チップ','Blueprint Chip'],note:['收集蓝图材料，战斗结算后存入材料仓库。','設計図素材を収集。戦闘結果後に倉庫へ保存します。','Collect blueprint materials, saved to storage at the flight report.'],spawn:'pickup_blueprint_scan',collect:'pickup_blueprint_scan'},
 {kind:'data',art:'data_core',label:'数据核心',letter:'◇',color:'#c5a1ff',name:['数据核心','データコア','Data Core'],note:['收集回声数据，战斗结算后存入材料仓库。','エコーデータを収集。戦闘結果後に倉庫へ保存します。','Collect echo data, saved to storage at the flight report.'],spawn:'pickup_data_glitch',collect:'pickup_data_glitch'}
];
export const ITEM_BY_KIND=Object.fromEntries(ITEM_TYPES.map(item=>[item.kind,item]));
export const TIERS=['s','m','l'];
export const TIER_NAMES={s:'小型',m:'中型',l:'大型'};
export const tierIndex=tier=>Math.max(0,TIERS.indexOf(tier));
export const itemArtKey=(kind,tier='s')=>{const item=ITEM_BY_KIND[kind];return item?item.art+(item.single?'':'_'+(TIERS.includes(tier)?tier:'s')):null;};
export const CONTAINERS=[
 {id:'supply_s',art:'container_supply_s',name:['小型补给箱','小型補給箱','Small Supply Crate'],note:['提供武器能量和脉冲单元。','武器エネルギーとパルスユニットを補給します。','Contains weapon energy and a pulse unit.']},
 {id:'supply_m',art:'container_supply_m',name:['中型补给箱','中型補給箱','Medium Supply Crate'],note:['提供命数补给、大招电池和炸弹碎片。','予備ライフ・必殺技バッテリー・爆弾片を補給します。','Contains a spare life, an ultimate battery and bomb shards.']},
 {id:'supply_l',art:'container_supply_l',name:['大型补给箱','大型補給箱','Large Supply Crate'],note:['提供命数补给、脉冲单元和一枚完整爆弹。','予備ライフ・パルスユニット・完成した爆弾を補給します。','Contains a spare life, a pulse unit and one full bomb.']},
 {id:'elite',art:'container_elite_reward',name:['精英奖励箱','エリート報酬箱','Elite Reward Crate'],note:['击败精英敌机后掉落蓝图和数据材料。','エリート撃破で設計図とデータ素材を獲得します。','Drops blueprint and data materials after an elite defeat.']},
 {id:'boss',art:'container_boss_drop',name:['首领奖励箱','ボス報酬箱','Boss Reward Crate'],note:['首领被击败后出现，奖励会在结算前自动回收。','ボス撃破で出現。結果画面前に報酬を自動回収します。','Appears after a boss defeat; rewards are collected before the report.']}
];
export const CONTAINER_BY_ID=Object.fromEntries(CONTAINERS.map(container=>[container.id,container]));
export function containerLoot(container,tier='s',chapter=0){
 if(container==='supply_s')return [{kind:'power',tier:'s'},{kind:'shield',tier:'s'}];
 if(container==='supply_m')return [{kind:'repair',tier:'m'},{kind:'energy',tier:'m'},{kind:'fragment',tier:'m'}];
 if(container==='supply_l')return [{kind:'repair',tier:'l'},{kind:'shield',tier:'l'},{kind:'bomb',tier:'l'}];
 if(container==='elite')return [{kind:'blueprint',tier},{kind:'data',tier},{kind:'score',tier}];
 if(container==='boss')return [{kind:'coin',tier:'l',amount:200+chapter*75},{kind:'blueprint',tier:'l'},{kind:'data',tier:'l'},{kind:'bomb',tier:'l'},{kind:'score',tier:'l'}];
 return [];
}
