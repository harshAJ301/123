(() => {
'use strict';
const $ = (id) => document.getElementById(id);
const all = (selector, root=document) => Array.from(root.querySelectorAll(selector));
const PAGE_NAMES = {1:'The Opening',2:'Mystery Map',3:'Evidence Room',4:'Puzzle Chamber',5:'Mini-Game',6:'Roast Room',7:'Camera Magic',8:'Celebration Lab',9:'Secret Room',10:'Always You'};
const defaults = {unlocked:1,completed:{},evidence:[],keys:[],puzzleDone:[],pieceOrder:[1,0,3,2],awards:[],roasts:0,secrets:[],photoTaken:false,celebrated:false,gameWon:false,page:1};
let state = loadState();
let currentClue = null;
let selectedPiece = null;
let cameraStream = null;
let activeCameraPage = null;
let handsInstance = null;
let handsEnabled = false;
let cameraLoopId = null;
let trackingBusy = false;
let lastHandCenters = [];
let lastGestureAt = {raise:0,clap:0,heart:0,wave:0};
let currentFilter = 'none';
let cameraStickers = [];
let recordedVoiceBlob = null;
let recordedVoiceUrl = null;
let recorder = null;
let recorderChunks = [];
let audioContext = null;
let melodyTimers = [];
let currentPartyEffect = 'sparkles';
let particles = [];
let fxCanvas = null, fxCtx = null, fxRAF = null;
const game = {started:false,won:false,x:45,y:385,vx:0,vy:0,onGround:false,left:false,right:false,jump:false,lives:3,collected:new Set(),startedAt:0,lastTick:0,elapsed:0,raf:null};
const platforms = [[0,426,194,24],[207,365,150,17],[355,320,151,17],[504,375,120,17],[624,310,145,17],[770,260,190,17]];
const starPoints = [[38,397],[83,397],[133,397],[174,397],[226,337],[272,337],[325,337],[372,292],[419,292],[474,292],[517,347],[559,347],[597,347],[639,282],[685,282],[740,282],[788,232],[851,232],[921,232]];
const hazards = [[157,408,29,18],[453,300,26,19],[691,290,26,19]];
const pieces = ['🌙','🏰','🎂','💗'];
const clues = [
 {title:'The Shadow Mystery',label:'CLUE 01 / SHADOW REPORT',riddle:'I follow you everywhere, but disappear in darkness. What am I?',hint:'Think about the shape that follows you when there is light.',answers:['shadow','a shadow','the shadow'],why:'The shadow has been identified. Excellent detective work.'},
 {title:'The Memory File',label:'CLUE 02 / MEMORY CAPTURE',riddle:'I capture a moment, but I cannot stop time. What am I?',hint:'You can keep one in a gallery, on your phone, or in a frame.',answers:['photograph','photo','picture','image','snapshot','a photograph'],why:'The memory capture is logged. Proof that time flies, even in high resolution.'},
 {title:'The Silent Witness',label:'CLUE 03 / MIRROR',riddle:'I show your face and copy your expressions, but I never speak. What am I?',hint:'You might check one before going out.',answers:['mirror','a mirror','the mirror'],why:'The silent witness checks out. It has no comment on the outfit.'},
 {title:'The Birthday Record',label:'CLUE 04 / AGE FILE',riddle:'I get bigger every birthday, but I never get heavier. What am I?',hint:'Nisha just levelled up to this number of years.',answers:['age','your age','my age'],why:'Age record confirmed. Level 19 unlocked in real life.'},
 {title:'The Secret Messenger',label:'CLUE 05 / MESSAGE',riddle:'I travel across the world in seconds, carrying words but having no voice. What am I?',hint:'It pops up on a phone and can be sent in a chat.',answers:['message','a message','text','text message','dm','a text'],why:'Message intercepted successfully. No read receipts were harmed.'},
 {title:'The Invisible Evidence',label:'CLUE 06 / FEELING',riddle:'You cannot see me, but you can feel me. I can turn an ordinary day into a memory. What am I?',hint:'It is an invisible feeling that makes moments matter.',answers:['emotion','feeling','an emotion','a feeling','love','happiness'],why:'The invisible evidence is real. Case file: friendship edition.'}
];
const roasts = [
 'Nisha has 47 tabs open in her brain, and one of them is playing music. Nobody knows which.',
 'Her reply speed is so unpredictable it qualifies as a weather system.',
 'She says “one minute” with the confidence of someone who has never met time.',
 'Overthinking level: has already imagined the sequel to a conversation that has not happened.',
 'She can turn a two-line story into a six-season drama. Renewed for season 19.',
 'Her plans have more plot twists than the mystery game she is currently playing.',
 'She is not late. She is building suspense. Very expensive suspense.',
 'The group chat does not need a notification; it needs a project manager.',
 'A professional at saying “I do not care” with 14 follow-up questions.',
 'Energy level: chaotic. Aura level: suspiciously iconic.',
 'She has a PhD in making a simple choice feel like the final round of a reality show.',
 'She is the main character, the narrator, and occasionally the problem.',
 'Her sleep schedule and common sense are currently missing. Please contact support.',
 'If vibes paid rent, she would own the entire building.',
 'She could win an argument with a wall, then apologise to the wall.',
 'Certified overthinker: the evidence is overwhelming and she is still thinking about it.'
];
const hiddenNotes = [
 'Secret note #1: you are allowed to take up space, try new things, and be proud of how far you have come. ♡',
 'Secret note #2: may your next year be full of people who make you laugh so hard your stomach hurts.',
 'Secret note #3: being a little chaotic is fine. Being boring would be the real plot twist.',
 'Secret note #4: when life gets loud, remember that you do not have to figure everything out at once.'
];
const miniWishes = ['Stay happy always ♡','Achieve your dreams ✧','More adventures & new places','Keep shining always','Health, success & endless joy','More laughs than worries'];
const $status = (id, text, ok=false) => { const el=$(id); if(!el)return; el.textContent=text; el.classList.toggle('ok',!!ok); };
function loadState(){
  try { const saved=JSON.parse(localStorage.getItem('nishaQuestState')||'null'); if(saved) return Object.assign({},defaults,saved,{completed:Object.assign({},defaults.completed,saved.completed||{})}); } catch(e){}
  return Object.assign({},defaults,{completed:{1:false}});
}
function saveState(){
  try { state.page = Number(state.page)||1; localStorage.setItem('nishaQuestState',JSON.stringify(state)); } catch(e){}
  updateTopProgress();
}
function toast(text){const el=$('toast'); if(!el)return; el.textContent=text; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2400);}
function beep(freq=520,duration=.075){
  if(!soundOn)return;
  try { const AudioCtx=window.AudioContext||window.webkitAudioContext; if(!AudioCtx)return; if(!audioContext)audioContext=new AudioCtx(); if(audioContext.state==='suspended')audioContext.resume(); const osc=audioContext.createOscillator(); const gain=audioContext.createGain(); osc.type='sine'; osc.frequency.value=freq; gain.gain.setValueAtTime(.045,audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration); osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration); } catch(e){}
}
let soundOn=false;
function updateTopProgress(){
  const completedCount=Object.keys(state.completed||{}).filter(k=>state.completed[k] && Number(k)>0).length;
  $('topProgress').textContent=completedCount+' / 10 CHAPTERS';
  $('soundButton').textContent=soundOn?'♫ Sound on':'♫ Sound off';
  $('soundButton').setAttribute('aria-pressed',String(soundOn));
}
function setCompleted(page){
  state.completed[page]=true;
  state.unlocked=Math.max(state.unlocked,Math.min(10,page+1));
  saveState(); renderMap();
}
function navigate(page, force=false){
  page=Number(page);
  if(!Number.isFinite(page)||page<1||page>10)return;
  if(!force && page>=3 && page>state.unlocked){toast('This chapter is locked. Complete the previous mission first.');beep(170);return;}
  const prev=Number(state.page);
  if((prev===7||prev===8)&&prev!==page)stopCamera();
  if(prev===5&&page!==5)stopGameLoop();
  all('.screen').forEach(s=>s.classList.remove('active'));
  const target=$('screen'+page); if(!target)return;
  target.classList.add('active');
  state.page=page; if(page===2&&!state.completed[2]){state.completed[2]=true;state.unlocked=Math.max(state.unlocked,3);} saveState(); beep(460);
  $('mapButton').classList.toggle('hidden',page===1);
  if(page===2)renderMap();
  if(page===3)renderEvidence();
  if(page===4)renderPuzzleState();
  if(page===5){drawGame();updateGameHUD();}
  if(page===6)renderRoast();
  if(page===7)resetCameraPageUI();
  if(page===8)resetPartyCameraUI();
  if(page===9)renderSecrets();
  if(page===10)renderFinal();
  window.scrollTo({top:0,behavior:'smooth'});
}
function renderMap(){
  const nodes=all('.map-node');
  nodes.forEach(btn=>{
    const p=Number(btn.dataset.page);
    const allowed=(p<=2)||(p<=state.unlocked);
    btn.disabled=!allowed;
    btn.classList.toggle('done',!!state.completed[p]);
    btn.classList.toggle('current',p===state.page);
    const status=btn.querySelector('.status-icon');
    if(status)status.textContent=state.completed[p]?'✓ COMPLETE':(p===2?'MAP HUB':(allowed?'OPEN':'🔒 LOCKED'));
  });
  const completedCount=Object.keys(state.completed||{}).filter(k=>state.completed[k]).length;
  $('mapCompletion').textContent=completedCount+' / 10 chapters complete';
  const next=findNextChapter();
  $('mapNext').innerHTML=next===10 && state.completed[10]?'Replay final chapter ↻':'Enter '+(PAGE_NAMES[next]||'the mystery')+' →';
  $('mapNext').disabled=next>state.unlocked && next>2;
}
function findNextChapter(){
  for(let p=3;p<=10;p++){if(p<=state.unlocked&&!state.completed[p])return p;}
  return state.completed[10]?10:Math.min(10,state.unlocked);
}
function advanceTo(page, label){
  setCompleted(page);
  toast(label||('Chapter '+page+' cleared!'));
  navigate(Math.min(10,page+1));
}
$('beginQuest').addEventListener('click',()=>{
  state.completed[1]=true;state.completed[2]=true;state.unlocked=Math.max(state.unlocked,3);saveState();navigate(2,true);confettiBurst(35);
});
$('resumeQuest').addEventListener('click',()=>{
  if(state.unlocked===1){toast('No saved quest yet — begin the quest to start.');return;}
  navigate(2,true);toast('Progress restored from this browser.');
});
$('mapButton').addEventListener('click',()=>navigate(2,true));
$('soundButton').addEventListener('click',()=>{soundOn=!soundOn;updateTopProgress();beep(650,.13);toast(soundOn?'Sound effects enabled.':'Sound effects muted.');});
all('.map-node').forEach(btn=>btn.addEventListener('click',()=>{
  const page=Number(btn.dataset.page);
  if(page===1){navigate(1,true);return;}
  if(page===2){navigate(2,true);return;}
  navigate(page);
}));
$('mapNext').addEventListener('click',()=>{
  if(state.unlocked<=2){state.unlocked=3;saveState();}
  let n=findNextChapter();
  if(n<3)n=3;
  if(n>state.unlocked)n=state.unlocked;
  navigate(n,true);
});
$('evidenceToMap').addEventListener('click',()=>navigate(2,true));
$('secretBack').addEventListener('click',()=>navigate(2,true));

