import {validate} from './engine.mjs';
const enc=new TextEncoder(), dec=new TextDecoder();
const to64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
const from64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export async function digest(text){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(text)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export const pinHash=(game,id,pin)=>digest(`${game.id}:${id}:${pin}`);
export class Store {
  constructor(storage,prefix='villa-traitors-v1'){this.storage=storage;this.key=prefix;this.lastRevision=null;this.lastId=null;}
  async load(){
    const copies=[this.storage.getItem(this.key),this.storage.getItem(this.key+'-mirror')];
    if(copies.every(x=>!x))return {state:null,recovered:false};
    const good=[];
    for(const copy of copies){try{if(!copy)continue;const {data,checksum}=JSON.parse(copy);if(await digest(data)!==checksum)continue;good.push(validate(JSON.parse(data)));}catch{}}
    if(!good.length)throw new Error('The saved game cannot be read. Keep this browser data; restore an encrypted backup from the recovery screen.');
    good.sort((a,b)=>b.revision-a.revision);const state=good[0];
    this.lastRevision=state.revision;this.lastId=state.id;
    return {state,recovered:good.length<2||copies[0]!==copies[1]};
  }
  async save(state,{replace=false}={}){
    validate(state);
    const raw=this.storage.getItem(this.key);
    if(raw&&!replace){
      let existing;try{existing=JSON.parse(JSON.parse(raw).data);}catch{}
      if(existing&&(existing.id!==this.lastId||existing.revision!==this.lastRevision))throw new Error('The game changed in another window. Close this window and reopen the saved game.');
    }
    const data=JSON.stringify(state),packet=JSON.stringify({data,checksum:await digest(data)});
    // One whole snapshot per write; never show results until the primary write succeeds.
    this.storage.setItem(this.key,packet);
    let mirrored=true;try{this.storage.setItem(this.key+'-mirror',packet);}catch{mirrored=false;}
    this.lastId=state.id;this.lastRevision=state.revision;
    return mirrored;
  }
  clear(){this.storage.removeItem(this.key);this.storage.removeItem(this.key+'-mirror');this.lastId=null;this.lastRevision=null;}
}
async function keyFor(password,salt){
  const seed=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},seed,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function exportBackup(state,password){
  if(password.length<8)throw new Error('Use a backup password of at least 8 characters.');
  validate(state);const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await keyFor(password,salt);
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(state)));
  return JSON.stringify({format:'villa-traitors-encrypted',version:1,salt:to64(salt),iv:to64(iv),data:to64(data)},null,2);
}
export async function importBackup(text,password){
  try{
    if(text.length>2000000)throw new Error();
    const b=JSON.parse(text);
    if(b.format!=='villa-traitors-encrypted'||b.version!==1)throw new Error();
    const key=await keyFor(password,from64(b.salt));
    const data=await crypto.subtle.decrypt({name:'AES-GCM',iv:from64(b.iv)},key,from64(b.data));
    return validate(JSON.parse(dec.decode(data)));
  }catch{throw new Error('Could not restore: check the backup file and its password. Your current game has not been changed.');}
}
