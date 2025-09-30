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

  async function loadSites(){
    let lastErr;
    for (const basePath of CANDIDATE_PATHS){
      try{
        const res = await fetch(`${basePath}?v=${Date.now()}`);
        if(!res.ok) throw new Error(res.status);
        const data = await res.json();
        const arr = Array.isArray(data.websites)?data.websites:[];
        if(!arr.length) throw new Error('empty');
        wsList.innerHTML = arr.map(obj=>{
          const label = Object.keys(obj)[0];
          const url = obj[label];
          return `
            <div class="ws-item" data-url="${encodeURIComponent(url)}">
              <div class="ws-name">${label}</div>
              <div class="ws-open"><span class="material-symbols-rounded">open_in_new</span></div>
            </div>`;
        }).join('');
        wsList.querySelectorAll('.ws-item').forEach(item=>{
          item.addEventListener('click',()=>{
            const u = decodeURIComponent(item.dataset.url||'');
            if(u) window.open(u,'_blank'); // always Safari
          });
        });
        return;
      }catch(e){lastErr=e;}
    }
    wsList.innerHTML=`<div class="ws-item"><div class="ws-name">Could not load websites (${lastErr?.message||''})</div></div>`;
  }
  await loadSites();
}
