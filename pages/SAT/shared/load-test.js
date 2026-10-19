(() => {
  const ownScript = document.currentScript;
  const root = new URL('../', ownScript.src);
  const id = new URLSearchParams(location.search).get('test') || ownScript.dataset.defaultTest || 'august2026';
  const known = ['august2026', 'september2026-practice1'];
  const showError = message => {
    const p = document.createElement('p');p.className='card';p.setAttribute('role','alert');p.textContent=message;
    document.querySelector('main').prepend(p);
  };
  if (!known.includes(id)) { showError('Unknown mock test. Return to Mock Tests to choose a test.'); return; }
  window.SAT_ROOT = root;
  window.SAT_ASSET_BASE = new URL('august-2026/', root);
  const data = document.createElement('script');
  data.src = new URL(`data/${id}.js`, root).href;
  data.onerror = () => showError('The test data could not be loaded. Please reload this page.');
  data.onload = () => {
    window.SAT_ACTIVE_TEST = window.SAT_TESTS[id];
    const engine = document.createElement('script');
    engine.src = new URL(ownScript.dataset.mode === 'results' ? 'shared/results.js' : 'shared/test.js', root).href;
    engine.onerror = () => showError('The test could not start. Please reload this page.');
    document.head.appendChild(engine);
  };
  document.head.appendChild(data);
})();
