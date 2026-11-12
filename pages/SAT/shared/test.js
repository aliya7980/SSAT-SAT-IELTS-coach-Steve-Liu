
const TEST = window.SAT_ACTIVE_TEST;
const QUESTIONS = TEST.questions;
const storagePrefix = `hd_sat_${TEST.id}_`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readSaved(kind, fallback) {
  try { return JSON.parse(localStorage.getItem(storagePrefix + kind) || 'null') ?? fallback; }
  catch { return fallback; }
}
// Migrate existing August attempts and teacher edits once, without changing legacy entries.
if (TEST.id === 'august2026') {
  ['attempts'].forEach(kind => {
    if (localStorage.getItem(storagePrefix + kind) === null && localStorage.getItem('hd_sat_' + kind)) {
      localStorage.setItem(storagePrefix + kind, localStorage.getItem('hd_sat_' + kind));
    }
  });
}
let practiceScreen = 'testScreen';
function saveProgress() {
  if (!state.name) return;
  const {timerId, ...snapshot} = state;
  localStorage.setItem(storagePrefix + 'progress', JSON.stringify({...snapshot, testId: TEST.id, screen: practiceScreen}));
}
function questionImages(item) {
  return (item.images || []).map(img => `<figure class="question-visual" style="--visual-max-width: ${Number(img.displayWidth) || 900}px"><a href="${escapeHtml(new URL(img.src, window.SAT_ASSET_BASE).href)}" target="_blank" rel="noopener" aria-label="Enlarge visual: ${escapeHtml(img.alt)}"><img src="${escapeHtml(new URL(img.src, window.SAT_ASSET_BASE).href)}" alt="${escapeHtml(img.alt)}" loading="eager"></a><figcaption>Click the visual to enlarge.</figcaption></figure>`).join('');
}

