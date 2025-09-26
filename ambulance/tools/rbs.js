// tools/rbs.js
export async function run(root) {
  root.innerHTML = `
  <style>
    .rbs * { box-sizing: border-box; }
    .rbs { padding: 12px; }

    :root{
      --rbs-low:#ff3b30;   /* iOS red  */
      --rbs-norm:#34c759;  /* iOS green */
      --rbs-high:#ff9500;  /* iOS orange */
    }

    .rbs-card{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 6px 18px rgba(0,0,0,.08);
      max-width: 720px;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
    }

    /* === STRONG TONE STRIP (very visible) === */
    .tone-strip{
      height: 8px;
      border-radius: 10px;
      margin: -4px -4px 10px -4px; /* bleed to edges inside the rounded card */
      background: var(--border);
    }
    .tint-low  .tone-strip{  background: var(--rbs-low);  }
    .tint-norm .tone-strip{  background: var(--rbs-norm); }
    .tint-high .tone-strip{  background: var(--rbs-high); }

    /* Card tints — LIGHT THEME (stronger) */
    .tint-low  { background: #ffe8ea;  border-color:#ffb3ba; }
    .tint-norm { background: #e9f9ee;  border-color:#b6ecc8; }
    .tint-high { background: #fff1df;  border-color:#ffd4a8; }

    /* Card tints — DARK THEME (high contrast) */
    [data-theme="dark"] .tint-low  { background:#2b1517; border-color:#5c1e24; }
    [data-theme="dark"] .tint-norm { background:#132518; border-color:#1e4d2a; }
    [data-theme="dark"] .tint-high { background:#2b1e0f; border-color:#5a3815; }

    .lab{
      display:block; margin: 6px 2px 6px; color: var(--muted); font-weight: 700;
    }

    /* Input + unit inside */
    .input-wrap{ position: relative; }
    .mg-input{
      width:100%;
      background: var(--surface-2);
      border:1px solid var(--border);
      color: var(--text);
      border-radius: 14px;
      padding: 14px 64px 14px 14px;   /* space for unit on right */
      font-size: 18px;
      outline: none;
      transition: border-color .18s ease, background .18s ease;
    }
    .mg-input:focus{ border-color: color-mix(in oklab, var(--accent) 55%, var(--border)); }
    .unit{
      position:absolute; right:12px; top:50%; transform: translateY(-50%);
      color: var(--muted); font-weight:700; pointer-events:none;
    }

    .chips{ display:flex; flex-wrap:wrap; gap:8px; margin: 10px 0 8px; }
    .chip{
      appearance:none; border:1px solid var(--border); background: var(--surface-2);
      color: var(--text); font-weight:800; padding:8px 12px; border-radius: 999px; cursor:pointer;
    }

    .actions{ display:flex; gap:10px; margin: 8px 0 6px; }
    .btn{
      appearance:none; border:1px solid var(--border); background: var(--surface-2);
      color: var(--text); font-weight:900; padding:10px 14px; border-radius:12px; cursor:pointer;
      transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
    }
    .btn:active{ transform: translateY(1px); }
    .btn.primary{
      background: linear-gradient(180deg,#6ba3ff,#3b7cff);
      border-color: color-mix(in oklab, #3b7cff 50%, var(--border));
      color: #fff;
      box-shadow: 0 6px 14px rgba(59,124,255,.25);
    }

    .result{ text-align:center; margin: 10px 0 2px; }
    .big{
      font-size: 30px; font-weight: 1000; color: var(--text);
    }
    .big small{ font-size:18px; font-weight:800; color: var(--muted); margin-left: 6px; }

    /* High-contrast status pill */
    .status{
      display:inline-block; margin-top:10px; padding:7px 14px; border-radius:999px;
      font-weight:900; border:1.5px solid transparent;
    }
    /* Light */
    .status.low  { background: #ffd7db; color:#8b0f16; border-color:#ff9aa4; }
    .status.norm { background: #dff7e7; color:#0f5a24; border-color:#a9e4bf; }
    .status.high { background: #ffe5c7; color:#8a3b00; border-color:#ffc27a; }

    /* Dark */
    [data-theme="dark"] .status.low  { background: rgba(255,59,48,.22); color:#ffd1d4; border-color: rgba(255,59,48,.55); }
    [data-theme="dark"] .status.norm { background: rgba(52,199,89,.22); color:#c7f5d6; border-color: rgba(52,199,89,.55); }
    [data-theme="dark"] .status.high { background: rgba(255,149,0,.22); color:#ffdcb3; border-color: rgba(255,149,0,.55); }

    /* Reference stays readable */
    .ref{ margin-top: 14px; }
    .ref .t{ color: color-mix(in oklab, var(--text) 88%, var(--muted)); font-weight:900; }
    .ref ul{ margin: 6px 0 0 18px; padding:0; color: color-mix(in oklab, var(--text) 95%, var(--muted)); }
    .ref li{ line-height:1.45; }

    @media (max-width: 420px){
      .mg-input { font-size:17px; }
      .big{ font-size:28px; }
    }
  </style>

  <div class="rbs">
    <div class="rbs-card" id="card">
      <div class="tone-strip"></div>

      <label class="lab" for="mg">Random Blood Sugar</label>

      <div class="input-wrap">
        <input id="mg" class="mg-input" inputmode="decimal" autocomplete="off" placeholder="e.g. 120" />
        <span class="unit">mg/dL</span>
      </div>

      <div class="chips">
        <button class="chip" data-val="50">50</button>
        <button class="chip" data-val="70">70</button>
        <button class="chip" data-val="100">100</button>
        <button class="chip" data-val="180">180</button>
        <button class="chip" data-val="250">250</button>
      </div>

      <div class="actions">
        <button id="doConvert" class="btn primary">Convert</button>
        <button id="doClear"   class="btn">Clear</button>
      </div>

      <div id="result" class="result" hidden>
        <div class="big"><span id="mmolVal">–</span><small>mmol/L</small></div>
        <div id="status" class="status norm">Normal</div>
      </div>

      <div class="ref">
        <div class="t">Reference (random glucose, mg/dL)</div>
        <ul>
          <li>Hypoglycemia: &lt; 70</li>
          <li>Normal: 70 – 120</li>
          <li>Hyperglycemia: &gt; 120</li>
        </ul>
      </div>
    </div>
  </div>
  `;

  const $ = (sel) => root.querySelector(sel);
  const mgInput  = $('#mg');
  const result   = $('#result');
  const mmolVal  = $('#mmolVal');
  const statusEl = $('#status');
  const card     = $('#card');

  function round1(x){ return Math.round(x*10)/10; }

  function applyTone(tone){
    card.classList.remove('tint-low','tint-norm','tint-high');
    card.classList.add(tone);
  }

  function show(mg) {
    const mmol = round1(mg/18);
    mmolVal.textContent = mmol.toFixed(1);

    if (mg < 70){
      statusEl.textContent = 'Hypoglycemia';
      statusEl.className = 'status low';
      applyTone('tint-low');
    } else if (mg <= 120){
      statusEl.textContent = 'Normal';
      statusEl.className = 'status norm';
      applyTone('tint-norm');
    } else {
      statusEl.textContent = 'Hyperglycemia';
      statusEl.className = 'status high';
      applyTone('tint-high');
    }
    result.hidden = false;
  }

  function convert() {
    const raw = (mgInput.value || '').trim().replace(',', '.');
    if (!raw) { result.hidden = true; return; }
    const mg = Number(raw);
    if (!isFinite(mg) || mg < 0) { alert('Please enter a valid mg/dL value.'); result.hidden = true; return; }
    show(mg);
  }

  // Events
  root.querySelectorAll('.chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      mgInput.value = btn.dataset.val;
      convert();
      mgInput.focus();
      mgInput.setSelectionRange(mgInput.value.length, mgInput.value.length);
    });
  });
  $('#doConvert').addEventListener('click', convert);
  $('#doClear').addEventListener('click', ()=>{
    mgInput.value=''; result.hidden = true; card.classList.remove('tint-low','tint-norm','tint-high'); mgInput.focus();
  });
  mgInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ convert(); }});
  mgInput.focus();
}
