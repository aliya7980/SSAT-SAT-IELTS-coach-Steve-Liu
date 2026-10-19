
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
  ['key', 'attempts'].forEach(kind => {
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

const state={module:1,index:0,name:"",answers:{1:{},2:{}},marked:{1:{},2:{}},crossed:{1:{},2:{}},seconds:{1:1920,2:1920},timerId:null,startTime:null};
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
 renderTimer()
}
function openNavigator(){show("navigatorScreen");$("navigatorTitle").textContent=`Reading and Writing · Module ${state.module} Navigator`;$("navigatorGrid").innerHTML="";QUESTIONS[state.module].forEach((item,i)=>{let b=document.createElement("button");b.className="navnum";if(state.answers[state.module][item.n])b.classList.add("answered");if(i===state.index)b.classList.add("current");if(state.marked[state.module][item.n])b.classList.add("marked");b.textContent=item.n;b.onclick=()=>{state.index=i;renderQuestion()};$("navigatorGrid").appendChild(b)})}
function openReview(){show("reviewScreen");clearInterval(state.timerId);$("reviewTitle").textContent=`Reading and Writing · Module ${state.module} Review`;let a=Object.keys(state.answers[state.module]).length,m=Object.keys(state.marked[state.module]).filter(k=>state.marked[state.module][k]).length;$("reviewStats").innerHTML=`Answered: <strong>${a}</strong> &nbsp; Unanswered: <strong>${27-a}</strong> &nbsp; Marked: <strong>${m}</strong>`;$("reviewGrid").innerHTML="";QUESTIONS[state.module].forEach((item,i)=>{let b=document.createElement("button");b.textContent=item.n;if(state.answers[state.module][item.n])b.classList.add("answered");if(state.marked[state.module][item.n])b.classList.add("marked");b.onclick=()=>{state.index=i;renderQuestion();startTimer()};$("reviewGrid").appendChild(b)});$("submitModuleBtn").textContent=state.module===1?"Submit Module 1 and Continue":"Submit Test";saveProgress()}
function getKey() { return {...TEST.answerKey, ...readSaved('key', {})}; }
function scoreAttempt(attempt) {
 const key=getKey();let correct=0,totalKnown=0;
 [1,2].forEach(mod=>QUESTIONS[mod].forEach(q=>{const answer=key[`m${mod}q${q.n}`];if(answer){totalKnown++;if(attempt.answers?.[mod]?.[q.n]===answer)correct++;}}));
 return {correct,totalKnown,accuracy:totalKnown?((correct/totalKnown)*100).toFixed(1):'—'};
}

function finishTest() {
  clearInterval(state.timerId);
  const key = getKey();
  let correct = 0, totalKnown = 0;
  [1, 2].forEach(mod => QUESTIONS[mod].forEach(item => {
    if (key[`m${mod}q${item.n}`]) {
      totalKnown++;
      if (state.answers[mod][item.n] === key[`m${mod}q${item.n}`]) correct++;
    }
  }));
  const attempt = {
    id: Date.now(), testId: TEST.id, testName: TEST.name, name: state.name, date: new Date().toLocaleString(),
    answers: JSON.parse(JSON.stringify(state.answers)),
    questions: QUESTIONS, answerKey: key,
    correct, incorrect: totalKnown - correct, totalKnown,
    accuracy: totalKnown ? ((correct / totalKnown) * 100).toFixed(1) : "—",
    secondsUsed: {1: 1920 - state.seconds[1], 2: 1920 - state.seconds[2]}
  };
  const attempts = readSaved('attempts', []);
  attempts.unshift(attempt);
  localStorage.setItem(storagePrefix + "attempts", JSON.stringify(attempts));
  localStorage.removeItem(storagePrefix + 'progress');
  location.assign(new URL(`august-2026/results.html?test=${TEST.id}&attempt=${attempt.id}`, window.SAT_ROOT).href);
}
$("startBtn").onclick=()=>{let n=$("studentName").value.trim();if(!n){alert("Please enter the student name.");return}state.name=n;state.module=1;state.index=0;state.seconds={1:1920,2:1920};state.answers={1:{},2:{}};state.marked={1:{},2:{}};state.crossed={1:{},2:{}};renderQuestion();startTimer()};
$("nextBtn").onclick=()=>{if(state.index===26)openReview();else{state.index++;renderQuestion()}};
$("backBtn").onclick=()=>{if(state.index>0){state.index--;renderQuestion()}};
$("navigatorBtn").onclick=openNavigator;$("closeNavigator").onclick=renderQuestion;
$("markBtn").onclick=()=>{let n=q().n;state.marked[state.module][n]=!state.marked[state.module][n];renderQuestion()};
$("submitModuleBtn").onclick=()=>{if(state.module===1){state.module=2;state.index=0;renderQuestion();startTimer()}else finishTest()};
$("restartBtn").onclick=()=>location.reload();

function openTeacher(){show("teacherScreen");$("teacherLogin").classList.remove("hidden");$("teacherDash").classList.add("hidden")}
$("teacherLink").onclick=e=>{e.preventDefault();openTeacher()};
$("teacherLoginBtn").onclick=()=>{if($("teacherCode").value==="1201"){ $("teacherLogin").classList.add("hidden");$("teacherDash").classList.remove("hidden");renderTeacher()}else $("teacherError").textContent="Incorrect access code."};
$("exitTeacher").onclick=()=>{show("startScreen");$("teacherCode").value="";$("teacherError").textContent=""};
function renderTeacher(){
 let key=getKey();$("answerKeyEditor").innerHTML="";
 [1,2].forEach(mod=>{let h=document.createElement("h4");h.textContent=`Module ${mod}`;h.style.marginTop="12px";$("answerKeyEditor").appendChild(h);QUESTIONS[mod].forEach(item=>{let row=document.createElement("div");row.className="answer-edit";let opts='<option value="">—</option>'+["A","B","C","D"].map(x=>`<option ${key[`m${mod}q${item.n}`]===x?"selected":""}>${x}</option>`).join("");row.innerHTML=`<strong>Q${item.n}</strong><select aria-label="Module ${mod} question ${item.n} correct answer" data-k="m${mod}q${item.n}">${opts}</select><input aria-label="Module ${mod} question ${item.n} skill" value="${item.skill}" disabled>`;$("answerKeyEditor").appendChild(row)})});
 let attempts=readSaved('attempts', []);$("attemptRows").innerHTML=attempts.map(original=>{const a={...original,...scoreAttempt(original)};return `<tr><td>${escapeHtml(a.name)}</td><td>${a.date}</td><td>${a.totalKnown?a.correct+"/"+a.totalKnown:"Pending key"}</td><td>${a.totalKnown?a.accuracy+"%":"—"}</td><td><a href="${new URL(`august-2026/results.html?test=${TEST.id}&attempt=${a.id}`,window.SAT_ROOT).href}">Review</a></td></tr>`}).join("");$("attemptSelect").innerHTML='<option value="">Select attempt</option>'+attempts.map(a=>`<option value="${a.id}">${escapeHtml(a.name)} — ${a.date}</option>`).join("")
}
$("saveKeyBtn").onclick=()=>{let key={};document.querySelectorAll("[data-k]").forEach(s=>{if(s.value)key[s.dataset.k]=s.value});localStorage.setItem(storagePrefix + "key",JSON.stringify(key));alert("Answer key saved on this browser.");renderTeacher()};
$("attemptSelect").onchange=()=>{let id=Number($("attemptSelect").value),attempt=readSaved('attempts', []).find(a=>a.id===id);if(!attempt){$("analysisBox").innerHTML="";return}let key=getKey(),skills={};[1,2].forEach(mod=>QUESTIONS[mod].forEach(item=>{let k=key[`m${mod}q${item.n}`];if(!k)return;skills[item.skill]??={c:0,t:0};skills[item.skill].t++;if(attempt.answers?.[mod]?.[item.n]===k)skills[item.skill].c++}));let entries=Object.entries(skills).sort((a,b)=>(a[1].c/a[1].t)-(b[1].c/b[1].t));$("analysisBox").innerHTML=`<h4>${escapeHtml(attempt.name)}</h4>`+entries.map(([s,v])=>`<div class="result-row"><span>${s}</span><strong>${v.c}/${v.t} (${Math.round(v.c/v.t*100)}%)</strong></div>`).join("")+(entries.length?`<div class="notice" style="margin-top:16px">Priority review: <strong>${entries.slice(0,3).map(x=>x[0]).join(", ")}</strong>.</div>`:`<div class="notice">Enter the answer key first to generate the analysis.</div>`)}

document.title = `HuskyDaddy SAT Practice | ${TEST.name}`;
document.querySelector('.hero h1').textContent = `SAT Practice: ${TEST.name}`;
document.querySelector('footer').textContent = `© HuskyDaddy | SAT ${TEST.name}`;
$('testName').value = TEST.name;
$('keyNotice').textContent = Object.keys(TEST.answerKey).length ? 'The answer key is preloaded. You can edit the correct choices here.' : 'Answer key pending. Responses are saved, but unkeyed questions will not be graded.';
$('keyStatus').textContent = Object.keys(getKey()).length === 54 ? 'Answer key ready: results available after both modules.' : 'Answer key pending: your responses will be saved for review when the key is added.';
$('testSelector').value = TEST.id;
$('testSelector').onchange = () => { saveProgress(); location.assign(`?test=${$('testSelector').value}`); };
const progress = readSaved('progress', null);
if (progress?.testId === TEST.id && progress.name) {
 $('resumeBtn').hidden = false;
 $('resumeBtn').textContent = `Resume ${progress.name} · Module ${progress.module}, Question ${progress.index + 1}`;
 $('resumeBtn').onclick = () => {
  Object.assign(state,progress,{timerId:null});
  if(progress.screen==='reviewScreen') openReview();
  else {renderQuestion();startTimer();}
 };
}
if (new URLSearchParams(location.search).get('view') === 'teacher' || document.body.dataset.view === 'teacher') openTeacher();
