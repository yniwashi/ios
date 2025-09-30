// tools/websites.js
export async function run(mountEl) {
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
        background:linear-gradient(90deg,#14b8a6,#3b82f6);
      }

      /* LANDMARK W1 — list as external links (no mini browser) */
      .ws-list{ display:flex; flex-direction:column; gap:8px }
      .ws-item{
        display:flex; align-items:center; gap:10px;
        text-decoration:none;
        background:var(--surface,#f6f8fd);
        border:1px solid var(--border,#e7ecf3);
        border-radius:12px; padding:12px 14px;
        color:var(--text,#0c1230); font-weight:800;
        box-shadow:0 4px 12px rgba(0,0,0,.06);
        transition:transform .18s ease, box-shadow .18s ease, background .18s ease;
      }
      .ws-item:hover{ transform:translateY(-1px); box-shadow:0 8px 18px rgba(0,0,0,.12) }
      .ws-k{ flex:1 1 auto; }
      .ws-ext{ font-size:12px; font-weight:900; opacity:.7 }

      /* Dark theme */
      :root[data-theme="dark"] .ws-card{ background:#151921; border-color:#232a37 }
      :root[data-theme="dark"] .ws-item{ background:#12151c; border-color:#232a37; color:#eef2ff }
    </style>

    <div class="ws-wrap">
      <div class="ws-card">
        <div class="ws-head">
          <h3 class="ws-title">Useful Websites</h3>
        </div>
        <div class="ws-strip"></div>
        <div id="wsList" class="ws-list" role="list"></div>
      </div>
    </div>
  `;

  /* ========= LANDMARK F1 — Robust JSON fetch (paths for your repo layout) ========= */
  const CANDIDATE_PATHS = [
    '../helpers/websites.json',      // index.html at ios/ambulance/
    '/ios/helpers/websites.json',    // absolute (if served from site root)
    '../../helpers/websites.json',   // safety net if folder depth changes
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
    // JSON shape is: { "websites": [ { "Label": "https://..." }, ... ] }
    const src = (json && Array.isArray(json.websites)) ? json.websites : [];
    return src.map(obj => {
      const label = Object.keys(obj)[0];
      const url = obj[label];
      return [label, url];
    }).filter(([k,v]) => k && v);
  }

  function openExternal(url) {
    // LANDMARK W2 — try to open in Safari / default browser
    // On iOS PWAs, target="_blank" usually opens Safari; this is an extra nudge.
    const w = window.open(url, '_blank');
    if (!w) {
      // Fallback: navigate current context
      location.href = url;
    }
  }

  function render(pairs) {
    const list = mountEl.querySelector('#wsList');
    list.innerHTML = pairs.map(([label, url]) => {
      // target+rel to strongly hint external open
      return `
        <a class="ws-item" href="${url}"
           target="_blank" rel="noopener noreferrer external" role="listitem" data-url="${url}">
          <span class="ws-k">${label}</span>
          <span class="ws-ext">Open</span>
        </a>
      `;
    }).join('');
    // Extra safety: intercept click and call window.open
    list.querySelectorAll('.ws-item').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openExternal(a.dataset.url);
      });
    });
  }

  try {
    const data = await loadWebsites();
    render(asPairs(data));
  } catch (e) {
    const list = mountEl.querySelector('#wsList');
    list.innerHTML = `
      <div class="ws-item" role="alert" style="color:#b91c1c;border-color:#fecaca;background:#fff1f2">
        Couldn’t load websites. Make sure the file exists at <strong>ios/helpers/websites.json</strong>.
      </div>
    `;
    console.error('websites.js: load error:', e);
  }
}