const state={module:1,index:0,name:"",answers:{1:{},2:{}},marked:{1:{},2:{}},crossed:{1:{},2:{}},seconds:{1:1920,2:1920},timerId:null,startTime:null,completedModules:[]};
const $=id=>document.getElementById(id);
function show(id){if(["testScreen","reviewScreen","navigatorScreen"].includes(id))practiceScreen=id;["startScreen","testScreen","navigatorScreen","reviewScreen","resultScreen","teacherScreen"].forEach(x=>$(x).classList.add("hidden"));$(id).classList.remove("hidden")}
function q(){return QUESTIONS[state.module][state.index]}
function startTimer(){
 clearInterval(state.timerId);
 state.timerId=setInterval(()=>{state.seconds[state.module]--;if(state.seconds[state.module]<=0){state.seconds[state.module]=0;clearInterval(state.timerId);openReview()}renderTimer()},1000)
}
function renderTimer(){let s=state.seconds[state.module],m=Math.floor(s/60),r=s%60;$("timer").textContent=`${m}:${String(r).padStart(2,"0")}`;saveProgress()}
function renderQuestion(){
 show("testScreen");const item=q();$("moduleLabel").textContent=`Reading and Writing · Module ${state.module}`;$("studentLabel").textContent=`Student: ${state.name}`;$("questionNumber").textContent=`Question ${item.n} of 27`;$("centerCounter").textContent=`${item.n} / 27`;$("progressBar").style.width=`${(item.n/27)*100}%`;
 $("passage").innerHTML=questionImages(item)+item.passage;$("prompt").innerHTML=item.prompt;$("options").innerHTML="";
 item.choices.forEach((c,i)=>{const l="ABCD"[i],div=document.createElement("div");div.className="option";if(state.answers[state.module][item.n]===l)div.classList.add("selected");if((state.crossed[state.module][item.n]||[]).includes(l))div.classList.add("crossed");
 div.innerHTML=`<div class="letter">${l}</div><div class="option-text">${c}</div><button class="cross-btn" title="Cross out">✕</button>`;
 div.querySelector(".option-text").addEventListener("click",()=>{state.answers[state.module][item.n]=l;renderQuestion()});
 div.querySelector(".letter").addEventListener("click",()=>{state.answers[state.module][item.n]=l;renderQuestion()});
 div.querySelector(".cross-btn").addEventListener("click",e=>{e.stopPropagation();let arr=state.crossed[state.module][item.n]||[];arr=arr.includes(l)?arr.filter(x=>x!==l):[...arr,l];state.crossed[state.module][item.n]=arr;renderQuestion()});
 $("options").appendChild(div)});
 $("markBtn").textContent=state.marked[state.module][item.n]?"★ Marked for Review":"☆ Mark for Review";
 $("backBtn").disabled=state.index===0;$("nextBtn").textContent=state.index===26?"Review Module":"Next →";
 teacherInk.render(`${TEST.id}:m${state.module}q${item.n}`);
 renderTimer()
}
function openNavigator(){show("navigatorScreen");$("navigatorTitle").textContent=`Reading and Writing · Module ${state.module} Navigator`;$("navigatorGrid").innerHTML="";QUESTIONS[state.module].forEach((item,i)=>{let b=document.createElement("button");b.className="navnum";if(state.answers[state.module][item.n])b.classList.add("answered");if(i===state.index)b.classList.add("current");if(state.marked[state.module][item.n])b.classList.add("marked");b.textContent=item.n;b.onclick=()=>{state.index=i;renderQuestion()};$("navigatorGrid").appendChild(b)})}
function openReview(){show("reviewScreen");clearInterval(state.timerId);$("reviewTitle").textContent=`Reading and Writing · Module ${state.module} Review`;let a=Object.keys(state.answers[state.module]).length,m=Object.keys(state.marked[state.module]).filter(k=>state.marked[state.module][k]).length;$("reviewStats").innerHTML=`Answered: <strong>${a}</strong> &nbsp; Unanswered: <strong>${27-a}</strong> &nbsp; Marked: <strong>${m}</strong>`;$("reviewGrid").innerHTML="";QUESTIONS[state.module].forEach((item,i)=>{let b=document.createElement("button");b.textContent=item.n;if(state.answers[state.module][item.n])b.classList.add("answered");if(state.marked[state.module][item.n])b.classList.add("marked");b.onclick=()=>{state.index=i;renderQuestion();startTimer()};$("reviewGrid").appendChild(b)});$("submitModuleBtn").textContent=state.module===1?"Submit Module 1 and Continue":"Submit Test";saveProgress()}
async function finishTest() {
  clearInterval(state.timerId);
  $('submitModuleBtn').disabled = true;
  saveProgress();
  try {
    const result = await window.SAT_API.student('submit', {
      answers: state.answers, completedModules: [1,2]
    });
    const attempt = {
      id: result.id, serverId: result.id, testId: TEST.id, testName: TEST.name,
      name: result.name, date: result.date, answers: JSON.parse(JSON.stringify(state.answers)),
      secondsUsed: {1:1920-state.seconds[1],2:1920-state.seconds[2]}
    };
    const attempts=readSaved('attempts',[]).filter(a=>String(a.id)!==result.id);
    attempts.unshift(attempt);
    localStorage.setItem(storagePrefix+'attempts',JSON.stringify(attempts));
    localStorage.removeItem(storagePrefix+'progress');
    location.assign(new URL(`august-2026/results.html?test=${TEST.id}&attempt=${result.id}`,window.SAT_ROOT).href);
  } catch(error) { alert(error.message); }
  finally { $('submitModuleBtn').disabled=false; }
}
$('startBtn').onclick=async()=>{
  const name=$('studentName').value.trim();
  if(!name){alert('Please enter the student name.');return;}
  $('startBtn').disabled=true;
  try {
    let accessCode=$('studentAccessCode').value;
    if(!accessCode&&teacherKey){const invite=await window.SAT_API.teacher('invitations','POST',{name});accessCode=invite.code;}
    window.SAT_API.setAccessCode(accessCode);
    const access=await window.SAT_API.student('start');
    if(access.submitted){location.assign(new URL(`august-2026/results.html?test=${TEST.id}&attempt=${access.id}`,window.SAT_ROOT).href);return;}
    state.name=access.name;state.module=1;state.index=0;state.seconds={1:1920,2:1920};
    state.answers={1:{},2:{}};state.marked={1:{},2:{}};state.crossed={1:{},2:{}};state.completedModules=[];
    renderQuestion();startTimer();
  }catch(error){alert(error.message);}
  finally{$('startBtn').disabled=false;}
};
$("nextBtn").onclick=()=>{if(state.index===26)openReview();else{state.index++;renderQuestion()}};
$("backBtn").onclick=()=>{if(state.index>0){state.index--;renderQuestion()}};
$("navigatorBtn").onclick=openNavigator;$("closeNavigator").onclick=renderQuestion;
$("markBtn").onclick=()=>{let n=q().n;state.marked[state.module][n]=!state.marked[state.module][n];renderQuestion()};
$("submitModuleBtn").onclick=()=>{if(state.module===1){state.completedModules=[1];state.module=2;state.index=0;renderQuestion();startTimer()}else finishTest()};
$("restartBtn").onclick=()=>location.reload();

