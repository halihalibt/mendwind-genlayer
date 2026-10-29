import {OBJECTS,RECIPES,PARTS,INITIAL,freshGame,practiceStep,conserved,repaired} from './game.js';
import * as chain from './chain.js';

const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lang=localStorage.getItem('mendwind-language')||'en',mode='practice',target='windmill',choice='full',busy=false,live=null,practice=freshGame(),manifest={};
const t=(en,zh)=>lang==='zh'?zh:en;
const state=()=>mode==='practice'?practice:live;
const icons={
 cloth:'<path d="m5 5 23 4-4 24L4 28Z" fill="#d5b993" stroke="#896c52"/><path d="m9 11 14 3M8 17l14 3M7 23l14 3" stroke="#f6ebd3" stroke-width="2"/>',
 wood:'<path d="m5 8 25-4 2 24-26 5Z" fill="#bd986b" stroke="#856844"/><path d="m9 13 18-4M10 20l16-4M11 26l17-4" stroke="#99784e"/><circle cx="18" cy="18" r="3" fill="none" stroke="#99784e"/>',
 oil:'<path d="M12 9h12v5l4 6v13H8V20l4-6Z" fill="#a7b784" stroke="#6c815c"/><path d="M14 4h8v6h-8Z" fill="#c2a270"/><path d="M18 19c-8 8 8 9 0 0" fill="#f4e5a4"/>',
 metal:'<path d="m7 7 20-1 5 8-5 17-19-1-5-10Z" fill="#a6ada3" stroke="#717c76"/><path d="m10 12 14-1 3 6-4 9-12-1-3-7Z" fill="#e5e7d3" stroke="#717c76"/>',
};
function svg(content,view='0 0 36 36'){return `<svg viewBox="${view}" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;}
function objectSvg(key){
 const repaired=state()?.objects[key]?.status==='MENDED';
 if(key==='windmill')return svg(`<path d="M39 44 28 91h44L60 44" fill="#d4b98b" stroke="#66765b" stroke-width="1.6"/><path d="M41 75h14v16H41Z" fill="#a67854"/><path d="M36 43 20 20 9 28 41 51M54 44l23-25 11 9-31 24M53 55l25 24-10 10-17-31M43 55 18 79 9 69l30-17" fill="#eddfa9" stroke="#7c8460" stroke-width="1.6"/><circle cx="49" cy="50" r="6" fill="#b9764b" stroke="#6e7659"/>${repaired?'<path d="m72 7 6 5 10-12" stroke="#7b945f" stroke-width="3"/>':''}`,'0 0 100 100');
 if(key==='glider')return svg(`<path d="m4 45 45-26 45 26-42 6Z" fill="#efdda8" stroke="#9a835b" stroke-width="1.6"/><path d="m49 20 2 58M4 45l47 13 43-13M23 34l28 24 24-26" stroke="#9a835b" stroke-width="1.6"/><path d="m36 58 23-1 12 15-25 6-14-5Z" fill="#b2865c" stroke="#736d50"/><path d="M48 78v10M63 75v10" stroke="#736d50" stroke-width="2"/><circle cx="48" cy="89" r="4" fill="#81836b"/><circle cx="65" cy="87" r="4" fill="#81836b"/>`,'0 0 100 100');
 return svg('<path d="M44 62h10v30H44Z" fill="#a98a61" stroke="#777454"/><path d="M20 35a28 28 0 0 1 56 0v31H20Z" fill="#c36e51" stroke="#855a47" stroke-width="1.6"/><path d="M32 35h33v7H32Z" fill="#544c37"/><path d="M64 20v46M22 59h51" stroke="#e4aa7e" stroke-width="2"/><path d="M75 28h14V13H75v30" stroke="#7f7051" fill="#e5c88d" stroke-width="2"/><circle cx="55" cy="51" r="2" fill="#d7bd85"/>','0 0 100 100');
}
const partName=i=>t(['Cloth','Wood','Oil','Metal'][i],['布料','木料','润滑油','金属件'][i]);
function statusName(s){return t({BROKEN:'AWAITING CARE',MENDING:'IN PROGRESS',MENDED:'MENDED',SALVAGED:'SALVAGED',OPEN:'OPEN',RESTORED:'RESTORED',CLOSED:'CLOSED'}[s]||s,{BROKEN:'等待修缮',MENDING:'修缮中',MENDED:'已修好',SALVAGED:'已拆解',OPEN:'营业中',RESTORED:'山谷复苏',CLOSED:'今日收工'}[s]||s);}
function translate(){
 document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.body.classList.toggle('zh',lang==='zh');
 document.querySelectorAll('[data-en]').forEach(el=>{el.innerHTML=el.dataset[lang]||el.dataset.en;});
 $('language').textContent=lang==='zh'?'EN':'中文';render();
}
function render(){
 const g=state(),obj=g?.objects[target]||{status:'BROKEN',done:[]};
 $('practice-mode').classList.toggle('selected',mode==='practice');$('live-mode').classList.toggle('selected',mode==='live');
 $('mode-note').textContent=mode==='practice'?t('SKETCHBOOK · Local guided play. No wallet, no AI calls, no transactions.','练习手记 · 本地引导体验，无钱包、AI 调用或链上交易。'):t('ON CHAIN · Only finalized GenLayer state is displayed here.','真实链上 · 此处仅显示 GenLayer 最终确认的状态。');
 $('mode-note').classList.toggle('live',mode==='live');
 $('practice-controls').hidden=mode!=='practice';$('live-controls').hidden=mode!=='live';$('chain-desk').hidden=mode!=='live';$('reset').hidden=mode!=='practice';
 $('object-tabs').innerHTML=Object.entries(OBJECTS).map(([k,o])=>`<button class="${target===k?'active':''}" data-object="${k}">${o.small} · ${t({windmill:'Windmill',glider:'Glider',postbox:'Postbox'}[k],{windmill:'风车',glider:'滑翔机',postbox:'邮筒'}[k])}</button>`).join('');
 $('object-title').textContent=OBJECTS[target][lang];$('object-story').textContent=t(OBJECTS[target].story,OBJECTS[target].zstory);$('object-number').textContent=t('Object no. ','物件编号 ')+OBJECTS[target].small;
 $('object-status').textContent=mode==='live'&&!g?t('NOT LOADED','尚未读取'):statusName(obj.status);$('object-status').classList.toggle('mended',obj.status==='MENDED');
 $('object-art').innerHTML=objectSvg(target);
 $('faults').innerHTML=OBJECTS[target].actions.map(a=>`<div class="fault-row ${obj.done.includes(a)?'done':''}"><span class="fault-name">${RECIPES[a][lang]}</span><span class="recipe-cost">${RECIPES[a].cost.map((v,i)=>v?`${v} ${partName(i)}`:'').filter(Boolean).join(' + ')}</span></div>`).join('');
 $('sketch-options').innerHTML=[['full',t('Repair both faults carefully','仔细修好两处问题')],['salvage',t('Dismantle for parts · irreversible','拆解回收零件 · 不可逆')],['magic',t('Try conjuring new supplies','试着凭空变出材料')]].map(([v,label])=>`<button class="sketch-option ${choice===v?'active':''}" data-choice="${v}">${label}</button>`).join('');
 $('stock').innerHTML=PARTS.map((p,i)=>`<div class="material ${g?.stock[i]===0?'depleted':''}">${svg(icons[p])}<b>${g?g.stock[i]:'—'}</b><small>${partName(i)}</small></div>`).join('');
 $('conservation').textContent=g&&conserved(g)?'↻ ✓':'↻';$('conservation').title=g?PARTS.map((p,i)=>`${p}: ${g.stock[i]} + ${g.spent[i]} = ${INITIAL[i]} + ${g.reclaimed[i]}`).join('\n'):t('Read the on-chain workshop first.','请先读取链上修缮铺。');
 const progress=g?repaired(g):0;$('progress-label').textContent=t(`${progress} / 6 repairs`,`${progress} / 6 项维修`);$('progress-bar').style.width=`${progress/6*100}%`;
 $('ending').textContent=g?.status==='RESTORED'?t('The valley is breathing again.','风车转了，信也能送到了。'):g?.status==='CLOSED'?t('Every choice leaves a little trace.','每个选择，都留下了一点痕迹。'):t('The valley is waiting.','山谷，正在等待。');
 $('mini-world').dataset.ending=g?.status||'OPEN';
 document.querySelectorAll('.pin').forEach(pin=>{const s=g?.objects[pin.dataset.target]?.status;pin.classList.toggle('active',pin.dataset.target===target);pin.classList.toggle('mended',s==='MENDED');pin.classList.toggle('salvaged',s==='SALVAGED');});
 $('revision').textContent=t('PAGE ','第 ')+String((g?.revision||0)+1).padStart(3,'0')+(lang==='zh'?' 页':'');
 const history=g?.history||[];
 $('history').innerHTML=history.length?[...history].reverse().map(r=>`<div class="history-row"><span>${String(r.revision).padStart(2,'0')}</span><button data-history="${esc(r.id)}">${OBJECTS[r.target][lang]} ↗</button><small>${esc(r.plan)}</small><span class="history-status">${esc(statusName(r.outcome))}</span><div class="history-detail" id="detail-${esc(r.id)}" hidden><p>${t('Applied operations: ','执行操作：')}${r.applied.length?r.applied.map(a=>RECIPES[a]?.[lang]||a).join(' · '):t('None. No materials spent.','无，不扣除材料。')}</p><p>${t('Stock after: ','剩余材料：')}${r.stock_after.map((n,i)=>`${partName(i)} ${n}`).join(' · ')}</p>${(r.interpretation?.steps||[]).filter(s=>s.quote).map(s=>`<p>“${esc(s.quote)}” → ${esc(s.action)}</p>`).join('')}</div></div>`).join(''):`<p class="empty-history">${mode==='live'&&!g?t('Read a workshop to find its story.','读取一间修缮铺，看看它的故事。'):t('A clean page. An afternoon full of possibilities.','新的一页，留给这个下午。')}</p>`;
 $('repair').disabled=busy||!!chain.pending()||(mode==='live'&&(!g||!chain.player()||g.owner?.toLowerCase()!==chain.player().toLowerCase()))||['MENDED','SALVAGED'].includes(obj.status)||g?.status==='CLOSED'||g?.status==='RESTORED';
 $('repair').querySelector('span').textContent=busy?t('Waiting for the wind…','等待风的回信…'):mode==='live'?t('Send repair to GenLayer','提交至 GenLayer 裁决'):t('Make a little difference','动手，让它变好一点');
 for(const id of ['temporary','wallet','deploy','new-game'])$(id).disabled=busy||!!chain.pending();
}
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),4000);}
function result(text,error=false){$('outcome').textContent=text;$('outcome').classList.toggle('error',error);}
function report(e){result(e.message||String(e),true);toast(e.message||String(e));}
function download(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
function address(){return $('contract-address').value.trim();}
function updateTx(r){const hash=r.hash||chain.pending()?.hash;$('transaction-status').innerHTML=`<strong>${esc(r.status||'')}</strong>${hash?` · <a href="${chain.EXPLORER}/tx/${hash}" target="_blank" rel="noopener">${hash}</a>`:''}${r.error?`<p>${esc(r.error)}</p>`:''}`;if(r.game){live=r.game;$('game-id').value=live.id;render();}if(r.status==='FINALIZED'){
 if(r.method==='deploy'){$('contract-address').value=r.address;manifest.contract_address=r.address;$('chain-status').textContent=`FINALIZED / SUCCESS · ${r.address} · canonical source verified`;}
 result(t('Finalized successfully. The workshop has been read back from the chain.','已最终确认成功，并从链上读回修缮铺状态。'));render();
 }}
async function waitForPending(){busy=true;render();try{const r=await chain.track(updateTx);updateTx(r);return r;}finally{busy=false;render();}}
async function write(method,args,gameId){busy=true;render();try{await chain.send(address(),method,args,gameId,updateTx);return await waitForPending();}finally{busy=false;render();}}
async function readGame(){const id=$('game-id').value.trim();if(!id)throw Error(t('Enter a workshop ID.','请填写修缮铺 ID。'));const g=await chain.read(address(),id);live=g;render();return g;}
function useIdea(){const obj=state()?.objects[target];const remaining=OBJECTS[target].actions.filter(a=>!obj?.done.includes(a));let text=OBJECTS[target].hint;
 if(remaining.length===1){text={PATCH_SAIL:'Patch the torn windmill sail using cloth.',OIL_AXLE:'Lubricate the windmill axle with oil.',BRACE_WING:'Brace the cracked wooden wing rib with wood.',PATCH_WING:'Patch the glider fabric wing using cloth.',REBUILD_BOX:'Replace the rotten postbox panel using wood.',FREE_LATCH:'Oil the stuck postbox latch and replace its broken metal spring.'}[remaining[0]];}
 $('plan').value=text;$('plan-count').textContent=`${text.length} / 600`;
}
async function inLive(){mode='live';result('');render();if(!manifest.contract_address)$('chain-status').textContent=t('No canonical deployment configured yet. Read a deployed address or deploy the published source below.','尚未配置部署。可填写合约地址读取，或展开下方部署入口。');}
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 try{
  if(b.dataset.object||b.dataset.target){target=b.dataset.object||b.dataset.target;choice='full';result('');render();if(mode==='live')useIdea();return;}
  if(b.dataset.choice){choice=b.dataset.choice;render();return;}
  if(b.dataset.history){const detail=$('detail-'+b.dataset.history);detail.hidden=!detail.hidden;return;}
  switch(b.id){
   case 'language':lang=lang==='en'?'zh':'en';localStorage.setItem('mendwind-language',lang);translate();break;
   case 'practice-mode':mode='practice';result('');render();break;
   case 'live-mode':await inLive();break;
   case 'reset':practice=freshGame();target='windmill';choice='full';result('');render();toast(t('A new afternoon begins.','新的一页，新的午后。'));break;
   case 'suggest':useIdea();break;
   case 'temporary':$('player-address').textContent=chain.temporary();toast(t('A free temporary player is ready. Keep this tab open.','临时玩家已就绪，请保持标签页打开。'));render();break;
   case 'wallet':$('player-address').textContent=await chain.wallet();render();break;
   case 'verify':{const v=await chain.verify(address());$('chain-status').textContent=`Source SHA-256 matched · ${v.version} · 61999 · gas 0`;toast(t('Exact source verified.','源码逐字核验通过。'));break;}
   case 'read':await readGame();result(t('Finalized workshop loaded.','已读取最终确认的修缮铺。'));break;
   case 'verified':{
    if(!manifest.example_id)throw Error(t('The first verified example is not published yet.','首个真实示例尚未发布。'));
    $('contract-address').value=manifest.contract_address;$('game-id').value=manifest.example_id;
    $('chain-status').textContent=t('Checking canonical source and reading finalized state…','正在核验源码并读取最终状态…');
    await readGame();$('chain-status').textContent=t('VERIFIED EXAMPLE · Current finalized read · Exact source matched','真实示例 · 当前链上最终读回 · 源码逐字一致');break;
   }
   case 'new-game':{
    if(!chain.player())throw Error(t('Create a free Studio player or connect a wallet first.','请先创建临时玩家或连接钱包。'));
    const slug='afternoon-'+Date.now().toString(36),id=chain.player().toLowerCase()+':'+slug;
    $('game-id').value=id;await write('open_workshop',[slug],id);break;
   }
   case 'deploy':await write('deploy',[],null);break;
   case 'recover':await waitForPending();break;
   case 'repair':{
    if(mode==='practice'){
     practice=practiceStep(practice,target,choice);const last=practice.history.at(-1);render();
     result(last.outcome==='UNSUPPORTED'?t('Nothing comes from nowhere. Try a repair that uses the materials in your cupboard.','材料不能凭空出现。换一个用得上手边材料的维修计划吧。'):last.outcome==='SALVAGED'?t('The object is gone for good. Its reclaimed parts are now in the cupboard.','物件已永久拆解，回收的零件放进了材料柜。'):t('A little care, a little less broken. Your materials have been accounted for.','修好了一点，山谷也明亮了一点。材料去向已记录。'));
     toast(practice.status==='RESTORED'?t('All three restored. The valley is breathing again.','三件旧物都修好了。山谷，又有了风。'):t('A new page in the journal.','手记，添了新的一页。'));
    }else{
     if(!live)throw Error('Read or open a workshop first.');
     const plan=$('plan').value.trim();if(plan.length<8)throw Error(t('Describe your repair in at least 8 characters.','请用至少 8 个字符描述维修计划。'));
     const actionId='repair-'+Date.now().toString(36);await write('act',[live.id,live.revision,actionId,target,plan],live.id);
    }break;
   }
   case 'export':if(!state())throw Error('Load a workshop first.');download('mendwind-'+(mode==='practice'?'practice':'workshop')+'.json',{mode,exported_at:new Date().toISOString(),contract:mode==='live'?address():null,game:state()});break;
   case 'export-execution':download('mendwind-execution.json',{network:61999,contract:address(),entries:chain.logs,pending:chain.pending()});break;
  }
 }catch(e){report(e);}
});
$('plan').addEventListener('input',()=>{$('plan-count').textContent=`${$('plan').value.length} / 600`;});
// Sound is enabled by default; browser autoplay rules determine its first start.
const music=$('ambience');music.volume=.4;let soundOn=true;
function startMusic(){if(soundOn&&music.paused)music.play().catch(()=>{});}
$('music').addEventListener('click',()=>{soundOn=!soundOn;$('music').classList.toggle('muted',!soundOn);$('music').setAttribute('aria-pressed',String(soundOn));$('music').querySelector('span').textContent=soundOn?t('Sound on','音乐开启'):t('Sound off','音乐关闭');if(soundOn)startMusic();else music.pause();});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#music'))startMusic();},{passive:true});document.addEventListener('keydown',startMusic);startMusic();
// Light, wind-borne seeds respond to the cursor; low-power/reduced-motion paths stay quiet.
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;const canvas=$('wind'),ctx=canvas.getContext('2d');let w=0,h=0,gust=0,mx=0,my=0,lastFrame=0;
const seeds=Array.from({length:38},()=>({x:Math.random(),y:Math.random(),r:1+Math.random()*2,s:.06+Math.random()*.12,p:Math.random()*6.28}));
function resize(){const rect=$('home').getBoundingClientRect();w=rect.width;h=rect.height;canvas.width=w;canvas.height=h;}
resize();window.addEventListener('resize',resize,{passive:true});
if(!reduced){
 $('home').addEventListener('pointermove',e=>{mx=(e.clientX/w-.5)*-9;my=(e.clientY/h-.5)*-5;$('home').style.setProperty('--mx',mx+'px');$('home').style.setProperty('--my',my+'px');},{passive:true});
 function draw(now){if(now-lastFrame>33){ctx.clearRect(0,0,w,h);const speed=gust>0?3.8:1;gust=Math.max(0,gust-.017);seeds.forEach(s=>{s.x+=s.s*.001*speed;if(s.x>1.02){s.x=-.02;s.y=Math.random();}const x=s.x*w,y=s.y*h+Math.sin(now*.0005+s.p)*18;ctx.beginPath();ctx.ellipse(x,y,s.r*2,s.r,.5+Math.sin(now*.0005+s.p),0,6.29);ctx.fillStyle=`rgba(255,247,211,${.35+s.r*.15})`;ctx.fill();});lastFrame=now;}requestAnimationFrame(draw);}requestAnimationFrame(draw);
}
$('gust').addEventListener('click',()=>{gust=4;$('gust').classList.remove('gust');requestAnimationFrame(()=>$('gust').classList.add('gust'));toast(t('A little breeze. A little possibility.','起风了，新的可能也来了。'));});
translate();
chain.deployment().then(m=>{manifest=m;$('contract-address').value=m.contract_address||'';if(m.contract_address)$('chain-status').textContent=`Stable Studionet 61999 · ${m.contract_address}`;if(chain.pending()){$('transaction-status').textContent=t('A previous transaction is saved. Use Check pending transaction; do not resend.','发现已保存交易。请检查交易，勿重复提交。');render();}}).catch(e=>{$('chain-status').textContent='Deployment manifest unavailable: '+e.message;});