function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function renderEvidence(){
  $('evidenceCount').textContent=state.evidence.length+' / 6';
  $('evidenceMeter').style.width=(state.evidence.length/6*100)+'%';
  $('evidencePct').textContent=Math.round(state.evidence.length/6*100)+'%';
  all('.evidence-item').forEach((b,i)=>{
    const found=state.evidence.includes(i);b.classList.toggle('found',found);
    b.innerHTML='<span class="obj">'+['🌒','📷','🪞','🎂','✉️','💗'][i]+'</span><b>'+['Shadow Report','Memory Capture','Silent Witness','Birthday Record','Secret Messenger','Invisible Evidence'][i]+'</b><small>'+(found?'✓ Evidence secured':'Tap to inspect')+'</small>'+(found?'<span class="found-mark">✓</span>':'');
  });
  if(state.evidence.length===6){$('evidenceContinue').disabled=false;$status('evidenceFeedback','All 6 clues secured. The next room is unlocked.',true);state.unlocked=Math.max(state.unlocked,4);saveState();}
  else {$('evidenceContinue').disabled=true;}
}
function selectClue(i){
  currentClue=i;const c=clues[i];
  $('evidenceEmpty').classList.add('hidden');$('evidencePuzzle').classList.remove('hidden');
  $('clueLabel').textContent=c.label;$('clueHeading').textContent=c.title;$('clueRiddle').textContent=c.riddle;$('clueHint').textContent='HINT: '+c.hint;
  $('evidenceAnswer').value='';$status('evidenceFeedback',state.evidence.includes(i)?'Already secured: '+c.why:'');beep(430);
  if(state.evidence.includes(i))$('evidenceAnswer').placeholder='Already solved — revisit any clue';
  else $('evidenceAnswer').placeholder='Enter your answer…';
}
all('.evidence-item').forEach(btn=>btn.addEventListener('click',()=>selectClue(Number(btn.dataset.clue))));
$('evidenceForm').addEventListener('submit',e=>{
  e.preventDefault(); if(currentClue===null)return;
  const c=clues[currentClue];const a=norm($('evidenceAnswer').value);if(!a)return;
  const okay=c.answers.map(norm).includes(a)||((currentClue===5)&&(a.includes('emotion')||a.includes('feeling')));
  if(okay){
    if(!state.evidence.includes(currentClue))state.evidence.push(currentClue);
    state.evidence.sort((a,b)=>a-b);saveState();renderEvidence();$status('evidenceFeedback',c.why,true);beep(760,.14);popFx('sparkles',1);
  }else{$status('evidenceFeedback','Not quite, detective. Try the hint and think literally.');beep(180);}
});
$('evidenceContinue').addEventListener('click',()=>{
  if(state.evidence.length<6){toast('All six clues are required.');return;}
  advanceTo(3,'Evidence Room cleared. Four puzzle locks are waiting.');navigate(4,true);
});

