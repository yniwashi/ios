// tools/websites.js
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
      }
      .ws-name{ font-weight:800; color:var(--text,#0c1230); }
      .ws-open{
        display:inline-flex; align-items:center; justify-content:center;
        width:36px; height:36px; border-radius:10px;
        background:var(--surface,#f3f6fb); border:1px solid var(--border,#dbe0ea);
        cursor:pointer;
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
    </style>

    <div class="ws-wrap">
      <div class="ws-card">
        <div class="ws-head">
          <h3 class="ws-title">Websites</h3>
        </div>

        <div class="ws-strip"></div>

        <!-- List view -->
        <div id="wsList" class="ws-list" aria-live="polite"></div>

        <!-- Browser view (hidden until a site is opened) -->
        <div id="wsBrowser" class="ws-browser" hidden>
          <div class="ws-toolbar">
            <button id="wsBack" class="ws-tbtn" disabled>
              <span class="material-symbols-rounded" aria-hidden="true">arrow_back</span> Back
            </button>
            <button id="wsForward" class="ws-tbtn" disabled>
              <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span> Forward
            </button>
            <button id="wsHome" class="ws-tbtn">
              <span class="material-symbols-rounded" aria-hidden="true">home</span> Home
            </button>
            <div id="wsUrl" class="ws-url"></div>
          </div>

          <iframe id="wsFrame" class="ws-frame" sandbox="allow-scripts allow-forms allow-same-origin allow-popups"></iframe>

          <div id="wsEmbedFail" class="ws-embed-fail">
            This site can’t be embedded here (the website blocks in-page viewing).
            <br>
            You can open it in Safari instead.
            <br>
            <button id="wsExternal" class="ws-ext">
              <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span> Open in Safari
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const JSON_PATH = '../../helpers/websites.json';

  /* ---------- state & helpers ---------- */
  const $  = sel => mountEl.querySelector(sel);
  const wsList    = $('#wsList');
  const wsBrowser = $('#wsBrowser');
  const wsFrame   = $('#wsFrame');
  const wsBack    = $('#wsBack');
  const wsForward = $('#wsForward');
  const wsHome    = $('#wsHome');
  const wsUrl     = $('#wsUrl');
  const wsEmbedFail = $('#wsEmbedFail');
  const wsExternal  = $('#wsExternal');

  // Our simple navigation stack
  const historyStack = [];
  let historyIndex = -1;

  function showList(){
    wsBrowser.hidden = true;
    wsList.hidden = false;
  }
  function showBrowser(){
    wsList.hidden = true;
    wsBrowser.hidden = false;
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
      // trim forward history if any
      if (historyIndex < historyStack.length - 1) historyStack.splice(historyIndex+1);
      historyStack.push(url);
      historyIndex = historyStack.length - 1;
    }
    wsFrame.src = url;
    updateToolbar();

    // Try to detect embed failure (best-effort)
    // If site blocks embedding, we’ll show the fail notice after a short timeout.
    const expected = url;
    let shown = false;
    setTimeout(() => {
      // If frame is still blank OR we cannot access location and it visually stays blank,
      // show the notice. (We can’t reliably inspect cross-origin; this is a UX fallback.)
      try {
        // Access may throw on cross-origin; that’s fine.
        const loc = wsFrame.contentWindow?.location?.href || '';
        // If it didn't actually navigate anywhere, assume block.
        if (!loc || loc === 'about:blank') shown = true;
      } catch {
        // If cross-origin and still looks blank, user can decide to open externally.
        // We won’t guess here; leave it unless user reports it’s blank.
      }
      if (shown){
        wsEmbedFail.style.display = 'block';
        wsExternal.onclick = () => { window.open(expected, '_blank'); };
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
  wsHome.addEventListener('click', () => {
    // Return to the list view (root)
    showList();
  });

  wsFrame.addEventListener('load', () => {
    // When a page loads, hide the embed-fail banner if it showed previously
    wsEmbedFail.style.display = 'none';
    updateToolbar();
  });

  /* ---------- load websites.json ---------- */
  async function loadSites(){
    const res = await fetch(JSON_PATH, { cache:'no-store' });
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    const arr = (data && Array.isArray(data.websites)) ? data.websites : [];
    // Each item is an object with a single { "Label": "URL" }
    wsList.innerHTML = arr.map(obj => {
      const label = Object.keys(obj)[0];
      const url   = obj[label];
      const id = 'ws_' + btoa(label).replace(/=/g,'');
      return `
        <div class="ws-item" data-url="${encodeURIComponent(url)}" id="${id}">
          <div class="ws-name">${label}</div>
          <button class="ws-open" aria-label="Open ${label}">
            <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span>
          </button>
        </div>
      `;
    }).join('');

    // Wire each item
    wsList.querySelectorAll('.ws-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const url = decodeURIComponent(item.dataset.url || '');
        if (!url) return;
        // Open inside our browser view (toolbar appears)
        navigateTo(url, true);
      });
    });
  }

  try {
    await loadSites();
  } catch (e){
    wsList.innerHTML = `
      <div class="ws-item">
        <div class="ws-name">Couldn’t load websites. Check <code>ios/helpers/websites.json</code>.</div>
      </div>
    `;
    console.error(e);
  }

  // Start on list
  showList();
}
