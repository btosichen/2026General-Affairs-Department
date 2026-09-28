const STORAGE_KEY='ymsh-listening-exam-v1';
const EDIT_PASSWORD_HASH='5723959ba4cced33029abb64cb213b70404d63b2f9e741be83d0be5385cb1c2c';
const roomSeed=[
 {grade:'國七',name:'701班',building:'立志樓',floor:'4F',students:22,type:'support'},
 {grade:'國七',name:'702班',building:'立志樓',floor:'4F',students:29,type:'main'},
 {grade:'國七',name:'703班',building:'立志樓',floor:'4F',students:30,type:'main'},
 {grade:'國七',name:'704班',building:'立志樓',floor:'4F',students:29,type:'main'},
 {grade:'國七',name:'705班',building:'立志樓',floor:'4F',students:30,type:'main'},
 {grade:'國七',name:'706班',building:'立志樓',floor:'4F',students:31,type:'support'},
 {grade:'國八',name:'801班',building:'立志樓',floor:'3F',students:21,type:'support'},
 {grade:'國八',name:'802班',building:'立志樓',floor:'3F',students:30,type:'main'},
 {grade:'國八',name:'803班',building:'立志樓',floor:'3F',students:30,type:'main'},
 {grade:'國八',name:'804班',building:'立志樓',floor:'3F',students:32,type:'main'},
 {grade:'國八',name:'805班',building:'立志樓',floor:'3F',students:32,type:'main'},
 {grade:'國八',name:'806班',building:'立志樓',floor:'3F',students:33,type:'support'},
 {grade:'高一',name:'101班',building:'立志樓',floor:'2F',students:34,type:'main'},
 {grade:'高一',name:'102班',building:'立志樓',floor:'2F',students:37,type:'main'},
 {grade:'高一',name:'103班',building:'立志樓',floor:'2F',students:36,type:'main'},
 {grade:'高一',name:'104班',building:'立志樓',floor:'2F',students:36,type:'main'},
 {grade:'高一',name:'105班',building:'立志樓',floor:'3F',students:36,type:'main'},
 {grade:'高一',name:'106班',building:'立志樓',floor:'1F',students:37,type:'reserve'},
 {grade:'高一',name:'107班',building:'立志樓',floor:'3F',students:37,type:'main'},
 {grade:'高一',name:'108班',building:'立志樓',floor:'3F',students:34,type:'main'},
 {grade:'高一',name:'109班',building:'立志樓',floor:'3F',students:37,type:'main'},
 {grade:'高一',name:'110班',building:'立志樓',floor:'4F',students:37,type:'main'},
 {grade:'高一',name:'111班',building:'立志樓',floor:'4F',students:36,type:'main'},
 {grade:'高一',name:'112班',building:'立志樓',floor:'4F',students:34,type:'main'},
 {grade:'高一',name:'113班',building:'立志樓',floor:'4F',students:28,type:'support'},
 {grade:'高二',name:'201班',building:'向陽樓',floor:'4F',students:28,type:'main'},
 {grade:'高二',name:'202班',building:'向陽樓',floor:'4F',students:41,type:'main'},
 {grade:'高二',name:'203班',building:'向陽樓',floor:'4F',students:41,type:'main'},
 {grade:'高二',name:'204班',building:'向陽樓',floor:'4F',students:22,type:'main'},
 {grade:'高二',name:'205班',building:'向陽樓',floor:'2F',students:25,type:'support'},
 {grade:'高二',name:'206班',building:'向陽樓',floor:'4F',students:44,type:'support'},
 {grade:'高二',name:'207班',building:'向陽樓',floor:'3F',students:44,type:'main'},
 {grade:'高二',name:'208班',building:'向陽樓',floor:'3F',students:44,type:'main'},
 {grade:'高二',name:'209班',building:'向陽樓',floor:'3F',students:34,type:'main'},
 {grade:'高二',name:'210班',building:'向陽樓',floor:'3F',students:34,type:'main'},
 {grade:'高二',name:'211班',building:'向陽樓',floor:'3F',students:34,type:'main'},
 {grade:'高二',name:'212班',building:'向陽樓',floor:'2F',students:33,type:'reserve'}
];
const floorPlan={
 '立志樓':{'4F':['706班','705班','704班','703班','702班','701班','110班','111班','112班','113班'],'3F':['806班','805班','804班','803班','802班','801班','105班','107班','108班','109班'],'2F':['101班','102班','103班','104班'],'1F':['106班']},
 '向陽樓':{'4F':['201班','202班','203班','204班','206班'],'3F':['207班','208班','209班','210班','211班'],'2F':['205班','212班']}
};
const seededRoom=r=>({...r,target:r.type==='support'?0:36,note:r.type==='support'?'桌椅支援教室，可提供其他英聽考場調度。':'',seats:Array(36).fill('')});
const initial=()=>({rooms:roomSeed.map(seededRoom),moves:[],updated:new Date().toISOString()});
let state=load(),filter='all',activeRoom=null,editing=false,pendingMoveRoom=null;
function normalize(saved){if(!saved?.rooms)return initial();roomSeed.forEach(seed=>{if(!saved.rooms.some(r=>r.name===seed.name))saved.rooms.push(seededRoom(seed))});saved.moves=Array.isArray(saved.moves)?saved.moves:[];return saved}
function load(){try{return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)))}catch{return initial()}}
function persist(message='已儲存'){state.updated=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));render();toast(message)}
const byName=n=>state.rooms.find(r=>r.name===n);
function incoming(name){return state.moves.filter(m=>m.type==='classroom'&&m.to===name).reduce((s,m)=>s+m.count,0)}
function outgoing(name){return state.moves.filter(m=>m.from===name).reduce((s,m)=>s+m.count,0)}
function finalCount(r){return r.students+incoming(r.name)-outgoing(r.name)}
function originalDelta(r){return r.students-r.target}
function render(){renderSummary();renderMap();renderMoves()}
function renderSummary(){const exam=state.rooms.filter(r=>r.type!=='support'),support=state.rooms.filter(r=>r.type==='support'),main=exam.filter(r=>r.type==='main').length,reserve=exam.filter(r=>r.type==='reserve').length,desks=exam.reduce((s,r)=>s+r.students,0),need=exam.reduce((s,r)=>s+Math.max(0,r.target-r.students),0),extra=exam.reduce((s,r)=>s+Math.max(0,r.students-r.target),0),supply=support.reduce((s,r)=>s+Math.max(0,finalCount(r)-r.target),0);summary.innerHTML=[['正式考場',`${main} 間`,''],['備用考場',`${reserve} 間`,''],['考場合計',`${exam.length} 間`,'sun'],['考場桌椅',`${desks} 套`,''],['原始缺少',`${need} 套`,'pink'],['原始多出',`${extra} 套`,'mint'],['支援教室',`${support.length} 間・${supply} 套`,'support']].map(([a,b,c])=>`<article class="stat ${c}"><i>${a}</i><strong>${b}</strong></article>`).join('')}
function roomHTML(r){const delta=originalDelta(r),isSupport=r.type==='support',show=filter==='all'||filter===r.type||(!isSupport&&filter==='shortage'&&delta<0)||(!isSupport&&filter==='surplus'&&delta>0),available=Math.max(0,finalCount(r)-r.target),label=r.type==='reserve'?'備用':isSupport?'支援':'正式';return`<button class="room ${r.type} ${show?'':'room-filtered'}" data-room="${r.name}"><header><h3>${r.name}</h3><span class="badge">${label}</span></header><div class="room-data"><span>班級人數<b>${r.students}人</b></span><span>${isSupport?'現有桌椅':'目標桌椅'}<b>${isSupport?r.students:r.target}套</b></span></div><div class="room-delta ${isSupport?'support':delta<0?'shortage':delta>0?'surplus':'even'}">${isSupport?`可供調度 ${available} 套`:delta<0?`缺少 ${Math.abs(delta)} 套`:delta>0?`多出 ${delta} 套`:'剛好 36 套'}</div></button>`}
function renderMap(){buildingMap.innerHTML=Object.entries(floorPlan).map(([building,floors])=>{const rooms=state.rooms.filter(r=>r.building===building),exam=rooms.filter(r=>r.type!=='support').length,support=rooms.filter(r=>r.type==='support').length;return`<section class="building"><header><h2>🏫 ${building}${building==='立志樓'?'（國中教學大樓）':''}</h2><span>${exam} 間考場＋${support} 間支援教室</span></header>${Object.entries(floors).map(([floor,names])=>`<div class="floor"><div class="floor-label">${floor}</div><div class="rooms">${names.map(n=>roomHTML(byName(n))).join('')}</div></div>`).join('')}</section>`}).join('');buildingMap.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>openRoom(b.dataset.room))}
function renderMoves(){if(!state.moves.length){movementList.innerHTML='<div class="movement-empty">尚未登記桌椅移動</div>';return}movementList.innerHTML=state.moves.map((m,i)=>`<div class="movement-row ${m.type==='outside'?'outside':''}"><strong>${m.from}</strong><i>→</i><strong>${m.type==='outside'?'教室外':m.to}</strong><b>${m.count} 張</b><button class="delete-move" data-delete="${i}" aria-label="刪除此移動">×</button></div>`).join('');movementList.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(!editing)return requestUnlock();state.moves.splice(+b.dataset.delete,1);persist('移動紀錄已刪除')})}
function openRoom(name){activeRoom=byName(name);const kind=activeRoom.type==='reserve'?'備用考場':activeRoom.type==='support'?'桌椅支援教室':'正式考場',support=activeRoom.type==='support';roomTitle.textContent=`${name}｜${kind}`;roomLocation.textContent=`${activeRoom.building} · ${activeRoom.floor} · ${activeRoom.grade}`;studentCount.value=activeRoom.students;targetDesks.value=activeRoom.target;targetDesks.min=support?0:1;targetDesksLabel.textContent=support?'教室需保留桌椅':'教室目標桌椅';roomNote.value=activeRoom.note||'';setEditable();renderDialogSummary();renderRoomMoves();renderSeats();switchTab('desks');roomDialog.showModal()}
function renderDialogSummary(){const r=activeRoom,delta=originalDelta(r),support=r.type==='support';dialogSummary.innerHTML=(support?[['班級人數',`${r.students}人`],['現有桌椅',`${r.students}套`],['保留桌椅',`${r.target}套`],['可供調度',`${Math.max(0,finalCount(r)-r.target)}套`]]:[['班級人數',`${r.students}人`],['預設桌椅',`${r.target}套`],['原始差額',delta<0?`缺${-delta}套`:delta>0?`多${delta}套`:'剛好'],['調度後',`${finalCount(r)}套`]]).map(x=>`<span>${x[0]}<b>${x[1]}</b></span>`).join('')}
function renderRoomMoves(){const list=state.moves.map((m,i)=>({...m,i})).filter(m=>m.from===activeRoom.name||m.to===activeRoom.name);roomMoves.innerHTML=list.length?list.map(m=>`<div class="mini-move ${m.type==='outside'?'outside':''}"><strong>${m.from}</strong><i>→</i><strong>${m.type==='outside'?'教室外':m.to}</strong><b>${m.count}張</b><button type="button" class="delete-move" data-mini-delete="${m.i}" ${editing?'':'disabled'}>×</button></div>`).join(''):'<div class="movement-empty">這間教室尚無移動紀錄</div>';roomMoves.querySelectorAll('[data-mini-delete]').forEach(b=>b.onclick=()=>{state.moves.splice(+b.dataset.miniDelete,1);renderRoomMoves();renderDialogSummary()})}
function renderSeats(){activeRoom.seats=Array.from({length:36},(_,i)=>activeRoom.seats?.[i]||'');seatGrid.innerHTML=activeRoom.seats.map((v,i)=>`<label class="seat"><b>座位 ${i+1}</b><input data-seat="${i}" value="${escapeHTML(v)}" placeholder="班級座號" ${editing?'':'disabled'}></label>`).join('')}
function setEditable(){[studentCount,targetDesks,roomNote,addMove,resetRoom].forEach(el=>el.disabled=!editing);editText.textContent=editing?'編輯模式已解鎖':'編輯模式已鎖定'}
function switchTab(name){document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));desksTab.classList.toggle('active',name==='desks');seatsTab.classList.toggle('active',name==='seats')}
function requestUnlock(){passwordInput.value='';passwordError.textContent='';passwordDialog.showModal();setTimeout(()=>passwordInput.focus(),0)}
async function sha256(v){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function escapeHTML(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(window._t);window._t=setTimeout(()=>toastEl.classList.remove('show'),1800)}
const toastEl=document.getElementById('toast');
function bindEvents(){
 document.body.dataset.appReady='true';
 document.querySelectorAll('.filters button').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('.filters button').forEach(x=>x.classList.toggle('active',x===b));renderMap()}));
 document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
 editToggle.addEventListener('change',()=>{if(editToggle.checked&&!editing){editToggle.checked=false;requestUnlock()}else if(!editToggle.checked){editing=false;setEditable();if(roomDialog.open){renderSeats();renderRoomMoves()}}});
 passwordForm.addEventListener('submit',async e=>{e.preventDefault();if(await sha256(passwordInput.value)===EDIT_PASSWORD_HASH){editing=true;editToggle.checked=true;passwordDialog.close();setEditable();if(roomDialog.open){renderSeats();renderRoomMoves()}toast('編輯模式已解鎖')}else{passwordError.textContent='密碼不正確，請重新輸入。'}});
 cancelPassword.addEventListener('click',()=>passwordDialog.close());
 closeRoom.addEventListener('click',()=>roomDialog.close());cancelRoom.addEventListener('click',()=>roomDialog.close());
 roomForm.addEventListener('submit',e=>{e.preventDefault();if(!editing)return requestUnlock();activeRoom.students=Math.max(0,+studentCount.value||0);const target=Number(targetDesks.value);activeRoom.target=activeRoom.type==='support'?Math.max(0,Number.isFinite(target)?target:0):Math.max(1,target||36);activeRoom.note=roomNote.value.trim();document.querySelectorAll('[data-seat]').forEach(i=>activeRoom.seats[+i.dataset.seat]=i.value.trim());roomDialog.close();persist(`${activeRoom.name} 已更新`)});
 resetRoom.addEventListener('click',()=>{if(!editing)return;const seed=roomSeed.find(r=>r.name===activeRoom.name);Object.assign(activeRoom,seededRoom(seed));state.moves=state.moves.filter(m=>m.from!==activeRoom.name&&m.to!==activeRoom.name);openRoom(activeRoom.name);toast('已還原此教室')});
 addMove.addEventListener('click',()=>{if(!editing)return requestUnlock();pendingMoveRoom=activeRoom.name;moveType.value='classroom';moveFrom.innerHTML=state.rooms.map(r=>`<option ${r.name===pendingMoveRoom?'selected':''}>${r.name}</option>`).join('');moveTo.innerHTML=state.rooms.filter(r=>r.name!==pendingMoveRoom).map(r=>`<option>${r.name}</option>`).join('');moveCount.value=1;moveNote.value='';moveToWrap.hidden=false;moveDialog.showModal()});
 moveType.addEventListener('change',()=>moveToWrap.hidden=moveType.value==='outside');
 closeMove.addEventListener('click',()=>moveDialog.close());cancelMove.addEventListener('click',()=>moveDialog.close());
 moveForm.addEventListener('submit',e=>{e.preventDefault();const from=moveFrom.value,to=moveType.value==='outside'?'':moveTo.value,count=Math.max(1,+moveCount.value||1);if(moveType.value==='classroom'&&from===to)return toast('來源與目的教室不可相同');state.moves.push({type:moveType.value,from,to,count,note:moveNote.value.trim()});moveDialog.close();renderRoomMoves();renderDialogSummary();persist('桌椅移動已登記')});
 printBtn.addEventListener('click',()=>window.print());
 exportBtn.addEventListener('click',()=>{const a=document.createElement('a'),blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download='英聽考場配置備份.json';a.click();URL.revokeObjectURL(a.href)});
 importInput.addEventListener('change',async e=>{try{const next=JSON.parse(await e.target.files[0].text());if(!next.rooms||!next.moves)throw Error();state=normalize(next);persist('資料已匯入')}catch{toast('備份檔格式不正確')}e.target.value=''});
}
bindEvents();render();setEditable();
