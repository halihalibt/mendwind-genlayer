import {copyFileSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const code=readFileSync('contracts/mendwind.py');
copyFileSync('contracts/mendwind.py','public/mendwind.py');
let manifest={};try{manifest=JSON.parse(readFileSync('public/deployment.json','utf8'));}catch{}
manifest={...manifest,network:'Stable Studionet',chain_id:61999,rpc:'https://studio.genlayer.com/api',version:'mendwind-1',source_sha256:createHash('sha256').update(code).digest('hex')};
writeFileSync('public/deployment.json',JSON.stringify(manifest,null,2)+'\n');
