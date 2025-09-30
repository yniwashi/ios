// tools/websites.js
export async function run(mountEl) {
  mountEl.innerHTML = `
    <style>
      /* ===== Websites (scoped) ===== */
      .ws-wrap{ padding:12px; display:flex; flex-direction:column; gap:12px; }
      .ws-card{
        background:var(--surface,#fff);
        border:1px solid var(--border,#e7ecf3);
        border-radius:14px; padding:14px;
        box-shadow:0 8px 18px rgba(0,0,0,.12);
      }
      .ws-head{ display:flex; align-items:center; justify-content:space-between; gap:10px }
      .ws-title{ margin:0; font-weight:900; font-size:16px; color:var(--text,#0c1230) }
      .ws-strip{ height:6px; border-radius:6px; margin:10px 0 14px 0;
        background:linear-gradient(90deg,#14b8a6,#3b82f6);
      }

      /* Website list */
      .ws-list{ display:flex; flex-direction:column; gap:8px }
      .ws-item{
        display:flex; align-items:center; justify-content:space-between;
        text-decoration:none;
        background:var(--surface,#f6f8fd);
        border:1px solid var(--border,#e7ecf3);
        border-radius:12px; padding:12px 14px;
        color:var(--text,#0c1230); font-weight:800;
        box-shadow:0 4px 12px rgba(0,0,0,.06);
        transition:transform .18s ease, box-shadow .18s ease, background .18s ease;
      }
      .ws-item:hover{ transform:translateY(-1px); box-shadow:0 8px 18px rgba(0,0,0,.12) }
      .ws-arrow{ font-size:16px; opacity:.7 }

      /* Toolbar */
      .ws-toolbar{
        display:flex; gap:8px; justify-content:space-between;
      }
      .ws-nav-btn{
        flex:1; text-align:center;
        border:none; border-radius:10px; padding:10px;
        font-weight:800; font-size:14px;
        background:var(--surface,#f3f6fb); border:1px solid var(--border,#dbe0ea);
        color:var(--text,#0c1230); cursor:pointer;
        box-shadow:0 4px 12px rgba(0,0,0,.06);
      }
      .ws-nav-btn:disabled{ opacity:.4; cursor:default }

      /* Dark theme */
      :root[data-theme="dark"] .ws-card{ background:#151921; border-color:#232a37 }
      :root[data-theme="dark"] .ws-item{ background:#12151c; border-color:#232a37; color:#eef2ff }
      :root[data-theme="dark"] .ws-nav-btn{ background:#12151c; border-color:#232a37; color:#eef2ff }
    </style>

    <div class="ws-wrap">
      <div class="ws-card">
        <div class="ws-head">
          <h3 class="ws-title">Useful Websites</h3>
        </div>
        <div class="ws-strip"></div>
        <div id="wsList" class="ws-list" role="list"></div>
      </div>

      <!-- LANDMARK T1 — Toolbar -->
      <div class="ws-toolbar">
        <button id="btnBack" class="ws-nav-btn" disabled>← Back</button>
        <button id="btnFwd"  class="ws-nav-btn" disabled>Forward →</button>
        <button id="btnHome" class="ws-nav-btn">🏠 Home</button>
      </div>
    </div>
  `;

  /* ========= Fetch JSON ========= */
  const CANDIDATE_PATHS = [
    '../helpers/websites.json',
    '/ios/helpers/websites.json',
    '../../helpers/websites.json',
  ];

  async function loadWebsites() {
    let lastErr;
    for (const p of CANDIDATE_PATHS) {
      try {
        const res = await fetch(p, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('Unable to fetch websites.json');
  }

  function asPairs(json) {
    const src = (json && Array.isArray(json.websites)) ? json.websites : [];
    return src.map(obj => {
      const label = Object.keys(obj)[0];
      const url = obj[label];
      return [label, url];
    }).filter(([k,v]) => k && v);
  }

  /* ========= Render ========= */
  function renderList(pairs) {
    const list = mountEl.querySelector('#wsList');
    list.innerHTML = pairs.map(([label, url]) => {
      return `
        <a class="ws-item" href="${url}" target="_blank" rel="noopener" data-url="${url}">
          <span>${label}</span>
          <span class="ws-arrow">→</span>
        </a>
      `;
    }).join('');
    list.querySelectorAll('.ws-item').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        // let user navigate inside Web App
        window.location.href = a.dataset.url;
      });
    });
  }

  try {
    const data = await loadWebsites();
    renderList(asPairs(data));
  } catch (e) {
    const list = mountEl.querySelector('#wsList');
    list.innerHTML = `
      <div class="ws-item" role="alert" style="color:#b91c1c;border-color:#fecaca;background:#fff1f2">
        Couldn’t load websites. Make sure the file exists at <strong>ios/helpers/websites.json</strong>.
      </div>
    `;
    console.error('websites.js: load error:', e);
  }

  /* ========= Toolbar Nav ========= */
  const btnBack = mountEl.querySelector('#btnBack');
  const btnFwd  = mountEl.querySelector('#btnFwd');
  const btnHome = mountEl.querySelector('#btnHome');

  function updateNavButtons() {
    btnBack.disabled = !window.history.state && window.history.length <= 1;
    btnFwd.disabled  = true; // forward tracking limited in PWA
  }
  btnBack.addEventListener('click', ()=> history.back());
  btnFwd.addEventListener('click', ()=> history.forward());
  btnHome.addEventListener('click', ()=> window.location.href = '/ios/ambulance/');

  updateNavButtons();
}