let teacherKey=null, teacherAttempts=[];
function openTeacher(){
 clearInterval(state.timerId);show('teacherScreen');
 $('teacherLogin').classList.remove('hidden');$('teacherDash').classList.add('hidden');
}
$('teacherLink').onclick=e=>{e.preventDefault();openTeacher();};
$('teacherLoginBtn').onclick=async()=>{
 $('teacherLoginBtn').disabled=true;$('teacherError').textContent='';
 try{
  await window.SAT_API.signIn($('teacherCode').value);
  $('teacherCode').value='';await renderTeacher();
  $('teacherLogin').classList.add('hidden');$('teacherDash').classList.remove('hidden');
  teacherInk.unlock();$('exitTeacher').textContent='Return to test';
 }catch(error){$('teacherError').textContent=error.message;}
 finally{$('teacherLoginBtn').disabled=false;}
};
$('exitTeacher').onclick=()=>{if(state.name){renderQuestion();startTimer();}else show('startScreen');};
async function renderTeacher(){
 const [keyData,attemptData]=await Promise.all([window.SAT_API.teacher('key'),window.SAT_API.teacher('attempts')]);
 teacherKey=keyData.answers;teacherAttempts=attemptData.attempts;
 $('answerKeyEditor').innerHTML='';$('analysisBox').innerHTML='';
 [1,2].forEach(mod=>{
  const h=document.createElement('h4');h.textContent=`Module ${mod}`;$('answerKeyEditor').appendChild(h);
  QUESTIONS[mod].forEach(item=>{
   const row=document.createElement('div');row.className='answer-edit';
   row.innerHTML=`<strong>Q${item.n}</strong><select aria-label="Module ${mod} question ${item.n} correct answer" data-k="m${mod}q${item.n}"><option value="">—</option>${['A','B','C','D'].map(x=>`<option ${teacherKey[`m${mod}q${item.n}`]===x?'selected':''}>${x}</option>`).join('')}</select><input aria-label="Skill" value="${escapeHtml(item.skill)}" disabled>`;
   $('answerKeyEditor').appendChild(row);
  });
 });
 $('attemptRows').innerHTML=teacherAttempts.map(a=>`<tr><td>${escapeHtml(a.name)}</td><td>${escapeHtml(new Date(a.date).toLocaleString())}</td><td>${a.correct}/${a.total}</td><td>${Math.round(a.correct/a.total*100)}%</td><td>Select below</td></tr>`).join('');
 $('attemptSelect').innerHTML='<option value="">Select attempt</option>'+teacherAttempts.map(a=>`<option value="${escapeHtml(a.id)}">${escapeHtml(a.name)} — ${escapeHtml(new Date(a.date).toLocaleString())}</option>`).join('');
}
$('saveKeyBtn').onclick=async()=>{
 const answers={};document.querySelectorAll('[data-k]').forEach(s=>answers[s.dataset.k]=s.value);
 $('saveKeyBtn').disabled=true;
 try{await window.SAT_API.teacher('key','PUT',{answers});await renderTeacher();alert('Answer key saved securely. Submitted attempts have been regraded.');}
 catch(error){alert(error.message);}finally{$('saveKeyBtn').disabled=false;}
};
$('attemptSelect').onchange=()=>{
 const attempt=teacherAttempts.find(a=>a.id===$('attemptSelect').value);
 if(!attempt||!teacherKey){$('analysisBox').innerHTML='';return;}
 const skills={};
 [1,2].forEach(mod=>QUESTIONS[mod].forEach(item=>{
  const correct=attempt.modules.find(m=>m.number===mod).questions.find(q=>q.number===item.n).status==='Correct';
  skills[item.skill]??={c:0,t:0};skills[item.skill].t++;if(correct)skills[item.skill].c++;
 }));
 $('analysisBox').innerHTML=`<h4>${escapeHtml(attempt.name)}</h4>`+Object.entries(skills).map(([skill,v])=>`<div class="result-row"><span>${escapeHtml(skill)}</span><strong>${v.c}/${v.t}</strong></div>`).join('')+
 [1,2].map(mod=>`<h4>Module ${mod}</h4>`+QUESTIONS[mod].map(item=>`<details class="card"><summary>Question ${item.n} · ${escapeHtml(attempt.modules.find(m=>m.number===mod).questions.find(q=>q.number===item.n).status)}</summary><p>Student response: ${escapeHtml(attempt.answers[mod]?.[item.n]||'Unanswered')} · Correct answer: ${escapeHtml(teacherKey[`m${mod}q${item.n}`])}</p>${questionImages(item)}<div>${item.passage}</div><p>${item.prompt}</p>${item.choices.map((choice,i)=>`<p>${'ABCD'[i]}. ${choice}</p>`).join('')}</details>`).join('')).join('');
};
$('issueAccessBtn').onclick=async()=>{
 const name=$('accessStudentName').value.trim();
 try{const invite=await window.SAT_API.teacher('invitations','POST',{name});$('issuedAccessCode').value=invite.code;$('accessCodeNotice').textContent=`One submission for ${invite.name} · expires ${new Date(invite.expires).toLocaleDateString()}. Copy and share this code privately.`;}
 catch(error){$('accessCodeNotice').textContent=error.message;}
};
$('importAttemptsBtn').onclick=async()=>{
 $('importAttemptsBtn').disabled=true;
 try{
  const local=readSaved('attempts',[]);let imported=0;
  for(const attempt of local){
   if(attempt.serverId)continue;
   const record=await window.SAT_API.teacher('import','POST',{id:attempt.id,name:attempt.name,date:attempt.date,answers:attempt.answers});
   attempt.serverId=record.id;imported++;
   localStorage.setItem(storagePrefix+'attempts',JSON.stringify(local));
  }
  await renderTeacher();alert(`${imported} earlier attempts imported and graded securely.`);
 }catch(error){alert(error.message);}finally{$('importAttemptsBtn').disabled=false;}
};
$('teacherLogoutBtn').onclick=()=>window.SAT_API.signOut().catch(error=>alert(error.message));
const teacherInk = window.createSATTeacherInk();

