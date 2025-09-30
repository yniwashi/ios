// tools/websites.js
export async function run(mountEl){
  mountEl.innerHTML = `
    <style>
      /* ===== Useful Websites (scoped) ===== */
      .web-wrap{ padding:12px }
      .web-card{
        background:var(--surface,#fff);
        border:1px solid var(--border,#e7ecf3);
        border-radius:14px; padding:14px;
        box-shadow:0 8px 18px rgba(0,0,0,.12);
      }

      .web-head{ display:flex; align-items:center; justify-content:space-between; gap:10px }
      .web-title{ margin:0; font-weight:900; font-size:16px; color:var(--text,#0c1230) }

      .web-strip{ height:6px; border-radius:6px; margin:10px 0 14px 0;
        background:linear-gradient(90deg,#10b981,#4caf50);
      }

      /* filter */
      .web-filter-wrap{ position:relative; margin-bottom:10px }
      .web-filter{
        width:100%; box-sizing:border-box;
        font-size:14px; font-weight:700; color:var(--text,#0c1230);
        background:var(--surface,#f3f6fb); border:1px solid var(--border,#dbe0ea);
        border-radius:12px; padding:10px 14px; outline:none;
      }

      /* list */
      .web-list{ display:flex; flex-direction:column; gap:8px; margin-top:6px }
      .web-item{
        display:flex; align-items:center; gap:10px;
        padding:12px; border-radius:12px;
        background:var(--surface,#f6f8fd);
        border:1px solid var(--border,#e7ecf3);
        text-decoration:none; color:var(--text,#0c1230);
        font-weight:800;
        transition:transform .18s ease, box-shadow .18s ease;
      }
      .web-item:hover{ transform:translateY(-1px); box-shadow:0 8px 18px rgba(0,0,0,.12) }
      .web-emoji{ font-size:18px; width:22px; text-align:center; }
      .web-label{ flex:1; line-height:1.2 }
      .web-open{ font-size:18px; opacity:.7 }

      .web-empty{
        padding:16px; border-radius:12px; text-align:center; font-weight:700;
        background:var(--surface,#f6f8fd); border:1px solid var(--border,#e7ecf3);
        color:var(--muted,#667085);
      }

      /* Viewer */
      .web-viewer{ display:none; margin-top:10px }
      .web-toolbar{
        display:flex; gap:8px; align-items:center; justify-content:space-between;
        background:var(--surface,#f6f8fd); border:1px solid var(--border,#e7ecf3);
        border-radius:12px; padding:8px;
      }
      .web-nav{ display:flex; gap:8px; align-items:center }
      .web-btn{
        border:1px solid var(--border,#dbe0ea); background:var(--surface,#f3f6fb);
        color:var(--text,#0c1230); font-weight:800; padding:8px 10px; border-radius:10px;
        cursor:pointer;
      }
      .web-btn[disabled]{ opacity:.5; cursor:default }
      .web-url{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        font-size:12px; font-weight:800; color:var(--muted,#6e7b91);
      }
      .web-iframe{
        width:100%; height:70vh; border:1px solid var(--border,#e7ecf3); border-radius:12px; margin-top:8px;
        background:#fff;
      }
      .web-hint{ font-size:12px; color:var(--muted,#6e7b91); margin-top:6px }

      /* Dark theme */
      :root[data-theme="dark"] .web-card{ background:#151921; border-color:#232a37 }
      :root[data-theme="dark"] .web-filter{
        background:#12151c; border-color:#232a37; color:#eef2ff;
      }
      :root[data-theme="dark"] .web-item,
      :root[data-theme="dark"] .web-empty,
      :root[data-theme="dark"] .web-toolbar{
        background:#12151c; border-color:#232a37; color:#eef2ff;
      }
      :root[data-theme="dark"] .web-btn{ background:#12151c; border-color:#232a37; color:#eef2ff }
      :root[data-theme="dark"] .web-iframe{ background:#0f1115 }
    </style>

    <div class="web-wrap">
      <div class="web-card">
        <div class="web-head">
          <h3 class="web-title">Useful Websites</h3>
        </div>

        <div class="web-strip"></div>

        <div class="web-filter-wrap">
          <input id="webSearch" class="web-filter" placeholder="Filter… e.g. Oracle, Email, CPD" />
        </div>

        <div id="webList" class="web-list"></div>

        <!-- LANDMARK V1 — Mini-browser viewer -->
        <div id="webViewer" class="web-viewer">
          <div class="web-toolbar">
            <div class="web-nav">
              <button id="navBack" class="web-btn" title="Back">←</button>
              <button id="navFwd"  class="web-btn" title="Forward">→</button>
              <button id="navHome" class="web-btn" title="Home">Home</button>
            </div>
            <div id="webUrl" class="web-url"></div>
            <button id="navOpen" class="web-btn" title="Open in browser">Open</button>
          </div>
          <iframe id="webFrame" class="web-iframe" sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>
          <div class="web-hint" id="webHint" style="display:none">
            If the page doesn't load here (some sites block embedding), tap <b>Open</b>.
          </div>
        </div>
      </div>
    </div>
  `;

  /* ========= LANDMARK F1 — Robust JSON fetch (tries 3 paths) ========= */
 /* ========= LANDMARK F1 — Robust JSON fetch (paths for your repo layout) ========= */
const CANDIDATE_PATHS = [
  // index.html is at ios/ambulance → helpers is one level up
  '../helpers/websites.json',

  // if the app ever serves from the site root (absolute)
  '/ios/helpers/websites.json',

  // (rare fallback) if index is moved one level deeper later
  '../../helpers/websites.json',
];


  const listEl   = mountEl.querySelector('#webList');
  const searchEl = mountEl.querySelector('#webSearch');

  let LINKS = [];
  let lastErr = null;

  for (const path of CANDIDATE_PATHS){
    try{
      const res = await fetch(path, { cache:'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      LINKS = normalizeLinks(data);
      lastErr = null;
      break;
    } catch (e){
      lastErr = e;
    }
  }

  if (lastErr){
    listEl.innerHTML = `<div class="web-empty">Couldn’t load websites. Check <code>ios/helpers/websites.json</code> path.</div>`;
    console.error('Websites load failed:', lastErr);
    return;
  }

  /* ========= LANDMARK R1 — Render list & filter ========= */
  function normalizeLinks(data){
    const src = Array.isArray(data) ? data : (data.websites || []);
    return src.map(entry => {
      const key = Object.keys(entry)[0];
      const url = entry[key];

      // Extract emoji + label ("🔗 Label")
      let emoji = '🔗', label = key;
      const m = key.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s+(.*)$/u);
      if (m){ emoji = m[1]; label = m[2]; }
      else {
        const idx = key.indexOf(' ');
        if (idx > 0){ emoji = key.slice(0, idx).trim(); label = key.slice(idx).trim(); }
      }
      return { emoji, label, url };
    });
  }

  function render(filter=''){
    const q = filter.trim().toLowerCase();
    listEl.innerHTML = '';
    const filtered = LINKS.filter(item => !q || item.label.toLowerCase().includes(q));
    if (!filtered.length){
      listEl.innerHTML = `<div class="web-empty">No matches.</div>`;
      return;
    }

    filtered.forEach(item => {
      const a = document.createElement('a');
      a.className = 'web-item';
      a.href = item.url;
      a.innerHTML = `
        <span class="web-emoji">${item.emoji}</span>
        <span class="web-label">${item.label}</span>
        <span class="web-open">↗</span>
      `;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openViewer(item.url);
      });
      listEl.appendChild(a);
    });
  }

  searchEl.addEventListener('input', () => render(searchEl.value));
  render();

  /* ========= LANDMARK V2 — Mini browser history + controls ========= */
  const viewer   = mountEl.querySelector('#webViewer');
  const iframe   = mountEl.querySelector('#webFrame');
  const urlBox   = mountEl.querySelector('#webUrl');
  const hint     = mountEl.querySelector('#webHint');
  const btnBack  = mountEl.querySelector('#navBack');
  const btnFwd   = mountEl.querySelector('#navFwd');
  const btnHome  = mountEl.querySelector('#navHome');
  const btnOpen  = mountEl.querySelector('#navOpen');

  const history = [];
  let index = -1;

  function updateNav(){
    btnBack.disabled = !(index > 0);
    btnFwd.disabled  = !(index >= 0 && index < history.length - 1);
    urlBox.textContent = index >= 0 ? history[index] : '';
  }

  function showViewer(show){
    viewer.style.display = show ? 'block' : 'none';
  }

  function setIframe(src){
    iframe.src = src;
    urlBox.textContent = src;
    hint.style.display = 'none';
    // Some sites block iframes; show hint after a short delay if nothing paints.
    // (We can't reliably detect X-Frame-Options, so we give a gentle nudge.)
    setTimeout(() => { hint.style.display = 'block'; }, 1200);
    iframe.addEventListener('load', ()=>{ hint.style.display = 'none'; }, { once:true });
  }

  function openViewer(url){
    // push new URL
    if (index < history.length - 1) history.splice(index + 1);
    history.push(url);
    index = history.length - 1;

    setIframe(url);
    showViewer(true);
    updateNav();
  }

  btnBack.addEventListener('click', () => {
    if (index > 0){
      index -= 1;
      setIframe(history[index]);
      updateNav();
    } else {
      // Nothing to go back to: route to "home" (list)
      showViewer(false);
    }
  });

  btnFwd.addEventListener('click', () => {
    if (index < history.length - 1){
      index += 1;
      setIframe(history[index]);
      updateNav();
    }
  });

  btnHome.addEventListener('click', () => {
    // Clear viewer, show list (root/home)
    showViewer(false);
  });

  btnOpen.addEventListener('click', () => {
    if (index >= 0){
      window.location.href = history[index]; // iOS webclip: open directly
    }
  });
}
