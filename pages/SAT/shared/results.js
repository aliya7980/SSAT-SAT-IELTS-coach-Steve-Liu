(async () => {
 const TEST=window.SAT_ACTIVE_TEST,$=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 document.title=`Your results | ${TEST.name}`;
 $('resultsTestName').textContent=TEST.name;
 $('newTestLink').href=`index.html?test=${TEST.id}`;
 $('teacherReviewLink').href=`teacher.html?test=${TEST.id}`;
 async function load(){
  $('resultSummary').textContent='Loading your results…';$('questionReview').innerHTML='';$('reviewControls').hidden=true;
  try{
   if(!window.SAT_API.hasAccessCode())throw Error('Enter the test access code your teacher issued to view your submitted result.');
   const result=await window.SAT_API.student('result');
   const requested=new URLSearchParams(location.search).get('attempt');
   if(requested&&requested!==result.id)throw Error('This access code belongs to a different attempt. Enter the matching code to view that result.');
   if(result.testId!==TEST.id)throw Error('This result belongs to a different test.');
   $('resultAccess').hidden=true;
   $('studentDetails').textContent=`${result.name} · ${new Date(result.date).toLocaleDateString()}`;
   $('resultSummary').innerHTML=`<div class="results-count"><strong>${result.correct}</strong><span>out of ${result.total} correct</span></div><p class="results-accuracy">${(result.correct/result.total*100).toFixed(1)}% accuracy</p><p>Reading and Writing · Both modules completed</p>`;
   $('reviewControls').hidden=false;
   function render(){
    const missed=$('reviewFilter').value==='missed';
    $('questionReview').innerHTML=result.modules.map(module=>{
     const rows=module.questions.filter(q=>!missed||q.status!=='Correct');
     return `<section class="results-module" aria-labelledby="module-${module.number}"><div class="results-module-heading"><h2 id="module-${module.number}">Module ${module.number}</h2><p><strong>${module.correct} / ${module.total}</strong> correct</p></div>`+
      (rows.length?`<ol class="results-question-grid" aria-label="Module ${module.number} question results">${rows.map(q=>`<li class="result-question ${q.status==='Correct'?'is-correct':'is-incorrect'}"><span class="result-icon" aria-hidden="true">${q.status==='Correct'?'✓':'×'}</span><span class="result-number">Question ${q.number}</span><span class="result-status">${esc(q.status)}</span></li>`).join('')}</ol>`:'<p class="results-empty">All questions in this module were answered correctly.</p>')+'</section>';
    }).join('');
   }
   $('reviewFilter').onchange=render;render();
  }catch(error){$('resultSummary').textContent=error.message;$('resultAccess').hidden=false;}
 }
 $('resultAccessForm').onsubmit=async event=>{event.preventDefault();window.SAT_API.setAccessCode($('resultAccessCode').value);$('resultAccessCode').value='';await load();};
 $('printResults').onclick=()=>window.print();
 await load();
})();
