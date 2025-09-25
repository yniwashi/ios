// /tools/gcs.js
// GCS — vertical radio lists, compact lines, instant scoring, full-card color.
export async function run(root){
  const style = document.createElement("style");
  style.textContent = `
  .gcs-wrap { padding:8px 10px; max-width:720px; margin:0 auto; }
.gcs-title { margin:0; font-size:17px; text-align:center; font-weight:900; letter-spacing:.2px }

/* Score card */
.gcs-score {
  margin-top:6px; border-radius:10px; padding:8px 10px;
  display:flex; align-items:center; justify-content:center; gap:6px;
  color:#fff; min-height:40px; text-align:center;
}
.gcs-score .val { font-size:15px; font-weight:900; letter-spacing:.2px }
.gcs-score .sum { font-size:11px; font-weight:700; opacity:.9 }
.gcs-score.ok     { background:linear-gradient(180deg,#16a34a,#0e7a34) }
.gcs-score.warn   { background:linear-gradient(180deg,#f59e0b,#c67b06) }
.gcs-score.bad    { background:linear-gradient(180deg,#ef4444,#c03030) }
.gcs-score.neutral{ background:linear-gradient(180deg,#64748b,#475569) }

/* Groups */
.gcs-group { margin-top:6px; border:1px solid var(--border); border-radius:8px; padding:6px; background:var(--surface) }
.gcs-group legend { padding:0 6px; font-weight:800; font-size:12px; color:var(--muted) }

/* Vertical list */
.gcs-list { margin:4px 0 0 0; padding:0; list-style:none; display:flex; flex-direction:column; gap:4px }

/* >>> Ultra-compact radio line <<< */
.line{
  position:relative; display:flex; align-items:flex-start; gap:4px;
  padding:4px 8px; border:1px solid var(--border); border-radius:8px;
  background:var(--surface-2); cursor:pointer; min-height:28px; /* real height cut */
}
.line input[type="radio"]{ position:absolute; opacity:0; pointer-events:none }
.dot{ width:12px; height:12px; border-radius:50%; border:2px solid #2b3140; flex:none; margin-top:2px; background:transparent }

.txt{ display:flex; gap:6px; align-items:baseline; flex-wrap:wrap; line-height:1.15; flex:1; min-width:0 }
.num{ font-weight:900; font-size:12.5px; flex:none }
.desc{
  font-weight:700; font-size:12.5px; opacity:.95;
  word-break:break-word; overflow-wrap:break-word; white-space:normal;
}

/* Selected */
.line.selected{ border-color:#169e97; background:linear-gradient(180deg,#22c1b9,#169e97); color:#fff }
.line.selected .dot{ border-color:rgba(255,255,255,.9); background:#fff }

/* Tightest on very small screens */
@media (max-width:360px){
  .desc{ font-size:12px }
  .line{ padding:5px 7px; min-height:32px }
}

/* Prevent iOS auto text inflation that can blow up row height */
.gcs-wrap { -webkit-text-size-adjust: 100% }


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
        <ul id="listE" class="gcs-list"></ul>
      </fieldset>

      <fieldset class="gcs-group">
        <legend>Verbal (V)</legend>
        <ul id="listV" class="gcs-list"></ul>
      </fieldset>

      <fieldset class="gcs-group">
        <legend>Motor (M)</legend>
        <ul id="listM" class="gcs-list"></ul>
      </fieldset>
    </div>
  `;
  root.prepend(style);

  // Data
  const E = [[4,"Spontaneous"],[3,"To speech"],[2,"To pain"],[1,"None"]];
  const V = [[5,"Oriented"],[4,"Confused"],[3,"Inappropriate"],[2,"Incomprehensible"],[1,"None"]];
  const M = [[6,"Obeys"],[5,"Localizes"],[4,"Withdraws"],[3,"Flexion"],[2,"Extension"],[1,"None"]];

  // Render a vertical list of radio lines
  function renderList(ulId, name, items){
    const ul = root.querySelector(ulId);
    ul.innerHTML = "";
    items.forEach(([val, text])=>{
      const id = `${name}-${val}`;
      const li = document.createElement("li");
      li.innerHTML = `
        <label class="line" for="${id}">
          <input type="radio" id="${id}" name="${name}" value="${val}">
          <span class="dot" aria-hidden="true"></span>
          <span class="txt"><span class="num">${val}</span><span class="desc">${text}</span></span>
        </label>
      `;
      ul.appendChild(li);
    });
  }
  renderList("#listE","e",E);
  renderList("#listV","v",V);
  renderList("#listM","m",M);

  // Helpers
  const scoreCard = root.querySelector("#scoreCard");
  const scoreVal  = root.querySelector("#scoreVal");
  const scoreSum  = root.querySelector("#scoreSum");

  function getSel(name){
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
  function updateSelections(){
    // Toggle selected class on the line wrappers
    ["e","v","m"].forEach(name=>{
      const all = root.querySelectorAll(`input[name="${name}"]`);
      all.forEach(inp=>{
        const line = inp.closest(".line");
        if (!line) return;
        if (inp.checked) line.classList.add("selected");
        else line.classList.remove("selected");
      });
    });
  }
  function updateScore(pushHash=true){
    updateSelections();
    const e = getSel("e"), v = getSel("v"), m = getSel("m");

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

  // Event wiring
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
