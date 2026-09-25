import {PLAN,createGame,reduce,alive,player,publicPlayers,pendingVoters,validTargets,ballotType,timings,randomIndex} from './engine.mjs';
import {Store,pinHash,exportBackup,importBackup} from './storage.mjs';

const root=document.querySelector('#app');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon='<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M3 20Q32-12 61 20Q32 52 3 20Z"/><circle cx="32" cy="20" r="9"/><path d="M32 7V33"/></svg>';
const icons={game:'◈',guests:'♧',schedule:'◷',rules:'≡'};
const clock=n=>new Date(n).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
let store,state=null,view='game',privateSession=null,busy=false,offlineReady=false,notice='',fatal='',lockOwned=false,booted=false;
let toastTimer,privateTimer,wrongPins=new Map();
const contextKey='villa-traitors-v1:'+location.pathname.replace(/index\.html$/,'');
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),5500);}
function name(id){return esc(player(state,Number(id))?.name||'Player');}
function btn(text,action,cls='primary',data=''){return `<button class="${cls}" data-action="${action}" ${data}>${text}</button>`;}
function top(){return `<header class="topbar"><a class="wordmark" href="#" data-action="home">${icon}<span>THE VILLA<small>A GAME OF TRAITORS</small></span></a>${state?btn('•••','tools','icon-button','aria-label="Game controls"'):btn('How to play','rules','text-button')}</header>`;}
function footer(){return state?`<nav class="bottomnav" aria-label="Game navigation">${Object.entries(icons).map(([k,i])=>`<button data-action="nav" data-view="${k}" class="${view===k?'active':''}" ${view===k?'aria-current="page"':''}><span aria-hidden="true">${i}</span>${{game:'The game',guests:'Players',schedule:'Schedule',rules:'Rules'}[k]}</button>`).join('')}</nav>`:'';}
function status(){return `<div class="statusline"><span class="dot ${offlineReady?'ready':''}"></span><span>${offlineReady?'Saved for offline play':navigator.onLine?'Preparing offline access…':'Offline access not verified'}</span><span class="status-right">ONE SHARED PHONE</span></div>`;}
function shell(content){return `<div class="shell">${top()}${state?.rehearsal?'<div class="practice-banner">REHEARSAL · All player PINs are 1234 · No real game</div>':''}${notice?`<div class="notice" role="alert">${esc(notice)}</div>`:''}<main id="main">${content}</main>${status()}${footer()}</div>`;}
function tag(text,cls=''){return `<span class="tag ${cls}">${text}</span>`;}
function statbar(){return `<div class="statbar"><div><strong>${alive(state).length}<small>/${state.players.length}</small></strong><span>still in</span></div><div><strong>${state.players.filter(p=>p.publicRole==='traitor').length}<small>/3</small></strong><span>Traitors caught</span></div><div><strong>${state.pot}</strong><span>prize points</span></div></div>`;}
function welcome(){return shell(`<section class="hero"><div class="hero-copy"><p class="eyebrow">YOUR VILLA. YOUR FRIENDS. THEIR SECRETS.</p><h1>The party<br>has a <em>secret.</em></h1><p class="lede">A little trust. A little betrayal.<br>One phone runs the game. Everyone gets to play.</p><div class="hero-actions">${btn('Enter the villa <span>↗</span>','setup')}${btn('Try a rehearsal','demo','secondary')}</div><div class="hero-facts"><span>12–14 friends</span><span>3 Traitors</span><span>4–5 hours</span></div></div><div class="villa-art" aria-hidden="true"><div class="arch"><div class="sun"></div><div class="eye-art">${icon}</div><div class="pool"><i></i><i></i><i></i></div><div class="steps"></div></div><span class="art-caption">TRUST IS A CHOICE.</span></div></section><div class="intro-grid"><article><span>01</span><h3>Keep your secret</h3><p>Private roles and PINs. No host has to sit out.</p></article><article><span>02</span><h3>Follow the suspicion</h3><p>Circle votes, secret murders and plenty of pool time.</p></article><article><span>03</span><h3>Face the final fire</h3><p>End together. Or banish one more.</p></article></div><p class="fine center">Free to play. No sign-in, tracking or game-data uploads.</p><div class="center">${btn('Restore a saved game','restore','text-button')}</div>`);}
function setup(){return shell(`<section class="page narrow"><p class="eyebrow">MAKE IT YOUR EVENING</p><h1>Who’s coming?</h1><p class="lede">One name per line. Use 12–14 unique names; thirteen is ideal.</p><form id="setup-form"><label for="names">Your players <span id="name-count">13 names</span></label><textarea id="names" name="names" rows="9" maxlength="500" required placeholder="Aarav\nAnanya\nYour friends…">${Array.from({length:13},(_,i)=>`Player ${i+1}`).join('\n')}</textarea><div class="field-row"><div><label for="duration">Evening length</label><select id="duration" name="duration"><option value="300">5 hours · relaxed</option><option value="270">4½ hours</option><option value="240">4 hours</option></select></div><div><label for="start-time">Start time</label><input type="time" id="start-time" name="start" value="${new Date().getHours().toString().padStart(2,'0')}:${new Date().getMinutes().toString().padStart(2,'0')}"></div></div><div class="note"><strong>Everyone plays. Nobody hosts.</strong><p>The phone deals 3 Traitors at random. Names and roles stay on this device. Use the same browser or home-screen app all evening.</p></div><label class="check"><input type="checkbox" required name="ready"> I have everyone’s names. We’re using one shared phone.</label><button class="primary full" type="submit">Deal the secrets <span>↗</span></button></form><p class="fine">Keep a charger handy. Try a rehearsal and airplane-mode check before your party.</p></section>`);}
function header(label,title,description=''){return `<p class="eyebrow">${label}</p><h1>${title}</h1>${description?`<p class="lede">${description}</p>`:''}`;}
function game(){
 if(!state)return welcome();
 if(state.pausedAt)return shell(`<section class="page narrow center">${header('TAKE YOUR TIME','The villa can wait.','Your game is paused. Private ballots and roles remain saved.')}<div class="pause-glyph">Ⅱ</div>${btn('Resume the evening','resume','primary full')}<p class="fine">Resuming shifts the schedule by the time you spent paused.</p></section>`);
 if(state.phase==='ended')return ending();
 if(state.phase==='deal'){
   const done=state.players.filter(p=>p.dealt).length;
   return shell(`<section class="page">${header('THE SECRET DRAW',`${done===state.players.length?'The secret is out there.':'Pass the phone.'}`, 'Each person selects their name, sets a private 4-digit PIN and accepts their role. Keep everyone else away from the screen.')}<div class="progress"><span style="width:${done/state.players.length*100}%"></span></div><p class="fine">${done} of ${state.players.length} roles accepted · 3 Traitors, ${state.players.length-3} Innocents</p><div class="player-grid">${state.players.map(p=>`<button class="player-card ${p.dealt?'complete':''}" data-action="deal" data-id="${p.id}" ${p.dealt?'disabled':''}><span class="avatar">${String(p.id).padStart(2,'0')}</span><span>${esc(p.name)}<small>${p.dealt?'Role accepted':'Tap privately to begin'}</small></span><span class="arrow">${p.dealt?'✓':'↗'}</span></button>`).join('')}</div>${done===state.players.length?btn('Everyone is ready · begin','start','primary full'):''}<div class="note">Traitors see their teammates privately. No eyes-closed introduction is needed. Don’t say your role aloud.</div></section>`);
 }
 const b=PLAN[state.block],times=timings(state);
 const cap=state.final?'THE FINAL FIRE':state.round?`ROUND ${state.round} OF 4`:'THE AFTERNOON BEGINS';
 if(state.phase==='activity'){
  return shell(`<section class="page">${header(b.kind==='mission'?'EVERYONE PLAYS · GHOSTS INCLUDED':'ROOM TO BREATHE',b.name,b.text)}${statbar()}<div class="activity-card"><div><span class="eyebrow">${b.kind==='mission'?'MISSION WINDOW':'TIME TO ENJOY THE VILLA'}</span><div class="timer" data-timer="${times[state.block].end}">--:--</div><p class="fine">Next: ${esc(PLAN[state.block+1]?.name||'the finale')} · ${clock(times[state.block].end)}</p></div><span class="activity-symbol" aria-hidden="true">${b.kind==='mission'?'✧':'≈'}</span></div>${b.kind==='mission'?`<div class="actions">${btn('Mission complete · +10 points','mission-win')}${btn('Finish without points','mission-lose','secondary')}</div>`:btn('Gather everyone · continue','next','primary full')}<p class="fine">Continue when everyone is ready. Timers never advance or eliminate anyone automatically.</p>${b.kind==='break'?ghostMini():''}</section>`);
 }
 if(state.phase==='discussion')return shell(`<section class="page">${header(cap,state.final?'One more question.':'Circle of Shaq',state.final?'Take two minutes to make your final case. The next person banished will keep their role hidden.':'Go around once: 20 seconds each to name a suspect. Then discuss. Only surviving players can influence the game.')}${statbar()}<div class="discussion-card"><span class="eyebrow">DISCUSSION TIMER</span><div class="timer" data-timer="${state.phaseAt+(state.final?2:10)*60000}">--:--</div><blockquote>“Who benefits<br>if we’re wrong?”</blockquote></div>${btn('Ready · open the vote','open-vote','primary full')}<p class="fine">Everyone writes their choice privately on this phone. Choices are revealed together.</p></section>`);
 if(ballotType(state))return ballots();
 if(['voteResult','murderResult','decisionResult','withdrawalResult'].includes(state.phase))return resultScreen();
 return shell('<p>Open the game controls to restore your saved game.</p>');
}
function ghostMini(){return `<div class="note"><strong>Ghost Club</strong><p>Eliminated? Lock a next-banishment prediction on paper, play cup toss, or record a private exit interview. Join every mission. Keep clues and reactions away from surviving players.</p></div>`;}
function ballots(){
 const type=ballotType(state),pending=pendingVoters(state),done=alive(state).length-pending.length;
 const title=type==='night'?'A secret in every envelope.':type==='decision'?'End it. Or risk it.':state.runoff?'A second look.':'Make your accusation.';
 const desc=type==='night'?'Every surviving player takes a private turn, including Innocents. Spend roughly 15 seconds each. Only Traitor choices affect the murder.':type==='decision'?'Everyone chooses END or BANISH privately. One BANISH is enough to continue.':state.runoff?'Vote again between the tied players. If it ties again, the app draws one of the tied names at random.':'Choose one other surviving player. No self-votes. Nobody sees the votes until all are sealed.';
 return shell(`<section class="page">${header(type==='night'?'THE SECRET NIGHT':type==='decision'?'THE FINAL FIRE':state.final?'FINAL BANISHMENT':`CIRCLE ${state.round}`,title,desc)}<div class="ballot-counter"><strong>${done}<span> / ${alive(state).length}</span></strong><span>sealed ${type==='night'?'envelopes':'choices'}</span></div><div class="player-grid">${alive(state).map(p=>`<button class="player-card ${p.id in state.ballot?'complete':''}" data-action="ballot" data-id="${p.id}" ${p.id in state.ballot?'disabled':''}><span class="avatar">${String(p.id).padStart(2,'0')}</span><span>${esc(p.name)}<small>${p.id in state.ballot?'Sealed':'Your private turn'}</small></span><span class="arrow">${p.id in state.ballot?'✓':'↗'}</span></button>`).join('')}</div>${!pending.length?btn(type==='night'?'Everyone ready · reveal the murder':type==='decision'?'Everyone ready · reveal decisions':'Everyone ready · reveal the votes','resolve','primary full'):''}${state.rehearsal&&pending.length?btn('Fill remaining practice choices','demo-ballots','secondary full'):''}<p class="fine">${pending.length?'Pass the phone with the screen covered.':'All choices are saved. Gather everyone before revealing.'}</p></section>`);
}
function voteTable(ballots){return `<div class="vote-list">${Object.entries(ballots).map(([id,v])=>`<div><span>${name(id)}</span><span>→</span><strong>${typeof v==='number'?name(v):esc(v)}</strong></div>`).join('')}</div>`;}
function resultScreen(){
 const r=state.result;let content='',label='THE VERDICT',button='Continue',action='continue-result';
 if(r.type==='tie'){
  content=`<h1>Suspicion is split.</h1><p class="lede">${r.tied.map(name).join(' · ')}</p><p>Everyone still in the game votes again between these players.</p>${voteTable(r.ballots)}`;button='Start the runoff';
 }else if(r.type==='decision'){
  content=`<h1>${r.ended?'The fire goes out.':'The fire stays lit.'}</h1><p class="lede">${r.ended?'Everyone chose END. Reveal the surviving roles together.':'Someone chose BANISH. Another vote must happen.'}</p>${voteTable(r.ballots)}`;button=r.ended?'Reveal the winners':'Begin final discussion';
 }else{
  const p=player(state,r.id),hidden=!p.publicRole;
  const role=hidden?'Role stays hidden':p.role==='traitor'?'TRAITOR':'INNOCENT';
  label=r.type==='murder'?'THE NIGHT HAS SPOKEN':r.type==='withdrawal'?'A PLAYER IS LEAVING':'THE CIRCLE HAS SPOKEN';
  content=`<div class="verdict ${!hidden&&p.role==='traitor'?'traitor':''}"><span class="eyebrow">${r.type==='murder'?'MURDERED':r.type==='withdrawal'?'WITHDRAWN':'BANISHED'}</span><h1>${esc(p.name)}</h1><div class="role-seal">${role}</div><p>${hidden?'Keep your role secret until the game ends.':'Your role is now public.'} Join the Ghost Club.</p></div>${r.draw?`<div class="note">The runoff tied between ${r.drawFrom.map(name).join(', ')}. A random draw selected ${esc(p.name)}. This result is saved.</div>`:''}${r.ballots?`<details><summary>See the votes</summary>${voteTable(r.ballots)}</details>`:''}`;
  button=r.type==='murder'?'Continue the evening':r.type==='withdrawal'?'Acknowledge withdrawal':state.final?'Continue the final fire':'Continue';
  if(r.type==='withdrawal')action='continue-withdrawal';
 }
 return shell(`<section class="page narrow"><p class="eyebrow">${label}</p>${content}${btn(button,action,'primary full')}<p class="fine">Results are locked once revealed. Nobody can undo what the group has seen.</p></section>`);
}
function ending(){return shell(`<section class="page"><div class="ending"><p class="eyebrow">THE SECRETS ARE OUT</p><div class="ending-eye">${icon}</div><h1>The ${state.winner==='traitor'?'Traitors':'Innocents'}<br><em>take the villa.</em></h1><p class="lede">${state.winners.map(name).join(' · ')}</p><p>${state.pot} prize points to share between the surviving winners.</p></div><div class="player-grid">${state.players.map(p=>`<div class="player-card"><span class="avatar ${p.role==='traitor'?'red':''}">${p.role==='traitor'?'T':'I'}</span><span>${esc(p.name)}<small>${p.role==='traitor'?'Traitor':'Innocent'} · ${p.alive?'survived':esc(p.exit)}</small></span>${state.winners.includes(p.id)?'<span class="arrow">✧</span>':''}</div>`).join('')}</div><div class="note"><strong>Time for the exit interviews.</strong><p>Let the Traitors explain their moves, open the Ghost predictions, and settle the prize pot.</p></div><div class="actions">${btn('See the whole story','history')}${btn('Start a fresh evening','new','secondary')}</div></section>`);}
function guests(){return shell(`<section class="page">${header('THE GUEST LIST','Everyone has a story.','Only publicly revealed roles appear here. Use your PIN to check your own role privately.')}<div class="player-grid">${publicPlayers(state).map(p=>`<div class="player-card ${!p.alive?'ghost':''}"><span class="avatar">${String(p.id).padStart(2,'0')}</span><span>${esc(p.name)}<small>${p.alive?'Still playing':'Ghost Club · '+esc(p.exit)}${p.role?' · '+esc(p.role):''}</small></span>${player(state,p.id).dealt?`<button class="text-button" data-action="my-role" data-id="${p.id}">My role</button>`:''}</div>`).join('')}</div>${ghostMini()}</section>`);}
function schedule(){return shell(`<section class="page">${header('THE EVENING, AT A GLANCE','A little structure.<br>A lot of party.','The clock is a guide. The group always chooses when to continue. Pauses and extensions move the planned finish.')}<div class="timeline">${timings(state).map(b=>`<div class="timeline-row ${b.index===state.block?'current':''} ${b.index<state.block?'past':''}"><span class="time">${clock(b.start)}</span><span class="timeline-dot"></span><div><strong>${esc(b.name)}</strong><small>${Math.round(b.minutes*state.duration/300)} minutes${b.kind==='mission'?' · all players':''}</small></div>${b.index===state.block?tag('NOW'):b.index<state.block?'<span>✓</span>':''}</div>`).join('')}<div class="timeline-row"><span class="time">${clock(timings(state).at(-1).end)}</span><span class="timeline-dot"></span><strong>Secrets out. Party on.</strong></div></div><div class="actions">${btn('Give us 10 more minutes','extend','secondary')}${btn(state.pausedAt?'Resume the evening':'Pause the game',state.pausedAt?'resume':'pause','secondary')}</div><p class="fine">Early departures can shorten the game. Catching all three Traitors in a regular Circle ends it immediately.</p></section>`);}
function rules(){return shell(`<section class="page narrow">${header('THE HOUSE RULES','Read once.<br>Trust carefully.')}<div class="rule-intro">3 Traitors. Everyone else is Innocent.<br>One shared phone. Everyone plays.</div><details open><summary>01 · What are we trying to do?</summary><p>Innocents try to banish all three Traitors. Traitors know one another and try to survive to the end. Only surviving winners share the prize. If all three Traitors are caught in regular Circles, surviving Innocents win immediately.</p></details><details><summary>02 · How do private turns work?</summary><p>At the draw, set a private four-digit PIN and accept your role. Traitors also see their teammates. Privately note your PIN and role on a folded backup slip. Pass the phone with the screen hidden. Every surviving player takes a turn in every ballot. PINs prevent casual accidental peeking; this is an honour-system party game.</p></details><details><summary>03 · Banishments and ties</summary><p>Discuss, then each survivor privately selects one other survivor. Choices are sealed once submitted and revealed together. Most votes leaves. A tie triggers one runoff among tied candidates, with all survivors voting. A second tie is settled by a saved random draw. Regular banishments reveal the role.</p></details><details><summary>04 · Murders</summary><p>After each regular banishment, all survivors take a private turn. Traitors choose a living Innocent. Innocents select a decoy that is ignored. Only Traitor choices count. Most choices determines the victim; tied targets are selected randomly. Only the victim is announced. Eliminated players cannot participate.</p></details><details><summary>05 · The final fire</summary><p>After four rounds (or sooner if five or fewer remain after a murder), stop murders. Every survivor chooses END or BANISH. Unanimous END finishes the game. Any BANISH triggers another discussion and vote. Final departures do not reveal roles. Repeat until everyone chooses END or only two remain. If any Traitors survive, those Traitors take the pot; otherwise the surviving Innocents share it. Numerical parity alone does not end the game.</p></details><details><summary>06 · Ghost Club</summary><p>Eliminated players join every mission, pool time, cup toss and private exit interviews. Before each Circle, Ghosts can write a next-banishment prediction on paper for a separate chocolate. No hints, advice, reactions or messages to living players. Being eliminated never makes someone the host.</p></details><details><summary>07 · Missions and prize points</summary><p>Three shared missions each add 10 points if completed. Points can represent wrapped chocolates or just bragging rights. Everyone, including Traitors and Ghosts, helps. Mission failure is not proof of a role. Play physical activities on dry ground.</p></details><details><summary>08 · If plans change</summary><p>Pause or extend the schedule from Game controls. No timer submits a ballot or eliminates anyone. Late arrivals can join side activities once roles are dealt. Withdraw a departing player only between ballots using Game controls. Their role is revealed during regular play and hidden in the finale. Fewer players may bring the finale forward.</p></details><details><summary>09 · Phone, privacy and recovery</summary><p>Keep this exact browser or installed home-screen app all evening; those can have separate storage. Do not clear browser data or use private browsing. The saved game stays on this device. Export a password-protected backup between rounds and save it where a spare phone can access it. Never upload game backups to the public GitHub repository.</p><p>To recover a forgotten player PIN, bring that person and the group together and use the public reset in Game controls. The reset is logged. There is no master role list during play. A determined device owner could inspect local data, so don’t use the game for high-stakes wagering.</p></details><details><summary>10 · Before your party</summary><p>Run a rehearsal on the exact phone. Wait for “Saved for offline play”, turn on airplane mode, close and reopen this webpage, and check that it resumes. Keep your battery charged. Set ordinary phone alarms for gatherings; browser timers and sound may stop in the background. Keep folded role slips and paper ballots as a fallback.</p></details><p class="fine">An unofficial fan-made party adaptation. Not affiliated with Prime Video or The Traitors. No recruitment, shields or changing roles in this edition.</p>${!state?btn('Back to the villa','home','secondary full'):''}</section>`);}
function controls(){return shell(`<section class="page narrow">${header('GAME CONTROLS','Keep the evening flowing.','These controls reveal no hidden roles. Anyone can help operate the phone.')}<div class="control-grid">${state.phase!=='ended'?btn(state.pausedAt?'Resume':'Pause game',state.pausedAt?'resume':'pause','secondary'):''}${state.phase!=='ended'?btn('+10 minutes','extend','secondary'):''}${btn('Save encrypted backup','backup','secondary')}${btn('Restore backup','restore','secondary')}${btn('Public game history','history','secondary')}${btn('Check this phone','check','secondary')}${state.phase!=='ended'?btn('Player needs to leave','withdraw','secondary'):''}${btn('Reset a player’s PIN','reset-pin','secondary')}${btn('Start a new game','new','danger')}</div><p class="fine">Session ${esc(state.id.slice(0,8))} · save ${state.revision} · version 1.0.0<br>Your game is stored only in this browser. No account, server database or tracking.</p></section>`);}
function history(){return shell(`<section class="page narrow">${header('THE PUBLIC RECORD','How suspicion unfolded.','This record includes only information the group has already seen.')}<div class="history-list">${state.history.length?state.history.map(h=>`<article><time>${clock(h.at)}</time><p>${esc(h.text)}</p>${h.detail?`<details><summary>Public choices</summary>${voteTable(h.detail)}</details>`:''}</article>`).join(''):'<p>No public events yet.</p>'}</div>${btn('Back to the game','home','secondary full')}</section>`);}
function backupPage(){return shell(`<section class="page narrow">${header('A SECOND WAY BACK','Save the evening.','Export an encrypted copy of this exact checkpoint. Keep the file and password somewhere you can reach from a spare phone.')}<form id="backup-form"><label for="backup-password">Backup password · at least 8 characters</label><input id="backup-password" name="password" type="password" minlength="8" maxlength="128" required autocomplete="new-password"><label for="backup-confirm">Repeat password</label><input id="backup-confirm" name="confirm" type="password" minlength="8" maxlength="128" required autocomplete="new-password"><button class="primary full">Download encrypted backup</button></form><div class="note">This file includes hidden roles, protected by your password. Keep it private; do not upload it to GitHub. A backup reflects this checkpoint, not later actions.</div></section>`);}
function restorePage(){return shell(`<section class="page narrow">${header('RECOVER YOUR EVENING','Pick up the story.','Choose a backup made by this game and enter its backup password.')}<form id="restore-form"><label for="backup-file">Encrypted backup file</label><input type="file" id="backup-file" name="file" accept=".json,application/json" required><label for="restore-password">Backup password</label><input id="restore-password" type="password" name="password" required maxlength="128" autocomplete="off"><label class="check"><input type="checkbox" required> This checkpoint matches what the group has already seen. I understand it replaces this browser’s current game.</label><button class="primary full">Check and restore backup</button></form><div class="note">An old save cannot undo revealed information. If your only backup is behind the live game, continue using the paper rules instead of replaying votes or murders.</div></section>`);}
function withdrawPage(){return shell(`<section class="page narrow">${header('A CHANGE OF PLANS','Someone has to leave.','They will leave the competition permanently. Their role is public during regular rounds and stays hidden during the finale.')}<form id="withdraw-form"><label for="departing">Departing player</label><select name="id" id="departing">${alive(state).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select><label class="check"><input type="checkbox" required> This player is present and agrees to leave. The group is aware.</label><button class="danger full">Confirm permanent withdrawal</button></form><p class="fine">Available only between ballots. This can bring the finale forward or end the game.</p></section>`);}
function resetPage(){return shell(`<section class="page narrow">${header('PUBLIC PIN RECOVERY','Bring the player over.','Only reset a PIN with that person and the group present. The change is recorded in the public history.')}<form id="reset-form"><label for="reset-player">Who forgot their PIN?</label><select name="id" id="reset-player">${state.players.filter(p=>p.dealt).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select><label class="check"><input type="checkbox" required> The player is here. Another person has witnessed and agreed to this reset.</label><button class="primary full">Pass phone to set a new PIN</button></form></section>`);}
function newPage(){return shell(`<section class="page narrow">${header('A FRESH START','End this saved evening?','Starting again removes this browser’s current game. Save an encrypted backup first if you need it.')}<form id="new-form"><label for="reset-word">Type RESET to continue</label><input id="reset-word" name="word" required pattern="RESET" placeholder="RESET" autocomplete="off"><button class="danger full">Clear this game and start again</button></form>${btn('Keep playing','home','secondary full')}</section>`);}
function checkPage(){return shell(`<section class="page narrow">${header('A QUICK DRESS REHEARSAL','Ready for the villa?')}<div class="readiness"><div><span>${offlineReady?'✓':'○'}</span><p><strong>${offlineReady?'Game files saved offline':'Offline preparation pending'}</strong><br>Keep the page open online until it says “Saved for offline play”.</p></div><div><span>${lockOwned?'✓':'○'}</span><p><strong>One active game window</strong><br>Keep other copies of this game closed.</p></div><div><span>1</span><p>Save a backup, then switch your phone to airplane mode.</p></div><div><span>2</span><p>Close and reopen this same browser tab or home-screen app. Check that the correct round returns.</p></div><div><span>3</span><p>Open your private role, switch away, then return. The role should be hidden.</p></div><div><span>4</span><p>Keep a power bank, ordinary phone alarms and paper role slips ready.</p></div></div><div class="note">On iPhone: Safari → Share → Add to Home Screen. On Android: browser menu → Add to Home screen / Install. Install before starting your real game, then do the rehearsal there. Installing later may open a separate save.</div>${btn('Back to the game','home','primary full')}</section>`);}

