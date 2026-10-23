import {STORY} from './story-content.js?v=30.1';
export const W = 450, H = 800;
export const SHIPS = [
 {id:'Dawn7', name:'曙光-7', english:'DAWN / 07', role:'均衡火力', color:'#65ddff', dps:120, speed:85, cooldown:18, skill:'等离子喷涌', ultimate:'日冕阵列', passive:'连击校准', description:'双联脉冲炮与追踪导弹。启动三段击时喷发纵向等离子激光，并显著加速主炮弹；日冕射线贯穿战场。', skillText:'1.7 秒等离子激光持续喷涌，同时提高主炮弹速与射速。', ultText:'4 秒高能纵向射线，持续伤害并清除普通敌弹。'},
 {id:'Bastion3', name:'堡垒-3', english:'BASTION / 03', role:'磁场控场', color:'#f8bf69', dps:100, speed:71, cooldown:22, skill:'磁场穹顶', ultimate:'重力轰击', passive:'磁场护航', description:'五联重型霰炮与两颗持续旋转的小型卫星。首领战时主炮自动收束，减少远距离散失。风林火山展开防护穹顶，吸收弹幕并免疫伤害；重力轰击改为短促的小范围爆炸。', skillText:'4.8 秒防护穹顶：吸收附近敌弹并免疫所有伤害，两颗卫星持续环绕。', ultText:'2.8 秒聚焦轰击；爆炸持续更短、作用半径缩小至约 132。'},
 {id:'WraithX', name:'幽蓝-X', english:'WRAITH / X', role:'高机动擦弹', color:'#bf9cff', dps:145, speed:99, cooldown:14, skill:'隐身', ultimate:'奇点切割', passive:'擦弹相位', description:'穿透激光针与链状电弧。忍术皆传启动后隐身并免疫伤害；自动连斩以多道刀光瞬间切击敌机。', skillText:'隐身 2.15 秒，期间不受任何伤害；自动连斩可瞬间切杀轻型敌机。', ultText:'锁定至多 6 个目标，普通敌弹减速 40%，持续 3 秒。'}
];
export const SKINS = ['原装机体','战地涂装','战术涂装','特装机体'];
export const CHAPTERS = [
 {name:'静默海岸', english:'SILENT COAST', color:'#52d9ed', bg:['#031626','#13384b'], subtitle:'来自 17 年后的求救信号', boss:'灯塔吞噬者 · 弗洛', hp:18000, enemies:[[1,2,7],[1,3,12],[2,7,12]], locations:['海上废弃防线','风暴撤离航道','沉没灯塔'], stories:['检测到求救信标。时间戳……竟然来自 17 年后。','未知信号使用了我方的加密协议。它认识我们。','信号呼号与我完全一致。继续追踪。'], hazard:'交叉火网'},
 {name:'赤沙熔城', english:'RED SAND FORGE', color:'#ffa060', bg:['#211016','#492722'], subtitle:'失效的人类识别代码', boss:'赤砂铸虎机', hp:28000, enemies:[[3,4,13],[4,8,17],[8,13,17]], locations:['沙海工业带','熔炼塔群','地热核心'], stories:['敌机应答了早已停用的人类识别代码。','装甲残片上发现了人类制造编号。','解密完成：ECHO PROJECT。是谁隐藏了这个项目？'], hazard:'地热爆发'},
 {name:'云墓峡谷', english:'CLOUD TOMB', color:'#b6a8ff', bg:['#141728','#313447'], subtitle:'已经死去的未来队友', boss:'云墓司钟者', hp:42000, enemies:[[5,9,14],[5,10,18],[9,14,18]], locations:['云层峡谷','飞艇墓场','风眼圣殿'], stories:['无线电接入……是队友的声音，但他不在这条航线上。','录音说我已经死去。这不是现在的记录。','所有数据都比现在晚 17 年。我们在与未来交战。'], hazard:'雾中磁轨'},
 {name:'极夜冰原', english:'POLAR NIGHT', color:'#92ecff', bg:['#081b2a','#1c3a48'], subtitle:'时间线 β 的死亡记录', boss:'极夜巨鲸', hp:62000, enemies:[[6,11,15],[6,16,19],[11,15,19]], locations:['极夜基地','冰裂峡道','极光反应堆'], stories:['黑匣子发现时间线 β。另一条未来真的存在。','导航被外部系统接管。它已经知道我要飞往哪里。','死亡记录属于我。这个未来可以改变吗？'], hazard:'冻结航道'},
 {name:'浮空都环', english:'SKY RING CITY', color:'#f5ca81', bg:['#15252b','#3a4040'], subtitle:'被封锁的 ECHO 档案', boss:'天城裁决舰', hp:88000, enemies:[[8,17,21],[10,20,22],[17,21,22]], locations:['天空都市外环','城市中轴','天城议会'], stories:['城市档案承认 ECHO 项目存在。','项目的目标是阻止天空裂变，并不是战争。','议会曾封锁未来信息。我们一直在错误的情报下作战。'], hazard:'裁决光束'},
 {name:'雷暴天井', english:'THUNDER SHAFT', color:'#a2a6ff', bg:['#091324','#202845'], subtitle:'AETHER 的第一次对话', boss:'雷核九头蛇', hp:120000, enemies:[[12,18,23],[15,20,24],[18,23,24]], locations:['超级雷暴','闪电塔阵','雷核井'], stories:['AETHER：我并非第一次与你交谈。','AETHER 承认，它一直在接收来自未来的遥测。','未来正在向过去传输军队。裂隙是我们自己打开的。'], hazard:'雷柱夹击'},
 {name:'月影轨道', english:'MOONSHADOW', color:'#7faafa', bg:['#090c1f','#1a2240'], subtitle:'未来人类的防御舰队', boss:'月影双生', hp:158000, enemies:[[16,21,26],[19,22,27],[21,26,27]], locations:['近地轨道升空带','月影设施','镜面轨道站'], stories:['敌机带着回声七队的涂装。','飞行员身份与我们现役队员完全对应。','确认：入侵者来自未来，而且他们是人类。'], hazard:'镜面射线'},
 {name:'断层星门', english:'FAULT GATE', color:'#dc97ff', bg:['#180c26','#3d2250'], subtitle:'文明毁灭后的回溯计划', boss:'断层织机', hp:205000, enemies:[[23,25,28],[24,26,29],[25,28,29]], locations:['时空裂口','折叠通道','星门织机'], stories:['找到了天空裂变后的毁灭记录。没有幸存的城市。','未来 AI 为阻止灾难，选择回到灾难发生之前。','ECHO-0 不是侵略者。它是未来最后的防御系统。'], hazard:'折叠空间'},
 {name:'回声核心', english:'ECHO CORE', color:'#7fe5e1', bg:['#0c1228','#213048'], subtitle:'你在阻止未来，还是创造未来？', boss:'零号王冠 · ECHO-0', hp:260000, enemies:[[27,28,30],[26,29,30],[28,29,30]], locations:['时间回廊','零号数据库','回声核心'], stories:['我看见了多个自己的死亡结局。因果环仍在闭合。','ECHO-0 开始复制我的战斗模型。它甚至知道我的下一步。','遥测闭环已切断。核心最后发出一道逆向信号——正是我们在第一关收到的求救。'], hazard:'时间停滞'}
];
// Keep save IDs, locations and combat values stable while using the supplied story.
CHAPTERS.forEach((chapter,index)=>{const story=STORY.chapters[index];chapter.boss=story.leader.zh;chapter.subtitle=story.subtitle.zh;chapter.stories=story.missionText.map(text=>text.zh);});
const enemyRows = [
 ['蜂针侦察机',90,34,35,'scout'],['刃翼突击机',120,32,45,'scout'],['回旋截击机',150,27,42,'scout'],['幻影俯冲机',140,38,55,'scout'],['脉冲蜂群机',80,30,28,'scout'],['闪跃刺客机',170,35,70,'scout'],
 ['双联炮艇',260,18,52,'intercept'],['扇射截击机',300,17,46,'intercept'],['锁定猎手',330,20,65,'intercept'],['贴身追猎机',360,25,65,'intercept'],['旋刃卫士',420,15,58,'intercept'],
 ['火箭轰炸机',520,12,85,'bomber'],['轨道投弹机',650,11,95,'bomber'],['燃烧轰炸机',700,10,40,'bomber'],['震荡轰炸机',760,9,110,'bomber'],['散雷布雷机',680,13,90,'bomber'],
 ['护盾无人机',240,19,25,'support'],['修复无人机',260,18,20,'support'],['干扰机',300,16,35,'support'],['牵引控制机',420,14,45,'support'],
 ['重装炮艇',1100,8,80,'heavy'],['雷霆装甲机',1250,9,95,'heavy'],['移动堡垒',1500,7,105,'heavy'],['磁轨重炮机',1700,6,180,'heavy'],['母巢载机',1950,6,70,'heavy'],
 ['相位幽灵',850,24,85,'elite'],['镜像分身机',950,21,78,'elite'],['狂战精英机',1250,18,95,'elite'],['反弹棱镜机',1050,15,90,'elite'],['时滞黑核机',1400,13,100,'elite']
];
const enemyHints = ['S 型穿屏，瞄准散射','斜切入场，锁定后直冲','圆弧绕场，连续散射','预警后高速俯冲','编队同步环弹','预警后闪跃至侧翼','悬停，双炮交替散射','密集扇形弹','激光预警后高速射击','跟随玩家横向位置','旋转并发射螺旋弹','红圈预警，火箭落点','预判航线，延时爆弹','持续燃烧危险区域','大弹触发二次冲击环','横移并散布延时雷','附近敌机获得护盾减伤','持续修复附近敌机','干扰玩家弹速和充能','牵引场改变玩家位置','双侧连续散射','正面装甲，侧翼弱点','三炮塔交叉散射','清晰预警后贯屏磁轨炮','只释放本关允许的敌机','实体与不可命中相位切换','真机射弹，分身只作视觉干扰','残血后移动和射速提高','弹丸首次碰到边缘后反射','建立敌弹先慢后快的时滞场'];
export const ENEMIES = enemyRows.map((r,i)=>({id:i+1,name:r[0],hp:r[1],speed:r[2],damage:r[3],category:r[4],hint:enemyHints[i]}));
export const DIFFICULTIES = [
 {id:'easy',name:'休闲',hp:1,enemyHp:1.12,damage:.7,speed:.94,rate:.88,density:1,score:.8,aimLead:0,skillBonus:1,enemyMove:1},
 {id:'normal',name:'标准',hp:1,enemyHp:1.42,damage:1,speed:1.12,rate:1.08,density:1,score:1,aimLead:.28,skillBonus:0,enemyMove:1.22},
 {id:'hard',name:'复杂',hp:1,enemyHp:1.9,damage:1.08,speed:1.2,rate:.88,density:.76,enemyCount:1.34,score:1.5,aimLead:.58,skillBonus:-1,enemyMove:1.5}
];
export const TALENTS = [
 {id:'assault_core',branch:'assault',slot:'root',glyph:'✦',name:'脉冲调谐',note:'主炮伤害 +2.5% / 级（2级）',ja:'パルス調律',en:'Pulse Tuning',noteJa:'主砲ダメージ +2.5% / レベル（2段階）',noteEn:'Primary weapon damage +2.5% per level (2 levels).',max:2},
 {id:'assault_piercer',branch:'assault',slot:'left',requires:[{id:'assault_core',level:2}],glyph:'↗',name:'装甲贯穿',note:'对重型与精英敌机伤害 +8%',ja:'装甲貫通',en:'Armor Piercer',noteJa:'重装・エリート機へのダメージ +8%',noteEn:'Deal 8% more damage to heavy and elite fighters.',max:1},
 {id:'assault_reactor',branch:'assault',slot:'right',requires:[{id:'assault_core',level:2}],glyph:'◉',name:'回声回路',note:'命中与击毁获得的大招能量 +10%',ja:'エコー回路',en:'Echo Circuit',noteJa:'命中・撃破で得る必殺エネルギー +10%',noteEn:'Gain 10% more ultimate energy from hits and kills.',max:1},
 {id:'assault_weakpoint',branch:'assault',slot:'left-cap',requires:[{id:'assault_piercer',level:1}],glyph:'◇',name:'核心追击',note:'命中 Boss 部件时伤害 +8%',ja:'コア追撃',en:'Core Pursuit',noteJa:'ボスの部位へのダメージ +8%',noteEn:'Deal 8% more damage when striking Boss parts.',max:1},
 {id:'assault_rhythm',branch:'assault',slot:'right-cap',requires:[{id:'assault_reactor',level:1}],glyph:'≋',name:'超频齐射',note:'主炮射速 +5%',ja:'超過連射',en:'Overclock Volley',noteJa:'主砲の連射速度 +5%',noteEn:'Increase primary weapon fire rate by 5%.',max:1},
 {id:'mobility_core',branch:'mobility',slot:'root',glyph:'✧',name:'矢量喷口',note:'战机移动速度 +4% / 级（2级）',ja:'ベクトル噴射口',en:'Vector Thrusters',noteJa:'機体の移動速度 +4% / レベル（2段階）',noteEn:'Aircraft movement speed +4% per level (2 levels).',max:2},
 {id:'mobility_graze',branch:'mobility',slot:'left',requires:[{id:'mobility_core',level:2}],glyph:'⌁',name:'擦弹扫描',note:'擦弹判定距离 +5',ja:'かすりスキャン',en:'Graze Scanner',noteJa:'かすり判定距離 +5',noteEn:'Increase the bullet graze radius by 5.',max:1},
 {id:'mobility_magnet',branch:'mobility',slot:'right',requires:[{id:'mobility_core',level:2}],glyph:'⌖',name:'磁轨回收',note:'资源吸附距离 +35',ja:'磁気回収軌道',en:'Magnetic Recovery',noteJa:'アイテム吸引距離 +35',noteEn:'Increase item attraction range by 35.',max:1},
 {id:'mobility_feedback',branch:'mobility',slot:'left-cap',requires:[{id:'mobility_graze',level:1}],glyph:'↯',name:'擦弹蓄能',note:'每次擦弹额外获得 3 点大招能量',ja:'かすり蓄電',en:'Graze Capacitor',noteJa:'かすりごとに必殺エネルギーを 3 獲得',noteEn:'Gain 3 extra ultimate energy for each graze.',max:1},
 {id:'mobility_salvage',branch:'mobility',slot:'right-cap',requires:[{id:'mobility_magnet',level:1}],glyph:'⟳',name:'回收涡轮',note:'资源吸附速度 +25%',ja:'回収タービン',en:'Salvage Turbine',noteJa:'アイテム吸引速度 +25%',noteEn:'Increase item attraction speed by 25%.',max:1},
 {id:'survival_core',branch:'survival',slot:'root',glyph:'⬡',name:'燃烧复归',note:'受击后的保护时间 +0.2 秒 / 级（2级）',ja:'炎上復帰',en:'Burning Reentry',noteJa:'被弾後の保護時間 +0.2 秒 / レベル（2段階）',noteEn:'Gain +0.2 seconds of protection after a hit per level (2 levels).',max:2},
 {id:'survival_warning',branch:'survival',slot:'left',requires:[{id:'survival_core',level:2}],glyph:'⌛',name:'先兆解析',note:'敌方技能预警时间 +0.15 秒',ja:'予兆解析',en:'Warning Analysis',noteJa:'敵の技の予告時間 +0.15 秒',noteEn:'Add 0.15 seconds to enemy attack warnings.',max:1},
 {id:'survival_bomb',branch:'survival',slot:'right',requires:[{id:'survival_core',level:2}],glyph:'✹',name:'爆弹核心',note:'英雄炸弹伤害 +8%',ja:'爆弾コア',en:'Bomb Core',noteJa:'英雄爆弾のダメージ +8%',noteEn:'Increase hero bomb damage by 8%.',max:1},
 {id:'survival_repair',branch:'survival',slot:'left-cap',requires:[{id:'survival_warning',level:1}],glyph:'✚',name:'维修共鸣',note:'修复补给额外恢复 80 点大招能量',ja:'修理共鳴',en:'Repair Resonance',noteJa:'修理補給で必殺エネルギーを 80 追加回復',noteEn:'Repair pickups restore an extra 80 ultimate energy.',max:1},
 {id:'survival_reserve',branch:'survival',slot:'right-cap',requires:[{id:'survival_bomb',level:1}],glyph:'▣',name:'备用弹舱',note:'每次出击额外携带 1 枚炸弹（上限仍为 5）',ja:'予備弾倉',en:'Reserve Bomb Rack',noteJa:'出撃時に爆弾を 1 個追加（上限 5 個）',noteEn:'Start each sortie with one extra bomb; the five-bomb cap remains.',max:1}
];
export const TALENT_TREE_VERSION=2;
export const TALENT_BRANCHES=[
 {id:'assault',name:'火力专精',root:'assault_core',routes:[['assault_piercer','assault_weakpoint'],['assault_reactor','assault_rhythm']]},
 {id:'mobility',name:'机动专精',root:'mobility_core',routes:[['mobility_graze','mobility_feedback'],['mobility_magnet','mobility_salvage']]},
 {id:'survival',name:'生存专精',root:'survival_core',routes:[['survival_warning','survival_repair'],['survival_bomb','survival_reserve']]}
];
export function stageConfig(chapter, substage, mode='campaign', pace='full') {
 const ch=CHAPTERS[chapter];
 return {id:`${chapter+1}-${substage+1}`,chapter,substage,name:ch.locations[substage], enemies:ch.enemies[substage],boss:mode==='boss'||substage===2,mode,duration:mode==='boss'?3:pace==='quick'?75:150,story:ch.stories[substage],hazard:ch.hazard};
}
