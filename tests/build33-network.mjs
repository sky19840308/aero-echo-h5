import assert from 'node:assert/strict';
import {CoopGame,CoopSession} from '../dist/coop.js?v=33.1';
import {CoopStream} from '../dist/coop-stream.js?v=33.1';
const room={code:'ABCDEFGH',status:'playing',host:{id:'a',choice:{shipIndex:0}},guest:{id:'b',choice:{shipIndex:2}}};
const game=new CoopGame({mission:0,room,width:1422,height:800,seed:33});game.start();
const host=new CoopSession({account:{user:{id:'a'}},autoSync:false});Object.assign(host,{room,role:'host',code:room.code,identity:'a',game,local:game.selectPilot('host'),baseState:'playing',state:'playing'});for(const p of game.crew)p.ack=0;
let checks=0;const ok=(v,s)=>{assert.ok(v,s);checks++;};
const scenarios=[];
for(const [rtt,jitter,loss]of [[40,5,0],[150,35,.06],[300,70,.12]]){
 let now=0,seed=33;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 const received=[],guest=new CoopSession({account:{user:{id:'b'}},autoSync:false,now:()=>now});Object.assign(guest,{room,role:'guest',code:room.code,identity:'b'});
 guest.applySnapshot(host.snapshot(true),0,{source:'direct'});await Promise.resolve();guest.local.ack=0;guest.baseState='playing';guest.refresh();
 let lastX=guest.local.player.x,maxStep=0,totalFrames=0;const queue=[];
 for(let i=0;i<600;i++){
  now=i*1000/60;const x=650+Math.sin(i/80)*280,y=600+Math.cos(i/95)*35;guest.moveTo(x,y);guest.update(1/60);
  maxStep=Math.max(maxStep,Math.abs(guest.local.player.x-lastX));lastX=guest.local.player.x;
  if(i%2===0&&rand()>=loss){const s=structuredClone(host.snapshot(true));s.game.clock=now/1000;s.game.time=now/1000;s.crew[1].player.x=x;s.crew[1].player.y=y;queue.push({at:now+rtt/2+(rand()-.5)*jitter*2,s,seq:i+1});}
  for(let n=queue.length-1;n>=0;n--)if(queue[n].at<=now){const item=queue.splice(n,1)[0];if(guest.applySnapshot(item.s,item.seq,{source:'direct',age:rtt/2000})){totalFrames++;received.push(item.seq);}}
 }
 ok(maxStep<30,'predicted local flight stays smooth at '+rtt+' ms');console.log(JSON.stringify({rtt,totalFrames,maxStep}));ok(totalFrames>140,'newest worlds keep arriving through jitter and loss');
 const clock=guest.lastAuthorityClock;const stale=host.snapshot(true);stale.game.clock=clock-1;ok(guest.applySnapshot(stale,99999,{source:'direct'})===false,'stale worlds cannot roll the scene back');
 const compact=host.snapshot(true);ok(compact.wire.tables.particles.length===0,'cosmetic particles do not consume network bandwidth');
 scenarios.push({rttMs:rtt,jitterMs:jitter,packetLoss:loss,receivedFrames:totalFrames,maxLocalStep:+maxStep.toFixed(2)});
}
class Socket{constructor(url,protocols){this.url=url;this.protocols=protocols;this.readyState=0;this.bufferedAmount=0;this.sent=[];}send(s){this.sent.push(s);}close(){this.readyState=3;this.onclose?.();}}
let now=1000;const stream=new CoopStream({origin:'https://aero.test',role:'guest',code:room.code,accessToken:'a'.repeat(43),socket:Socket,now:()=>now});stream.start();const ws=stream.ws;ws.readyState=1;ws.onopen();
ok(ws.url==='wss://aero.test/api/rooms/ABCDEFGH/stream','TLS stream URL contains no credential');ok(ws.protocols[1]==='token.'+'a'.repeat(43),'credential uses the protected handshake header');
ws.bufferedAmount=50000;ok(stream.sendFrame({type:'frame'})===false,'backpressure never queues a stale world');ws.bufferedAmount=0;ok(stream.send({type:'input'}),'input resumes as soon as buffer clears');stream.close();
// A heartbeat from the relay is not evidence that the other pilot still sends.
let staleNow=1000;const staleSession=new CoopSession({account:{user:{id:'a'}},autoSync:false,now:()=>staleNow});Object.assign(staleSession,{room,code:room.code,role:'host',identity:'a',game,local:game.selectPilot('host'),baseState:'playing',state:'playing',lastPeerAt:1000,stream:{open:true,lastSeen:1000,rtt:10}});staleNow=8000;staleSession.stream.lastSeen=staleNow;staleSession.checkNetwork();ok(!staleSession.peerHealthy()&&staleSession.peerStale,'server pongs cannot hide a silent teammate');staleNow=47001;staleSession.stream.lastSeen=staleNow;staleSession.checkNetwork();ok(staleSession.failureReason==='peer-timeout','a dropped teammate reaches the normal disconnect state');
console.log(JSON.stringify({passed:true,checks,scenarios,scope:'deterministic latency, jitter, packet loss and real transport logic; no physical two-device claim'}));
