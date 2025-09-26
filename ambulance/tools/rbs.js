// tools/rbs.js
export async function run(root) {
  root.innerHTML = `
  <style>
    .rbs * { box-sizing: border-box; }
    .rbs { padding: 12px; }

    .rbs-card{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 6px 18px rgba(0,0,0,.08);
      max-width: 720px;
      margin: 0 auto;
    }

    .rbs-head{
      display:flex; align-items:center; gap:10px; margin-bottom: 10px;
    }
    .rbs-title{
      margin:0; font-weight:800; font-size:18px; color:var(--text);
    }

    .lab{
      display:block; margin: 6px 2px 6px; color: var(--muted); font-weight: 600;
    }

    /* input with unit inside on the right */
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
      color: var(--muted); font-weight:600; pointer-events:none;
    }

    .chips{ display:flex; flex-wrap:wrap; gap:8px; margin: 10px 0 8px; }
    .chip{
      appearance:none; border:1px solid var(--border); background: var(--surface-2);
      color: var(--text); font-weight:700; padding:8px 12px; border-radius: 999px; cursor:pointer;
    }

    .actions{ display:flex; gap:10px; margin: 8px 0 6px; }
    .btn{
      appearance:none; border:1px solid var(--border); background: var(--surface-2);
      color: var(--text); font-weight:800; padding:10px 14px; border-radius:12px; cursor:pointer;
      transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
    }
    .btn:active{ transform: translateY(1px); }
    .btn.primary{
      background: linear-gradient(180deg,#6ba3ff,#3b7cff);
      border-color: color-mix(in oklab, #3b7cff 50%, var(--border));
      color: #fff;
      box-shadow: 0 6px 14px rgba(59,124,255,.25);
    }

    .result{ text-align:center; margin: 8px 0 2px; }
    .big{
      font-size: 28px; font-weight: 900; color: var(--text);
    }
    .big small{ font-size:18px; font-weight:800; color: var(--muted); margin-left: 6px; }

    .status{
      display:inline-block; margin-top:8px; padding:6px 12px; border-radius:999px;
      font-weight:800; border:1px solid transparent;
    }

    /* Card tints that work in light & dark (mix with surface) */
    .tint-low   { background: color-mix(in oklab, #e53935 10%, var(--surface));  border-color: color-mix(in oklab, #e53935 30%, var(--border)); }
    .tint-norm  { background: color-mix(in oklab, #43A047 10%, var(--surface));  border-color: color-mix(in oklab, #43A047 30%, var(--border)); }
    .tint-high  { background: color-mix(in oklab, #FB8C00 10%, var(--surface));  border-color: color-mix(in oklab, #FB8C00 30%, var(--border)); }

    .status.low  { background:#ffebee;  color:#b71c1c; border-color:#ffcdd2; }
    .status.norm { background:#e8f5e9;  color:#1b5e20; border-color:#c8e6c9; }
    .status.high { background:#fff3e0;  color:#e65100; border-color:#ffe0b2; }

    /* Keep reference text readable in dark */
    .ref{ margin-top: 14px; }
    .ref .t{ color: color-mix(in oklab, var(--text) 86%, var(--muted)); font-weight:800; }
    .ref ul{ margin: 6px 0 0 18px; padding:0; color: color-mix(in oklab, var(--text) 92%, var(--muted)); }
    .ref li{ line-height:1.45; }

    /* make it breathe a bit on small screens */
    @media (max-width: 420px){
      .mg-input { font-size:17px; }
      .big{ font-size:26px; }
    }
  </style>

  <div class="rbs">
    <div class="rbs-card" id="card">
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

  function show(mg) {
    const mmol = round1(mg/18);
    mmolVal.textContent = mmol.toFixed(1);

    // Reset card tint classes
    card.classList.remove('tint-low','tint-norm','tint-high');

    if (mg < 70){
      statusEl.textContent = 'Hypoglycemia';
      statusEl.className = 'status low';
      card.classList.add('tint-low');
    } else if (mg <= 120){
      statusEl.textContent = 'Normal';
      statusEl.className = 'status norm';
      card.classList.add('tint-norm');
    } else {
      statusEl.textContent = 'Hyperglycemia';
      statusEl.className = 'status high';
      card.classList.add('tint-high');
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
    mgInput.value=''; result.hidden = true; mgInput.focus();
  });
  mgInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ convert(); }});
  mgInput.focus();
}
