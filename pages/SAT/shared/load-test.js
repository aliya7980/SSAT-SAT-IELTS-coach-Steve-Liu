(() => {
  const ownScript = document.currentScript;
  const root = new URL('../', ownScript.src);
  const id = new URLSearchParams(location.search).get('test') || ownScript.dataset.defaultTest || 'august2026';
  const known = ['august2026', 'september2026-practice1', 'october2026-practice1', 'november2026-practice1'];
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
    function startEngine() {
    if (ownScript.dataset.mode === 'results') {
      document.head.appendChild(engine);
    } else {
      const ink = document.createElement('script');
      ink.src = new URL('shared/teacher-ink.js', root).href;
      ink.onload = () => document.head.appendChild(engine);
      ink.onerror = () => showError('The marking controls could not be loaded. Please reload this page.');
      document.head.appendChild(ink);
    }
    }
    function loadClient() {
      const client = document.createElement('script');
      client.src = new URL('shared/api-client.js', root).href;
      client.onload = startEngine;
      client.onerror = () => showError('Secure test controls could not load. Please reload.');
      document.head.appendChild(client);
    }
    const config = document.createElement('script');
    config.src = new URL('shared/api-config.js', root).href;
    config.onload = loadClient;
    config.onerror = () => showError('Secure test configuration could not load. Please reload.');
    document.head.appendChild(config);
  };
  document.head.appendChild(data);
})();
