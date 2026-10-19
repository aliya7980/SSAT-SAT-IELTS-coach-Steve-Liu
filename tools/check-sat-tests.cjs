const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../pages/SAT');
const ids=['august2026','september2026-practice1'];
const configs={};for(const id of ids){const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data',id+'.js'),'utf8'),c);configs[id]=c.window.SAT_TESTS[id];const test=configs[id];assert.equal(test.id,id);for(const m of [1,2]){assert.equal(test.questions[m].length,27);test.questions[m].forEach((q,i)=>{assert.equal(q.n,i+1);assert(q.passage&&q.prompt);assert.equal(q.choices.length,4);for(const img of q.images||[])assert(fs.existsSync(path.join(root,'august-2026',img.src)),img.src);});}for(const [k,a]of Object.entries(test.answerKey)){assert(/^m[12]q([1-9]|1[0-9]|2[0-7])$/.test(k));assert(/^[ABCD]$/.test(a));}}
assert.equal(Object.keys(configs.august2026.answerKey).length,54);assert.equal(Object.keys(configs['september2026-practice1'].answerKey).length,0);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/september2026-practice1/visual-manifest.json')));assert.equal(manifest.length,5);for(const row of manifest){const q=configs['september2026-practice1'].questions[row.module][row.questionNumber-1];assert(q.images.some(img=>img.src===row.imageFilename));assert.equal(q.source.pdfPageNumber,row.sourcePdfPageNumber);assert.equal(row.sourcePdfPageIndex,row.sourcePdfPageNumber-1);}
const memory={hd_sat_key:JSON.stringify({'m1q1':'A'}),hd_sat_attempts:'[]'};
function context(id,search=''){
 const elements={};function el(name){return elements[name]??={value:'missed',innerHTML:'',textContent:'',hidden:true,options:[{}],dataset:{},style:{},classList:{add(){},remove(){}},appendChild(){},addEventListener(){},querySelector(){return {addEventListener(){}};}};}
 const c={window:{SAT_ACTIVE_TEST:configs[id],SAT_ROOT:new URL('http://localhost/pages/SAT/'),SAT_ASSET_BASE:new URL('http://localhost/pages/SAT/august-2026/'),print(){}},document:{body:{dataset:{}},getElementById:el,querySelector:el,querySelectorAll:()=>[],createElement:()=>el('created'+Math.random())},localStorage:{getItem:k=>memory[k]??null,setItem:(k,v)=>memory[k]=v,removeItem:k=>delete memory[k]},location:{search,assign:url=>c.destination=url},URL,URLSearchParams,clearInterval(){},setInterval(){return 1;},alert(){},console};vm.createContext(c);return {c,elements};
}
const engine=fs.readFileSync(path.join(root,'shared/test.js'),'utf8'),review=fs.readFileSync(path.join(root,'shared/results.js'),'utf8');
for(const id of ids){
 const {c,elements}=context(id);vm.runInContext(engine,c);
 vm.runInContext(`state.name='Student';state.answers={1:{},2:{}};[1,2].forEach(m=>QUESTIONS[m].forEach(q=>state.answers[m][q.n]=getKey()['m'+m+'q'+q.n]||'B'));state.answers[1][1]='B';delete state.answers[2][27];renderQuestion();`,c);
 assert(memory[`hd_sat_${id}_progress`]);assert.equal(JSON.parse(memory[`hd_sat_${id}_progress`]).testId,id);
 vm.runInContext('finishTest()',c);assert(!memory[`hd_sat_${id}_progress`]);assert(c.destination.includes('test='+id));
 const attempt=JSON.parse(memory[`hd_sat_${id}_attempts`])[0];assert.equal(attempt.testId,id);assert.equal(attempt.totalKnown,id==='august2026'?54:0);if(id==='august2026')assert.equal(attempt.correct,52);
 c.location.search=new URL(c.destination).search;vm.runInContext(review,c);assert(elements.questionReview.innerHTML.includes('Question 27'));
 if(id==='august2026'){assert(elements.resultSummary.innerHTML.includes('52 / 54'));assert.equal((elements.questionReview.innerHTML.match(/<details /g)||[]).length,2);}
 else {assert(elements.resultSummary.innerHTML.includes('Answer key pending'));assert(!elements.questionReview.innerHTML.includes(' · Correct answer'));}
 elements.reviewFilter.value='all';elements.reviewFilter.onchange();assert.equal((elements.questionReview.innerHTML.match(/<details /g)||[]).length,54);
 console.log(id+': data, submit, results, pending keys, and filters passed');
}
assert.equal(JSON.parse(memory.hd_sat_august2026_attempts).length,1);assert.equal(JSON.parse(memory['hd_sat_september2026-practice1_attempts']).length,1);
// A key added later grades the previously unscored September responses.
const id=ids[1];memory[`hd_sat_${id}_key`]=JSON.stringify({m1q2:'B'});const {c,elements}=context(id);vm.runInContext(review,c);assert(elements.resultSummary.innerHTML.includes('1 / 1'));assert(elements.resultSummary.innerHTML.includes('53 awaiting key'));
// Resume preserves answers, timer, and test identity.
const resume=context(id);vm.runInContext(engine,resume.c);vm.runInContext(`state.name='Resume';state.module=2;state.index=8;state.seconds[2]=123;state.answers[2][9]='D';saveProgress();`,resume.c);const resumed=context(id);vm.runInContext(engine,resumed.c);resumed.elements.resumeBtn.onclick();assert.equal(vm.runInContext('state.seconds[2]',resumed.c),123);assert.equal(vm.runInContext('state.answers[2][9]',resumed.c),'D');
console.log('Cross-test isolation, legacy August migration, later-key scoring, resume, and five visual mappings passed.');