function privatePage(){
 const p=player(state,privateSession.id),mode=privateSession.mode,stage=privateSession.stage;
 const close=btn('Hide & go back','private-close','text-button');
 if(stage==='sealed')return `<main class="private-screen center"><div class="sealed-mark">✓</div><p class="eyebrow">SAVED AND SEALED</p><h1>Keep your<br>poker face.</h1><p>Your choice is safely recorded.</p>${btn('Hide & pass the phone','private-close','primary full')}</main>`;
 let body='';
 if(stage==='pin'||stage==='setpin'){
  body=`<p class="eyebrow">FOR ${esc(p.name).toUpperCase()} ONLY</p><h1>${stage==='setpin'?'Make it<br>your secret.':'Your private<br>moment.'}</h1><p>${stage==='setpin'?'Choose a 4-digit PIN you can remember. Privately note it on your folded backup slip.':'Keep the screen away from other players.'}</p><form id="pin-form"><label for="player-pin">${stage==='setpin'?'Choose a 4-digit PIN':'Your 4-digit PIN'}</label><input id="player-pin" class="pin-input" name="pin" inputmode="numeric" pattern="[0-9]{4}" type="password" maxlength="4" minlength="4" required autocomplete="off">${stage==='setpin'?'<label for="pin-confirm">Repeat your PIN</label><input id="pin-confirm" class="pin-input" name="confirm" inputmode="numeric" pattern="[0-9]{4}" type="password" maxlength="4" minlength="4" required autocomplete="off">':''}<button class="primary full">${stage==='setpin'?(mode==='reset'?'Save new PIN':'Show my role'):'Unlock my turn'}</button></form>`;
 }else if(stage==='role'){
  body=`<p class="eyebrow">${esc(p.name).toUpperCase()}, YOUR SECRET IS…</p><div class="role-card ${p.role}"><div class="private-eye">${icon}</div><h1>${p.role==='traitor'?'Traitor.':'Innocent.'}</h1><p>${p.role==='traitor'?'Blend in. Choose your murders. Survive the final fire.':'Follow the votes. Question the stories. Find all three Traitors.'}</p></div>${p.role==='traitor'?`<div class="teammates"><span class="eyebrow">YOUR FELLOW TRAITORS</span><p>${state.players.filter(q=>q.role==='traitor'&&q.id!==p.id).map(q=>esc(q.name)).join(' · ')}</p></div>`:'<p class="fine">You do not know anybody else’s role. Trust carefully.</p>'}<p class="fine">Privately copy your role onto a folded backup slip. Keep it hidden.</p>${btn(mode==='deal'?'I remember · accept my role':'Hide my role',mode==='deal'?'accept-role':'private-close','primary full')}`;
 }else if(stage==='choice'){
  const type=ballotType(state);
  const description=type==='decision'?'END means you trust everyone left. Any BANISH keeps the game going.':type==='night'?(p.role==='traitor'?'Choose a living Innocent to murder. Your fellow Traitors make their own choices. Most votes wins; ties are drawn randomly.':'You are Innocent. Choose any name as a decoy; your choice is ignored. This gives everyone the same private ritual.'):'Choose one other surviving player to banish. Your vote becomes public after everyone has voted.';
  const choices=type==='decision'?[{id:'END',name:'End the game',detail:'I trust everyone left.'},{id:'BANISH',name:'Banish again',detail:'A Traitor may remain.'}]:validTargets(state,p.id).map(q=>({id:q.id,name:q.name}));
  body=`<p class="eyebrow">${esc(p.name).toUpperCase()} · PRIVATE CHOICE</p><h1>${type==='night'?'Seal the night.':type==='decision'?'Trust your gut.':'Name your suspect.'}</h1><p>${description}</p><div class="choice-list">${choices.map(q=>`<button class="choice ${privateSession.choice===q.id?'chosen':''}" data-action="choose" data-value="${q.id}" aria-pressed="${privateSession.choice===q.id}"><span>${esc(q.name)}${q.detail?`<small>${esc(q.detail)}</small>`:''}</span><span>${privateSession.choice===q.id?'●':'○'}</span></button>`).join('')}</div>${privateSession.choice!==undefined?`<div class="seal-confirm">Your choice: <strong>${type==='decision'?esc(privateSession.choice):name(privateSession.choice)}</strong></div>`:''}${btn('Confirm & seal my choice','seal','primary full',privateSession.choice===undefined?'disabled':'')}<p class="fine">Once sealed, your choice cannot be edited. Hide the screen before passing the phone.</p>`;
 }
 return `<main class="private-screen"><div class="private-top"><span>◈ PRIVATE TURN</span>${close}</div>${body}</main>`;
}
function render(){
 if(!booted)return;
 document.body.classList.toggle('private',!!privateSession);
 if(privateSession){root.innerHTML=privatePage();armPrivateTimer();}
 else if(fatal&&view!=='restore')root.innerHTML=`<main class="page narrow">${header('LET’S KEEP YOUR GAME SAFE','A pause, not a reset.',esc(fatal))}${btn('Restore encrypted backup','restore','primary full')}<p>Do not clear your browser data. If you have no matching backup, continue on paper using your private role slips and the last public result.</p></main>`;
 else {
  const pages={setup,game,guests,schedule,rules,tools:controls,history,backup:backupPage,restore:restorePage,withdraw:withdrawPage,'reset-pin':resetPage,new:newPage,check:checkPage};
  root.innerHTML=(pages[view]||game)();
 }
 updateTimers();
}
function updateTimers(){
 const now=state?.pausedAt||Date.now();
 for(const el of root.querySelectorAll('[data-timer]')){
  const ms=Number(el.dataset.timer)-now;
  if(ms<=0){el.textContent='Ready when you are';el.classList.add('timer-due');}
  else{const sec=Math.ceil(ms/1000);el.textContent=`${Math.floor(sec/60).toString().padStart(2,'0')}:${(sec%60).toString().padStart(2,'0')}`;}
 }
}
function armPrivateTimer(){clearTimeout(privateTimer);privateTimer=setTimeout(()=>{if(privateSession){closePrivate();toast('Private screen locked after 60 seconds. Your submitted choices are saved.');}},60000);}
function closePrivate(){privateSession=null;clearTimeout(privateTimer);document.body.classList.remove('private');view='game';render();window.scrollTo(0,0);}
function conceal(){document.body.classList.add('concealed');if(privateSession)closePrivate();root.querySelectorAll('input[type=password]').forEach(x=>x.value='');}
function openPrivate(mode,id){
 const p=player(state,id);if(!p)throw new Error('Player not found.');
 if(mode==='ballot'&&(!p.alive||id in state.ballot))throw new Error('This player has no pending ballot.');
 privateSession={mode,id,stage:mode==='reset'||!p.dealt?'setpin':'pin'};render();window.scrollTo(0,0);
}
async function commit(action){
 if(!lockOwned)throw new Error('This window does not own the game. Close other game windows and reload.');
 const next=reduce(state,action);
 let mirrored;
 try{mirrored=await store.save(next);}catch(e){
  if(e.name==='QuotaExceededError'||e.name==='SecurityError')throw new Error('This phone could not save that action, so it has not been revealed. Keep this window open and export a backup from Game controls.');
  throw e;
 }
 state=next;
 if(!mirrored)notice='Progress saved, but the extra recovery copy could not be written. Export a backup now.';
}
async function installState(next,replace=false){
 if(!lockOwned)throw new Error('Close other game windows before starting or restoring.');
 await store.save(next,{replace});state=next;fatal='';notice='';privateSession=null;view='game';
}
async function demo(){
 if(state){view='new';return;}
 let s=createGame(Array.from({length:13},(_,i)=>`Guest ${i+1}`),{rehearsal:true});
 for(const p of s.players)s=reduce(s,{type:'deal',id:p.id,pinHash:await pinHash(s,p.id,'1234')});
 await installState(s);
}
async function fillDemo(){
 if(!state.rehearsal)throw new Error('Practice choices are only available in rehearsal games.');
 for(const p of pendingVoters(state)){
  const type=ballotType(state);let value;
  if(type==='decision')value='END';
  else if(type==='night'&&p.role==='innocent')value=null;
  else {const options=validTargets(state,p.id);value=options[randomIndex(options.length)].id;}
  await commit({type:'ballot',id:p.id,value});
 }
}
function download(text,filename){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
async function handleAction(el){
 const a=el.dataset.action,id=Number(el.dataset.id);
 if(['nav','tools','rules','setup','backup','restore','history','withdraw','reset-pin','new','check'].includes(a)){
  view=a==='nav'?el.dataset.view:a;privateSession=null;return;
 }
 switch(a){
 case 'home':view='game';privateSession=null;break;
 case 'demo':await demo();break;
 case 'deal':openPrivate('deal',id);break;
 case 'my-role':openPrivate('role',id);break;
 case 'ballot':openPrivate('ballot',id);break;
 case 'private-close':closePrivate();break;
 case 'accept-role':{
  if(!privateSession||privateSession.mode!=='deal'||privateSession.stage!=='role')throw new Error('Open your own role first.');
  await commit({type:'deal',id:privateSession.id,pinHash:privateSession.draftHash});closePrivate();break;
 }
 case 'choose':if(privateSession?.stage==='choice')privateSession.choice=['END','BANISH'].includes(el.dataset.value)?el.dataset.value:Number(el.dataset.value);break;
 case 'seal':{
  if(privateSession?.stage!=='choice'||privateSession.choice===undefined)throw new Error('Choose a name first.');
  const p=player(state,privateSession.id),v=state.phase==='night'&&p.role==='innocent'?null:privateSession.choice;
  await commit({type:'ballot',id:p.id,value:v});privateSession={id:p.id,stage:'sealed'};break;
 }
 case 'start':await commit({type:'start'});break;
 case 'next':await commit({type:'next'});break;
 case 'mission-win':await commit({type:'next',success:true});break;
 case 'mission-lose':await commit({type:'next',success:false});break;
 case 'open-vote':await commit({type:'openVote'});break;
 case 'resolve':await commit({type:'resolve'});break;
 case 'continue-result':await commit({type:'continueResult'});break;
 case 'continue-withdrawal':await commit({type:'continueWithdrawal'});break;
 case 'pause':await commit({type:'pause'});view='game';break;
 case 'resume':await commit({type:'resume'});view='game';break;
 case 'extend':await commit({type:'extend',minutes:10});toast('Ten minutes added to the planned schedule.');break;
 case 'demo-ballots':await fillDemo();break;
 }
}
async function handleForm(form){
 const d=new FormData(form),formId=form.getAttribute('id');
 if(formId==='setup-form'){
  const names=String(d.get('names')).split('\n').map(x=>x.trim()).filter(Boolean);
  const time=String(d.get('start')||'');let start=Date.now();
  if(time){const [h,m]=time.split(':').map(Number);const today=new Date();today.setHours(h,m,0,0);start=today.getTime();}
  await installState(createGame(names,{duration:Number(d.get('duration')),start}));
 }else if(formId==='pin-form'){
  if(!privateSession)throw new Error('Private turn has expired.');
  const pin=String(d.get('pin'));if(!/^\d{4}$/.test(pin))throw new Error('Use exactly four digits.');
  const p=player(state,privateSession.id);
  if(privateSession.stage==='setpin'){
   if(pin!==d.get('confirm'))throw new Error('The two PINs do not match.');
   const hash=await pinHash(state,p.id,pin);
   if(privateSession.mode==='reset'){await commit({type:'resetPin',id:p.id,pinHash:hash});wrongPins.delete(p.id);closePrivate();toast(`${p.name}’s PIN reset is recorded in public history.`);}
   else {privateSession.draftHash=hash;privateSession.stage='role';}
  }else{
   const failures=wrongPins.get(p.id)||{count:0,until:0};
   if(Date.now()<failures.until)throw new Error('Too many attempts. Wait one minute or use the public PIN reset with the player present.');
   if(await pinHash(state,p.id,pin)!==p.pinHash){failures.count++;if(failures.count>=5){failures.until=Date.now()+60000;failures.count=0;}wrongPins.set(p.id,failures);throw new Error('That PIN does not match. Try again.');}
   wrongPins.delete(p.id);privateSession.stage=privateSession.mode==='ballot'?'choice':'role';
  }
 }else if(formId==='backup-form'){
  const pw=String(d.get('password'));if(pw!==d.get('confirm'))throw new Error('The backup passwords do not match.');
  const json=await exportBackup(state,pw);download(json,`villa-backup-${state.id.slice(0,8)}-save-${state.revision}.json`);view='game';toast('Backup prepared. Keep the file and password somewhere a spare phone can reach.');
 }else if(formId==='restore-form'){
  const file=d.get('file');if(!file?.size||file.size>2000000)throw new Error('Choose a valid game backup under 2 MB.');
  const next=await importBackup(await file.text(),String(d.get('password')));
  if(state&&next.id===state.id&&next.revision<state.revision)throw new Error('This backup is older than the current game. Restoring it could replay revealed events, so it has been blocked.');
  await installState(next,true);toast('Checkpoint restored. Check the public history with your group before continuing.');
 }else if(formId==='withdraw-form'){
  await commit({type:'withdraw',id:Number(d.get('id'))});view='game';
 }else if(formId==='reset-form'){
  openPrivate('reset',Number(d.get('id')));
 }else if(formId==='new-form'){
  if(d.get('word')!=='RESET')throw new Error('Type RESET exactly.');
  if(!lockOwned)throw new Error('Close the other game window first.');
  store.clear();state=null;privateSession=null;notice='';wrongPins.clear();view='setup';
 }
}
async function run(fn){
 if(busy)return;busy=true;root.setAttribute('aria-busy','true');
 try{await fn();render();}catch(e){toast(e.message||'Something interrupted that action. Your last saved checkpoint is unchanged.');}
 finally{busy=false;root.removeAttribute('aria-busy');}
}
root.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el||el.disabled)return;e.preventDefault();run(()=>handleAction(el));});
root.addEventListener('submit',e=>{e.preventDefault();run(()=>handleForm(e.target));});
root.addEventListener('input',e=>{if(e.target.id==='names'){const n=e.target.value.split('\n').filter(x=>x.trim()).length;const el=document.querySelector('#name-count');if(el)el.textContent=`${n} names`;}});
document.addEventListener('pointerdown',()=>{if(privateSession)armPrivateTimer();},{passive:true});
document.addEventListener('keydown',e=>{if(privateSession)armPrivateTimer();if(e.key==='Escape'&&privateSession)closePrivate();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)conceal();else{document.body.classList.remove('concealed');updateTimers();}});
window.addEventListener('pagehide',conceal);
window.addEventListener('pageshow',()=>{document.body.classList.remove('concealed');if(privateSession)closePrivate();});
window.addEventListener('popstate',()=>{if(privateSession)closePrivate();});
window.addEventListener('storage',e=>{if(e.key===contextKey&&state){privateSession=null;fatal='Another game window changed the save. Close extra windows, then reload this one to load the latest checkpoint.';render();}});
setInterval(updateTimers,1000);
async function offlineSetup(){
 if(!('serviceWorker' in navigator))return;
 try{
  await navigator.serviceWorker.register('./sw.js',{scope:'./'});
  await navigator.serviceWorker.ready;
  if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  const files=['./index.html','./styles.css','./app.mjs','./engine.mjs','./storage.mjs','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
  offlineReady=(await Promise.all(files.map(f=>caches.match(new URL(f,location.href).href)))).every(Boolean);
  // A background cache update must never wipe a form somebody is filling in.
  const line=root.querySelector('.statusline');if(line)line.outerHTML=status();
 }catch{offlineReady=false;}
}
async function boot(){
 try{
  if(!window.isSecureContext||!crypto.subtle)throw new Error('Open the published HTTPS GitHub Pages link. A downloaded file preview cannot run this game reliably.');
  localStorage.setItem(contextKey+'-probe','ok');localStorage.removeItem(contextKey+'-probe');
  store=new Store(localStorage,contextKey);
  const saved=await store.load();state=saved.state;if(saved.recovered)notice='Recovered a readable saved copy. Compare the public history with your group before continuing.';
 }catch(e){fatal=e.message||'This browser cannot save the game. Use a normal browser window with storage enabled.';}
 booted=true;render();offlineSetup();
}
if(navigator.locks){
 navigator.locks.request(contextKey,{ifAvailable:true},async lock=>{
  if(!lock){booted=true;root.innerHTML=`<main class="page narrow">${header('ONE EVENING. ONE WINDOW.','Your game is open elsewhere.','Close the other tab or app window for this game, then reload this page. This prevents two windows from recording different results.')}</main>`;return;}
  lockOwned=true;await boot();await new Promise(()=>{});
 }).catch(e=>{booted=true;fatal=e.message;render();});
}else{lockOwned=true;boot();}