function markKey(n, message){
  if(!state.keys.includes(n))state.keys.push(n);state.keys.sort((a,b)=>a-b);state.puzzleDone[n-1]=true;
  const card=$('puzzleCard'+n);if(card)card.classList.add('done');
  $('keyCount').textContent=state.keys.length+' / 4';
  $('chestStatus').textContent=state.keys.length===4?'All four keys fit. Enter the final code to open the chest.':message;
  saveState();renderPuzzleState();
  if(state.keys.length===4){$('puzzleContinue').disabled=!state.puzzleDone.every(Boolean);state.unlocked=Math.max(state.unlocked,5);saveState();}
}
function renderPuzzleState(){
  $('keyCount').textContent=state.keys.length+' / 4';
  for(let n=1;n<=4;n++)$('puzzleCard'+n).classList.toggle('done',!!state.puzzleDone[n-1]);
  const ordered=state.pieceOrder||[1,0,3,2];all('.piece').forEach((b,i)=>{b.textContent=pieces[ordered[i]];b.classList.toggle('selected',selectedPiece===i);});
  const seq=$('symbolSequence');seq.innerHTML='';
  (state.symbolSeq||[]).forEach(sym=>{const span=document.createElement('span');span.textContent=sym;span.className='has-symbol';seq.appendChild(span);});
  for(let i=(state.symbolSeq||[]).length;i<4;i++){const span=document.createElement('span');span.textContent='?';seq.appendChild(span);}
  $('puzzleContinue').disabled=state.keys.length<4||!state.puzzleDone.every(Boolean);
  if(state.keys.length===4)$('chestStatus').textContent='All four keys fit. The treasure chest is ready.';
}
const symbolExpected=['🦋','🌸','🌙','⭐'];
if(!Array.isArray(state.symbolSeq))state.symbolSeq=[];
all('[data-symbol]').forEach(btn=>btn.addEventListener('click',()=>{
  if(state.puzzleDone[0]){toast('Symbol lock already cleared.');return;}
  const pos=state.symbolSeq.length, chosen=btn.dataset.symbol;
  if(chosen===symbolExpected[pos]){
    state.symbolSeq.push(chosen);saveState();renderPuzzleState();$status('symbolFeedback',state.symbolSeq.length===4?'Symbol sequence accepted! Key 1 earned.':'Correct symbol '+state.symbolSeq.length+' of 4.',true);beep(530+pos*90);
    if(state.symbolSeq.length===4)markKey(1,'Symbol key earned.');
  }else{state.symbolSeq=[];saveState();renderPuzzleState();$status('symbolFeedback','Wrong order. Sequence reset — try again.');beep(170);}
}));
$('resetSequence').addEventListener('click',()=>{state.symbolSeq=[];saveState();renderPuzzleState();$status('symbolFeedback','Sequence reset.');});
$('numberLockForm').addEventListener('submit',e=>{
  e.preventDefault();if(norm($('numberLock').value)==='0019'){markKey(2,'Number lock opened.');$status('numberFeedback','Correct: 0019. Key 2 earned.',true);beep(740);}else{$status('numberFeedback','Access denied. Four digits: 0019.');beep(180);}
});
all('.piece').forEach(btn=>btn.addEventListener('click',()=>{
  if(state.puzzleDone[2])return;
  const i=Number(btn.dataset.piece);
  if(selectedPiece===null){selectedPiece=i;renderPuzzleState();$status('pictureFeedback','Tile selected. Pick another tile to swap.');return;}
  if(selectedPiece===i){selectedPiece=null;renderPuzzleState();return;}
  const order=state.pieceOrder.slice();const tmp=order[selectedPiece];order[selectedPiece]=order[i];order[i]=tmp;state.pieceOrder=order;selectedPiece=null;saveState();renderPuzzleState();beep(420);
  if(order.every((v,idx)=>v===idx)){markKey(3,'Picture restored.');$status('pictureFeedback','Picture restored in the right order. Key 3 earned.',true);}else $status('pictureFeedback','Nice swap. Keep arranging the scene until it reads moon → castle → cake → heart.');
}));
$('finalLockForm').addEventListener('submit',e=>{
  e.preventDefault();if(state.keys.length<3){$status('finalLockFeedback','Collect at least the first three keys before trying the final lock.');return;}
  if(norm($('finalLock').value).replace(/\s/g,'')==='nisha19'){markKey(4,'Final lock opened.');$status('finalLockFeedback','NISHA19 accepted. The treasure chest is open!',true);beep(800,.2);confettiBurst(50);}
  else{$status('finalLockFeedback','Incorrect. Enter NISHA19.');beep(170);}
});
$('puzzleContinue').addEventListener('click',()=>{
  if(state.keys.length<4||!state.puzzleDone.every(Boolean)){toast('Solve all four puzzles and use the final lock.');return;}
  advanceTo(4,'All four keys collected. The portal is open.');navigate(5,true);resetGame();
});

