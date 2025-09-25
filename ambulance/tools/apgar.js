// /tools/apgar.js
// APGAR with horizontal "chips" per category — pink theme, adjustable tokens,
// compact sections with separators, and a clear total out of 10.

export async function run(root){
  root.innerHTML = "";

  // =========================
  // 🎛 TUNABLE DESIGN TOKENS
  // =========================
  const CSS_TOKENS = `
    :root {
      /* Spacing */
      --sec-gap: 18px;                 /* space between APGAR blocks */
      --row-gap: 8px;                  /* space between chips in a row */

      /* Chip size + shape */
      --chip-pad-y: 10px;
      --chip-pad-x: 12px;
      --chip-font: 14px;
      --chip-radius: 999px;            /* 8px for less round */

      /* Number in chip "(2)" */
      --chip-num-size: 16px;

      /* Score card sizes */
      --score-pad-y: 8px;
      --score-pad-x: 12px;
      --score-min-h: 40px;
      --score-val: 18px;               /* "Total 8 / 10" size */
      --score-sum: 13px;               /* details line size */

      /* Selected chip colors (PINK) */
      --chip-sel-start: #ff6ea9;       /* start */
      --chip-sel-end:   #e34e8a;       /* end */
      --chip-sel-text:  #ffffff;

      /* Unselected chip */
      --chip-border: var(--border);
      --chip-bg:     var(--surface-2);
      --chip-text:   var(--text);

      /* Score card gradients */
      --score-ok-start:   #16a34a;
      --score-ok-end:     #0e7a34;
      --score-warn-start: #f59e0b;
      --score-warn-end:   #c67b06;
      --score-bad-start:  #ef4444;
      --score-bad-end:    #c03030;
      --score-neutral-s:  #ff6ea9;     /* pinky neutral backdrop */
      --score-neutral-e:  #e34e8a;
    }
  `;

  const style = document.createElement("style");
  style.textContent = `
  ${CSS_TOKENS}

  .apg-wrap{padding:12px 12px 16px;max-width:760px;margin:0 auto;-webkit-text-size-adjust:100%}
  .apg-title{margin:0 0 8px;font-size:18px;text-align:center;font-weight:900;letter-spacing:.2px}

  /* Score card (full background color) */
  .apg-score{
    border-radius:12px;
    padding:var(--score-pad-y) var(--score-pad-x);
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
    color:#fff; min-height:var(--score-min-h); text-align:center;
    background:linear-gradient(180deg,var(--score-neutral-s),var(--score-neutral-e)); /* pink-neutral until classified */
  }
  .apg-score.ok   { background:linear-gradient(180deg,var(--score-ok-start),var(--score-ok-end)) }
  .apg-score.warn { background:linear-gradient(180deg,var(--score-warn-start),var(--score-warn-end)) }
  .apg-score.bad  { background:linear-gradient(180deg,var(--score-bad-start),var(--score-bad-end)) }

  .apg-score .val{font-size:var(--score-val);font-weight:900}
  .apg-score .sum{font-size:var(--score-sum);font-weight:700;opacity:.95}

  /* Section header + spacing + separator */
  .apg-sec{
    margin-top: var(--sec-gap);
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }
  .apg-sec:first-of-type{ margin-top: 12px }
  .apg-sec:last-of-type{ border-bottom: none }
  .apg-sec .hd{
    font-size:16px;                    /* make titles bigger if you like */
    font-weight:900;
    color:var(--muted);
    margin:0 0 8px 4px;
    letter-spacing:.2px;
  }

  /* Chip row */
  .chip-row{
    display:flex; flex-wrap:wrap; gap:var(--row-gap); align-items:stretch;
  }

  /* Chip (label around a hidden radio) */
  .chip{
    position:relative; display:inline-flex; align-items:center; gap:8px;
    padding:var(--chip-pad-y) var(--chip-pad-x);
    border:1px solid var(--chip-border);
    border-radius:var(--chip-radius);
    background:var(--chip-bg);
    color:var(--chip-text);
    cursor:pointer; line-height:1.1; font-weight:800; font-size:var(--chip-font);
    transition: transform .15s ease, box-shadow .15s ease, background .15s ease, border-color .15s ease, color .15s ease;
    min-height: calc(var(--chip-pad-y)*2 + 20px);
  }
  .chip:active{ transform: translateY(1px) scale(.99) }

  .chip input{ position:absolute; opacity:0; pointer-events:none }

  .chip .kv{ display:inline-flex; align-items:baseline; gap:8px; min-width:0 }
  .chip .n{ font-size:var(--chip-num-size); font-weight:900; flex:none }
  .chip .t{ white-space:nowrap }
  @media (max-width:400px){ .chip .t{ white-space:normal } }

  /* Selected state (pink) */
  .chip.selected{
    background:linear-gradient(180deg,var(--chip-sel-start),var(--chip-sel-end));
    border-color: var(--chip-sel-end);
    color: var(--chip-sel-text);
    box-shadow:0 6px 16px rgba(0,0,0,.22);
  }
  `;
  root.appendChild(style);

  // ---------- Markup ----------
  root.insertAdjacentHTML("afterbegin", `
    <div class="apg-wrap">
      <h2 class="apg-title">APGAR Score</h2>

      <div id="scoreCard" class="apg-score">
        <div class="val" id="scoreVal">Total — / 10</div>
        <div class="sum" id="scoreSum"></div>
      </div>

      <section class="apg-sec" aria-labelledby="hd-appearance">
        <h3 id="hd-appearance" class="hd">Appearance (Skin Color)</h3>
        <div id="rowA" class="chip-row" role="radiogroup" aria-label="Appearance"></div>
      </section>

      <section class="apg-sec" aria-labelledby="hd-pulse">
        <h3 id="hd-pulse" class="hd">Pulse (Heart Rate)</h3>
        <div id="rowP" class="chip-row" role="radiogroup" aria-label="Pulse"></div>
      </section>

      <section class="apg-sec" aria-labelledby="hd-grimace">
        <h3 id="hd-grimace" class="hd">Grimace (Reflex Irritability)</h3>
        <div id="rowG" class="chip-row" role="radiogroup" aria-label="Grimace"></div>
      </section>

      <section class="apg-sec" aria-labelledby="hd-activity">
        <h3 id="hd-activity" class="hd">Activity (Muscle Tone)</h3>
        <div id="rowAc" class="chip-row" role="radiogroup" aria-label="Activity"></div>
      </section>

      <section class="apg-sec" aria-labelledby="hd-resp">
        <h3 id="hd-resp" class="hd">Respiration (Breathing)</h3>
        <div id="rowR" class="chip-row" role="radiogroup" aria-label="Respiration"></div>
      </section>
    </div>
  `);

  // ---------- Options ----------
  // Each is [score, label]
  const Appearance = [
    [0, "Blue/pale all over"],
    [1, "Pink body, blue extremities"],
    [2, "Completely pink"]
  ];
  const Pulse = [
    [0, "Absent"],
    [1, "< 100 bpm"],
    [2, "≥ 100 bpm"]
  ];
  const Grimace = [
    [0, "No response"],
    [1, "Grimace/feeble response"],
    [2, "Cough/sneeze/pull away"]
  ];
  const Activity = [
    [0, "Limp"],
    [1, "Some flexion"],
    [2, "Active motion"]
  ];
  const Respiration = [
    [0, "Absent"],
    [1, "Slow/irregular"],
    [2, "Good, crying"]
  ];

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
        <span class="kv"><span class="n">(${val})</span><span class="t">${text}</span></span>
      `;
      row.appendChild(el);
    });
  }

  renderRow("#rowA",  "a",  Appearance);
  renderRow("#rowP",  "p",  Pulse);
  renderRow("#rowG",  "g",  Grimace);
  renderRow("#rowAc", "ac", Activity);
  renderRow("#rowR",  "r",  Respiration);

  // ---------- State & scoring ----------
  const scoreCard = root.querySelector("#scoreCard");
  const scoreVal  = root.querySelector("#scoreVal");
  const scoreSum  = root.querySelector("#scoreSum");

  function getSel(name){
    const el = root.querySelector(`input[name="${name}"]:checked`);
    return el ? Number(el.value) : null;
  }
  function classify(total){
    // Common cutoffs: 7–10 OK, 4–6 intermediate, 0–3 low
    scoreCard.classList.remove("ok","warn","bad");
    if (total == null){ return; }
    if      (total <= 3) scoreCard.classList.add("bad");
    else if (total <= 6) scoreCard.classList.add("warn");
    else                 scoreCard.classList.add("ok");
  }
  function syncSelectedClass(){
    ["a","p","g","ac","r"].forEach(name=>{
      root.querySelectorAll(`input[name="${name}"]`).forEach(inp=>{
        const chip = inp.closest(".chip");
        if (chip) chip.classList.toggle("selected", !!inp.checked);
      });
    });
  }
  function updateScore(pushHash=true){
    syncSelectedClass();
    const a  = getSel("a");
    const p  = getSel("p");
    const g  = getSel("g");
    const ac = getSel("ac");
    const r  = getSel("r");
    const partsOk = [a,p,g,ac,r].every(v => v !== null);

    if (partsOk){
      const total = a+p+g+ac+r;
      scoreVal.textContent = `Total ${total} / 10`;
      scoreSum.textContent = `(A ${a}, P ${p}, G ${g}, Ac ${ac}, R ${r})`;
      classify(total);
    } else {
      scoreVal.textContent = `Total — / 10`;
      scoreSum.textContent = ``;
      // leave pink-neutral background until classified
    }

    if (pushHash){
      const q = new URLSearchParams((location.hash||"").replace(/^#/,""));
      q.set("tool","apgar");
      if (a!=null)  q.set("a",  String(a));  else q.delete("a");
      if (p!=null)  q.set("p",  String(p));  else q.delete("p");
      if (g!=null)  q.set("g",  String(g));  else q.delete("g");
      if (ac!=null) q.set("ac", String(ac)); else q.delete("ac");
      if (r!=null)  q.set("r",  String(r));  else q.delete("r");
      history.replaceState(null,"","#"+q.toString());
    }
  }

  // Events
  root.querySelectorAll('#rowA input,#rowP input,#rowG input,#rowAc input,#rowR input').forEach(inp=>{
    inp.addEventListener("change", ()=>{
      if (navigator.vibrate) { try{ navigator.vibrate(6); }catch(_){} }
      updateScore(true);
    });
  });

  // Restore from hash
  const h = new URLSearchParams((location.hash||"").replace(/^#/,""));
  [["a",Appearance],["p",Pulse],["g",Grimace],["ac",Activity],["r",Respiration]].forEach(([name])=>{
    const v = h.get(name);
    if (!v) return;
    const el = root.querySelector(`input[name="${name}"][value="${v}"]`);
    if (el) el.checked = true;
  });
  updateScore(false);
}
