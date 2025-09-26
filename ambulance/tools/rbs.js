// RBS Converter — mg/dL → mmol/L with category styling
// Usage: loaded by index.html via run(mountEl, params)

export async function run(mountEl, params = {}) {
  mountEl.innerHTML = `
    <style>
      /* ===== RBS styles (scoped) ===== */
      .rbs-wrap{ padding:14px 12px 28px; display:flex; flex-direction:column; gap:12px; }
      .rbs-card{
        background:var(--surface);
        border:1px solid var(--border);
        border-radius:12px;
        overflow:hidden;
      }
      .rbs-card .strip{ height:5px; background:#e5e7eb; }
      .rbs-body{ padding:12px; display:flex; flex-direction:column; gap:12px; }

      .rbs-row{ display:flex; align-items:flex-end; gap:10px; }
      .rbs-field{ flex:1; display:flex; flex-direction:column; gap:6px; }
      .rbs-label{ font-size:12px; color:var(--muted); font-weight:600; letter-spacing:.02em; }
      .rbs-input{
        appearance:none; width:100%;
        background:var(--surface-2);
        border:1px solid var(--border);
        border-radius:10px;
        padding:12px 12px;
        font:600 16px/1.1 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif;
        color:var(--text);
      }
      .rbs-suffix{ font-size:12px; color:var(--muted); padding-bottom:4px; white-space:nowrap; }

      .rbs-actions{ display:flex; gap:8px; }
      .rbs-btn{
        appearance:none; cursor:pointer; user-select:none;
        border-radius:10px; border:1px solid var(--border);
        background:linear-gradient(180deg,#3a7bfd,#2660ea);
        color:#fff; font-weight:800; font-size:14px;
        padding:10px 12px; flex:0 0 auto; box-shadow:0 8px 18px rgba(0,0,0,.18);
        transition:transform .2s, box-shadow .2s, filter .2s;
      }
      .rbs-btn:active{ transform:scale(.98) }
      .rbs-btn.secondary{
        background:var(--surface-2); color:var(--text); border-color:var(--border);
        box-shadow:none;
      }

      .rbs-result{ display:none; }
      .rbs-mm{ text-align:center; font-weight:900; }
      .rbs-mm .big{ font-size:26px; }
      .rbs-mm .unit{ font-size:18px; margin-left:4px; }

      .rbs-status{ display:flex; align-items:center; justify-content:center; }
      .rbs-pill{
        display:inline-flex; align-items:center; justify-content:center;
        border-radius:999px; padding:6px 10px; font-weight:800; font-size:13px;
        border:1px solid transparent;
      }

      .rbs-ref{ margin-top:4px; }
      .rbs-ref-title{ font-size:12px; color:var(--muted); font-weight:700; }
      .rbs-ref-lines{ font-size:13px; line-height:1.25; white-space:pre-line; }

      /* Category tints (light backgrounds) */
      .tint-low   { background:#FFEBEE }  /* very light red */
      .tint-norm  { background:#E8F5E9 }  /* very light green */
      .tint-high  { background:#FFF3E0 }  /* very light orange */

      .strip-low  { background:#E53935 }
      .strip-norm { background:#43A047 }
      .strip-high { background:#FB8C00 }

      .pill-low   { background:#E53935; color:#fff; }
      .pill-norm  { background:#C8E6C9; color:#0b1b13; border-color:#A5D6A7; }
      .pill-high  { background:#FFE0B2; color:#281a0a; border-color:#FFCC80; }

      /* Tiny error */
      .rbs-err{ color:#E53935; font-size:12px; display:none; }

      /* Quick presets */
      .rbs-presets{ display:flex; gap:8px; flex-wrap:wrap; }
      .rbs-chip{
        appearance:none; cursor:pointer;
        padding:6px 10px; border-radius:999px;
        background:var(--surface-2); border:1px solid var(--border);
        font-weight:700; font-size:12px; color:var(--text);
      }
    </style>

    <div class="rbs-wrap">
      <div class="rbs-card" id="rbs-card">
        <div class="strip" id="rbs-strip"></div>

        <div class="rbs-body">
          <div class="rbs-row">
            <div class="rbs-field">
              <label class="rbs-label" for="rbs-mg">Random Blood Sugar</label>
              <input id="rbs-mg" class="rbs-input" type="number" inputmode="decimal" step="0.1" min="0" placeholder="Enter mg/dL">
              <div class="rbs-err" id="rbs-err">Please enter a valid number in mg/dL.</div>
            </div>
            <div class="rbs-suffix">mg/dL</div>
          </div>

          <div class="rbs-presets" aria-label="Quick values">
            <button type="button" class="rbs-chip" data-v="50">50</button>
            <button type="button" class="rbs-chip" data-v="70">70</button>
            <button type="button" class="rbs-chip" data-v="100">100</button>
            <button type="button" class="rbs-chip" data-v="180">180</button>
            <button type="button" class="rbs-chip" data-v="250">250</button>
          </div>

          <div class="rbs-actions">
            <button id="rbs-convert" class="rbs-btn">Convert</button>
            <button id="rbs-clear"   class="rbs-btn secondary">Clear</button>
          </div>

          <div id="rbs-result" class="rbs-result">
            <div class="rbs-mm">
              <span id="rbs-val" class="big">—</span>
              <span class="unit">mmol/L</span>
            </div>
            <div class="rbs-status">
              <span id="rbs-pill" class="rbs-pill">—</span>
            </div>

            <div class="rbs-ref">
              <div class="rbs-ref-title">Reference (random glucose, mg/dL)</div>
              <div class="rbs-ref-lines">- Hypoglycemia: &lt; 70
- Normal: 70 – 120
- Hyperglycemia: &gt; 120</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ----- DOM -----
  const el = q => mountEl.querySelector(q);
  const mgInput   = el("#rbs-mg");
  const btnGo     = el("#rbs-convert");
  const btnClear  = el("#rbs-clear");
  const resultBox = el("#rbs-result");
  const pill      = el("#rbs-pill");
  const strip     = el("#rbs-strip");
  const card      = el("#rbs-card");
  const valOut    = el("#rbs-val");
  const err       = el("#rbs-err");

  // Quick preset chips
  mountEl.querySelectorAll(".rbs-chip").forEach(chip=>{
    chip.addEventListener("click", ()=>{
      mgInput.value = chip.getAttribute("data-v") || "";
      err.style.display = "none";
      mgInput.focus();
    });
  });

  btnGo.addEventListener("click", handleConvert);
  btnClear.addEventListener("click", () => {
    mgInput.value = "";
    resultBox.style.display = "none";
    err.style.display = "none";
    // reset tints
    strip.className = "strip";
    card.className  = "rbs-card";
  });

  // Enter key convenience
  mgInput.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); handleConvert(); }
  });

  // If a hash param like #tool=rbs&mg=110 exists, prefill
  const mgPrefill = (params && params.mg) || getHashParam("mg");
  if (mgPrefill) {
    mgInput.value = mgPrefill;
    handleConvert();
  }

  function handleConvert() {
    const raw = (mgInput.value || "").trim();
    const mg = Number.parseFloat(raw);
    if (!raw || !Number.isFinite(mg) || mg < 0) {
      err.style.display = "block";
      resultBox.style.display = "none";
      return;
    }
    err.style.display = "none";

    // mg/dL → mmol/L
    const mmol = mg / 18;
    const mmolText = formatOneDecimal(mmol);
    valOut.textContent = mmolText;

    // Categories + visuals
    let tintClass = "tint-norm";
    let stripClass = "strip-norm";
    let pillClass = "pill-norm";
    let statusText = "Normal";

    if (mg < 70) {
      tintClass = "tint-low";
      stripClass = "strip-low";
      pillClass  = "pill-low";
      statusText = "Hypoglycemia";
    } else if (mg > 120) {
      tintClass = "tint-high";
      stripClass = "strip-high";
      pillClass  = "pill-high";
      statusText = "Hyperglycemia";
    }

    // apply classes
    strip.className = `strip ${stripClass}`;
    card.className  = `rbs-card ${tintClass}`;
    pill.className  = `rbs-pill ${pillClass}`;
    pill.textContent = statusText;

    resultBox.style.display = "block";

    // make the result shareable in URL
    tryUpdateHash({ tool: "rbs", mg: mg.toString() });
  }

  function formatOneDecimal(value) {
    // round to 1 decimal like Kotlin version
    return (Math.round(value * 10) / 10).toFixed(1);
  }

  function tryUpdateHash(obj) {
    if (typeof updateHash === "function") updateHash(obj);
  }
  function getHashParam(key) {
    try {
      const h = new URLSearchParams((location.hash||"").replace(/^#/, ""));
      return h.get(key);
    } catch { return null; }
  }
}