/* Playable platformer */
const gameCanvas=$('gameCanvas');const gctx=gameCanvas.getContext('2d');
function resetGame(){
  stopGameLoop();game.started=false;game.won=false;game.x=38;game.y=386;game.vx=0;game.vy=0;game.onGround=false;game.lives=3;game.collected=new Set();game.startedAt=0;game.elapsed=0;game.left=false;game.right=false;game.jump=false;
  $('gameMessage').textContent='Press Start to begin.';$('gameContinue').disabled=true;drawGame();updateGameHUD();
}
function drawGame(){
  if(!gctx)return;
  const ctx=gctx,W=gameCanvas.width,H=gameCanvas.height;
  const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#11152f');grad.addColorStop(.55,'#22224a');grad.addColorStop(1,'#121021');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  for(let i=0;i<95;i++){const x=(i*137)%W,y=(i*71)%260;ctx.globalAlpha=.23+(i%4)*.12;ctx.fillStyle=i%8===0?'#ffaddf':'#e9e5ff';ctx.fillRect(x,y,2,2);}ctx.globalAlpha=1;
  ctx.fillStyle='#3b2a63';ctx.beginPath();ctx.arc(792,95,54,0,Math.PI*2);ctx.fill();ctx.fillStyle='#11152f';ctx.beginPath();ctx.arc(811,79,50,0,Math.PI*2);ctx.fill();
  // Distant towers
  ctx.fillStyle='#17132d';for(let i=0;i<13;i++){const x=660+i*20;const h=50+(i*37)%95;ctx.fillRect(x,258-h,13,h);ctx.beginPath();ctx.moveTo(x-3,258-h);ctx.lineTo(x+6.5,242-h);ctx.lineTo(x+16,258-h);ctx.fill();}
  // Portal
  ctx.save();ctx.shadowColor='#ff70c8';ctx.shadowBlur=26;ctx.strokeStyle='#ff70c8';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(900,209,32,46,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#a78dff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(900,209,22,36,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  // Platforms
  platforms.forEach((p,i)=>{ctx.fillStyle=i%2?'#3c2b57':'#302447';ctx.fillRect(p[0],p[1],p[2],p[3]);ctx.fillStyle='#b57cff';ctx.fillRect(p[0],p[1],p[2],3);ctx.fillStyle='#ff78cf';ctx.globalAlpha=.18;ctx.fillRect(p[0],p[1]+p[3]-4,p[2],4);ctx.globalAlpha=1;for(let x=p[0]+8;x<p[0]+p[2];x+=25){ctx.fillStyle='#8a6da4';ctx.fillRect(x,p[1]+p[3]+3,2,5);}});
  // Hazards
  hazards.forEach(h=>{ctx.fillStyle='#ff6f95';ctx.shadowColor='#ff6f95';ctx.shadowBlur=10;for(let x=h[0];x<h[0]+h[2];x+=10){ctx.beginPath();ctx.moveTo(x,h[1]+h[3]);ctx.lineTo(x+5,h[1]);ctx.lineTo(x+10,h[1]+h[3]);ctx.fill();}ctx.shadowBlur=0;});
  // Stars
  starPoints.forEach((s,i)=>{if(game.collected.has(i))return;const pulse=1+Math.sin(Date.now()/180+i)*.12;ctx.save();ctx.translate(s[0],s[1]);ctx.scale(pulse,pulse);ctx.shadowColor='#ffd98a';ctx.shadowBlur=17;ctx.fillStyle='#ffd98a';ctx.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?7:14;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.restore();});
  // Character
  ctx.save();ctx.translate(game.x,game.y);ctx.shadowColor='#ff70c8';ctx.shadowBlur=12;ctx.fillStyle='#291b42';ctx.beginPath();ctx.roundRect(-12,-24,24,28,7);ctx.fill();ctx.fillStyle='#ffe0f6';ctx.beginPath();ctx.arc(0,-31,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff70c8';ctx.beginPath();ctx.moveTo(-9,-41);ctx.lineTo(-20,-48);ctx.lineTo(-12,-34);ctx.fill();ctx.beginPath();ctx.moveTo(-6,-41);ctx.lineTo(6,-50);ctx.lineTo(3,-35);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-5,-33,3,3);ctx.fillRect(4,-33,3,3);ctx.restore();
  // Finish label
  ctx.fillStyle='#f5c6ff';ctx.font='bold 12px DM Sans, sans-serif';ctx.textAlign='center';ctx.fillText('PORTAL',900,268);
  if(!game.started&&!game.won){ctx.fillStyle='#070711aa';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.font='bold 25px DM Sans,sans-serif';ctx.textAlign='center';ctx.fillText('COLLECT 19 STARS',W/2,H/2-8);ctx.font='13px DM Sans,sans-serif';ctx.fillStyle='#d8c9f0';ctx.fillText('Press Start / Restart to play',W/2,H/2+18);}
  if(game.won){ctx.fillStyle='#070711b8';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ffd98a';ctx.font='bold 32px DM Sans,sans-serif';ctx.textAlign='center';ctx.fillText('LEVEL CLEARED ✦',W/2,H/2-8);ctx.fillStyle='#fff';ctx.font='15px DM Sans,sans-serif';ctx.fillText('All stars collected — portal unlocked!',W/2,H/2+20);}
}
function updateGameHUD(){
  const n=game.collected.size;$('starCount').textContent=n+' / 19';$('hudStars').textContent=n+'/19';$('hudLives').textContent=String(game.lives);$('hudTime').textContent=formatTime(game.elapsed);
  const percent=Math.round(n/19*100);$('gamePercent').textContent=percent+'%';$('gameMeter').style.width=percent+'%';
  $('gameMissionText').textContent=game.won?'All 19 stars collected. Chapter complete.':n+' of 19 stars found. Keep moving toward the glowing portal.';
}
function formatTime(sec){sec=Math.floor(sec||0);return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}
function resetAtCheckpoint(){game.x=38;game.y=386;game.vx=0;game.vy=0;game.onGround=false;game.lives--;if(game.lives<=0){game.lives=3;game.collected.clear();$('gameMessage').textContent='Three lives used — stars reset. Give it another go.';}else $('gameMessage').textContent='Oof. Respawned. Your collected stars stay with you.';updateGameHUD();}
function startGame(){
  stopGameLoop();if(game.won)resetGame();game.started=true;game.won=false;game.startedAt=Date.now()-game.elapsed*1000;game.lastTick=performance.now();$('gameMessage').textContent='Go collect those sparkles!';game.raf=requestAnimationFrame(gameLoop);beep(580);
}
function stopGameLoop(){if(game.raf){cancelAnimationFrame(game.raf);game.raf=null;}game.started=false;}
function gameLoop(now){
  if(!game.started||game.won)return;
  const dt=Math.min(.035,(now-(game.lastTick||now))/1000);game.lastTick=now;game.elapsed=(Date.now()-game.startedAt)/1000;
  const speed=220;
  game.vx=game.left?-speed:game.right?speed:0;
  if(game.jump&&game.onGround){game.vy=-480;game.onGround=false;game.jump=false;beep(350,.05);}
  game.vy+=1100*dt;game.x+=game.vx*dt;game.y+=game.vy*dt;game.x=Math.max(12,Math.min(948,game.x));
  game.onGround=false;
  const feet=game.y+4;
  platforms.forEach(p=>{if(game.vy>=0 && game.x+10>p[0] && game.x-10<p[0]+p[2] && feet>=p[1] && feet<=p[1]+Math.max(12,game.vy*dt+5)){game.y=p[1]-4;game.vy=0;game.onGround=true;}});
  starPoints.forEach((s,i)=>{if(!game.collected.has(i)&&Math.hypot(game.x-s[0],game.y-14-s[1])<25){game.collected.add(i);beep(680+i*12,.04);popFx('sparkles',1);}});
  const hit=hazards.some(h=>game.x+10>h[0]&&game.x-10<h[0]+h[2]&&game.y>h[1]-18&&game.y<h[1]+h[3]);
  if(hit){resetAtCheckpoint();}
  if(game.y>510){resetAtCheckpoint();}
  if(game.collected.size===19&&game.x>870&&game.y<275){game.won=true;game.started=false;state.gameWon=true;setCompleted(5);$('gameContinue').disabled=false;$('gameMessage').textContent='Perfect! All stars collected. Portal activated.';confettiBurst(60);toast('Mini-game cleared!');saveState();}
  drawGame();updateGameHUD();if(game.started)game.raf=requestAnimationFrame(gameLoop);
}
$('gameStart').addEventListener('click',()=>{if(!game.started)startGame();});
all('[data-key]').forEach(btn=>{
  const k=btn.dataset.key;const down=e=>{e.preventDefault();if(k==='left')game.left=true;if(k==='right')game.right=true;if(k==='jump')game.jump=true;};
  const up=e=>{if(e)e.preventDefault();if(k==='left')game.left=false;if(k==='right')game.right=false;};
  btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointerleave',up);btn.addEventListener('pointercancel',up);
});
window.addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp',' ','a','d','A','D','w','W'].includes(e.key)&&Number(state.page)===5){if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')game.left=true;if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')game.right=true;if(e.key==='ArrowUp'||e.key===' '||e.key==='w'||e.key==='W')game.jump=true;if(e.key===' '||e.key.startsWith('Arrow'))e.preventDefault();}
});
window.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')game.left=false;if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')game.right=false;});
$('gameContinue').addEventListener('click',()=>{
  if(!game.won){toast('Collect all 19 stars and reach the portal first.');return;}
  advanceTo(5,'Mini-game cleared. Time for a highly unofficial roast report.');navigate(6,true);
});

/* Roast room */
function renderRoast(){
  $('awardCount').textContent=state.awards.length+' / 4';all('[data-award]').forEach(b=>b.classList.toggle('earned',state.awards.includes(Number(b.dataset.award))));
  $('roastContinue').disabled=state.awards.length<4;$('roastContinueHint').textContent=state.awards.length>=4?'Awards complete. Camera Magic is unlocked.':'Collect '+Math.max(0,4-state.awards.length)+' more award(s) to unlock.';
}
function newRoast(){const item=roasts[Math.floor(Math.random()*roasts.length)];$('roastOutput').textContent=item;state.roasts=(state.roasts||0)+1;saveState();$status('roastFeedback','Roast #'+state.roasts+' delivered. The friendship remains intact.');beep(460);}
all('[data-roast]').forEach(b=>b.addEventListener('click',()=>{const n=Number(b.dataset.roast);const lines=['Overthinking CEO: the board has reviewed 47 hypothetical outcomes and is still not satisfied.','Late Reply Queen: your notification could grow a beard before you answer it.','Drama Icon: even a minor inconvenience gets a cinematic soundtrack.','Excuse Master: those explanations deserve their own streaming service.','Plot-Twist Planner: the plan changed so often the plan has asked for a break.','Chaos Legend: the vibes are immaculate; the organisation is currently a rumour.'];$('roastOutput').textContent=lines[n];state.roasts=(state.roasts||0)+1;saveState();$status('roastFeedback','Sticky note opened. Roast report updated.');beep(450);}));
$('randomRoast').addEventListener('click',newRoast);
$('shareRoast').addEventListener('click',async()=>{
  const t=$('roastOutput').textContent;
  try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(t);toast('Roast copied to clipboard.');}else throw new Error('clipboard unavailable');}
  catch(e){$status('roastFeedback','Copy it manually: '+t);}
});
const dares=['Truth: what tiny thing instantly improves your mood?','Dare: do your best royal wave at the camera.','Truth: what snack would you defend with your life?','Dare: invent a dramatic title for today.','Truth: which fictional world would you visit for one day?','Dare: give yourself an award for surviving this week.'];
$('truthDare').addEventListener('click',()=>{$('truthDareText').textContent=dares[Math.floor(Math.random()*dares.length)];beep(500);});
all('[data-award]').forEach(btn=>btn.addEventListener('click',()=>{
  const n=Number(btn.dataset.award);if(!state.awards.includes(n))state.awards.push(n);saveState();renderRoast();beep(700);toast('Award unlocked: '+btn.querySelector('b').textContent);
}));
$('roastContinue').addEventListener('click',()=>{
  if(state.awards.length<4){toast('Collect all four awards first.');return;}
  advanceTo(6,'Awards collected. The camera has been cleared for launch.');navigate(7,true);
});

