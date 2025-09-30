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

      /* Dark theme */
      :root[data-theme="dark"] .web-card{ background:#151921; border-color:#232a37 }
      :root[data-theme="dark"] .web-filter{
        background:#12151c; border-color:#232a37; color:#eef2ff;
      }
      :root[data-theme="dark"] .web-item,
      :root[data-theme="dark"] .web-empty{
        background:#12151c; border-color:#232a37; color:#eef2ff;
      }
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
      </div>
    </div>
  `;

  /* =========================
     LANDMARK 1 — Fetch JSON
     Path is relative to /tools/, so we go up one level:
     ../ios/helpers/websites.json
     ========================= */
  const JSON_PATH = '../ios/helpers/websites.json';

  const listEl   = mountEl.querySelector('#webList');
  const searchEl = mountEl.querySelector('#webSearch');

  // Temporary loading state
  listEl.innerHTML = `<div class="web-empty">Loading…</div>`;

  // Fetch + parse "{ websites: [ { "<emoji> Label": "url" }, ... ] }"
  let LINKS = [];
  try{
    const res = await fetch(JSON_PATH, { cache: 'no-cache' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // LANDMARK 2 — Normalize JSON into {emoji,label,url}
    LINKS = (data.websites || []).map(entry => {
      // each entry is an object with a single key => value
      const key = Object.keys(entry)[0];
      const url = entry[key];

      // split the emoji (first char or first grapheme) from the label
      // we’ll assume the format "<emoji><space>Label"
      let emoji = '';
      let label = key;
      const m = key.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s+(.*)$/u);
      if (m){
        emoji = m[1];
        label = m[2];
      } else {
        // fallback: first char then trim
        const idx = key.indexOf(' ');
        if (idx > 0){
          emoji = key.slice(0, idx).trim();
          label = key.slice(idx).trim();
        }
      }
      return { emoji, label, url };
    });
  } catch (e){
    console.error('Websites load failed:', e);
    listEl.innerHTML = `<div class="web-empty">Couldn’t load websites. Check <code>ios/helpers/websites.json</code>.</div>`;
    return;
  }

  /* =========================
     LANDMARK 3 — Render helper
     ========================= */
  function render(filter=''){
    const q = filter.trim().toLowerCase();
    listEl.innerHTML = '';

    const filtered = LINKS.filter(item =>
      !q || item.label.toLowerCase().includes(q)
    );

    if (!filtered.length){
      listEl.innerHTML = `<div class="web-empty">No matches.</div>`;
      return;
    }

    filtered.forEach(item => {
      const a = document.createElement('a');
      a.className = 'web-item';
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = `
        <span class="web-emoji">${item.emoji || '🔗'}</span>
        <span class="web-label">${item.label}</span>
        <span class="web-open">↗</span>
      `;
      listEl.appendChild(a);
    });
  }

  /* =========================
     LANDMARK 4 — Wire up filter
     ========================= */
  searchEl.addEventListener('input', () => render(searchEl.value));

  // Initial paint
  render();
}
