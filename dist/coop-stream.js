// Persistent TLS transport when a direct data channel is unavailable. Never
// queue old worlds behind new ones; socket backpressure discards that frame.
export class CoopStream {
 constructor({origin,role,code,accessToken,onPacket=()=>{},onState=()=>{},now=()=>Date.now(),socket=globalThis.WebSocket}={}){
  Object.assign(this,{origin,role,code,accessToken,onPacket,onState,now,socket});this.state='off';this.closed=false;this.lastSeen=0;this.rtt=0;this.retries=0;
 }
 get open(){return !this.closed&&this.ws?.readyState===1;}
 start(){
  if(this.closed||!this.socket||!this.origin)return;clearTimeout(this.retry);this.state='connecting';this.onState();
  const url=new URL(`/api/rooms/${this.code}/stream`,this.origin);url.protocol=url.protocol==='https:'?'wss:':'ws:';
  try{const ws=this.ws=new this.socket(url.href,['aero-v1',...(this.accessToken?['token.'+this.accessToken]:[])]);
   ws.onopen=()=>{if(this.ws!==ws)return;this.retries=0;this.lastSeen=this.now();this.state='stream';this.onState();this.send({type:'ping',at:this.now()});};
   ws.onmessage=event=>{if(this.ws!==ws||typeof event.data!=='string'||event.data.length>450000)return;let p;try{p=JSON.parse(event.data);}catch{return;}if(p.code!==this.code)return;this.lastSeen=this.now();if(p.type==='pong'){this.rtt=Math.max(0,this.now()-p.at);return;}if(p.type==='hello')return;this.onPacket(p);};
   ws.onclose=()=>{if(this.ws!==ws||this.closed)return;this.state='retrying';this.onState();this.retry=setTimeout(()=>this.start(),Math.min(5000,250*2**Math.min(5,this.retries++)));this.retry?.unref?.();};
   ws.onerror=()=>{if(this.ws===ws)ws.close();};
  }catch{this.state='unavailable';this.onState();}
  if(!this.heartbeat){this.heartbeat=setInterval(()=>{if(this.open){if(this.now()-this.lastSeen>6000)this.ws.close();else this.send({type:'ping',at:this.now()});}},1000);this.heartbeat?.unref?.();}
 }
 send(packet){if(!this.open||this.ws.bufferedAmount>48000)return false;try{this.ws.send(JSON.stringify({...packet,code:this.code}));return true;}catch{return false;}}
 sendFrame(packet){return this.send(packet);}
 close(){this.closed=true;clearTimeout(this.retry);clearInterval(this.heartbeat);this.ws?.close();this.state='off';}
}
