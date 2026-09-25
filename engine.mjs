// The complete game rules. No network, UI or account dependencies.
export const VERSION = 2;
export const PLAN = [
  {name:'The secret draw', kind:'deal', minutes:15, text:'Pass the phone privately. Everyone gets a role and sets a PIN.'},
  {name:'Let the suspicion begin.', kind:'break', minutes:60, text:'Enjoy the party. Talk, listen and decide who you trust. Gather for the Circle when this timer ends.'},
  {name:'Circle of Shaq · 1', kind:'council', minutes:20},
  {name:'Who do you trust now?', kind:'break', minutes:55, text:'Back to the party. Compare stories and make your next move. The next Circle starts when this timer ends.'},
  {name:'Circle of Shaq · 2', kind:'council', minutes:20},
  {name:'Everyone has a theory.', kind:'break', minutes:55, text:'Food, pool time and conversations. Keep your suspicions ready for the next Circle.'},
  {name:'Circle of Shaq · 3', kind:'council', minutes:20},
  {name:'One last alliance.', kind:'break', minutes:15, text:'A short break before the last Circle. Who deserves your trust?'},
  {name:'Circle of Shaq · 4', kind:'council', minutes:20},
  {name:'The final fire', kind:'finale', minutes:20, text:'End together, or banish again. Final departures keep their roles secret.'}
];
export const alive = s => s.players.filter(p=>p.alive);
export const player = (s,id) => s.players.find(p=>p.id===id);
// Merge old mission/break pairs without changing any Circle's scheduled time.
// Role assignments, accepted ballots, revisions and public results stay intact.
export function migrate(saved){
  if(saved?.schema!==1)return validate(saved);
  const map=[0,1,1,2,3,3,4,5,5,6,7,8,9];
  if(!Number.isInteger(saved.block)||saved.block<0||saved.block>=map.length)throw new Error('The old schedule cannot be read.');
  const next=structuredClone(saved);
  next.schema=VERSION;next.block=map[saved.block];
  delete next.pot;delete next.completedMissions;
  return validate(next);
}
const requireThat = (ok,msg) => { if (!ok) throw new Error(msg); };
export function randomIndex(length) {
  requireThat(Number.isInteger(length)&&length>0,'No choices available.');
  const cap = Math.floor(4294967296 / length) * length;
  const data = new Uint32Array(1);
  do { crypto.getRandomValues(data); } while (data[0] >= cap);
  return data[0] % length;
}
export function shuffled(items, rng=randomIndex) {
  const a=[...items];
  for(let i=a.length-1;i>0;i--){ const j=rng(i+1); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
export function createGame(names, {duration=300, start=Date.now(), rehearsal=false}={}) {
  const cleaned = names.map(n=>n.trim());
  requireThat(cleaned.length>=12&&cleaned.length<=14,'Use 12–14 players. This edition is designed for 13.');
  requireThat(cleaned.every(n=>n.length>0&&n.length<=24),'Names must be 1–24 characters.');
  requireThat(new Set(cleaned.map(n=>n.toLowerCase())).size===cleaned.length,'Give each person a different display name.');
  requireThat([240,270,300].includes(duration),'Choose a four, four-and-a-half or five-hour game.');
  const roles=shuffled(cleaned.map((_,i)=>i<3?'traitor':'innocent'));
  return {
    schema:VERSION, id:crypto.randomUUID(), revision:0, created:Date.now(), start,
    duration, rehearsal, players:cleaned.map((name,i)=>({id:i+1,name,role:roles[i],alive:true,pinHash:null,dealt:false,publicRole:null,exit:null})),
    phase:'deal', block:0, round:0, final:false, ballot:{}, runoff:0, candidates:[],
    result:null, history:[], shift:0, pausedAt:null,
    phaseAt:Date.now(), winner:null, winners:[], finalCycle:0
  };
}
export function publicPlayers(s) {
  return s.players.map(p=>({id:p.id,name:p.name,alive:p.alive,exit:p.exit,role:s.phase==='ended'?p.role:p.publicRole}));
}
export function timings(s) {
  let cursor=s.start+s.shift;
  return PLAN.map((b,i)=>{ const start=cursor; cursor+=b.minutes*(s.duration/300)*60000; return {...b,index:i,start,end:cursor}; });
}
function log(s,text,detail=null){s.history.push({at:Date.now(),text,detail});}
function setPhase(s,phase){s.phase=phase;s.phaseAt=Date.now();s.ballot={};}
function finish(s){
  const ts=alive(s).filter(p=>p.role==='traitor');
  s.winner=ts.length?'traitor':'innocent';
  s.winners=alive(s).filter(p=>p.role===s.winner).map(p=>p.id);
  setPhase(s,'ended'); s.pausedAt=null;
  log(s,`${s.winner==='traitor'?'Traitors':'Innocents'} win. The secrets are out.`);
}
function regularWin(s){return alive(s).every(p=>p.role!=='traitor');}
function beginBlock(s,index){
  s.block=index;s.result=null;s.runoff=0;s.candidates=[];
  const b=PLAN[index];
  if(!b){finish(s);return;}
  if(b.kind==='finale'){
    s.final=true;s.finalCycle=0;
    if(alive(s).length<=2)finish(s);else setPhase(s,'decision');
    log(s,'The final fire begins. Departing players now keep their roles hidden.');
  } else if(b.kind==='council'){
    s.round=PLAN.slice(0,index+1).filter(b=>b.kind==='council').length;
    setPhase(s,'discussion');log(s,`Circle of Shaq ${s.round} begins.`);
  } else setPhase(s,'activity');
}
export function ballotType(s){
  return s.phase==='night'?'night':s.phase==='decision'?'decision':s.phase==='vote'?'vote':null;
}
export function pendingVoters(s){return ballotType(s)?alive(s).filter(p=>!(p.id in s.ballot)):[];}
export function validTargets(s,id){
  const p=player(s,id);
  if(s.phase==='night') return alive(s).filter(q=>p.role==='traitor'?q.role==='innocent':q.id!==id);
  if(s.phase==='vote')return alive(s).filter(q=>q.id!==id&&(!s.runoff||s.candidates.includes(q.id)));
  return [];
}
function topChoices(values){
  const tally={};for(const id of values)tally[id]=(tally[id]||0)+1;
  const max=Math.max(...Object.values(tally));
  return {tally,top:Object.keys(tally).filter(id=>tally[id]===max).map(Number)};
}
function eliminate(s,id,method){
  const p=player(s,id);requireThat(p?.alive,'That player has already left.');
  p.alive=false;p.exit=method;
  if(!s.final||method==='murder')p.publicRole=p.role;
}
// Every action is applied to a copy. Callers persist the copy before showing it.
export function reduce(state,action,rng=randomIndex){
  requireThat(state.schema===VERSION,'This save needs a different app version.');
  const s=structuredClone(state),a=action;
  if(s.pausedAt && !['resume','extend','resetPin'].includes(a.type))throw new Error('Resume the game first.');
  switch(a.type){
    case 'deal': {
      requireThat(s.phase==='deal','The draw is already finished.');
      const p=player(s,a.id);requireThat(p&&!p.dealt,'This role has already been accepted.');
      requireThat(/^[a-f0-9]{64}$/.test(a.pinHash),'Set a valid PIN first.');
      p.dealt=true;p.pinHash=a.pinHash;break;
    }
    case 'start':
      requireThat(s.phase==='deal'&&s.players.every(p=>p.dealt),'Everyone must accept their role first.');
      log(s,'All roles accepted. The game begins.');beginBlock(s,1);break;
    case 'next':
      requireThat(s.phase==='activity','Finish the current round before continuing.');
      beginBlock(s,s.block+1);break;
    case 'openVote':
      requireThat(s.phase==='discussion','Discussion must come before voting.');
      s.runoff=0;s.candidates=[];s.result=null;setPhase(s,'vote');break;
    case 'ballot': {
      requireThat(ballotType(s),'There is no ballot open.');
      const p=player(s,a.id);requireThat(p?.alive,'Only surviving players can vote.');
      requireThat(!(a.id in s.ballot),'Your ballot is already sealed.');
      if(s.phase==='decision')requireThat(['END','BANISH'].includes(a.value),'Choose END or BANISH.');
      else if(s.phase==='night'&&p.role==='innocent')requireThat(a.value===null,'Innocents submit an empty night envelope.');
      else requireThat(validTargets(s,a.id).some(p=>p.id===a.value),'That is not an eligible choice.');
      s.ballot[a.id]=a.value;break;
    }
    case 'resolve': {
      requireThat(ballotType(s)&&pendingVoters(s).length===0,'Wait until every surviving player has submitted.');
      if(s.phase==='decision'){
        const ended=Object.values(s.ballot).every(v=>v==='END');
        s.result={type:'decision',ballots:{...s.ballot},ended};
        log(s,ended?'Everyone chose END.':'At least one player chose BANISH.',{...s.ballot});
        setPhase(s,'decisionResult');
      } else if(s.phase==='night'){
        const values=alive(s).filter(p=>p.role==='traitor').map(p=>s.ballot[p.id]);
        requireThat(values.length>0,'No Traitors remain.');
        const {top}=topChoices(values),id=top[rng(top.length)];
        eliminate(s,id,'murder');s.result={type:'murder',id};
        log(s,`${player(s,id).name} was murdered. Innocent.`);setPhase(s,'murderResult');
      } else {
        const ballots={...s.ballot},{top,tally}=topChoices(Object.values(ballots));
        if(top.length>1&&!s.runoff){
          s.result={type:'tie',tied:top,ballots,tally};
          log(s,'The vote is tied. A runoff is required.',ballots);setPhase(s,'voteResult');
        }else{
          const id=top[rng(top.length)];eliminate(s,id,s.final?'final banishment':'banishment');
          s.result={type:'banishment',id,ballots,tally,draw:top.length>1,drawFrom:top};
          log(s,`${player(s,id).name} was banished.${s.final?' Role stays hidden.':` ${player(s,id).role==='traitor'?'Traitor':'Innocent'}.`}`,ballots);
          setPhase(s,'voteResult');
        }
      }break;
    }
    case 'continueResult':
      if(s.phase==='voteResult'){
        if(s.result.type==='tie'){
          s.runoff=1;s.candidates=s.result.tied;s.result=null;setPhase(s,'vote');
        }else if(s.final){
          s.finalCycle++;
          if(alive(s).length<=2)finish(s);else {s.result=null;setPhase(s,'decision');}
        }else if(regularWin(s))finish(s);
        else {s.result=null;setPhase(s,'night');}
      }else if(s.phase==='murderResult'){
        if(alive(s).length<=2)finish(s);
        else if(alive(s).length<=5||s.round>=4)beginBlock(s,PLAN.length-1);
        else beginBlock(s,s.block+1);
      }else if(s.phase==='decisionResult'){
        if(s.result.ended)finish(s);else {s.result=null;setPhase(s,'discussion');}
      }else throw new Error('There is no result to continue from.');
      break;
    case 'pause':
      requireThat(!s.pausedAt&&s.phase!=='ended','This game cannot be paused now.');s.pausedAt=Date.now();break;
    case 'resume':
      requireThat(s.pausedAt,'The game is not paused.');
      s.shift+=Date.now()-s.pausedAt;s.phaseAt+=Date.now()-s.pausedAt;s.pausedAt=null;break;
    case 'extend':
      requireThat(s.phase!=='ended'&&Number.isInteger(a.minutes)&&a.minutes>0&&a.minutes<=30,'Choose an extension of 1–30 minutes.');
      s.shift+=a.minutes*60000;if(s.phase==='discussion')s.phaseAt+=a.minutes*60000;log(s,`Schedule extended by ${a.minutes} minutes.`);break;
    case 'resetPin':{
      const p=player(s,a.id);requireThat(p?.dealt&&/^[a-f0-9]{64}$/.test(a.pinHash),'Choose a dealt player and a valid PIN.');
      p.pinHash=a.pinHash;log(s,`${p.name} reset their PIN with the group present.`);break;
    }
    case 'withdraw':{
      requireThat(['activity','discussion','decision'].includes(s.phase)&&Object.keys(s.ballot).length===0,'Withdraw only between ballots, before anyone votes.');
      requireThat(s.phase!=='decision'||s.final,'Invalid withdrawal.');
      const p=player(s,a.id);requireThat(p?.alive,'That player has already left.');
      eliminate(s,a.id,'withdrawal');
      log(s,`${p.name} withdrew.${s.final?' Role stays hidden.':` ${p.role==='traitor'?'Traitor':'Innocent'}.`}`);
      s.result={type:'withdrawal',id:a.id,previousPhase:s.phase};setPhase(s,'withdrawalResult');break;
    }
    case 'continueWithdrawal':
      requireThat(s.phase==='withdrawalResult','No withdrawal to acknowledge.');
      if((!s.final&&regularWin(s))||alive(s).length<=2)finish(s);
      else if(!s.final&&alive(s).length<=5)beginBlock(s,PLAN.length-1);
      else{const p=s.result.previousPhase;s.result=null;setPhase(s,p);}break;
    default:throw new Error('Unknown game action.');
  }
  s.revision++;
  validate(s);return s;
}
export function validate(s){
  requireThat(s&&s.schema===VERSION&&typeof s.id==='string','This is not a supported game save.');
  requireThat(Array.isArray(s.players)&&s.players.length>=12&&s.players.length<=14,'The player list is invalid.');
  requireThat(new Set(s.players.map(p=>p.id)).size===s.players.length,'Duplicate player identifiers.');
  requireThat(s.players.filter(p=>p.role==='traitor').length===3,'The role count is invalid.');
  requireThat(s.players.every(p=>Number.isInteger(p.id)&&typeof p.name==='string'&&p.name.length<=24&&['traitor','innocent'].includes(p.role)&&typeof p.alive==='boolean'&&typeof p.dealt==='boolean'&&(!p.dealt||/^[a-f0-9]{64}$/.test(p.pinHash))&&[null,'traitor','innocent'].includes(p.publicRole)),'A player record is invalid.');
  requireThat(['deal','activity','discussion','vote','night','decision','voteResult','murderResult','decisionResult','withdrawalResult','ended'].includes(s.phase),'Unknown game phase.');
  requireThat(Number.isInteger(s.block)&&s.block>=0&&s.block<PLAN.length&&Number.isInteger(s.revision)&&s.revision>=0,'The round record is invalid.');
  requireThat(Number.isFinite(s.start)&&Number.isFinite(s.shift)&&[240,270,300].includes(s.duration)&&Array.isArray(s.history),'The schedule is invalid.');
  requireThat(s.ballot&&typeof s.ballot==='object'&&!Array.isArray(s.ballot),'The ballot record is invalid.');
  requireThat(typeof s.final==='boolean'&&Number.isInteger(s.round)&&s.round>=0&&s.round<=4&&[0,1].includes(s.runoff)&&Array.isArray(s.candidates),'The round settings are invalid.');
  requireThat(Number.isFinite(s.phaseAt)&&(s.pausedAt===null||Number.isFinite(s.pausedAt)),'The timing record is invalid.');
  requireThat(s.history.every(h=>h&&typeof h.text==='string'&&Number.isFinite(h.at)&&(h.detail===null||typeof h.detail==='object')),'The public history is invalid.');
  requireThat(s.players.every(p=>(p.publicRole===null||p.publicRole===p.role)&&(!p.alive||p.exit===null)),'The public role record is invalid.');
  if(['voteResult','murderResult','decisionResult','withdrawalResult'].includes(s.phase)){
    requireThat(s.result&&['tie','banishment','murder','decision','withdrawal'].includes(s.result.type),'The saved result is invalid.');
    if(s.result.id!==undefined)requireThat(player(s,s.result.id)&&!player(s,s.result.id).alive,'The departing player record is invalid.');
    if(s.result.type==='tie')requireThat(Array.isArray(s.result.tied)&&s.result.tied.length>1&&s.result.tied.every(id=>player(s,id)?.alive),'The runoff record is invalid.');
  }
  if(s.phase==='ended')requireThat(['traitor','innocent'].includes(s.winner)&&Array.isArray(s.winners)&&s.winners.length>0&&s.winners.every(id=>player(s,id)?.alive&&player(s,id)?.role===s.winner),'The winning result is invalid.');
  if(ballotType(s))for(const [id,v] of Object.entries(s.ballot)){
    const p=player(s,Number(id));requireThat(p?.alive,'An eliminated player has a ballot.');
    if(s.phase==='decision')requireThat(['END','BANISH'].includes(v),'Invalid final choice.');
    else if(s.phase==='night'&&p.role==='innocent')requireThat(v===null,'Invalid night envelope.');
    else requireThat(validTargets(s,p.id).some(q=>q.id===v),'Invalid vote target.');
  }
  return s;
}
