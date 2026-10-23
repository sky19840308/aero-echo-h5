import assert from 'node:assert/strict';
import {createLocalDuoGame,localDuoActionForKey,moveLocalDuoPilots} from '../dist/local-duo.js?v=31';

const events=[];
const game=createLocalDuoGame({mission:0,hostShip:0,hostSkin:0,guestShip:2,guestSkin:1,seed:9029,onEvent:event=>events.push(event)});
assert.equal(game.crew.length,2);
assert.equal(game.crew.find(p=>p.role==='host').ship.id,'Dawn7');
assert.equal(game.crew.find(p=>p.role==='guest').ship.id,'WraithX');
assert.equal(game.stage.mode,'campaign');
assert.equal(localDuoActionForKey('KeyQ').type,'skill');
assert.equal(localDuoActionForKey('Numpad2').type,'bomb');
assert.equal(localDuoActionForKey('AltRight').type,'wingmen');
assert.equal(localDuoActionForKey('Enter').role,'guest');

game.start();
const host=game.crew.find(p=>p.role==='host'),guest=game.crew.find(p=>p.role==='guest');
const hostStart=host.player.targetX,guestStart=guest.player.targetX;
assert.equal(moveLocalDuoPilots(game,new Set(['KeyA','ArrowRight']),1/60),true);
assert.ok(host.player.targetX<hostStart,'left keyboard WASD moves the primary ship left');
assert.ok(guest.player.targetX>guestStart,'right keyboard arrows move the secondary ship right');
assert.equal(game.activePilot.role,'host','input restores the main pilot as the renderer and HUD selection');
assert.equal(moveLocalDuoPilots(game,new Set(),1/60),false);

const guestCharges=guest.player.wingmanCharges;
assert.equal(game.use('guest','wingmen'),true,'the secondary pilot can activate its own wingmen');
assert.equal(guest.player.wingmanCharges,guestCharges-1);
assert.equal(game.wingmen.filter(unit=>unit.role==='guest').length,10);
assert.equal(host.player.wingmanCharges,3,'the pilots have independent wingman charges');
assert.equal(game.use('host','skill'),true,'the primary pilot can activate its own skill');

console.log('Local same-screen co-op controls, movement and pilot-specific actions pass.');
