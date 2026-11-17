(() => {
  'use strict';
  const P = DetailsPractice, store = 'hd_sat_special_details_grade_v1';
  const input = document.getElementById('report');
  const valid = x => x && x.type === 'details-grade-report' && x.schemaVersion === 1 && x.testId === P.ID && typeof x.studentName === 'string' && typeof x.attemptId === 'string' && x.total === 34 && [x.correct,x.answered,x.unanswered].every(Number.isInteger) && x.correct >= 0 && x.correct <= x.answered && x.answered <= 34 && x.unanswered >= 0 && x.answered + x.unanswered === 34 && Number.isFinite(Date.parse(x.submittedAt)) && Number.isFinite(Date.parse(x.gradedAt));
  function show(x) {
    if (!valid(x)) throw Error('This is not a valid Details grade report.');
    if (x.attemptId !== P.state.attemptId || x.studentName !== P.state.studentName) throw Error('This report belongs to a different student or practice attempt. Restore that response file on the practice home page first.');
    document.getElementById('finalStudent').textContent = x.studentName;
    document.getElementById('finalDates').textContent = 'Submitted: ' + new Date(x.submittedAt).toLocaleString() + ' · Graded: ' + new Date(x.gradedAt).toLocaleString();
    P.meta(document.getElementById('finalStats'), [['Correct', x.correct + ' / 34'], ['Accuracy', Math.round(x.correct/34*100) + '%'], ['Incorrect', x.answered-x.correct], ['Unanswered', x.unanswered]]);
    document.getElementById('finalResults').hidden = false;
    document.getElementById('pendingGrade').hidden = true;
  }
  P.readFile(input, x => {
    show(x);
    // Store only grade totals and identity: never retain an answer key or item feedback.
    const clean = Object.fromEntries(['type','schemaVersion','testId','attemptId','studentName','total','correct','answered','unanswered','submittedAt','gradedAt'].map(k=>[k,x[k]]));
    try { localStorage.setItem(store, JSON.stringify(clean)); } catch {}
  });
  try { const saved=JSON.parse(localStorage.getItem(store)); if(saved)show(saved); } catch {}
  document.getElementById('printResults').addEventListener('click',()=>window.print());
})();
