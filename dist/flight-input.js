import {localDuoActionForKey,LOCAL_DUO_KEY_CODES} from './local-duo.js?v=30.1';

const movement=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
const soloActions={KeyQ:'skill',KeyE:'bomb',KeyR:'wingmen',Space:'ultimate'};

export function flightKeyBinding({code,repeat=false,editable=false,buttonActivation=false,duo=false}){
 if(editable)return null;
 if(code==='Escape'||code==='KeyP')return repeat?null:{kind:'pause'};
 if(buttonActivation&&['Space','Enter','NumpadEnter'].includes(code))return null;
 if(movement.has(code))return {kind:'move'};
 const action=duo?localDuoActionForKey(code):soloActions[code]?{role:'host',type:soloActions[code]}:null;
 return action?{kind:'action',...action}:null;
}

export function isMovementKey(code,duo=false){return duo?LOCAL_DUO_KEY_CODES.has(code):movement.has(code)||!!soloActions[code];}