document.title = `Authentic SAT Practice Suites | ${TEST.name}`;
document.querySelector('.hero h1').textContent = 'Authentic SAT Practice Suites';
document.querySelector('footer').textContent = `© HuskyDaddy | SAT ${TEST.name}`;
$('testName').value = TEST.name;
window.SAT_API.onExpire(()=>{
 teacherKey=null;teacherAttempts=[];teacherInk.lock();
 for(const id of ['answerKeyEditor','attemptRows','attemptSelect','analysisBox'])$(id).innerHTML='';
 $('issuedAccessCode').value='';$('teacherDash').classList.add('hidden');$('teacherLogin').classList.remove('hidden');
});
$('keyNotice').textContent='Teacher access only. Keys and grading are stored on the secure service.';
$('keyStatus').textContent=window.SAT_API.configured?'Use the test access code issued by your teacher. Results show raw accuracy only.':'Secure grading needs setup. Saved responses are preserved; submission is unavailable until configured.';
$('testSelector').value = TEST.id;
$('testSelector').onchange = () => { saveProgress(); location.assign(`?test=${$('testSelector').value}`); };
const progress = readSaved('progress', null);
if (progress?.testId === TEST.id && progress.name) {
 $('resumeBtn').hidden = false;
 $('resumeBtn').textContent = `Resume ${progress.name} · Module ${progress.module}, Question ${progress.index + 1}`;
 $('resumeBtn').onclick = async () => {
  if(!window.SAT_API.hasAccessCode()&&$('studentAccessCode').value)window.SAT_API.setAccessCode($('studentAccessCode').value);
  if(window.SAT_API.configured){try{const access=await window.SAT_API.student('start');if(access.submitted){location.assign(new URL(`august-2026/results.html?test=${TEST.id}&attempt=${access.id}`,window.SAT_ROOT).href);return;}}catch(error){alert(error.message);return;}}
  for(const k of ['name','module','index','seconds','answers','marked','crossed','startTime'])if(progress[k]!==undefined)state[k]=progress[k];
  state.completedModules=state.module===2?[1]:[];state.timerId=null;
  if(progress.screen==='reviewScreen') openReview();
  else {renderQuestion();startTimer();}
 };
}
if (new URLSearchParams(location.search).get('view') === 'teacher' || document.body.dataset.view === 'teacher') openTeacher();