/* Live camera, browser-side hand tracking, visual overlays */
const filterCss={none:'none',dreamy:'saturate(1.15) brightness(1.08) contrast(.96)',vintage:'sepia(.35) contrast(.95) saturate(.8)',pink:'saturate(1.3) hue-rotate(-10deg) brightness(1.05)',mono:'grayscale(1)',gold:'sepia(.2) saturate(1.5) hue-rotate(-12deg) brightness(1.06)',fairy:'saturate(1.25) hue-rotate(8deg) brightness(1.09)',night:'hue-rotate(17deg) saturate(1.2) brightness(.82)'};
function resetCameraPageUI(){
  if(!cameraStream){$('cameraFrame').classList.remove('video-active');$('cameraStatus').textContent='CAMERA OFF';$('startCamera').disabled=false;$('capturePhoto').disabled=true;$('stopCamera').disabled=true;$('toggleTracking').disabled=true;}
  renderFilters();
}
function resetPartyCameraUI(){if(!cameraStream||activeCameraPage!=='party'){$('partyCameraFrame').classList.remove('video-active');$('partyCameraStatus').textContent='CAMERA OFF';$('startPartyCamera').disabled=false;$('stopPartyCamera').disabled=true;}}
function renderFilters(){
  all('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===currentFilter));
  const video=$('cameraVideo');if(video)video.style.filter=filterCss[currentFilter]||'none';
}
function loadExternalScript(url){
  return new Promise((resolve,reject)=>{
    const prior=all('script[data-dynamic-src]').find(s=>s.dataset.dynamicSrc===url);
    if(prior&&prior.dataset.failed==='yes'){prior.remove();} else if(prior){if(prior.dataset.loaded==='yes')resolve();else{prior.addEventListener('load',()=>resolve(),{once:true});prior.addEventListener('error',()=>reject(new Error('script unavailable')),{once:true});}return;}
    const script=document.createElement('script');script.src=url;script.async=true;script.dataset.dynamicSrc=url;script.onload=()=>{script.dataset.loaded='yes';resolve();};script.onerror=()=>{script.dataset.failed='yes';reject(new Error('script unavailable'));};document.head.appendChild(script);
  });
}
async function ensureHands(){
  if(window.Hands)return true;
  try{await loadExternalScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');return !!window.Hands;}catch(e){return false;}
}
async function startCamera(target){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('Camera is unavailable in this browser. Use the manual celebration controls instead.');return;}
  stopCamera();
  const video=$(target==='party'?'partyCameraVideo':'cameraVideo');
  const frame=$(target==='party'?'partyCameraFrame':'cameraFrame');
  const canvas=$(target==='party'?'partyCameraCanvas':'cameraCanvas');
  const status=$(target==='party'?'partyCameraStatus':'cameraStatus');
  try{
    status.textContent='REQUESTING CAMERA…';
    cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false});
    activeCameraPage=target;video.srcObject=cameraStream;await video.play();
    frame.classList.add('video-active');video.classList.add('ready');status.textContent='LIVE · ON DEVICE';
    canvas.width=video.videoWidth||640;canvas.height=video.videoHeight||480;
    if(target==='party'){$('startPartyCamera').disabled=true;$('stopPartyCamera').disabled=false;}
    else{$('startCamera').disabled=true;$('capturePhoto').disabled=false;$('stopCamera').disabled=false;$('toggleTracking').disabled=false;video.style.filter=filterCss[currentFilter]||'none';}
    $('cameraNotice')&&($('cameraNotice').textContent='Live preview active. The camera stream is handled in this page and is not uploaded.');
    toast('Camera ready. Make a gesture or choose an effect.');
    const has=await ensureHands();
    if(has){try{
      handsInstance=new window.Hands({locateFile:(file)=>'https://cdn.jsdelivr.net/npm/@mediapipe/hands/'+file});
      handsInstance.setOptions({maxNumHands:2,modelComplexity:1,minDetectionConfidence:.55,minTrackingConfidence:.5});
      handsInstance.onResults((results)=>processHandResults(results,target,canvas,video));
      handsEnabled=true;
      if(target!=='party'){$('toggleTracking').textContent='Hand tracking on';$('toggleTracking').classList.add('btn-cyan');}
      $('gestureStatus').textContent='Tracking active — try moving your hands.';
      $('cameraNotice')&&($('cameraNotice').textContent='Hand-tracking model loaded. Gestures are processed in the browser; the camera feed is not uploaded by this page.');
      pumpCamera(video);
    }catch(e){handsEnabled=false;$('gestureStatus').textContent='Hand tracking failed to initialise. Manual effect buttons still work.';pumpCamera(video);}
    }else{handsEnabled=false;$('gestureStatus').textContent='Tracking library did not load. Camera still works; use the effect buttons.';$('cameraNotice')&&($('cameraNotice').textContent='The camera is live, but the hand-tracking library could not load. Manual controls remain available.');}
    if(!handsEnabled)pumpCamera(video);
  }catch(error){
    cameraStream=null;activeCameraPage=null;status.textContent='CAMERA OFF';toast(error&&error.name==='NotAllowedError'?'Camera permission was declined. You can skip this feature.':'Could not start the camera. You can continue without it.');
    $('cameraNotice')&&($('cameraNotice').textContent='Camera could not start. You can still use the site with manual effects and skip ahead.');
  }
}
async function pumpCamera(video){
  if(!cameraStream)return;
  if(cameraLoopId)cancelAnimationFrame(cameraLoopId);
  let busy=false;
  const tick=async()=>{
    if(!cameraStream||!video||video.readyState<2){cameraLoopId=requestAnimationFrame(tick);return;}
    if(handsEnabled&&handsInstance&&!busy){
      busy=true;try{await handsInstance.send({image:video});}catch(e){}busy=false;
    }
    cameraLoopId=requestAnimationFrame(tick);
  };
  cameraLoopId=requestAnimationFrame(tick);
}
function stopCamera(){
  if(cameraLoopId){cancelAnimationFrame(cameraLoopId);cameraLoopId=null;}
  if(handsInstance){try{handsInstance.close();}catch(e){}handsInstance=null;}
  handsEnabled=false;trackingBusy=false;
  if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;}
  ['cameraVideo','partyCameraVideo'].forEach(id=>{const v=$(id);if(v){v.pause();v.srcObject=null;v.classList.remove('ready');v.style.filter='none';}});
  $('cameraFrame')&&$('cameraFrame').classList.remove('video-active');$('partyCameraFrame')&&$('partyCameraFrame').classList.remove('video-active');
  if($('cameraStatus'))$('cameraStatus').textContent='CAMERA OFF';if($('partyCameraStatus'))$('partyCameraStatus').textContent='CAMERA OFF';
  if($('startCamera'))$('startCamera').disabled=false;if($('capturePhoto'))$('capturePhoto').disabled=true;if($('stopCamera'))$('stopCamera').disabled=true;if($('toggleTracking')){$('toggleTracking').disabled=true;$('toggleTracking').textContent='Enable hand tracking';$('toggleTracking').classList.remove('btn-cyan');}
  if($('startPartyCamera'))$('startPartyCamera').disabled=false;if($('stopPartyCamera'))$('stopPartyCamera').disabled=true;
  activeCameraPage=null;lastHandCenters=[];
}
$('startCamera').addEventListener('click',()=>startCamera('camera'));
$('stopCamera').addEventListener('click',()=>{stopCamera();$('cameraNotice').textContent='Camera stopped. No live feed is running.';});
$('toggleTracking').addEventListener('click',async()=>{
  if(!cameraStream){toast('Start the camera first.');return;}
  if(handsEnabled){handsEnabled=false;$('toggleTracking').textContent='Enable hand tracking';$('gestureStatus').textContent='Tracking paused.';}
  else{const has=await ensureHands();if(has&&handsInstance){handsEnabled=true;$('toggleTracking').textContent='Hand tracking on';$('gestureStatus').textContent='Tracking active — move your hands.';}else toast('The hand-tracking model is not ready. Try reloading or use manual controls.');}
});
all('[data-filter]').forEach(b=>b.addEventListener('click',()=>{currentFilter=b.dataset.filter;renderFilters();beep(400);}));
all('[data-sticker]').forEach(b=>b.addEventListener('click',()=>{const s=b.dataset.sticker;if(cameraStickers.includes(s))cameraStickers=cameraStickers.filter(x=>x!==s);else cameraStickers.push(s);b.classList.toggle('active',cameraStickers.includes(s));toast(cameraStickers.includes(s)?s+' sticker added.':s+' sticker removed.');}));
$('clearStickers').addEventListener('click',()=>{cameraStickers=[];all('[data-sticker]').forEach(b=>b.classList.remove('active'));});
function setGestureActive(id){all('.gesture').forEach(x=>x.classList.remove('detected'));if(id&&$(id))$(id).classList.add('detected');}
function processHandResults(results,target,canvas,video){
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  const sets=results.multiHandLandmarks||[];
  if(!sets.length){lastHandCenters=[];return;}
  const links=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  sets.forEach((hand,hi)=>{
    ctx.strokeStyle='#ff8be2';ctx.lineWidth=Math.max(3,canvas.width/300);ctx.shadowColor='#ff70c8';ctx.shadowBlur=11;ctx.beginPath();
    links.forEach(l=>{ctx.moveTo(hand[l[0]].x*canvas.width,hand[l[0]].y*canvas.height);ctx.lineTo(hand[l[1]].x*canvas.width,hand[l[1]].y*canvas.height);});ctx.stroke();
    hand.forEach((p,i)=>{ctx.beginPath();ctx.fillStyle=[4,8,12,16,20].includes(i)?'#fff4bd':'#ff83d7';ctx.arc(p.x*canvas.width,p.y*canvas.height,i%4===0?canvas.width/125:canvas.width/200,0,Math.PI*2);ctx.fill();});ctx.shadowBlur=0;
  });
  const centers=sets.map(hand=>({x:hand[9].x,y:hand[9].y,palmX:(hand[0].x+hand[9].x)/2,palmY:(hand[0].y+hand[9].y)/2,up:hand[12].y<hand[0].y-.18&&hand[8].y<.48,index:hand[8],thumb:hand[4]}));
  centers.forEach((c,i)=>{if(lastHandCenters[i]){const d=Math.hypot(c.x-lastHandCenters[i].x,c.y-lastHandCenters[i].y);if(d>.035){const rect=video.getBoundingClientRect();spawnParticles(rect.left+(1-c.x)*rect.width,rect.top+c.y*rect.height,'sparkles',2);if(target==='camera')setGestureActive('gestureMove');}}});
  const now=Date.now();
  const cooldown=(key,ms)=>{if(now-(lastGestureAt[key]||0)>ms){lastGestureAt[key]=now;return true;}return false;};
  if(centers.length>=2){
    const distance=Math.hypot(centers[0].palmX-centers[1].palmX,centers[0].palmY-centers[1].palmY);
    const indices=Math.hypot(sets[0][8].x-sets[1][8].x,sets[0][8].y-sets[1][8].y);
    const thumbs=Math.hypot(sets[0][4].x-sets[1][4].x,sets[0][4].y-sets[1][4].y);
    if(centers.every(c=>c.up)&&cooldown('raise',3000)){popFx('fireworks',2);beep(800,.16);setGestureActive(target==='camera'?'gestureRaise':null);gestureToast('Both hands raised → fireworks!');}
    else if(distance<.16&&cooldown('clap',2600)){popFx('confetti',2);beep(680,.12);setGestureActive(target==='camera'?'gestureClap':null);gestureToast('Hands together → confetti burst!');}
    else if(indices<.12&&thumbs<.22&&cooldown('heart',3500)){popFx('hearts',2);beep(740,.12);setGestureActive(target==='camera'?'gestureHeart':null);gestureToast('Heart gesture detected → hearts!');}
  }
  if(centers.length===1&&lastHandCenters[0]&&Math.abs(centers[0].x-lastHandCenters[0].x)>.12&&cooldown('wave',1200)){cyclePartyEffect();popFx(currentPartyEffect,1);if(target==='camera')setGestureActive('gestureWave');}
  lastHandCenters=centers;
}
function gestureToast(text){if(Number(state.page)===7||Number(state.page)===8)toast(text);if($('gestureStatus')&&Number(state.page)===7)$('gestureStatus').textContent=text;}
$('capturePhoto').addEventListener('click',()=>{
  const video=$('cameraVideo');if(!cameraStream||video.readyState<2){toast('Start the camera before capturing.');return;}
  try{
    const canvas=document.createElement('canvas');canvas.width=video.videoWidth||640;canvas.height=video.videoHeight||480;const ctx=canvas.getContext('2d');
    ctx.save();ctx.translate(canvas.width,0);ctx.scale(-1,1);ctx.filter=filterCss[currentFilter]||'none';ctx.drawImage(video,0,0,canvas.width,canvas.height);ctx.filter='none';
    const overlay=$('cameraCanvas');if(overlay.width)ctx.drawImage(overlay,0,0,canvas.width,canvas.height);
    ctx.restore();
    ctx.fillStyle='rgba(13,8,25,.62)';ctx.fillRect(0,canvas.height-70,canvas.width,70);ctx.fillStyle='#fff0fa';ctx.font='bold '+Math.max(18,canvas.width/28)+'px DM Sans, sans-serif';ctx.textAlign='center';ctx.fillText($('photoCaption').value||'Happy Birthday Nisha! ♡',canvas.width/2,canvas.height-27);
    cameraStickers.forEach((s,i)=>{ctx.font=Math.max(35,canvas.width/11)+'px serif';ctx.textAlign='center';ctx.fillText(s,canvas.width*(.12+(i%4)*.25),canvas.height*(.16+Math.floor(i/4)*.2));});
    const a=document.createElement('a');a.download='nisha-level-19-camera-magic.png';a.href=canvas.toDataURL('image/png');a.click();state.photoTaken=true;saveState();toast('Birthday photo downloaded to your device.');confettiBurst(24);beep(770,.12);
  }catch(e){toast('Photo could not be created on this browser. Try a screenshot instead.');}
});
$('cameraContinue').addEventListener('click',()=>{if(cameraStream)stopCamera();advanceTo(7,'Camera Magic complete. Camera access was optional.');navigate(8,true);});
$('cameraSkip').addEventListener('click',()=>{if(cameraStream)stopCamera();advanceTo(7,'Camera skipped — no worries.');navigate(8,true);});

