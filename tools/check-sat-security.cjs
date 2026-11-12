'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createApp,passwordHash}=require('../sat-backend/app.cjs');
(async()=>{
 const ids=fs.readdirSync(path.join(__dirname,'../pages/SAT/data')).filter(id=>fs.existsSync(path.join(__dirname,'../pages/SAT/data',id,'metadata.json')));
 const seed=Object.fromEntries(ids.map(id=>[id,Object.fromEntries([1,2].flatMap(m=>Array.from({length:27},(_,n)=>[`m${m}q${n+1}`,'ABCD'[(n+m)%4]])))]));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sat-security-')),dbPath=path.join(dir,'test.sqlite');
 let clock=Date.now(),app;const password='Test-only unique password 9#';
 const digest=await passwordHash(password),config={dbPath,passwordDigest:digest,origins:['https://www.huskydaddy.com'],seed,now:()=>clock};
 app=createApp(config);
 let ip=0;
 async function call(route,{method='GET',data,token,origin='https://www.huskydaddy.com',address}={}){
  const res=await app.handle(new Request('https://grading.example'+route,{method,headers:{Origin:origin,...(data!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(data!==undefined?{body:JSON.stringify(data)}:{})}),{ip:address||String(++ip)});
  assert.equal(res.headers.get('cache-control'),'no-store, private');return {status:res.status,data:await res.json(),headers:res.headers};
 }
 for(const id of ids){
  assert.equal((await call(`/api/teacher/tests/${id}/key`)).status,401);
  assert.equal((await call(`/api/teacher/tests/${id}/attempts`)).status,401);
  assert.equal((await call(`/api/teacher/tests/${id}/key`,{method:'PUT',data:{answers:seed[id]}})).status,401);
  assert.equal((await call(`/api/teacher/tests/${id}/invitations`,{method:'POST',data:{name:'Student'}})).status,401);
 }
 assert.equal((await call('/api/teacher/login',{method:'POST',data:{password:'1201'}})).status,401,'Old public code must fail');
 assert.equal((await call('/api/teacher/login',{method:'POST',data:{password},origin:'https://evil.example'})).status,403);
 const login=await call('/api/teacher/login',{method:'POST',data:{password}});assert.equal(login.status,200);const token=login.data.token;
 for(const id of ids){
  const key=await call(`/api/teacher/tests/${id}/key`,{token});assert.deepEqual(key.data.answers,seed[id]);
  const invite=await call(`/api/teacher/tests/${id}/invitations`,{method:'POST',token,data:{name:'Test student'}});assert.equal(invite.status,201);
  const code=invite.data.code;const auth={testId:id,code};
  assert.equal((await call('/api/student/start',{method:'POST',data:auth})).status,200);
  assert.equal((await call('/api/student/submit',{method:'POST',data:{...auth,answers:{1:{},2:{}},completedModules:[1]}})).status,400);
  assert.equal((await call('/api/student/submit',{method:'POST',data:{...auth,answers:{1:{1:'E'},2:{}},completedModules:[1,2]}})).status,400);
  const answers={1:{},2:{}};for(const m of [1,2])for(let n=1;n<=27;n++)answers[m][n]=seed[id][`m${m}q${n}`];
  answers[1][1]=answers[1][1]==='A'?'B':'A';delete answers[2][27];
  const payload={...auth,answers,completedModules:[1,2]};
  const submission=await call('/api/student/submit',{method:'POST',data:payload});assert.equal(submission.status,201);
  const result=submission.data;assert.equal(result.correct,52);assert.equal(result.total,54);
  assert.equal(result.modules[0].correct,26);assert.equal(result.modules[1].correct,26);
  assert.equal(result.modules[0].questions[0].status,'Incorrect');assert.equal(result.modules[1].questions[26].status,'Unanswered');
  const text=JSON.stringify(result);for(const forbidden of ['answerKey','correctAnswer','explanation','"answers"','"selected"'])assert(!text.includes(forbidden));
  assert(result.modules.every(m=>m.questions.every(q=>['number','status'].length===Object.keys(q).length)));
  assert.equal((await call('/api/student/submit',{method:'POST',data:payload})).status,200,'Identical retry is idempotent');
  const modified=JSON.parse(JSON.stringify(payload));modified.answers[1][1]=seed[id].m1q1;
  assert.equal((await call('/api/student/submit',{method:'POST',data:modified})).status,409,'Repeated probing cannot regrade a changed response');
  const wrongTest=ids.find(x=>x!==id);
  assert.equal((await call('/api/student/result',{method:'POST',data:{testId:wrongTest,code}})).status,401);
  assert.equal((await call('/api/student/result',{method:'POST',data:{...auth,code:'unissued-code'}})).status,401);
  assert.equal((await call(`/api/teacher/tests/${id}/key`,{token:code})).status,401,'Student code is never teacher auth');
  assert.equal((await call(`/api/teacher/tests/${id}/key`,{token:token.slice(0,-1)+'!'})).status,401);
  assert.equal((await call(`/api/teacher/tests/${id}/import`,{method:'POST',data:{}})).status,401);
  const historical={id:'old-local-id',name:'Historical student',date:'2026-01-01T00:00:00Z',answers};
  const imported=await call(`/api/teacher/tests/${id}/import`,{method:'POST',token,data:historical});assert.equal(imported.status,201);
  const duplicate=await call(`/api/teacher/tests/${id}/import`,{method:'POST',token,data:historical});assert.equal(duplicate.data.id,imported.data.id);assert.equal(duplicate.data.imported,false);
  const review=await call(`/api/teacher/tests/${id}/attempts`,{token});assert.deepEqual(review.data.attempts[0].answers,answers);
  const changedKey={...seed[id],m1q1:answers[1][1]};assert.equal((await call(`/api/teacher/tests/${id}/key`,{method:'PUT',token,data:{answers:changedKey}})).status,200);
  const regraded=await call('/api/student/result',{method:'POST',data:auth});assert.equal(regraded.data.correct,53);
  // All-blank submission: every question is explicitly unanswered and counts against 54.
  const blankInvite=await call(`/api/teacher/tests/${id}/invitations`,{method:'POST',token,data:{name:'Blank attempt'}});
  const blank=await call('/api/student/submit',{method:'POST',data:{testId:id,code:blankInvite.data.code,answers:{1:{},2:{}},completedModules:[1,2]}});
  assert.equal(blank.data.correct,0);assert.equal(blank.data.total,54);assert(blank.data.modules.every(m=>m.questions.every(q=>q.status==='Unanswered')));
  console.log(id+': submission, both modules, unanswered, immutable retries, student privacy, teacher review, regrading, and unauthorized requests passed.');
 }
 // Persistence across a restart (keys and submitted responses stay on the private volume).
 app.close();app=createApp({...config,seed:{}});assert.equal((await call(`/api/teacher/tests/${ids[0]}/key`,{token})).status,200);
 assert.equal((await call('/api/teacher/logout',{method:'POST',token})).status,200);
 assert.equal((await call(`/api/teacher/tests/${ids[0]}/key`,{token})).status,401);
 const relog=await call('/api/teacher/login',{method:'POST',data:{password}});clock+=61*60e3;
 assert.equal((await call(`/api/teacher/tests/${ids[0]}/key`,{token:relog.data.token})).status,401,'Expired sessions cannot access keys');
 for(let n=0;n<8;n++)await call('/api/teacher/login',{method:'POST',data:{password:'wrong'},address:'rate-test'});
 assert.equal((await call('/api/teacher/login',{method:'POST',data:{password:'wrong'},address:'rate-test'})).status,429);
 app.close();fs.rmSync(dir,{recursive:true});console.log('Authentication expiry, logout, persistent database, login throttling, and CORS checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
