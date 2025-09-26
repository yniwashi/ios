// tools/waafels.js
export async function run(mountEl) {
  mountEl.innerHTML = `
    <style>
      /* ========= WAAFELLS (scoped) ========= */
      .waaf-wrap{ padding:12px }
      .waaf-card{
        background:var(--waaf-bg, var(--surface,#ffffff));
        border:1px solid var(--waaf-bd, var(--border,#e7ecf3));
        border-radius:14px; padding:14px;
        box-shadow:0 8px 18px rgba(0,0,0,.12);
      }
      .waaf-head{
        display:flex; align-items:center; justify-content:space-between; gap:10px;
        margin-bottom:10px;
      }
      /* LANDMARK 1 — Title only "WAAFELLS" */
      .waaf-title{ margin:0; font-weight:900; font-size:16px; color:var(--text,#0c1230) }

      /* LANDMARK 2 — Mode pill hidden until a mode is chosen */
      .waaf-pill{
        display:none;                /* hidden by default */
        padding:6px 10px; border-radius:999px; font-weight:800;
        background:#ffd2e1; color:#6c1130; border:1px solid rgba(0,0,0,.08);
      }

      .waaf-strip{ height:6px; border-radius:6px; margin:-4px 0 12px 0;
        background:linear-gradient(90deg,#fa3473,#ff6ea9);
      }

      .waaf-row{ display:flex; gap:10px; flex-wrap:wrap; }
      .waaf-col{ flex:1 1 260px; min-width:240px }
      .waaf-field{ margin-bottom:10px }

      .waaf-label{ font-size:12px; font-weight:700; color:#6e7b91; margin:0 0 4px 2px }
      .waaf-input-wrap{ position:relative }
      .waaf-input{
        width:100%; font-size:18px; font-weight:800; color:var(--text,#0c1230);
        background:var(--surface,#f3f6fb); border:1px solid var(--border,#dbe0ea);
        border-radius:12px; padding:12px 14px; outline:none;
      }

      /* LANDMARK 3 — Larger age group chips */
      .waaf-radio{
        display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;
      }
      .waaf-chip{
        border-radius:999px; border:1px solid var(--border,#dbe0ea);
        background:var(--surface,#f3f6fb);
        padding:12px 16px;            /* bigger */
        font-weight:900;
        font-size:14px;               /* bigger */
        cursor:pointer;
      }
      .waaf-chip[data-active="true"]{
        background:#ffe3ed; border-color:#ff8bb5; color:#6c1130;
      }

      /* LANDMARK 4 — Action heading + AP/CCP buttons */
      .waaf-actions-wrap{ margin-top:12px }
      .waaf-actions-title{
        margin:0 0 6px 2px; font-weight:900; font-size:12px; color:#6e7b91;
        text-transform:uppercase; letter-spacing:.12em;
      }
      .waaf-actions{ display:flex; gap:10px; }
      .waaf-btn{
        border:none; border-radius:12px; padding:10px 14px; font-weight:900; cursor:pointer;
        box-shadow:0 6px 14px rgba(0,0,0,.12);
      }
      .waaf-btn.primary{ color:#fff; background:linear-gradient(180deg,#ff4f8d,#fa3473) }
      .waaf-btn.ghost{ color:var(--text,#0c1230); background:var(--surface,#f3f6fb); border:1px solid var(--border,#dbe0ea); }
      .waaf-btn.push-right{ margin-left:auto }

      /* LANDMARK 5 — Stacked results (one after another) */
      .waaf-results{
        display:flex; flex-direction:column; gap:8px; margin-top:12px;
      }
      .waaf-rowitem{
        background:var(--surface,#f6f8fd); border:1px solid var(--border,#e7ecf3);
        border-radius:12px; padding:10px 12px; display:flex; align-items:baseline; gap:8px;
      }
      .waaf-k{ font-size:12px; font-weight:800; color:#6e7b91; min-width:150px }
      .waaf-v{ font-size:16px; font-weight:900; color:var(--text,#0c1230); word-break:break-word }

      /* ---------- Dark theme tweaks ---------- */
      :root[data-theme="dark"] .waaf-card{
        --waaf-bg:#151921; --waaf-bd:#232a37;
      }
      :root[data-theme="dark"] .waaf-input{
        background:#12151c; border-color:#232a37; color:#eef2ff;
      }
      :root[data-theme="dark"] .waaf-chip{
        background:#12151c; border-color:#232a37; color:#eef2ff;
      }
      :root[data-theme="dark"] .waaf-chip[data-active="true"]{
        background:#4c1329; border-color:#8b2146; color:#ffd7e6;
      }
      :root[data-theme="dark"] .waaf-rowitem{
        background:#12151c; border-color:#232a37;
      }
      :root[data-theme="dark"] .waaf-btn.ghost{
        background:#12151c; border:1px solid #232a37; color:#eef2ff;
      }
    </style>

    <div class="waaf-wrap">
      <div class="waaf-card">
        <div class="waaf-head">
          <h3 class="waaf-title">WAAFELLS</h3>
          <div id="waafModePill" class="waaf-pill"></div>
        </div>

        <div class="waaf-strip"></div>

        <div class="waaf-row">
          <div class="waaf-col">
            <div class="waaf-field">
              <div class="waaf-label">Age</div>
              <div class="waaf-input-wrap">
                <input id="ageInput" class="waaf-input" inputmode="numeric" placeholder="e.g., 8">
              </div>
            </div>
          </div>

          <div class="waaf-col">
            <div class="waaf-label">Age Group</div>
            <div class="waaf-radio" id="ageGroup">
              <button class="waaf-chip" data-val="Months" data-active="true">Months</button>
              <button class="waaf-chip" data-val="Years">Years</button>
            </div>
          </div>
        </div>

        <!-- LANDMARK 4 — Title above AP/CCP + shorter labels -->
        <div class="waaf-actions-wrap">
          <div class="waaf-actions-title">Calculate WAAFELLS for</div>
          <div class="waaf-actions">
            <button id="btnAP"  class="waaf-btn primary">AP</button>
            <button id="btnCCP" class="waaf-btn ghost">CCP</button>
            <button id="btnClear" class="waaf-btn ghost push-right">Clear</button>
          </div>
        </div>

        <!-- LANDMARK 5 — Stacked results with Age at the top -->
        <div class="waaf-results">
          <div class="waaf-rowitem"><div class="waaf-k">Age</div><div id="valAge" class="waaf-v">—</div></div>
          <div class="waaf-rowitem"><div class="waaf-k">Weight</div><div id="valWeight" class="waaf-v">—</div></div>
          <div class="waaf-rowitem"><div class="waaf-k">Adrenaline</div><div id="valAdr" class="waaf-v">—</div></div>
          <div class="waaf-rowitem"><div class="waaf-k">Amiodarone</div><div id="valAmi" class="waaf-v">—</div></div>
          <div class="waaf-rowitem"><div class="waaf-k">Fluids (10–20 mL/kg)</div><div id="valFluids" class="waaf-v">—</div></div>
          <div class="waaf-rowitem"><div class="waaf-k">SGA Size</div><div id="valTube" class="waaf-v">—</div></div>
          <div class="waaf-rowitem"><div class="waaf-k">Energy</div><div id="valEnergy" class="waaf-v">—</div></div>
          <div class="waaf-rowitem"><div class="waaf-k">SBP (mmHg)</div><div id="valSbp" class="waaf-v">—</div></div>
          <div class="waaf-rowitem"><div class="waaf-k">Dextrose 10% (ROSC)</div><div id="valDex" class="waaf-v">—</div></div>
          <div class="waaf-rowitem"><div class="waaf-k">Chest Wall Decompression</div><div id="valNeedle" class="waaf-v">—</div></div>
        </div>

        <!-- LANDMARK 6 — Notes removed -->
      </div>
    </div>
  `;

  /* ====== Helpers ====== */
  const $ = sel => mountEl.querySelector(sel);
  const $$ = sel => [...mountEl.querySelectorAll(sel)];

  const ageInput = $('#ageInput');
  const ageChipWrap = $('#ageGroup');
  const modePill = $('#waafModePill');

  const out = {
    age: $('#valAge'),
    weight: $('#valWeight'),
    adr: $('#valAdr'),
    ami: $('#valAmi'),
    fluids: $('#valFluids'),
    tube: $('#valTube'),
    energy: $('#valEnergy'),
    sbp: $('#valSbp'),
    dex: $('#valDex'),
    needle: $('#valNeedle'),
  };

  function activeAgeGroup(){
    const btn = ageChipWrap.querySelector('[data-active="true"]');
    return btn ? btn.dataset.val : 'Months';
  }
  function setAgeGroup(val){
    $$('.waaf-chip').forEach(b => b.dataset.active = (b.dataset.val === val));
  }

  const clamp = (v, max) => (v > max ? max : v);
  const oneDec = v => (Math.round(v*10)/10).toFixed(1);
  const fmtAgeLabel = (age, grp) => {
    if (grp === 'Months') {
      const n = Math.round(age);
      return n === 1 ? '1 month' : `${n} months`;
    } else {
      const n = Math.round(age);
      return n === 1 ? '1 year' : `${n} years`;
    }
  };

  function clearAll(){
    Object.values(out).forEach(el => el.textContent = '—');
    modePill.textContent = '';
    modePill.style.display = 'none';        // hide mode pill again
    ageInput.value = '';
  }

  // ===== Core calc (same logic as your Kotlin) =====
  function calc(mode){  // mode: 'AP' | 'CCP'
    const grp = activeAgeGroup();        // 'Months' | 'Years'
    const raw = (ageInput.value||'').trim();
    const age = Number(raw);
    if (!raw || Number.isNaN(age) || age < 0){
      clearAll(); return;
    }

    // LANDMARK 2 — show mode pill and set to AP/CCP only
    modePill.textContent = mode;
    modePill.style.display = 'inline-block';

    // Write Age row first
    out.age.textContent = fmtAgeLabel(age, grp);

    // Outputs
    let weight, adrMg, adrMl, amiMg, minFl, maxFl, energy, energySeq, dex, sBP, tube, needle;

    if (grp === 'Months'){
      weight = age * 0.5 + 4;
      adrMg = weight * 0.01;
      adrMl = weight / 10;
      amiMg = weight * 5;
      minFl = weight * 10;
      maxFl = weight * 20;
      dex   = clamp(weight * 2.5, 50);
      sBP   = ((age / 12) * 2) + 70;
      tube  = (weight <= 5) ? 'Size 1' : 'Size 1.5';
      needle = 'IV Catheter 22g\n(Color: Blue | Length: 2.5cm)';

      if (mode === 'AP'){
        energy = clamp(weight * 4, 360);
        energySeq = null;
      } else {
        const s1 = clamp(weight * 4, 360);
        const s2 = clamp(weight * 6, 360);
        const s3 = clamp(weight * 8, 360);
        const s4 = clamp(weight * 10, 360);
        energySeq = `${oneDec(s1)} J → ${oneDec(s2)} J → ${oneDec(s3)} J → ${oneDec(s4)} J`;
      }

    } else {
      if (age <= 5){
        weight = age * 2 + 8;
        adrMg = weight * 0.01;
        adrMl = weight / 10;
        amiMg = weight * 5;
        minFl = weight * 10;
        maxFl = weight * 20;
        dex   = clamp(weight * 2.5, 50);
        sBP   = age * 2 + 70;
        tube  = (weight >= 10 && weight <= 24) ? 'Size 2'
             : (weight >= 25 && weight <= 35) ? 'Size 2.5'
             : '';
        if (age < 2) {
          needle = 'IV Catheter 22g\n(Color: Blue | Length: 2.5cm)';
        } else { // 2..5
          needle = 'IV Catheter 18g\n(Color: Green | Length: 3.2cm)';
        }

        if (mode === 'AP'){
          energy = clamp(weight * 4, 360);
          energySeq = null;
        } else {
          const s1 = clamp(weight * 4, 360);
          const s2 = clamp(weight * 6, 360);
          const s3 = clamp(weight * 8, 360);
          const s4 = clamp(weight * 10, 360);
          energySeq = `${oneDec(s1)} J → ${oneDec(s2)} J → ${oneDec(s3)} J → ${oneDec(s4)} J`;
        }

      } else {
        weight = age * 3 + 7;
        adrMg = weight * 0.01;
        adrMl = weight / 10;
        amiMg = weight * 5;
        minFl = weight * 10;
        maxFl = weight * 20;
        dex   = clamp(weight * 2.5, 50);
        sBP   = age * 2 + 70;
        tube  = (weight >= 25 && weight <= 35) ? 'Size 2.5'
             : (weight > 35) ? 'Consider adult SGA sizes'
             : '';
        if (age === 6){
          needle = 'IV Catheter 18g\n(Color: Green | Length: 3.2cm)';
        } else if (age >= 7 && age <= 13){
          needle = 'IV Catheter 16g\n(Color: Grey | Length: 4.5cm)';
        } else {
          needle = 'IV Catheter 16g\n(Color: Grey | Length: 4.5cm)\nConsider patient size\nLonger needle may be required\nARS Needle 10g or 14g';
        }

        if (mode === 'AP'){
          energy = clamp(weight * 4, 360);
          energySeq = null;
        } else {
          const s1 = clamp(weight * 4, 360);
          const s2 = clamp(weight * 6, 360);
          const s3 = clamp(weight * 8, 360);
          const s4 = clamp(weight * 10, 360);
          energySeq = `${oneDec(s1)} J → ${oneDec(s2)} J → ${oneDec(s3)} J → ${oneDec(s4)} J`;
        }
      }
    }

    // Write outputs (stacked)
    out.weight.textContent = `${oneDec(weight)} kg`;
    out.adr.textContent    = `${oneDec(adrMg)} mg (${oneDec(adrMl)} mL)`;
    out.ami.textContent    = `${oneDec(amiMg)} mg (${oneDec(adrMl)} mL)`;
    out.fluids.textContent = `${Math.round(minFl)} – ${Math.round(maxFl)} mL`;
    out.tube.textContent   = tube || '—';
    out.energy.textContent = energySeq ? energySeq : `${oneDec(energy)} J`;
    out.sbp.textContent    = `${Math.round(sBP)} mmHg`;
    out.dex.textContent    = `${oneDec(dex)} mL`;
    out.needle.textContent = needle;
  }

  // Wire up
  $$('.waaf-chip').forEach(ch => ch.addEventListener('click', () => {
    setAgeGroup(ch.dataset.val);
  }));
  $('#btnAP').addEventListener('click', () => calc('AP'));
  $('#btnCCP').addEventListener('click', () => calc('CCP'));
  $('#btnClear').addEventListener('click', () => clearAll());

  // init
  clearAll();
}
