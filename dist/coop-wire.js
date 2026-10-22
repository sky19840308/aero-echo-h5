// Schema tables and a per-packet string dictionary keep complete worlds small.
// Combat fields and projectile membership are retained; only visual coordinates
// are rounded (0.1 px / 1 ms) before transport.
const ARRAYS=['enemies','bullets','pickups','hazards','effects','weaponEffects','particles','texts','lootBursts','wingmen'];
const FORBIDDEN=new Set(['__proto__','prototype','constructor']);
const POSITION=new Set(['x','y','px','py','vx','vy','originX','originY','dashX','dashY']);
const TIME=new Set(['age','warn','duration','life','hold','burstAt']);
const rounded=(key,value)=>typeof value!=='number'?value:POSITION.has(key)?Math.round(value*10)/10:TIME.has(key)?Math.round(value*1000)/1000:value;
export function packCoopSnapshot(snapshot){
 const dictionary=[],ids=new Map(),tables={},game={...snapshot.game};
 const intern=value=>{if(!ids.has(value)){ids.set(value,dictionary.length);dictionary.push(value);}return ids.get(value);};
 for(const name of ARRAYS){
  const groups=[],schemas=new Map();
  for(const item of game[name]||[]){
   const keys=Object.keys(item).sort(),strings=keys.flatMap((key,index)=>typeof item[key]==='string'?[index]:[]),signature=JSON.stringify([keys,strings]);
   let group=schemas.get(signature);if(!group){group={keys,strings,rows:[]};schemas.set(signature,group);groups.push(group);}
   group.rows.push(keys.map(key=>typeof item[key]==='string'?intern(item[key]):rounded(key,item[key])));
  }
  tables[name]=groups;delete game[name];
 }
 return {...snapshot,game,wire:{v:1,dictionary,tables}};
}
export function unpackCoopSnapshot(snapshot){
 if(!snapshot?.wire)return snapshot;
 const {v,dictionary,tables}=snapshot.wire;
 if(v!==1||!Array.isArray(dictionary)||dictionary.length>4096||dictionary.some(value=>typeof value!=='string'||value.length>160)||!tables||typeof tables!=='object')return null;
 const game={...snapshot.game};
 for(const name of ARRAYS){
  const groups=tables[name],items=[],limit=name==='bullets'?1280:name==='particles'?160:name==='texts'?24:120;
  if(!Array.isArray(groups)||groups.length>limit)return null;
  for(const group of groups){
   const {keys,strings,rows}=group||{};
   if(!Array.isArray(keys)||keys.length>96||new Set(keys).size!==keys.length||keys.some(key=>typeof key!=='string'||key.length>96||FORBIDDEN.has(key))||!Array.isArray(strings)||strings.some(index=>!Number.isInteger(index)||index<0||index>=keys.length)||!Array.isArray(rows)||items.length+rows.length>limit)return null;
   const stringColumns=new Set(strings);
   for(const row of rows){
    if(!Array.isArray(row)||row.length!==keys.length)return null;
    const item={};
    for(let column=0;column<keys.length;column++){
     const value=row[column];if(stringColumns.has(column)){if(!Number.isInteger(value)||value<0||value>=dictionary.length)return null;item[keys[column]]=dictionary[value];}else item[keys[column]]=value;
    }items.push(item);
   }
  }game[name]=items;
 }
 const {wire,...rest}=snapshot;return {...rest,game};
}
