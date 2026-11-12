const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../pages/SAT/shared/api-client.js'),'utf8');
function storage(entries={}){const store={...entries};Object.defineProperties(store,{getItem:{value:k=>store[k]??null},setItem:{value:(k,v)=>store[k]=String(v)},removeItem:{value:k=>delete store[k]}});return store;}
(async()=>{
 const local=storage({hd_sat_key:'legacy-key-must-disappear',hd_sat_august2026_key:'legacy-key-must-disappear',hd_sat_august2026_attempts:JSON.stringify([{id:1,name:'Old student',answers:{1:{1:'B'},2:{}},answerKey:{private:'legacy'},questions:{private:'snapshot'},correct:12}]),hd_sat_august2026_progress:JSON.stringify({answers:{1:{3:'C'}}})});
 const session=storage(),events={};let nextFetch;
 const c={window:{SAT_API_BASE:'https://grading.example',SAT_ACTIVE_TEST:{id:'august2026'},addEventListener:(name,fn)=>events[name]=fn},localStorage:local,sessionStorage:session,location:{href:'https://www.huskydaddy.com/pages/SAT/'},URL,setTimeout:()=>1,clearTimeout(){},fetch:async(url,opts)=>{if(nextFetch)return nextFetch(url,opts);if(url.endsWith('/login'))return {ok:true,json:async()=>({token:'memory-only-secret',expires:Date.now()+3600e3})};return {ok:true,json:async()=>({answers:{synthetic:'teacher-only'}})};}};
 vm.runInNewContext(source,c);const api=c.window.SAT_API;
 assert(!local.hd_sat_key);assert(!local.hd_sat_august2026_key);
 const old=JSON.parse(local.hd_sat_august2026_attempts)[0];assert.equal(old.answers[1][1],'B');assert(!old.answerKey);assert(!old.questions);assert.equal(JSON.parse(local.hd_sat_august2026_progress).answers[1][3],'C');
 await assert.rejects(api.teacher('key'),/sign-in/);
 await api.signIn('never-store-password');const result=await api.teacher('key');assert.equal(result.answers.synthetic,'teacher-only');
 assert(!JSON.stringify(local).includes('teacher-only'));assert(!JSON.stringify(local).includes('memory-only'));assert(!JSON.stringify(session).includes('memory-only'));
 api.setAccessCode(' student-invitation ');assert.equal(session.hd_sat_august2026_access,'student-invitation');
 let expired=false;api.onExpire(()=>expired=true);events.pagehide();assert(expired);await assert.rejects(api.teacher('key'),/sign-in/);
 // An authenticated request completing after logout must not repopulate teacher data.
 await api.signIn('never-store-password');let resolve;
 nextFetch=()=>new Promise(r=>resolve=r);const pending=api.teacher('key');events.pagehide();resolve({ok:true,json:async()=>({answers:{synthetic:'teacher-only'}})});await assert.rejects(pending,/session ended/);
 console.log('Legacy key cleanup preserves student responses; teacher credentials/keys remain memory-only; page exit and stale-response protection passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
