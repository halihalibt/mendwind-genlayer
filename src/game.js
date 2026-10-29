export const PARTS=['cloth','wood','oil','metal'];
export const INITIAL=[2,2,2,1];
export const RECIPES={
 PATCH_SAIL:{cost:[1,0,0,0],en:'Patch the torn sail',zh:'缝补破损风帆'},
 OIL_AXLE:{cost:[0,0,1,0],en:'Oil the seized axle',zh:'为卡住的转轴上油'},
 BRACE_WING:{cost:[0,1,0,0],en:'Brace the cracked wing rib',zh:'加固开裂的翼肋'},
 PATCH_WING:{cost:[1,0,0,0],en:'Patch the fabric wing',zh:'缝补布质机翼'},
 REBUILD_BOX:{cost:[0,1,0,0],en:'Replace the rotten panel',zh:'更换腐朽木板'},
 FREE_LATCH:{cost:[0,0,1,1],en:'Oil the latch & replace its spring',zh:'润滑锁扣并更换弹簧'},
};
export const OBJECTS={
 windmill:{en:'The hilltop windmill',zh:'山顶风车',small:'01',actions:['PATCH_SAIL','OIL_AXLE'],salvage:[0,1,0,1],hint:'Patch the torn sail with cloth and lubricate the axle with oil.',zhint:'用布缝好破损的风帆，再为转轴上油。',story:'It used to turn all afternoon. The valley has been a little quieter since.',zstory:'它曾整整一个下午都在转。停下以后，山谷也安静了许多。'},
 glider:{en:'The postal glider',zh:'送信滑翔机',small:'02',actions:['BRACE_WING','PATCH_WING'],salvage:[1,1,0,0],hint:'Brace the cracked wooden wing rib with wood and patch the fabric wing with cloth.',zhint:'用木料加固开裂的翼肋，再用布缝补破损的机翼。',story:'There are letters waiting on the other side of the clouds.',zstory:'云的另一边，还有人在等一封信。'},
 postbox:{en:'The village postbox',zh:'村口邮筒',small:'03',actions:['REBUILD_BOX','FREE_LATCH'],salvage:[0,1,0,1],hint:'Replace the rotten wooden panel with wood. Oil the stuck latch and replace its broken metal spring.',zhint:'用木料更换腐朽的木板，为卡住的锁扣上油，并换上新的金属弹簧。',story:'A small red box, keeping a whole village connected.',zstory:'一个小小的红盒子，装着整座村庄的牵挂。'},
};
export function freshGame(){return {id:'practice',revision:0,status:'OPEN',stock:[...INITIAL],spent:[0,0,0,0],reclaimed:[0,0,0,0],history:[],objects:Object.fromEntries(Object.keys(OBJECTS).map(k=>[k,{status:'BROKEN',done:[]}]))};}
export function practiceStep(state,target,choice){
 const g=structuredClone(state),o=g.objects[target];
 if(g.status!=='OPEN')throw Error('This workshop is closed. Start another practice session.');
 if(['MENDED','SALVAGED'].includes(o.status))throw Error('This object is already resolved. Choose another.');
 const actions=choice==='full'?OBJECTS[target].actions:choice==='salvage'?['SALVAGE']:choice==='magic'?[]:[choice];
 let outcome='UNSUPPORTED',applied=[];
 if(choice==='salvage'){
  OBJECTS[target].salvage.forEach((v,i)=>{g.stock[i]+=v;g.reclaimed[i]+=v;});o.status='SALVAGED';outcome='SALVAGED';applied=actions;
 } else if(actions.length){
  if(actions.some(a=>o.done.includes(a)))outcome='ALREADY_DONE';
  else {const cost=PARTS.map((_,i)=>actions.reduce((n,a)=>n+RECIPES[a].cost[i],0));
   if(cost.some((v,i)=>v>g.stock[i]))outcome='NO_MATERIAL';
   else {cost.forEach((v,i)=>{g.stock[i]-=v;g.spent[i]+=v;});o.done.push(...actions);o.done.sort();o.status=o.done.length===2?'MENDED':'MENDING';outcome=o.status;applied=actions;}
  }
 }
 g.revision++;g.history.push({id:'sketch-'+g.revision,target,outcome,applied,plan:choice==='magic'?'Conjure new materials and repair it with magic.':choice==='salvage'?'Dismantle this entire object for its reclaimed components.':actions.map(a=>RECIPES[a].en).join(' and '),stock_after:[...g.stock],revision:g.revision,interpretation:{decision:choice==='magic'?'UNSUPPORTED':'CLEAR',steps:actions.map(a=>({action:a,quote:''}))}});
 const states=Object.values(g.objects).map(o=>o.status);
 if(states.every(s=>s==='MENDED'))g.status='RESTORED';else if(states.every(s=>['MENDED','SALVAGED'].includes(s))||g.revision>=12)g.status='CLOSED';
 return g;
}
export function conserved(g){return g.stock.every((v,i)=>v>=0&&v+g.spent[i]===INITIAL[i]+g.reclaimed[i]);}
export function repaired(g){return Object.values(g.objects).reduce((n,o)=>n+o.done.length,0);}
export function normalize(v){if(typeof v==='bigint')return Number(v);if(Array.isArray(v))return v.map(normalize);if(v instanceof Map)return Object.fromEntries([...v.entries()].map(([k,w])=>[k,normalize(w)]));if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,w])=>[k,normalize(w)]));return v;}
