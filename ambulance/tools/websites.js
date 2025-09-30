// ios/ambulance/tools/websites.js
export async function run(mountEl){
  mountEl.innerHTML = `
    <style>
      .ws-wrap{padding:12px}
      .ws-card{background:var(--surface,#fff);border:1px solid var(--border,#e7ecf3);
        border-radius:14px;padding:14px;box-shadow:0 8px 18px rgba(0,0,0,.12)}
      .ws-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .ws-title{margin:0;font-weight:900;font-size:16px;color:var(--text,#0c1230)}
      .ws-strip{height:6px;border-radius:6px;margin:10px 0 14px 0;
        background:linear-gradient(90deg,#16a34a,#22c55e)}
      .ws-list{display:flex;flex-direction:column;gap:8px}
      .ws-item{display:flex;align-items:center;justify-content:space-between;gap:12px;
        background:var(--surface,#f6f8fd);border:1px solid var(--border,#e7ecf3);
        border-radius:12px;padding:12px;cursor:pointer}
      .ws-name{font-weight:800;color:var(--text,#0c1230)}
      .ws-open{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;
        background:var(--surface,#f3f6fb);border:1px solid var(--border,#dbe0ea)}
      .material-symbols-rounded{font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24;font-size:20px}
      :root[data-theme="dark"] .ws-card{background:#151921;border-color:#232a37}
      :root[data-theme="dark"] .ws-item{background:#12151c;border-color:#232a37}
      :root[data-theme="dark"] .ws-open{background:#12151c;border-color:#232a37;color:#eef2ff}
    </style>

    <div class="ws-wrap">
      <div class="ws-card">
        <div class="ws-head"><h3 class="ws-title">Websites</h3></div>
        <div class="ws-strip"></div>
        <div id="wsList" class="ws-list"></div>
      </div>
    </div>
  `;

  const CANDIDATE_PATHS = [
    '../helpers/websites.json',
    '/ios/helpers/websites.json',
    '../../helpers/websites.json'
  ];

  const wsList = mountEl.querySelector('#wsList');

// LANDMARK — drop-in replacement for loadSites()
async function loadSites(){
  let lastErr;

  for (const basePath of CANDIDATE_PATHS){
    try{
      const res  = await fetch(`${basePath}?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const arr  = Array.isArray(data?.websites) ? data.websites : [];
      if (!arr.length) throw new Error('Empty websites list');

      // Render list
      wsList.innerHTML = arr.map(obj => {
        const label = Object.keys(obj)[0];
        const u     = obj[label];

        // safe id for arbitrary unicode label
        const id = 'ws_' + btoa(unescape(encodeURIComponent(label))).replace(/=+$/,'');

        return `
          <div class="ws-item" data-url="${encodeURIComponent(u)}" id="${id}">
            <div class="ws-name">${label}</div>
            <div style="display:flex; gap:8px;">
              <button class="ws-open" data-action="open"  aria-label="Open ${label}">
                <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span>
              </button>
              <button class="ws-open" data-action="share" aria-label="Share ${label}">
                <span class="material-symbols-rounded" aria-hidden="true">ios_share</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Wire Open / Share actions
      wsList.querySelectorAll('.ws-item').forEach(item => {
        const url = decodeURIComponent(item.dataset.url || '');

        item.addEventListener('click', async (e) => {
          const btn = e.target.closest('button.ws-open');
          if (!btn) return; // ignore clicks not on the buttons

          const action = btn.dataset.action;
          if (action === 'open') {
            // Best-possible external open from a WebClip (new Safari tab/window)
            window.open(url, '_blank', 'noopener,noreferrer');
          } else if (action === 'share') {
            try {
              if (navigator.share) {
                await navigator.share({ url, title: 'Open in Safari', text: 'Ambulance – Useful website' });
              } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                alert('Link copied. Paste into Safari to open.');
              } else {
                location.href = url; // last resort
              }
            } catch (err) {
              console.debug('Share cancelled:', err);
            }
          }
        });
      });

      console.log('[websites] loaded from', basePath);
      return; // ✅ success, stop trying other paths
    } catch (err){
      lastErr = err;
      console.warn('[websites] failed', basePath, err);
      // try next candidate path
    }
  }

  // If we reach here, all paths failed
  wsList.innerHTML = `
    <div class="ws-item">
      <div class="ws-name">Couldn’t load websites. Make sure <code>ios/helpers/websites.json</code> exists and is served. (${lastErr?.message || 'Unknown error'})</div>
    </div>
  `;
}

// LANDMARK — call it after building the DOM
await loadSites();