/* Celebration lab */
$('startPartyCamera').addEventListener('click',()=>startCamera('party'));
$('stopPartyCamera').addEventListener('click',()=>stopCamera());
all('[data-party-effect]').forEach(btn=>btn.addEventListener('click',()=>{currentPartyEffect=btn.dataset.partyEffect;all('[data-party-effect]').forEach(b=>b.classList.toggle('active',b===btn));beep(410);}));
$('launchEffect').addEventListener('click',()=>{popFx(currentPartyEffect,2);beep(740,.14);});
$('celebrateNow').addEventListener('click',()=>{
  state.celebrated=true;saveState();$('celebrateMessage').textContent='BIRTHDAY PROTOCOL ACTIVATED. Nisha has officially been showered with sparkles.';confettiBurst(100);popFx('fireworks',3);playCelebrationNotes();beep(800,.18);toast('Happy 19th Birthday, Nisha!');$('celebrateContinue').textContent='Unlock secret room →';
});
$('celebrateContinue').addEventListener('click',()=>{
  if(cameraStream)stopCamera();state.celebrated=true;saveState();advanceTo(8,'Celebration protocol complete. The secret vault is open.');navigate(9,true);
});
$('partySound').addEventListener('click',playCelebrationNotes);
function playCelebrationNotes(){
  try{const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;if(!audioContext)audioContext=new AudioCtx();if(audioContext.state==='suspended')audioContext.resume();const notes=[523.25,659.25,783.99,1046.5,783.99,880,1046.5];notes.forEach((n,i)=>{const id=setTimeout(()=>{if(!audioContext)return;const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=n;g.gain.setValueAtTime(.001,audioContext.currentTime);g.gain.linearRampToValueAtTime(.06,audioContext.currentTime+.03);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.34);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+.36);},i*180);melodyTimers.push(id);});}catch(e){}
}
function playOriginalMelody(){playCelebrationNotes();}

