// /tools/gcs.js
// Compact GCS with radio "pills", instant scoring, no footer buttons.
// Full card background color changes based on severity. Text fits within each pill.
export async function run(root){
  // Scoped styles
  const style = document.createElement("style");
  style.textContent = `
    .gcs-wrap { padding:14px; max-width:720px; margin:0 auto; }
    .gcs-title { margin:0; font-size:20px; text-align:center; font-weight:900; letter-spacing:.2px }

    .gcs-score {
      margin-top:12px; border-radius:16px; padding:14px 16px;
      display:flex; align-items:center; justify-content:center; gap:10px;
      color:#fff; /* default; overridden by bg classes */
      min-height:64px; text-align:center;
    }
    .gcs-score .val { font-size:22px; font-weight:900; letter-spacing:.3px }
    .gcs-score .sum { font-size:13px; font-weight:700; opacity:.9 }

    /* full background color (not border) */
    .gcs-score.ok   { background:linear-gradient(180deg,#16a34a,#0e7a34) }
    .gcs-score.warn { background:linear-gradient(180deg,#f59e0b,#c67b06) }
    .gcs-score.bad  { background:linear-gradient(180deg,#ef4444,#c03030) }
    .gcs-score.neutral { background:linear-gradient(180deg,#64748b,#475569) }

    .gcs-group { margin-top:12px; border:1px solid #2b3140; border-radius:12px; padding:10px }
    .gcs-group legend { padding:0 6px; font-weight:800; font-size:14px }
    .gcs-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(92px,1fr)); gap:8px; margin-top:8px }

    /* compact pill radios */
    .chip { position:relative; display:block; user-select:none }
    .chip input[type="radio"] { position:absolute; inset:0; opacity:0; pointer-events:none; }
    .chip label {
      display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;
      gap:4px; padding:10px 8px; min-height:56px;
      border-radius:12px; border:1px solid #2b3140; background:var(--surface-2);
      color: var(--text); font-weight:800; font-size:14px; letter-spacing:.2px;
      transition: transform .16s ease, box-shadow .16s ease, background .16s ease, border-color .16s ease;
      cursor:pointer; line-height:1.15;
      word-break: break-word;
    }
    .chip label .k { font-weight:900; font-size:16px }
    .chip input[type="radio"]:checked + label {
      background:linear-gradient(180deg,#22c1b9,#169e97); color:#fff; border-color:#169e97;
      box-shadow: 0 6px 18px rgba(0,0,0,.25);
    }
    .chip label:active { transform: translateY(1px) scale(.99) }
    .chip label:focus-within { outline:2px solid color-mix(in oklab, var(--accent) 50%, transparent); outline-offset:2px }

    @media (min-width: 480px){
      .gcs-row { grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); }
    }
  `;
  root.innerHTML = `
    <div class="gcs-wrap">
      <h2 class="gcs-title">Glasgow Coma Scale</h2>

      <div id="scoreCard" class="gcs-score neutral">
        <div class="val" id="scoreVal">E—, V—, M—</div>
        <div class="sum" id="scoreSum"></div>
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
    </div>
  `;
  root.prepend(style);

  // Options (number + short label)
  const E = [[4,"Spontaneous"],[3,"To speech"],[2,"To pain"],[1,"None"]];
  const V = [[5,"Oriented"],[4,"Confused"],[3,"Inappropriate"],[2,"Incomprehensible"],[1,"None"]];
  const M = [[6,"Obeys"],[5,"Localizes"],[4,"Withdraws"],[3,"Flexion"],[2,"Extension"],[1,"None"]];

  function renderGroup(containerId, name, items){
    const row = root.querySelector(containerId);
    row.innerHTML = "";
    items.forEach(([val, text]) => {
      const id = `${name}-${val}`;
      const wrap = document.createElement("div");
      wrap.className = "chip";
      // two-line layout: number line + label line (fits better)
      wrap.innerHTML = `
        <input type="radio" name="${name}" id="${id}" value="${val}">
        <label for="${id}">
          <span class="k">${val}</span>
          <span class="t">${text}</span>
        </label>
      `;
      row.appendChild(wrap);
    });
  }
  renderGroup("#rowE","e",E);
  renderGroup("#rowV","v",V);
  renderGroup("#rowM","m",M);

  const scoreCard = root.querySelector("#scoreCard");
  const scoreVal  = root.querySelector("#scoreVal");
  const scoreSum  = root.querySelector("#scoreSum");

  function getSelected(name){
    const el = root.querySelector(`input[name="${name}"]:checked`);
    return el ? Number(el.value) : null;
  }

  function setCardClass(cls){
    scoreCard.classList.remove("ok","warn","bad","neutral");
    scoreCard.classList.add(cls);
  }

  function classify(total){
    if (total == null){ setCardClass("neutral"); return; }
    if (total <= 8) setCardClass("bad");
    else if (total <= 12) setCardClass("warn");
    else setCardClass("ok");
  }

  function updateScore(pushHash=true){
    const e = getSelected("e");
    const v = getSelected("v");
    const m = getSelected("m");

    // Main text must say E#, V#, M#
    const parts = [
      `E${e!=null?e:"—"}`,
      `V${v!=null?v:"—"}`,
      `M${m!=null?m:"—"}`
    ];
    scoreVal.textContent = parts.join(", ");

    const ready = e!=null && v!=null && m!=null;
    scoreSum.textContent = ready ? `(Total ${e+v+m})` : "";

    classify(ready ? (e+v+m) : null);

    if (pushHash){
      const p = new URLSearchParams((location.hash||"").replace(/^#/,""));
      p.set("tool","gcs");
      if (e!=null) p.set("e", String(e)); else p.delete("e");
      if (v!=null) p.set("v", String(v)); else p.delete("v");
      if (m!=null) p.set("m", String(m)); else p.delete("m");
      history.replaceState(null,"","#"+p.toString());
    }
  }

  // Wire listeners
  root.querySelectorAll('input[name="e"],input[name="v"],input[name="m"]').forEach(inp=>{
    inp.addEventListener("change", ()=>{
      if (navigator.vibrate) { try{ navigator.vibrate(6); }catch(_){} }
      updateScore(true);
    });
  });

  // Deep-link restore
  const h = new URLSearchParams((location.hash||"").replace(/^#/,""));
  [["e",E],["v",V],["m",M]].forEach(([name])=>{
    const v = h.get(name);
    if (!v) return;
    const opt = root.querySelector(`input[name="${name}"][value="${v}"]`);
    if (opt){ opt.checked = true; }
  });
  updateScore(false);
}
