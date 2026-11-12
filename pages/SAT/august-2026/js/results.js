(() => {
  const $ = id => document.getElementById(id);
  // Render names and answers as text; question passages contain the test's own markup.
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let attempts;
  try { attempts = JSON.parse(localStorage.getItem('hd_sat_attempts') || '[]'); }
  catch { attempts = []; }
  const id = new URLSearchParams(location.search).get('attempt');
  const attempt = Array.isArray(attempts) ? (id ? attempts.find(item => String(item.id) === id) : attempts[0]) : null;
  if (!attempt?.questions || !attempt?.answerKey) {
    $('resultSummary').textContent = 'No completed test review is available here. Complete both modules on this browser to see your results.';
    return;
  }
  $('studentDetails').textContent = `${attempt.name} · ${attempt.date}`;
  const modules = [1, 2].map(mod => ({mod, rows: attempt.questions[mod].map(question => {
    const selected = attempt.answers?.[mod]?.[question.n];
    const answer = attempt.answerKey[`m${mod}q${question.n}`];
    return {question, selected, answer, correct: selected === answer, status: !selected ? 'Unanswered' : selected === answer ? 'Correct' : 'Incorrect'};
  })}));
  const rows = modules.flatMap(module => module.rows);
  const correct = rows.filter(row => row.correct).length;
  const unanswered = rows.filter(row => !row.selected).length;
  $('resultSummary').innerHTML = `<div class="score">${correct} / ${rows.length}</div><p>${(correct / rows.length * 100).toFixed(1)}% accuracy · ${rows.length - correct - unanswered} incorrect · ${unanswered} unanswered</p>`;
  $('reviewControls').hidden = false;
  function render() {
    const missedOnly = $('reviewFilter').value === 'missed';
    $('questionReview').innerHTML = modules.map(({mod, rows}) => {
      const visible = missedOnly ? rows.filter(row => !row.correct) : rows;
      return `<section aria-label="Module ${mod} review"><h2 class="module-summary">Module ${mod} · ${rows.filter(row => row.correct).length} / ${rows.length}</h2>` +
        (visible.length ? visible.map(({question, selected, answer, correct, status}) => `<details class="card answer-review ${correct ? 'correct' : !selected ? 'unanswered' : ''}">
          <summary>Question ${question.n} · ${escape(status)} · ${escape(question.skill)}</summary>
          <p><strong>Your answer:</strong> ${escape(selected || 'Not answered')} &nbsp; <strong>Correct answer:</strong> ${escape(answer)}</p>
          <div class="passage">${question.passage}</div><p>${question.prompt}</p>
          ${question.choices.map((choice, i) => {const letter = 'ABCD'[i]; return `<div class="review-choice ${letter === answer ? 'right-choice' : letter === selected ? 'wrong-choice' : ''}"><span class="choice-label">${letter}${letter === answer ? ' · Correct answer' : ''}${letter === selected ? ' · Your answer' : ''}</span>${choice}</div>`;}).join('')}
          </details>`).join('') : '<p class="card">All answers in this module are correct.</p>') + '</section>';
    }).join('');
  }
  $('reviewFilter').onchange = render;
  $('printResults').onclick = () => {
    document.querySelectorAll('#questionReview details').forEach(detail => { detail.open = true; });
    window.print();
  };
  render();
})();