/* Secret Room */
function renderSecrets(){
  $('secretCount').textContent=state.secrets.length+' / 4';$('secretMeter').style.width=(state.secrets.length/4*100)+'%';$('secretPct').textContent=Math.round(state.secrets.length/4*100)+'%';
  all('[data-secret]').forEach(b=>{const n=Number(b.dataset.secret);b.classList.toggle('opened',state.secrets.includes(n));const sm=b.querySelector('small');if(sm)sm.textContent=state.secrets.includes(n)?'✓ Surprise discovered':'Tap to unlock';});
  $('secretContinue').disabled=state.secrets.length<3;
  $status('secretFeedback',state.secrets.length>=3?'The last chapter is ready. Three secrets is enough — voice recording is optional.':'Discover at least 3 of 4 surprises to unlock the final message.',state.secrets.length>=3);
}
function showModal(title,body,kicker='SURPRISE UNLOCKED'){
  $('modalKicker').textContent=kicker;$('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modalBackdrop').classList.add('show');document.body.style.overflow='hidden';beep(620);
}
function closeModal(){$('modalBackdrop').classList.remove('show');document.body.style.overflow='';}
$('modalClose').addEventListener('click',closeModal);$('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
all('[data-secret]').forEach(btn=>btn.addEventListener('click',()=>{
  const n=Number(btn.dataset.secret);
  if(!state.secrets.includes(n))state.secrets.push(n);saveState();renderSecrets();
  if(n===0){
    const note=hiddenNotes[Math.floor(Math.random()*hiddenNotes.length)];
    showModal('A hidden note for Nisha', '<div class="secret-letter">“'+note+'”</div><p>Filed under: small things worth remembering. ♡</p><div class="actions"><button class="btn btn-primary" id="nextHiddenNote" type="button">Find another note</button></div>');
    $('nextHiddenNote').addEventListener('click',()=>{$('modalBody').querySelector('.secret-letter').textContent='“'+hiddenNotes[Math.floor(Math.random()*hiddenNotes.length)]+'”';beep(540);});
  }else if(n===1){
    showModal('Digital birthday DLC', '<div style="font-size:46px;text-align:center">🎁✨🎂</div><h3 style="font-family:Playfair Display,serif;color:#ffe1f3;font-size:24px;text-align:center">You have unlocked: Main Character Energy</h3><p>A tiny digital gift for reaching level 19: unlimited permission to try again, change your mind, and make this year your own.</p><div class="callout pink">Bonus item: one free pass to be dramatic today. Use responsibly (or not).</div>');
  }else if(n===2){
    showModal('Classified case file #019', '<div class="tag">FICTIONAL REPORT · FRIENDSHIP EDITION</div><h3 style="margin-top:15px">Subject: Nisha / Level 19</h3><p><b style="color:#ffe1f3">Observed strengths:</b> legendary potential, chaotic sparkle, and an ability to turn ordinary moments into stories.</p><p><b style="color:#ffe1f3">Known hazards:</b> overthinking, plot twists, and saying “one last thing” followed by six more things.</p><p><b style="color:#ffe1f3">Final assessment:</b> highly worth celebrating. Case closed. ♡</p>');
  }else{
    showModal('Voice Letter Station', '<p>Record a greeting in your own voice, then play it back here. It stays in this browser session; it is not uploaded by this page. This is optional — opening the station already counts as a discovery.</p><div class="actions"><button class="btn btn-primary" id="recordVoice" type="button">● Start recording</button><button class="btn btn-secondary" id="stopVoice" type="button" disabled>Stop recording</button></div><div class="answer-status" id="voiceStatus">Microphone access will be requested only when you start recording.</div><div id="voicePlayback" style="margin-top:12px"></div>');
    $('recordVoice').addEventListener('click',startVoiceRecording);$('stopVoice').addEventListener('click',stopVoiceRecording);
  }
}));
async function startVoiceRecording(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){$status('voiceStatus','Recording is not available in this browser.');return;}
  try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});recorderChunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data&&e.data.size)recorderChunks.push(e.data);};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());recordedVoiceBlob=new Blob(recorderChunks,{type:recorder.mimeType||'audio/webm'});if(recordedVoiceUrl)URL.revokeObjectURL(recordedVoiceUrl);recordedVoiceUrl=URL.createObjectURL(recordedVoiceBlob);$('voicePlayback').innerHTML='<audio controls src="'+recordedVoiceUrl+'" style="width:100%"></audio><a class="btn btn-secondary btn-sm" href="'+recordedVoiceUrl+'" download="nisha-birthday-voice-note.webm">Download recording</a>';$status('voiceStatus','Recording saved locally for this session.',true);$('recordVoice').disabled=false;$('stopVoice').disabled=true;};recorder.start();$('recordVoice').disabled=true;$('stopVoice').disabled=false;$status('voiceStatus','Recording… say happy birthday!');}catch(e){$status('voiceStatus','Microphone permission declined or recording unavailable. That is completely fine.');}
}
function stopVoiceRecording(){if(recorder&&recorder.state!=='inactive')recorder.stop();}
$('secretContinue').addEventListener('click',()=>{
  if(state.secrets.length<3){toast('Discover three surprises first.');return;}
  advanceTo(9,'Secret room cleared. The final letter is ready.');navigate(10,true);confettiBurst(65);
});

