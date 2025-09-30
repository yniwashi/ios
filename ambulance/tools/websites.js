// ios/ambulance/tools/websites.js
export async function run(mountEl){
  mountEl.innerHTML = `
    <style>
      /* ===== Websites (scoped) ===== */
      .ws-wrap{ padding:12px }
      .ws-card{
        background:var(--surface,#fff);
        border:1px solid var(--border,#e7ecf3);
        border-radius:14px; padding:14px;
        box-shadow:0 8px 18px rgba(0,0,0,.12);
      }

      .ws-head{ display:flex; align-items:center; justify-content:space-between; gap:10px }
      .ws-title{ margin:0; font-weight:900; font-size:16px; color:var(--text,#0c1230) }

      .ws-strip{ height:6px; border-radius:6px; margin:10px 0 14px 0;
        background:linear-gradient(90deg,#16a34a,#22c55e);
      }

      /* List */
      .ws-list{ display:flex; flex-direction:column; gap:8px }
      .ws-item{
        display:flex; align-items:center; justify-content:space-between; gap:12px;
        background:var(--surface,#f6f8fd); border:1px solid var(--border,#e7ecf3);
        border-radius:12px; padding:12px;
        cursor:pointer;
      }
      .ws-name{ font-weight:800; color:var(--text,#0c1230); }
      .ws-open{
        display:inline-flex; align-items:center; justify-content:center;
        width:36px; height:36px; border-radius:10px;
        background:var(--surface,#f3f6fb); border:1px solid var(--border,#dbe0ea);
      }
      .material-symbols-rounded{ font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24; }
      .ws-open .material-symbols-rounded{ font-size:20px; line-height:1; }

      /* Browser area */
      .ws-browser[hidden]{ display:none }
      .ws-toolbar{
        display:flex; gap:8px; align-items:center;
        background:var(--surface,#f6f8fd); border:1px solid var(--border,#e7ecf3);
        border-radius:12px; padding:8px; margin-bottom:8px;
      }
      .ws-tbtn{
        display:inline-flex; align-items:center; gap:6px;
        border:1px solid var(--border,#dbe0ea); background:var(--surface,#fff);
        border-radius:10px; padding:8px 10px; font-weight:800; cursor:pointer;
        color:var(--text,#0c1230);
      }
      .ws-tbtn[disabled]{ opacity:.4; cursor:default }
      .ws-url{
        margin-left:auto; font-size:12px; font-weight:700; color:#6e7b91; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:50%;
      }
      .ws-frame{
        width:100%; height:60vh; border:1px solid var(--border,#e7ecf3); border-radius:12px; background:#fff;
      }

      .ws-embed-fail{
        background:var(--surface,#fff7ed); border:1px solid #fed7aa; color:#7c2d12;
        border-radius:12px; padding:12px; margin-top:8px; display:none;
      }
      .ws-embed-fail .ws-ext{
        margin-top:8px; display:inline-flex; align-items:center; gap:6px;
        background:#111827; color:#fff; border:0; border-radius:10px; padding:8px 10px; cursor:pointer;
      }

      /* Dark tweaks */
      :root[data-theme="dark"] .ws-card{ background:#151921; border-color:#232a37 }
      :root[data-theme="dark"] .ws-item,
      :root[data-theme="dark"] .ws-toolbar{ background:#12151c; border-color:#232a37 }
      :root[data-theme="dark"] .ws-open{ background:#12151c; border-color:#232a37; color:#eef2ff }
      :root[data-theme="dark"] .ws-tbtn{ background:#12151c; border-color:#232a37; color:#eef2ff }
      :root[data-theme="dark"] .ws-frame{ background:#0f1115; border-color:#232a37 }
      :root[data-theme="dark"] .ws-embed-fail{ background:#3b1f10; border-color:#8b5a2b; color:#fde68a }

      /* ===== Full screen browser mode ===== */
      #wsRoot.browser-mode .ws-card{
        background:transparent; border:0; border-radius:0; padding:0; box-shadow:none;
      }
      #wsRoot.browser-mode #wsList{ display:none!important; }
      #wsRoot.browser-mode .ws-strip{ display:none!important; }
      #wsRoot.browser-mode .ws-toolbar{
        position:sticky; top:0; z-index:2; border-radius:0; padding:10px;
      }
      #wsRoot.browser-mode .ws-frame{
        width:100%; height:calc(100dvh - 56px - 12px); border:0; border-radius:0;
      }
    </style>

    <div id="wsRoot" class="ws-wrap">
      <div class="ws-card">
        <div class="ws-head">
          <h3 class="ws-title">Websites</h3>
        </div>

        <div class="ws-strip"></div>

        <!-- List view -->
        <div id="wsList" class="ws-list" aria-live="polite"></div>

        <!-- Browser view -->
        <div id="wsBrowser" class="ws-browser" hidden>
          <div class="ws-toolbar">
            <button id="wsBack" class="ws-tbtn" disabled>
              <span class="material-symbols-rounded">arrow_back</span> Back
            </button>
            <button id="wsForward" class="ws-tbtn" disabled>
              <span class="material-symbols-rounded">arrow_forward</span> Forward
            </button>
            <button id="wsHome" class="ws-tbtn">
              <span class="material-symbols-rounded">home</span> Home
            </button>
            <div id="wsUrl" class="ws-url"></div>
          </div>

          <iframe id="wsFrame" class="ws-frame" sandbox="allow-scripts allow-forms allow-same-origin allow-popups"></iframe>

          <div id="wsEmbedFail" class="ws-embed-fail">
            This site can’t be embedded here.
            <button id="wsExternal" class="ws-ext">
              <span class="material-symbols-rounded">open_in_new</span> Open in Safari
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const CANDIDATE_PATHS = [
    '../helpers/websites.json',
    '/ios/helpers/websites.json',
    '../../helpers/websites.json'
  ];

  const $  = sel => mountEl.querySelector(sel);
  const wsRoot    = $('#wsRoot');
  const wsList    = $('#wsList');
  const wsBrowser = $('#wsBrowser');
  const wsFrame   = $('#wsFrame');
  const wsBack    = $('#wsBack');
  const wsForward = $('#wsForward');
  const wsHome    = $('#wsHome');
  const wsUrl     = $('#wsUrl');
  const wsEmbedFail = $('#wsEmbedFail');
  const wsExternal  = $('#wsExternal');

  const historyStack = [];
  let historyIndex = -1;

  function showList(){
    wsBrowser.hidden = true;
    wsList.hidden = false;
    wsRoot.classList.remove('browser-mode');
  }
  function showBrowser(){
    wsList.hidden = true;
    wsBrowser.hidden = false;
    wsRoot.classList.add('browser-mode');
  }
  function updateToolbar(){
    wsBack.disabled = historyIndex <= 0;
    wsForward.disabled = historyIndex < 0 || historyIndex >= historyStack.length - 1;
    wsUrl.textContent = historyIndex >= 0 ? historyStack[historyIndex] : '';
  }
  function navigateTo(url, push=true){
    wsEmbedFail.style.display = 'none';
    showBrowser();
    if (push){
      if (historyIndex < historyStack.length - 1) historyStack.splice(historyIndex+1);
      historyStack.push(url);
      historyIndex = historyStack.length - 1;
    }
    wsFrame.src = url;
    updateToolbar();

    const expected = url;
    let timedOut = false;
    setTimeout(() => {
      try {
        const loc = wsFrame.contentWindow?.location?.href || '';
        if (!loc || loc === 'about:blank') timedOut = true;
      } catch {}
      if (timedOut){
        wsEmbedFail.style.display = 'block';
        wsExternal.onclick = () => window.open(expected, '_blank');
      }
    }, 1200);
  }

  wsBack.addEventListener('click', () => {
    if (historyIndex > 0){
      historyIndex -= 1;
      wsFrame.src = historyStack[historyIndex];
      updateToolbar();
    }
  });
  wsForward.addEventListener('click', () => {
    if (historyIndex < historyStack.length - 1){
      historyIndex += 1;
      wsFrame.src = historyStack[historyIndex];
      updateToolbar();
    }
  });
  wsHome.addEventListener('click', showList);

  wsFrame.addEventListener('load', () => {
    wsEmbedFail.style.display = 'none';
    updateToolbar();
  });

  async function loadSites(){
    let lastErr;
    for (const basePath of CANDIDATE_PATHS){
      const url = `${basePath}?v=${Date.now()}`;
      try {
        const res = await fetch(url, { cache:'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const arr = (data && Array.isArray(data.websites)) ? data.websites : [];
        if (!arr.length) throw new Error('Empty websites list');

        wsList.innerHTML = arr.map(obj => {
          const label = Object.keys(obj)[0];
          const u     = obj[label];
          const id    = 'ws_' + btoa(unescape(encodeURIComponent(label))).replace(/=/g,'');
          return `
            <div class="ws-item" data-url="${encodeURIComponent(u)}" id="${id}">
              <div class="ws-name">${label}</div>
              <div class="ws-open"><span class="material-symbols-rounded">open_in_new</span></div>
            </div>
          `;
        }).join('');

        wsList.querySelectorAll('.ws-item').forEach(item => {
          item.addEventListener('click', () => {
            const u = decodeURIComponent(item.dataset.url || '');
            if (u) navigateTo(u, true);
          });
        });

        console.log('[websites] loaded from', url);
        return;
      } catch (err){
        lastErr = err;
        console.warn('[websites] failed', url, err);
      }
    }
    wsList.innerHTML = `<div class="ws-item"><div class="ws-name">Couldn’t load websites.json (${lastErr?.message||'Unknown'})</div></div>`;
  }

  await loadSites();
  showList();
}
