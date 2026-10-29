import {createClient,createAccount,abi} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {sha256,stringToHex} from 'viem';
import {normalize} from './game.js';

export const RPC='https://studio.genlayer.com/api';
export const EXPLORER='https://explorer-studio.genlayer.com';
export const chain={...studionet,rpcUrls:{default:{http:[RPC]}}};
const client=createClient({chain,endpoint:RPC});
let signer=null,provider=null,verified='',manifest=null;
const KEY='mendwind-pending-v1';
export const logs=[];
export async function deployment(){if(!manifest)manifest=await fetch('./deployment.json').then(r=>r.json());return manifest;}
export function pending(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch{return null;}}
function savePending(p){if(p)localStorage.setItem(KEY,JSON.stringify(p));else localStorage.removeItem(KEY);}
export function player(){return signer?.address||'';}
export function temporary(){if(pending())throw Error('Finish checking the pending transaction before changing players.');signer=createAccount();provider=null;return signer.address;}
export async function wallet(){
 if(pending())throw Error('Finish checking the pending transaction before changing players.');
 provider=window.okxwallet||window.ethereum;
 if(!provider)throw Error('No wallet extension found. Use Free Studio player instead.');
 const addresses=await provider.request({method:'eth_requestAccounts'});
 let id=await provider.request({method:'eth_chainId'});
 if(Number(id)!==61999){
  try{await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xf22f'}]});}
  catch(e){if(e.code!==4902)throw e;await provider.request({method:'wallet_addEthereumChain',params:[{chainId:'0xf22f',chainName:'GenLayer Stable Studionet',rpcUrls:[RPC],nativeCurrency:{name:'GEN',symbol:'GEN',decimals:18},blockExplorerUrls:[EXPLORER]}]});}
 }
 id=await provider.request({method:'eth_chainId'});if(Number(id)!==61999)throw Error('Use Stable Studionet 61999.');
 signer={address:addresses[0],type:'json-rpc'};return signer.address;
}
async function preflight(){
 const [id,gas]=await Promise.all([client.request({method:'eth_chainId'}),client.request({method:'eth_gasPrice'})]);
 if(Number(id)!==61999||BigInt(gas)!==0n)throw Error('Network must be Stable Studionet 61999 with zero gas price. No write sent.');
 if(provider){const [walletId,addresses]=await Promise.all([provider.request({method:'eth_chainId'}),provider.request({method:'eth_accounts'})]);if(Number(walletId)!==61999||addresses[0]?.toLowerCase()!==player().toLowerCase())throw Error('Wallet changed. Connect again.');}
 return {chainId:Number(id),gasPrice:String(gas)};
}
export async function hashText(text){return sha256(stringToHex(text)).slice(2);}
export async function verify(address){
 verified='';if(!/^0x[0-9a-fA-F]{40}$/.test(address))throw Error('A deployed contract address is required.');
 const m=await deployment();const network=await preflight();
 const source=await client.getContractCode(address);const hash=await hashText(source);
 if(hash!==m.source_sha256)throw Error('Deployed source does not match the canonical MENDWIND source.');
 const info=JSON.parse(await client.readContract({address,functionName:'get_info',args:[],transactionHashVariant:'latest-final'}));
 if(info.version!=='mendwind-1')throw Error('Protocol mismatch.');verified=address.toLowerCase();
 return {address,source_sha256:hash,network,version:info.version};
}
export async function read(address,id){
 if(verified!==address.toLowerCase())await verify(address);
 const g=JSON.parse(await client.readContract({address,functionName:'get_game',args:[id],transactionHashVariant:'latest-final'}));
 if(g.id!==id||g.version!=='mendwind-1')throw Error('Unexpected workshop readback.');return g;
}
export async function send(address,method,args,gameId,onChange){
 if(pending())throw Error('A transaction is already pending. Check it instead of sending again.');
 if(!signer)throw Error('Connect a wallet or create a free Studio player first.');
 await preflight();if(method!=='deploy'&&verified!==address.toLowerCase())await verify(address);
 let code;
 if(method==='deploy'){
  code=await fetch('./mendwind.py').then(r=>r.text());const m=await deployment();if(await hashText(code)!==m.source_sha256)throw Error('Source file hash mismatch.');
  await client.getContractSchemaForCode(code);
 }
 const p={sender:player(),address,method,args:normalize(args),gameId,hash:null,submitted_at:new Date().toISOString()};savePending(p);
 const writer=createClient({chain,endpoint:RPC,account:provider?player():signer,...(provider?{provider}:{})});
 try{
  if(method==='deploy'){
   p.hash=await writer.deployContract({code,args:[],leaderOnly:false,consensusMaxRotations:3});
  }else p.hash=await writer.writeContract({address,functionName:method,args,value:0n,leaderOnly:false,consensusMaxRotations:3});
  savePending(p);onChange?.({...p,status:'SUBMITTED'});
 }catch(e){
  p.error=String(e.message||e);p.status='SUBMISSION_UNCERTAIN';savePending(p);
  throw Error('Submission did not return a hash. No automatic retry. '+p.error);
 }
 return p;
}
function decodeCall(tx){
 const raw=tx.data?.calldata;
 const base64=typeof raw==='string'?raw:raw?.base64;
 if(base64)return normalize(abi.calldata.decode(Uint8Array.from(atob(base64),c=>c.charCodeAt(0))));
 return normalize(tx.txDataDecoded?.callData||null);
}
export function bindReceipt(tx,p){
 if((tx.from_address||tx.sender||'').toLowerCase()!==p.sender.toLowerCase())throw Error('Transaction sender differs from saved intent.');
 if(p.method==='deploy')return;
 if((tx.to_address||tx.recipient||'').toLowerCase()!==p.address.toLowerCase())throw Error('Transaction contract differs from saved intent.');
 const call=decodeCall(tx);
 if(!call||call.method!==p.method||JSON.stringify(normalize(call.args||[]))!==JSON.stringify(normalize(p.args)))throw Error('Transaction method or arguments differ from saved intent.');
 if(Object.keys(call.kwargs||{}).length)throw Error('Unexpected keyword arguments.');
 if(tx.leader_only===true||tx.txDataDecoded?.leaderOnly===true||tx.data?.leader_only===true)throw Error('Leader-only transaction is not accepted.');
}
export async function checkPending(){
 const p=pending();if(!p)return {status:'NONE'};
 if(!p.hash)throw Error('Submission has no returned hash. Inspect wallet history; do not resend automatically.');
 const tx=await client.getTransaction({hash:p.hash});const status=tx.statusName||tx.status;
 if(status!=='FINALIZED'){
  if(['CANCELED','UNDETERMINED','LEADER_TIMEOUT','VALIDATORS_TIMEOUT','DISAGREEMENT'].includes(status)){
   logs.push({...p,status,transaction:normalize(tx)});savePending(null);throw Error('Transaction ended without success: '+status+'. No retry was sent.');
  }return {...p,status};
 }
 const receipts=tx.consensus_data?.leader_receipt;const leader=Array.isArray(receipts)?receipts.at(-1):receipts;
 const execution=tx.txExecutionResultName||leader?.execution_result;
 if(execution!=='SUCCESS'){
  logs.push({...p,status,execution,transaction:normalize(tx)});savePending(null);
  throw Error('FINALIZED but execution failed. State was not accepted. '+(leader?.error||JSON.stringify(leader?.result)||''));
 }
 const consensus=tx.resultName||tx.result_name||tx.result;
 if(consensus!=='MAJORITY_AGREE')throw Error('Finalized transaction has no majority agreement: '+String(consensus));
 bindReceipt(tx,p);
 let game=null,address=p.address;
 if(p.method==='deploy'){
  address=tx.data?.contract_address||tx.txDataDecoded?.contractAddress||tx.to_address||tx.recipient;
  if(!address)throw Error('Finalized deployment did not expose its contract address.');await verify(address);
 }else{
  game=await read(address,p.gameId);
  if(p.method==='open_workshop'&&game.owner.toLowerCase()!==p.sender.toLowerCase())throw Error('Created workshop owner mismatch.');
  if(p.method==='act'){
   const record=game.history.find(r=>r.id===p.args[2]);
   if(!record||record.revision!==p.args[1]+1||record.target!==p.args[3]||record.plan!==p.args[4])throw Error('Finalized action does not match workshop state.');
  }
 }
 const entry={...p,address,status,execution,game,transaction:normalize(tx),checked_at:new Date().toISOString()};logs.push(entry);savePending(null);return entry;
}
export async function track(onChange){
 for(let n=0;n<120;n++){
  try{const r=await checkPending();onChange(r);if(['FINALIZED','NONE'].includes(r.status))return r;}
  catch(e){onChange({status:'CHECK_ERROR',error:e.message});throw e;}
  await new Promise(r=>setTimeout(r,4000));
 }
 throw Error('Still waiting. The saved transaction can be checked later without resending.');
}
