(() => {
  const TEST = window.SAT_ACTIVE_TEST;
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const prefix = `hd_sat_${TEST.id}_`;
  function read(kind, fallback) {
    try { return JSON.parse(localStorage.getItem(prefix+kind) || (TEST.id === 'august2026' ? localStorage.getItem('hd_sat_'+kind) : null) || 'null') ?? fallback; }
    catch { return fallback; }
  }
  document.title = `Answer Review | ${TEST.name}`;
  document.querySelector('h1').textContent = `${TEST.name} · Answer Review`;
  $('newTestLink').href = `index.html?test=${TEST.id}`;
  $('teacherReviewLink').href = `teacher.html?test=${TEST.id}`;
  const attempts=read('attempts',[]);
  const id=new URLSearchParams(location.search).get('attempt');
  const attempt=Array.isArray(attempts) ? (id ? attempts.find(a=>String(a.id)===id) : attempts[0]) : null;
  if (!attempt || (attempt.testId && attempt.testId !== TEST.id)) {
    $('resultSummary').textContent = 'No completed test review is available here. Complete both modules on this browser to see your results.';
    return;
  }
  $('studentDetails').textContent = `${attempt.name} · ${attempt.date}`;
  // Current keys also grade responses submitted while the September key was pending.
  const key={...attempt.answerKey,...TEST.answerKey,...read('key',{})};
  const questions=attempt.questions || TEST.questions;
  const modules=[1,2].map(mod=>({mod,rows:questions[mod].map(question=>{
    const selected=attempt.answers?.[mod]?.[question.n], answer=key[`m${mod}q${question.n}`];
    return {question,selected,answer,correct:Boolean(answer && selected===answer),status:!selected?'Unanswered':!answer?'Awaiting answer key':selected===answer?'Correct':'Incorrect'};
  })}));
  const rows=modules.flatMap(m=>m.rows),known=rows.filter(r=>r.answer).length,correct=rows.filter(r=>r.correct).length;
  const wrong=rows.filter(r=>r.answer && r.selected && !r.correct).length,unanswered=rows.filter(r=>!r.selected).length;
  $('resultSummary').innerHTML=known ? `<div class="score">${correct} / ${known}</div><p>${(correct/known*100).toFixed(1)}% accuracy on keyed questions · ${wrong} incorrect · ${unanswered} unanswered${known<rows.length?` · ${rows.length-known} awaiting key`:''}</p>` : `<h3>Answer key pending</h3><p>Your responses to both modules have been saved. ${rows.length-unanswered} answered · ${unanswered} unanswered. Return to this page after the answer key is added to see your score and corrections.</p>`;
  $('reviewControls').hidden=false;
  if(known<rows.length) {$('reviewFilter').value='all';$('reviewFilter').options[0].textContent='Incorrect, unanswered, or awaiting key';}
  function images(question) {
    return (question.images||[]).map(img=>`<figure class="question-visual"><a href="${escape(new URL(img.src,window.SAT_ASSET_BASE).href)}" target="_blank" rel="noopener"><img src="${escape(new URL(img.src,window.SAT_ASSET_BASE).href)}" alt="${escape(img.alt)}"></a><figcaption>Click the visual to enlarge.</figcaption></figure>`).join('');
  }
  function render() {
    const missedOnly=$('reviewFilter').value==='missed';
    $('questionReview').innerHTML=modules.map(({mod,rows})=>{
      const visible=missedOnly?rows.filter(r=>!r.correct):rows;
      const keyed=rows.filter(r=>r.answer).length;
      return `<section aria-label="Module ${mod} review"><h2 class="module-summary">Module ${mod} · ${keyed?`${rows.filter(r=>r.correct).length} / ${keyed}`:'Answer key pending'}</h2>`+(visible.length?visible.map(({question,selected,answer,correct,status})=>`<details class="card answer-review ${correct?'correct':!answer?'pending':!selected?'unanswered':''}"><summary>Question ${question.n} · ${escape(status)} · ${escape(question.skill)}</summary><p><strong>Your answer:</strong> ${escape(selected||'Not answered')} &nbsp; <strong>Correct answer:</strong> ${escape(answer||'Awaiting answer key')}</p><div class="passage">${images(question)}${question.passage}</div><p>${question.prompt}</p>${question.choices.map((choice,i)=>{const letter='ABCD'[i];return `<div class="review-choice ${letter===answer?'right-choice':answer&&letter===selected?'wrong-choice':''}"><span class="choice-label">${letter}${letter===answer?' · Correct answer':''}${letter===selected?' · Your answer':''}</span>${choice}</div>`;}).join('')}</details>`).join(''):'<p class="card">All answers in this module are correct.</p>')+'</section>';
    }).join('');
  }
  $('reviewFilter').onchange=render;
  $('printResults').onclick=()=>{document.querySelectorAll('#questionReview details').forEach(d=>d.open=true);window.print();};
  render();
})();
