import {PLAN,timings} from './engine.mjs';

// Deadlines use wall time so the display catches up after the browser sleeps.
// This is not a background scheduler: a suspended page cannot execute this code.
export function currentTimer(state){
  if(!state||state.pausedAt)return null;
  let deadline,title;
  if(state.phase==='activity'){
    deadline=timings(state)[state.block].end;
    title=PLAN[state.block+1]?.name||'Gather everyone';
  }else if(state.phase==='discussion'){
    deadline=state.phaseAt+(state.final?2:10)*60000;
    title='Discussion finished. Time to vote.';
  }else return null;
  return {deadline,title,key:`${state.id}:${state.block}:${state.phase}:${state.finalCycle}:${deadline}`};
}

export class TimerTracker{
  constructor(storage,key){
    this.storage=storage;this.key=key;this.seen=[];
    try{const saved=JSON.parse(storage.getItem(key));if(Array.isArray(saved))this.seen=saved.filter(x=>typeof x==='string').slice(-60);}catch{}
  }
  claim(timer,now=Date.now()){
    if(!timer||now<timer.deadline||this.seen.includes(timer.key))return false;
    this.seen=[...this.seen,timer.key].slice(-60);
    // Alert preferences must never block or corrupt game persistence.
    try{this.storage.setItem(this.key,JSON.stringify(this.seen));}catch{}
    return true;
  }
}

export class BrowserAlerts{
  constructor(){this.audio=null;this.sound=false;this.keepAwake=false;this.wake=null;this.requestingWake=false;}
  get soundReady(){return this.sound&&this.audio?.state==='running';}
  async enableSound(){
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)throw new Error('Sound is unavailable in this browser. Use your phone’s Clock alarm.');
    this.audio??=new Audio();
    await this.audio.resume();
    if(this.audio.state!=='running')throw new Error('Sound is blocked. Check your phone settings and try again.');
    this.sound=true;this.chime();
  }
  chime(){
    if(!this.sound||this.audio?.state!=='running')return false;
    const ctx=this.audio,start=ctx.currentTime;
    for(const [i,f] of [440,554.37,659.25,440,554.37,659.25].entries()){
      const tone=ctx.createOscillator(),gain=ctx.createGain(),at=start+i*.24;
      tone.type='sine';tone.frequency.value=f;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.22,at+.025);gain.gain.exponentialRampToValueAtTime(.001,at+.42);
      tone.connect(gain);gain.connect(ctx.destination);tone.start(at);tone.stop(at+.45);
      tone.onended=()=>{tone.disconnect();gain.disconnect();};
    }
    return true;
  }
  get notificationSupport(){return 'Notification' in window&&'serviceWorker' in navigator;}
  async enableNotifications(){
    if(!this.notificationSupport)throw new Error('Notifications are unavailable here. On iPhone, add this site to your Home Screen and open it there first. Use Clock for background alarms.');
    const permission=await Notification.requestPermission();
    if(permission!=='granted')throw new Error('Notifications were not allowed. You can change this in browser settings. Sound and on-screen alerts still work while the page is open.');
    const delivered=await this.notify('Browser alerts are enabled. Keep the game open; use Clock when you leave it.','villa-alert-test');
    if(!delivered)throw new Error('Permission granted, but the test notification could not be sent. Try again after offline setup finishes.');
  }
  async notify(body,tag){
    if(!this.notificationSupport||Notification.permission!=='granted')return false;
    try{
      const registration=await navigator.serviceWorker.getRegistration();
      if(!registration?.active)return false;
      await registration.showNotification('The Villa · Timer',{
        body,tag,icon:new URL('./icon-192.png',import.meta.url).href,
        data:{url:new URL('./',import.meta.url).href}
      });return true;
    }catch{return false;}
  }
  async syncWake(active){
    if(!this.keepAwake||!active||document.hidden){
      if(this.wake){const lock=this.wake;this.wake=null;try{await lock.release();}catch{}}
      return;
    }
    if(this.wake&&!this.wake.released||this.requestingWake||!navigator.wakeLock)return;
    this.requestingWake=true;
    try{
      const lock=await navigator.wakeLock.request('screen');
      this.wake=lock;lock.addEventListener('release',()=>{if(this.wake===lock)this.wake=null;});
      if(!this.keepAwake||document.hidden){this.wake=null;await lock.release();}
    }catch{}finally{this.requestingWake=false;}
  }
}
