'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../pages/SAT');
const ids=fs.readdirSync(path.join(root,'data')).filter(id=>fs.existsSync(path.join(root,'data',id,'metadata.json')));
const configs={};
function noKeys(value){if(Array.isArray(value))value.forEach(noKeys);else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value)){assert(!['answerKey','correctAnswer','explanation'].includes(k),'Leaked private field '+k);noKeys(v);}}
for(const id of ids){
 const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data',id+'.js'),'utf8'),c);const test=configs[id]=c.window.SAT_TESTS[id];noKeys(test);
 for(const m of [1,2]){assert.equal(test.questions[m].length,27);test.questions[m].forEach((q,i)=>{assert.equal(q.n,i+1);assert(q.passage&&q.prompt);assert.equal(q.choices.length,4);for(const img of q.images||[])assert(fs.existsSync(path.join(root,'august-2026',img.src)));});}
 assert(!fs.existsSync(path.join(root,'data',id,'answer-key.json')));
}
const memory={};
function context(id){
 const elements={};const el=name=>elements[name]??={value:'all',innerHTML:'',textContent:'',hidden:true,disabled:false,options:[{}],dataset:{},style:{},classList:{add(){},remove(){}},appendChild(){},addEventListener(){},querySelector(){return {addEventListener(){}};}};
 let signed=false;let result;
 const safeResult=()=>({id:'attempt-'+id,testId:id,name:'Student',date:new Date().toISOString(),correct:0,total:54,modules:[1,2].map(number=>({number,correct:0,total:27,questions:Array.from({length:27},(_,i)=>({number:i+1,status:i===26?'Unanswered':'Incorrect'}))}))});
 const api={configured:true,setAccessCode(){},hasAccessCode:()=>true,onExpire(fn){this.expire=fn;},async student(action,payload){if(action==='start')return {id:'attempt-'+id,name:'Student',submitted:false};if(action==='submit'){assert.deepEqual(payload.completedModules,[1,2]);result=safeResult();return result;}return result||safeResult();},async signIn(password){if(password!=='server-test-password')throw Error('Invalid credentials.');signed=true;},async signOut(){signed=false;api.expire();},async teacher(action){if(!signed)throw Error('Teacher sign-in required.');return action==='key'?{answers:Object.fromEntries([1,2].flatMap(m=>Array.from({length:27},(_,i)=>[`m${m}q${i+1}`,'B'])))}:{attempts:[]};}};
 const c={window:{SAT_API:api,createSATTeacherInk:()=>({unlock(){c.inkUnlocked=true;},lock(){c.inkUnlocked=false;},render(key){c.inkQuestion=key;}}),SAT_ACTIVE_TEST:configs[id],SAT_ROOT:new URL('http://localhost/pages/SAT/'),SAT_ASSET_BASE:new URL('http://localhost/pages/SAT/august-2026/'),print(){}},document:{body:{dataset:{}},getElementById:el,querySelector:el,querySelectorAll:()=>[],createElement:()=>el('new'+Math.random())},localStorage:{getItem:k=>memory[k]??null,setItem:(k,v)=>memory[k]=v,removeItem:k=>delete memory[k]},location:{search:'',assign:url=>c.destination=url},URL,URLSearchParams,clearInterval(){},setInterval(){return 1;},alert(message){c.lastAlert=message;},console};
 vm.createContext(c);return {c,elements,api,el};
}
(async()=>{
 const engine=fs.readFileSync(path.join(root,'shared/test.js'),'utf8'),review=fs.readFileSync(path.join(root,'shared/results.js'),'utf8');
 for(const id of ids){
  const {c,elements,api,el}=context(id);vm.runInContext(engine,c);
  assert.equal(c.document.querySelector('.hero h1').textContent,'Authentic SAT Practice Suites');
  el('studentName').value='Student';el('studentAccessCode').value='issued-code';await elements.startBtn.onclick();assert.equal(c.inkQuestion,`${id}:m1q1`);
  vm.runInContext("state.answers[1][1]='B';saveProgress();",c);assert(JSON.parse(memory[`hd_sat_${id}_progress`]).answers[1][1]==='B');
  elements.nextBtn.onclick();assert.equal(c.inkQuestion,`${id}:m1q2`);elements.backBtn.onclick();assert.equal(c.inkQuestion,`${id}:m1q1`);
  el('teacherCode').value='1201';await elements.teacherLoginBtn.onclick();assert(!c.inkUnlocked);
  el('teacherCode').value='server-test-password';await elements.teacherLoginBtn.onclick();assert(c.inkUnlocked);elements.exitTeacher.onclick();
  await api.signOut();assert(!c.inkUnlocked);assert.equal(elements.answerKeyEditor.innerHTML,'');
  elements.submitModuleBtn.onclick();assert.equal(vm.runInContext('state.module',c),2);
  vm.runInContext("state.answers[2][1]='C';saveProgress();",c);await vm.runInContext('finishTest()',c);
  assert(c.destination.includes('attempt=attempt-'+id));assert(!memory[`hd_sat_${id}_progress`]);
  const attempt=JSON.parse(memory[`hd_sat_${id}_attempts`])[0];noKeys(attempt);assert(!attempt.questions);assert.equal(attempt.answers[2][1],'C');
  c.location.search=new URL(c.destination).search;await vm.runInContext(review,c);
  assert(elements.resultSummary.innerHTML.includes('out of 54 correct'));assert(elements.questionReview.innerHTML.includes('Module 1'));assert(elements.questionReview.innerHTML.includes('Module 2'));assert.equal((elements.questionReview.innerHTML.match(/class="result-question /g)||[]).length,54);assert(elements.questionReview.innerHTML.includes('Unanswered'));
  assert(!/Correct answer:|right-choice|Awaiting answer key|Your answer:/.test(elements.questionReview.innerHTML));
  // Rejected submissions preserve responses and stay on the page.
  const retry=context(id);vm.runInContext(engine,retry.c);retry.api.student=async()=>{throw Error('Service unavailable.');};
  vm.runInContext("state.name='Retry';state.module=2;state.answers[1][3]='D';",retry.c);await vm.runInContext('finishTest()',retry.c);
  assert(!retry.c.destination);assert(JSON.parse(memory[`hd_sat_${id}_progress`]).answers[1][3]==='D');assert.equal(retry.el('submitModuleBtn').disabled,false);
  const resumed=context(id);vm.runInContext(engine,resumed.c);await resumed.elements.resumeBtn.onclick();assert.equal(vm.runInContext('state.answers[1][3]',resumed.c),'D');
  console.log(id+': public question data, start, navigation, submission, student results, teacher authentication/lock, saved responses, failure/retry, and resume passed.');
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
