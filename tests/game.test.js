import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshGame,practiceStep,conserved,normalize} from '../src/game.js';
import {bindReceipt} from '../src/chain.js';
import {abi} from 'genlayer-js';

test('three complete repairs restore the valley and conserve all four materials',()=>{let g=freshGame();for(const o of ['windmill','glider','postbox']){g=practiceStep(g,o,'full');assert.ok(conserved(g));}assert.equal(g.status,'RESTORED');assert.deepEqual(g.stock,[0,0,0,0]);});
test('salvage permanently retires an object and cannot repeat gains',()=>{const g=practiceStep(freshGame(),'glider','salvage');assert.ok(conserved(g));assert.deepEqual(g.stock,[3,3,2,1]);assert.throws(()=>practiceStep(g,'glider','salvage'));});
test('unsupported request does not generate supplies',()=>{const g=practiceStep(freshGame(),'glider','magic');assert.deepEqual(g.stock,[2,2,2,1]);assert.equal(g.history[0].outcome,'UNSUPPORTED');});
test('missing one required part prevents the entire multi-repair',()=>{const g=freshGame();g.stock[0]=0;g.spent[0]=2;const after=practiceStep(g,'windmill','full');assert.deepEqual(after.stock,g.stock);assert.equal(after.objects.windmill.done.length,0);assert.equal(after.history[0].outcome,'NO_MATERIAL');});
test('twelve unsuccessful attempts end practice',()=>{let g=freshGame();for(let i=0;i<12;i++)g=practiceStep(g,'windmill','magic');assert.equal(g.status,'CLOSED');assert.throws(()=>practiceStep(g,'windmill','full'));});
test('practice updates do not mutate an earlier page',()=>{const g=freshGame();practiceStep(g,'windmill','full');assert.equal(g.revision,0);assert.deepEqual(g.stock,[2,2,2,1]);});
test('SDK bigint arguments normalize to numbers for exact intent comparison',()=>assert.deepEqual(normalize(['id',1n,'repair']),['id',1,'repair']));
const intent={sender:'0x'+'a'.repeat(40),address:'0x'+'b'.repeat(40),method:'act',args:['id',1,'request','windmill','Patch the sail.']};
function tx(p=intent){return {from_address:p.sender,to_address:p.address,data:{calldata:Buffer.from(abi.calldata.encode({method:p.method,args:p.args})).toString('base64')}};}
test('decoded SDK calldata binds to complete saved intent',()=>assert.doesNotThrow(()=>bindReceipt(tx(),intent)));
test('different sender or target contract is rejected',()=>{assert.throws(()=>bindReceipt({...tx(),from_address:'0x'+'c'.repeat(40)},intent));assert.throws(()=>bindReceipt({...tx(),to_address:'0x'+'c'.repeat(40)},intent));});
test('tampered method, revision or plan is rejected',()=>{for(const changed of [{...intent,method:'open_workshop'},{...intent,args:['id',2,'request','windmill','Patch the sail.']},{...intent,args:['id',1,'request','windmill','Other plan.']}])assert.throws(()=>bindReceipt(tx(changed),intent));});
