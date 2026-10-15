// Authenticated room signaling remains on the Site. Gameplay uses encrypted
// browser-to-browser data channels; the HTTP relay remains a fallback.
const MAGIC=0xaee0beef,CHUNK=10000,MAX_BYTES=450000;
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export class CoopPeer {
 constructor({role,code,request,onPacket=()=>{},onState=()=>{},now=()=>Date.now(),rtc=globalThis.RTCPeerConnection,iceServers=[{urls:'stun:stun.cloudflare.com:3478'}]}={}){
  this.role=role;this.code=code;this.request=request;this.onPacket=onPacket;this.onState=onState;this.now=now;this.rtc=rtc;this.iceServers=iceServers;
  this.state='off';this.key='';this.closed=false;this.fragments=new Map();this.serial=0;this.lastSeen=0;this.rtt=0;this.sending=false;
 }
 get open(){return !this.closed&&!['failed','closed'].includes(this.pc?.connectionState)&&this.control?.readyState==='open'&&this.frames?.readyState==='open';}
 async start(){
  if(!this.rtc||this.closed)return;this.state='connecting';this.onState(this.state);
  this.pc=new this.rtc({iceServers:this.iceServers,iceCandidatePoolSize:1});
  this.pc.ondatachannel=event=>this.bind(event.channel);
  this.pc.onconnectionstatechange=()=>{if(!this.closed&&['failed','closed'].includes(this.pc.connectionState))this.onState(this.state='relay');};
  if(this.role==='host'){
   this.key=token();this.bind(this.pc.createDataChannel('aero-control',{ordered:true}));this.bind(this.pc.createDataChannel('aero-frames',{ordered:false,maxPacketLifeTime:150}));
   await this.pc.setLocalDescription(await this.pc.createOffer());await this.gather();
   if(this.closed)return;await this.request({signal:{key:this.key,type:'offer',sdp:this.pc.localDescription.sdp}});
  }
  if(this.closed)return;this.pollTimer=setInterval(()=>void this.poll().catch(()=>{}),700);this.pollTimer?.unref?.();void this.poll().catch(()=>{});
  this.heartbeat=setInterval(()=>{if(this.open)this.send({type:'ping',at:this.now()});},500);this.heartbeat?.unref?.();
 }
 async gather(){for(let n=0;n<40&&!this.closed&&this.pc.iceGatheringState!=='complete';n++)await pause(100);}
 async poll(){
  if(this.closed||this.polling||this.open)return;this.polling=true;
  try{const response=await this.request({}),signal=response.signal;if(this.closed||!signal||signal.key===this.accepted)return;
   if(this.role==='guest'&&signal.type==='offer'){
    this.key=signal.key;await this.pc.setRemoteDescription({type:'offer',sdp:signal.sdp});await this.pc.setLocalDescription(await this.pc.createAnswer());await this.gather();
    if(!this.closed)await this.request({signal:{key:this.key,type:'answer',sdp:this.pc.localDescription.sdp}});
   }else if(this.role==='host'&&signal.type==='answer'&&signal.key===this.key)await this.pc.setRemoteDescription({type:'answer',sdp:signal.sdp});
   else return;this.accepted=signal.key;
  }finally{this.polling=false;}
 }
 bind(channel){
  if(channel.label==='aero-control')this.control=channel;else if(channel.label==='aero-frames')this.frames=channel;else{channel.close();return;}
  channel.binaryType='arraybuffer';channel.onopen=()=>{if(this.open){this.state='direct';this.lastSeen=this.now();this.send({type:'hello',gzip:!!globalThis.DecompressionStream});this.onState(this.state);}};
  channel.onclose=()=>{if(!this.closed)this.onState(this.state='relay');};channel.onerror=()=>{if(!this.closed)this.onState(this.state='relay');};
  channel.onmessage=event=>{if(typeof event.data==='string')this.deliver(event.data);else void this.receive(event.data).catch(()=>{});};
 }
 deliver(text){
  if(this.closed||text.length>MAX_BYTES)return;
  let packet;try{packet=JSON.parse(text);}catch{return;}
  if(packet.key!==this.key||packet.code!==this.code)return;this.lastSeen=this.now();
  if(packet.type==='hello'){this.remoteGzip=packet.gzip===true;return;}
  if(packet.type==='ping'){this.send({type:'pong',at:packet.at});return;}
  if(packet.type==='pong'){this.rtt=Math.max(0,this.now()-Number(packet.at||this.now()));return;}
  this.onPacket(packet);
 }
 send(packet){if(!this.open||this.control.bufferedAmount>32000)return false;try{this.control.send(JSON.stringify({...packet,key:this.key,code:this.code}));return true;}catch{return false;}}
 async sendFrame(packet){
  if(!this.open||this.sending||this.frames.bufferedAmount>96000)return false;this.sending=true;
  try{
   let bytes=new TextEncoder().encode(JSON.stringify({...packet,key:this.key,code:this.code})),compressed=0;
   if(this.remoteGzip&&globalThis.CompressionStream&&bytes.length>1500){const zipped=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());if(zipped.length<bytes.length){bytes=zipped;compressed=1;}}
   if(!this.open||bytes.length>MAX_BYTES||this.frames.bufferedAmount>96000)return false;
   const count=Math.ceil(bytes.length/CHUNK),serial=++this.serial;
   for(let index=0;index<count;index++){
    const part=bytes.subarray(index*CHUNK,(index+1)*CHUNK),buffer=new ArrayBuffer(16+part.length),view=new DataView(buffer);view.setUint32(0,MAGIC);view.setUint32(4,serial);view.setUint16(8,index);view.setUint16(10,count);view.setUint8(12,compressed);new Uint8Array(buffer,16).set(part);this.frames.send(buffer);
   }return true;
  }catch{return false;}finally{this.sending=false;}
 }
 async receive(buffer){
  if(this.closed||!(buffer instanceof ArrayBuffer)||buffer.byteLength<16||buffer.byteLength>CHUNK+16)return;
  const view=new DataView(buffer);if(view.getUint32(0)!==MAGIC)return;
  const serial=view.getUint32(4),index=view.getUint16(8),count=view.getUint16(10),compressed=view.getUint8(12);
  if(count<1||count>45||index>=count||compressed>1)return;
  for(const [id,frame]of this.fragments)if(this.now()-frame.at>2000||serial>id+2)this.fragments.delete(id);
  let frame=this.fragments.get(serial);if(!frame){if(this.fragments.size>=3)return;frame={at:this.now(),parts:new Array(count),size:0,count,compressed};this.fragments.set(serial,frame);}
  if(frame.count!==count||frame.compressed!==compressed||frame.parts[index])return;const part=new Uint8Array(buffer.slice(16));frame.parts[index]=part;frame.size+=part.length;
  if(frame.size>MAX_BYTES){this.fragments.delete(serial);return;}if(frame.parts.filter(Boolean).length!==count)return;this.fragments.delete(serial);
  let bytes=new Uint8Array(frame.size),cursor=0;for(const chunk of frame.parts){bytes.set(chunk,cursor);cursor+=chunk.length;}
  if(compressed){if(!globalThis.DecompressionStream)return;const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),chunks=[];let size=0;for(;;){const result=await reader.read();if(result.done)break;size+=result.value.length;if(size>MAX_BYTES){await reader.cancel();return;}chunks.push(result.value);}bytes=new Uint8Array(size);cursor=0;for(const chunk of chunks){bytes.set(chunk,cursor);cursor+=chunk.length;}}
  this.deliver(new TextDecoder().decode(bytes));
 }
 close(){this.closed=true;clearInterval(this.pollTimer);clearInterval(this.heartbeat);this.fragments.clear();this.control?.close();this.frames?.close();this.pc?.close();this.state='off';}
}
