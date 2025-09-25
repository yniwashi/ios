// /tools/gcs.js
// GCS with compact horizontal chips per category (fast taps, tiny height, full text visible).
export async function run(root){
  root.innerHTML = "";

  const style = document.createElement("style");
  style.textContent = `
  .gcs-wrap{padding:8px 10px;max-width:760px;margin:0 auto;-webkit-text-size-adjust:100%}
  .gcs-title{margin:0 0 6px;font-size:16px;text-align:center;font-weight:900;letter-spacing:.2px}

  /* Score card (full background) */
  .gcs-score{border-radius:10px;padding:6px 10px;display:flex;align-items:center;justify-content:center;gap:8px;color:#fff;min-height:34px;text-align:center}
  .gcs-score .val{font-size:14px;font-weight:900}
  .gcs-score .sum{font-size:11px;font-weight:700;opacity:.9}
  .gcs-score.ok{background:linear-gradient(180deg,#16a34a,#0e7a34)}
  .gcs-score.warn{background:linear-gradient(180deg,#f59e0b,#c67b06)}
  .gcs-score.bad{background:linear-gradient(180deg,#ef4444,#c03030)}
  .gcs-score.neutral{background:linear-gradient(180deg,#64748b,#475569)}

  /* Section */
  .gcs-sec{margin-top:8px}
  .gcs-sec .hd{font-size:12px;font-weight:800;color:var(--muted);margin:0 0 6px 4px}

  /* Chip row — single thin line, wraps if needed */
  .chip-row{
    display:flex; flex-wrap:wrap; gap:6px;
    align-items:stretch;
  }

  /* Each chip is a label tied to a visually-hidden radio */
  .chip{position:relative;display:inline-flex;align-items:center;gap:6px;
    padding:6px 8px;border:1px solid var(--border);border-radius:999px;background:var(--surface-2);
    color:var(--text);cursor:pointer;line-height:1.1; font-weight:800; font-size:12.5px;
  }
  .chip input{position:absolute;opacity:0;pointer-events:none}
  .chip .kv{display:inline-flex;align-items:center;gap:6px;min-width:0}
  .chip .n{font-weight:900;font-size:12.5px;flex:none}
  .chip .t{white-space:nowrap}                /* keep row compact; allow wrap on very narrow screens below */
  @media (max-width:360px){ .chip .t{white-space:normal} } /* allow wrap when space is super tight */

  .chip.selected{
    background:linear-gradient(180deg,#22c1b9,#169e97);
    border-color:#169e97; color:#fff;
    box-shadow:0 4px 12px rgba(0,0,0,.2)
  }

  /* Make the rows super thin overall */
  .chip-row .chip{min-height:28px}

  /* Reduce outer spacing so everything fits on one mobile view */
  .gcs-wrap .gcs-sec + .gcs-sec{margin-top:6px}
  `;
  root.appendChild(style);

  root.insertAdjacentHTML("afterbegin", `
    <div class="gcs-wrap">
      <h2 class="gcs-title">Glasgow Coma Scale</h2>

      <div id="scoreCard" class="gcs-score neutral">
        <div class="val" id="scoreVal">E—, V—, M—</div>
        <div class="sum" id="scoreSum"></div>
      </div>

      <section class="gcs-sec" aria-labelledby="hd-e">
        <h3 id="hd-e" class="hd">Eye (E)</h3>
        <div id="rowE" class="chip-row" role="radiogroup" aria-label="Eye response"></div>
      </section>

      <section class="gcs-sec" aria-labelledby="hd-v">
        <h3 id="hd-v" class="hd">Verbal (V)</h3>
        <div id="rowV" class="chip-row" role="radiogroup" aria-label="Verbal response"></div>
      </section>

      <section class="gcs-sec" aria-labelledby="hd-m">
        <h3 id="hd-m" class="hd">Motor (M)</h3>
        <div id="rowM" class="chip-row" role="radiogroup" aria-label="Motor response"></div>
      </section>
    </div>
  `);

  // Options
  const E = [[4,"Spontaneous"],[3,"To speech"],[2,"To pain"],[1,"None"]];
  const V = [[5,"Oriented"],[4,"Confused"],[3,"Inappropriate"],[2,"Incomprehensible"],[1,"None"]];
  const M = [[6,"Obeys"],[5,"Localizes"],[4,"Withdraws"],[3,"Flexion"],[2,"Extension"],[1,"None"]];

  // Render a chip row (horizontal, compact)
  function renderRow(sel, name, items){
    const row = root.querySelector(sel);
    row.innerHTML = "";
    items.forEach(([val, text])=>{
      const id = `${name}-${val}`;
      const el = document.createElement("label");
      el.className = "chip";
      el.setAttribute("for", id);
      el.innerHTML = `
        <input type="radio" id="${id}" name="${name}" value="${val}">
        <span class="kv"><span class="n">${val}</span><span class="t">${text}</span></span>
      `;
      row.appendChild(el);
    });
  }
  renderRow("#rowE","e",E);
  renderRow("#rowV","v",V);
  renderRow("#rowM","m",M);

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
  function syncSelectedClass(){
    ["e","v","m"].forEach(name=>{
      root.querySelectorAll(`input[name="${name}"]`).forEach(inp=>{
        const chip = inp.parentElement?.parentElement || null; // label.chip
        if (!chip) return;
        if (inp.checked) chip.classList.add("selected");
        else chip.classList.remove("selected");
      });
    });
  }
  function updateScore(pushHash=true){
    syncSelectedClass();
    const e = getSelected("e");
    const v = getSelected("v");
    const m = getSelected("m");

    scoreVal.textContent = `E${e!=null?e:"—"}, V${v!=null?v:"—"}, M${m!=null?m:"—"}`;
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

  // Wire events
  root.querySelectorAll('#rowE input, #rowV input, #rowM input').forEach(inp=>{
    inp.addEventListener("change", ()=>{
      if (navigator.vibrate) { try{ navigator.vibrate(5); }catch(_){} }
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