/* Final keepsake, replay and celebrations */
function renderFinal(){if(!state.completed[10]){state.completed[10]=true;state.unlocked=10;saveState();renderMap();}}
$('finalConfetti').addEventListener('click',()=>{confettiBurst(110);popFx('fireworks',3);playOriginalMelody();$status('finalFeedback','Birthday protocol re-activated. ✦',true);});
$('downloadKeepsake').addEventListener('click',()=>{
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0b0918"/><stop offset=".55" stop-color="#271536"/><stop offset="1" stop-color="#0b1023"/></linearGradient><linearGradient id="pink"><stop stop-color="#ff72cb"/><stop offset="1" stop-color="#d0a0ff"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="8"/></filter></defs><rect width="1200" height="1500" fill="url(#bg)"/>'+Array.from({length:95},(_,i)=>'<circle cx="'+((i*127)%1200)+'" cy="'+((i*191)%1500)+'" r="'+(i%3+1)+'" fill="'+(i%4?'#ffd8f2':'#fff')+'" opacity=".65"/>').join('')+'<circle cx="600" cy="430" r="245" fill="none" stroke="#ff70c8" stroke-width="2" opacity=".5"/><circle cx="600" cy="430" r="220" fill="none" stroke="#b89aff" stroke-dasharray="7 15" opacity=".7"/><text x="600" y="190" fill="#7cece6" font-family="monospace" font-size="27" letter-spacing="9" text-anchor="middle">BIRTHDAY PROTOCOL COMPLETE</text><text x="600" y="365" fill="#ff70c8" font-family="Georgia,serif" font-size="108" text-anchor="middle" font-weight="bold">HAPPY 19TH</text><text x="600" y="490" fill="#fff0fa" font-family="Georgia,serif" font-size="105" text-anchor="middle">NISHA ♡</text><text x="600" y="655" fill="#f2dff7" font-family="Georgia,serif" font-size="39" text-anchor="middle">Same chaos. More adventures.</text><text x="600" y="715" fill="#f2dff7" font-family="Georgia,serif" font-size="39" text-anchor="middle">A new level unlocked.</text><path d="M300 820 Q600 980 900 820" fill="none" stroke="#ff70c8" stroke-width="3"/><text x="600" y="965" fill="#fff0fa" font-family="Georgia,serif" font-size="35" text-anchor="middle">May this year bring more joy,</text><text x="600" y="1020" fill="#fff0fa" font-family="Georgia,serif" font-size="35" text-anchor="middle">good people, and brilliant stories.</text><text x="600" y="1150" fill="#ffb8e4" font-family="Georgia,serif" font-size="39" font-style="italic" text-anchor="middle">Stay happy. Stay weird. Stay you.</text><text x="600" y="1270" fill="#7cece6" font-family="monospace" font-size="24" letter-spacing="7" text-anchor="middle">FROM YOUR FRIEND · LEVEL 19</text><text x="600" y="1370" fill="#a99abd" font-family="monospace" font-size="19" text-anchor="middle">THE NISHA FILES · CASE CLOSED</text></svg>';
  const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='happy-19th-birthday-nisha.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);$status('finalFeedback','Birthday keepsake downloaded. You can open it or share it. ♡',true);beep(740);
});
$('replayJourney').addEventListener('click',()=>{
  if(!window.confirm('Replay from the beginning? This will reset the saved puzzle and mission progress on this device.'))return;
  stopCamera();stopGameLoop();state=Object.assign({},defaults,{completed:{1:false},pieceOrder:[1,0,3,2],evidence:[],keys:[],puzzleDone:[],awards:[],secrets:[],unlocked:1,page:1});saveState();resetGame();renderMap();navigate(1,true);toast('Quest reset. The mystery is new again.');
});

/* Ambient confetti and gesture particles */
function initFxLayer(){
  fxCanvas=document.createElement('canvas');fxCanvas.setAttribute('aria-hidden','true');fxCanvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:75';document.body.appendChild(fxCanvas);fxCtx=fxCanvas.getContext('2d');resizeFx();window.addEventListener('resize',resizeFx);animateFx();
}
function resizeFx(){if(!fxCanvas)return;const dpr=Math.min(window.devicePixelRatio||1,2);fxCanvas.width=Math.floor(innerWidth*dpr);fxCanvas.height=Math.floor(innerHeight*dpr);fxCtx.setTransform(dpr,0,0,dpr,0,0);}
function spawnParticles(x,y,type='sparkles',count=8){
  const glyphs={sparkles:['✦','✧','·'],confetti:['✦','•','✧','🎊'],hearts:['♡','♥','💗'],fireworks:['✦','✧','·'],butterflies:['🦋','✧'],stars:['★','✦','⭐']};
  const list=glyphs[type]||glyphs.sparkles;
  for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2;const speed=30+Math.random()*150;particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-40,life:.8+Math.random()*1.15,max:1.9,glyph:list[Math.floor(Math.random()*list.length)],size:12+Math.random()*22,color:['#ff70c8','#ffd98a','#7cece6','#cf9dff','#fff0fa'][Math.floor(Math.random()*5)],gravity:type==='confetti'?30:8});}
}
function popFx(type='sparkles',bursts=1){
  const w=innerWidth,h=innerHeight;
  for(let b=0;b<bursts;b++){
    const x=w*(.2+Math.random()*.6),y=h*(.18+Math.random()*.5);
    spawnParticles(x,y,type,type==='fireworks'?30:19);
  }
}
function confettiBurst(n=50){
  const colors=['#ff70c8','#ffd98a','#7cece6','#bd85ff','#fff0fa','#a5f4bd'];
  for(let i=0;i<n;i++){const el=document.createElement('span');el.className='confetti-piece';el.textContent=['✦','✧','•','♥','★'][Math.floor(Math.random()*5)];el.style.left=Math.random()*100+'vw';el.style.setProperty('--dur',(2+Math.random()*3)+'s');el.style.setProperty('--size',(10+Math.random()*18)+'px');el.style.setProperty('--piece-color',colors[Math.floor(Math.random()*colors.length)]);el.style.setProperty('--drift',(-90+Math.random()*180)+'px');document.body.appendChild(el);setTimeout(()=>el.remove(),5300);}
}
function animateFx(){
  if(!fxCtx)return;
  fxCtx.clearRect(0,0,innerWidth,innerHeight);
  const dt=.016;
  particles=particles.filter(p=>p.life>0);
  particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;fxCtx.globalAlpha=Math.max(0,Math.min(1,p.life/0.6));fxCtx.shadowColor=p.color;fxCtx.shadowBlur=12;fxCtx.fillStyle=p.color;fxCtx.font='bold '+p.size+'px sans-serif';fxCtx.textAlign='center';fxCtx.fillText(p.glyph,p.x,p.y);});
  fxCtx.globalAlpha=1;fxCtx.shadowBlur=0;
  fxRAF=requestAnimationFrame(animateFx);
}
function cyclePartyEffect(){
  const names=['sparkles','confetti','hearts','fireworks','butterflies','stars'];let i=names.indexOf(currentPartyEffect);currentPartyEffect=names[(i+1)%names.length];
  all('[data-party-effect]').forEach(b=>b.classList.toggle('active',b.dataset.partyEffect===currentPartyEffect));
}
function updateStartupUI(){
  $('mapButton').classList.toggle('hidden',Number(state.page)===1);renderMap();renderEvidence();renderPuzzleState();renderRoast();renderSecrets();updateTopProgress();drawGame();
  if(state.completed[3]&&state.evidence.length===6){state.unlocked=Math.max(state.unlocked,4);}
  if(state.completed[4]&&state.keys.length===4){state.unlocked=Math.max(state.unlocked,5);}
  if(state.gameWon){game.won=true;game.started=false;game.collected=new Set(starPoints.map((_,i)=>i));$('gameContinue').disabled=false;drawGame();updateGameHUD();}
  if(state.page===1&&state.unlocked>1){} // Intro remains the landing screen; Resume opens the map.
  saveState();
}
initFxLayer();
updateStartupUI();
})();