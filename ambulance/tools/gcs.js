// /tools/gcs.js
// GCS with big radio "pills", instant scoring, iOS-safe (no selects), deep-linking.
export async function run(root){
  // Scoped styles for the tool (kept inside the panel)
  const style = document.createElement("style");
  style.textContent = `
    .gcs-wrap { padding:18px; max-width:700px; margin:0 auto; }
    .gcs-title { margin:0; font-size:24px; text-align:center; font-weight:900; letter-spacing:.2px }
    .gcs-score {
      margin-top:14px; border:1px solid #2b3140; border-radius:16px; padding:14px;
      display:flex; align-items:center; justify-content:space-between; gap:10px;
      background: var(--surface);
    }
    .gcs-score .val { font-size:32px; font-weight:900 }
    .gcs-score.ok    { border-color: #16a34a; }
    .gcs-score.warn  { border-color: #f59e0b; }
    .gcs-score.bad   { border-color: #ef4444; }

    .gcs-group { margin-top:18px; border:1px solid #2b3140; border-radius:14px; padding:14px }
    .gcs-group legend { padding:0 6px; font-weight:800; font-size:16px }
    .gcs-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; margin-top:10px }

    /* pill radios */
    .chip { position:relative; display:block; user-select:none }
    .chip input[type="radio"] {
      position:absolute; inset:0; opacity:0; pointer-events:none;
    }
    .chip label {
      display:flex; align-items:center; justify-content:center; text-align:center;
      gap:6px; padding:14px 12px; min-height:48px;
      border-radius:14px; border:1px solid #2b3140; background:var(--surface-2);
      color: var(--text); font-weight:800; font-size:16px; letter-spacing:.2px;
      transition: transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
      cursor:pointer;
    }
    .chip label .k { font-weight:900 }
    .chip input[type="radio"]:checked + label {
      background:linear-gradient(180deg,#22c1b9,#169e97); color:#fff; border-color:#169e97;
      box-shadow: 0 6px 18px rgba(0,0,0,.25);
    }
    .chip label:active { transform: translateY(1px) scale(.99) }
    .chip label:focus-within { outline:2px solid color-mix(in oklab, var(--accent) 50%, transparent); outline-offset:2px }

    .gcs-actions { margin-top:18px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap }
    .gbtn {
      padding:14px 18px; border-radius:14px; border:1px solid #2b3140; color:#fff;
      font-weight:900; font-size:16px; letter-spacing:.2px; min-width:140px; touch-action:manipulation;
    }
    .gbtn.primary { background:linear-gradient(180deg,#22c1b9,#169e97) }
    .gbtn.muted   { background:linear-gradient(180deg,#64748b,#475569) }
    @media (min-width: 768px){
      .gcs-row { grid-template-columns:repeat(3, minmax(160px,1fr)); }
    }
  `;
  root.innerHTML = `
    <div class="gcs-wrap">
      <h2 class="gcs-title">Glasgow Coma Scale</h2>

      <div id="scoreCard" class="gcs-score">
        <div style="font-weight:700">Total</div>
        <div class="val" id="scoreVal">—</div>
      </div>

      <fieldset class="gcs-group">
        <legend>Eye (E)</legend>
        <div class="gcs-row" id="rowE"></div>
      </fieldset>

      <fieldset class="gcs-group">
        <legend>Verbal (V)</legend>
        <div class="gcs-row" id="rowV"></div>
      </fieldset>

      <fieldset class="gcs-group">
        <legend>Motor (M)</legend>
        <div class="gcs-row" id="rowM"></div>
      </fieldset>

      <div class="gcs-actions">
        <button type="button" id="copy"  class="gbtn primary">Copy Result</button>
        <button type="button" id="reset" class="gbtn muted">Reset</button>
      </div>
    </div>
  `;
  root.prepend(style);

  // Options (number + short label)
  const E = [
    [4, "Spontaneous"],
    [3, "To speech"],
    [2, "To pain"],
    [1, "None"],
  ];
  const V = [
    [5, "Oriented"],
    [4, "Confused"],
    [3, "Inappropriate"],
    [2, "Incomprehensible"],
    [1, "None"],
  ];
  const M = [
    [6, "Obeys"],
    [5, "Localizes"],
    [4, "Withdraws"],
    [3, "Flexion"],
    [2, "Extension"],
    [1, "None"],
  ];

  // Render a radio group into a container
  function renderGroup(containerId, name, items){
    const row = root.querySelector(containerId);
    row.innerHTML = "";
    items.forEach(([val, text], idx) => {
      const id = `${name}-${val}`;
      const wrap = document.createElement("div");
      wrap.className = "chip";
      wrap.innerHTML = `
        <input type="radio" name="${name}" id="${id}" value="${val}">
        <label for="${id}"><span class="k">${val}</span> — <span>${text}</span></label>
      `;
      row.appendChild(wrap);
    });
  }
  renderGroup("#rowE", "e", E);
  renderGroup("#rowV", "v", V);
  renderGroup("#rowM", "m", M);

  const scoreCard = root.querySelector("#scoreCard");
  const scoreVal  = root.querySelector("#scoreVal");

  function getSelected(name){
    const el = root.querySelector(`input[name="${name}"]:checked`);
    return el ? Number(el.value) : null;
  }

  function classify(total){
    // Simple banding: <=8 red, 9–12 amber, 13–15 green
    scoreCard.classList.remove("ok","warn","bad");
    if (total == null){ return; }
    if (total <= 8)    scoreCard.classList.add("bad");
    else if (total <= 12) scoreCard.classList.add("warn");
    else               scoreCard.classList.add("ok");
  }

  function updateScore(pushHash=true){
    const e = getSelected("e");
    const v = getSelected("v");
    const m = getSelected("m");
    const ready = e!=null && v!=null && m!=null;
    if (!ready){
      scoreVal.textContent = "—";
      scoreCard.classList.remove("ok","warn","bad");
      if (pushHash){
        const p = new URLSearchParams((location.hash||"").replace(/^#/,""));
        p.set("tool","gcs");
        if (e!=null) p.set("e", String(e)); else p.delete("e");
        if (v!=null) p.set("v", String(v)); else p.delete("v");
        if (m!=null) p.set("m", String(m)); else p.delete("m");
        history.replaceState(null,"","#"+p.toString());
      }
      return;
    }
    const total = e + v + m;
    scoreVal.textContent = String(total);
    classify(total);

    if (pushHash){
      const p = new URLSearchParams((location.hash||"").replace(/^#/,""));
      p.set("tool","gcs"); p.set("e",String(e)); p.set("v",String(v)); p.set("m",String(m));
      history.replaceState(null,"","#"+p.toString());
    }
  }

  // Wire listeners
  root.querySelectorAll('input[name="e"],input[name="v"],input[name="m"]').forEach(inp=>{
    inp.addEventListener("change", ()=>{
      // tiny haptic on supported devices
      if (navigator.vibrate) try{ navigator.vibrate(8); }catch(_){}
      updateScore(true);
    });
  });

  // Deep-link restore
  const h = new URLSearchParams((location.hash||"").replace(/^#/,""));
  [["e",E],["v",V],["m",M]].forEach(([name, items])=>{
    const v = h.get(name);
    if (!v) return;
    const opt = root.querySelector(`input[name="${name}"][value="${v}"]`);
    if (opt){ opt.checked = true; }
  });
  updateScore(false);

  // Copy & Reset actions
  root.querySelector("#copy").addEventListener("click", ()=>{
    const e = getSelected("e"), v = getSelected("v"), m = getSelected("m");
    const ready = e!=null && v!=null && m!=null;
    const text = ready ? `GCS ${e+v+m} (E${e} V${v} M${m})` : "GCS: incomplete";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(()=> toast("Copied"));
    } else {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
      toast("Copied");
    }
  });

  root.querySelector("#reset").addEventListener("click", ()=>{
    root.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    updateScore(true);
    // move focus away (prevents accidental select on next tap)
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  });

  function toast(msg){
    // very small non-blocking toast
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:rgba(0,0,0,.8);color:#fff;padding:10px 14px;border-radius:12px;font-weight:700;z-index:9999";
    document.body.appendChild(el);
    setTimeout(()=>{ el.style.opacity="0"; el.style.transition="opacity .25s"; setTimeout(()=>el.remove(),250)}, 900);
  }
}
