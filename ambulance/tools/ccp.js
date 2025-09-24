// /tools/ccp.js
export async function run(root){
  root.innerHTML = `
    <div style="padding:10px">
      <form id="ccp" style="display:grid;gap:10px">
        <fieldset style="border:1px solid #2b3140;border-radius:12px;padding:10px">
          <legend style="padding:0 6px">Patient</legend>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <label style="display:flex;gap:6px;align-items:center">
              <input type="radio" name="mode" value="age" checked>
              <span>Use Age</span>
            </label>
            <label style="display:flex;gap:6px;align-items:center">
              <input type="radio" name="mode" value="weight">
              <span>Use Weight</span>
            </label>
          </div>

          <div id="ageRow" style="display:grid;grid-template-columns:1.2fr .8fr 1fr;gap:8px;margin-top:8px">
            <label>Age
              <input type="number" min="0" step="1" name="ageVal" placeholder="e.g. 6" required
                style="width:100%;padding:8px;border-radius:8px;border:1px solid #2b3140;background:transparent;color:inherit">
            </label>
            <label>Unit
              <select name="ageUnit" style="width:100%;padding:8px;border-radius:8px;border:1px solid #2b3140;background:transparent;color:inherit">
                <option value="years">years</option>
                <option value="months">months</option>
              </select>
            </label>
            <div style="display:flex;align-items:end">
              <button type="button" id="estWeight" style="width:100%;padding:10px;border-radius:10px;border:1px solid #2b3140;background:linear-gradient(180deg,#ffb43a,#ff9620);color:#fff;font-weight:700">Estimate Weight</button>
            </div>
          </div>

          <div id="weightRow" style="display:none;grid-template-columns:1fr;gap:8px;margin-top:8px">
            <label>Weight (kg)
              <input type="number" min="0" step="0.1" name="weight" placeholder="e.g. 18.5"
                style="width:100%;padding:8px;border-radius:8px;border:1px solid #2b3140;background:transparent;color:inherit">
            </label>
          </div>
        </fieldset>

        <fieldset style="border:1px solid #2b3140;border-radius:12px;padding:10px">
          <legend style="padding:0 6px">Medication</legend>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <label>Choose
              <select name="med" style="width:100%;padding:8px;border-radius:8px;border:1px solid #2b3140;background:transparent;color:inherit">
                <option value="adenosine">Adenosine</option>
                <option value="amiodarone">Amiodarone</option>
                <option value="ketamine">Ketamine</option>
                <option value="midazolam">Midazolam</option>
              </select>
            </label>
            <label>Route
              <select name="route" style="width:100%;padding:8px;border-radius:8px;border:1px solid #2b3140;background:transparent;color:inherit">
                <option value="iv">IV</option>
                <option value="io">IO</option>
                <option value="im">IM</option>
                <option value="intranasal">IN</option>
              </select>
            </label>
          </div>
        </fieldset>

        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="submit" style="padding:10px 14px;border-radius:10px;border:1px solid #2b3140;background:linear-gradient(180deg,#3a7bfd,#2660ea);color:#fff;font-weight:700">Calculate</button>
          <button type="button" id="reset" style="padding:10px 14px;border-radius:10px;border:1px solid #2b3140;background:linear-gradient(180deg,#64748b,#475569);color:#fff;font-weight:700">Reset</button>
        </div>
      </form>

      <div id="ccpOut" style="padding:10px"></div>
      <p style="font-size:12px;color:#9aa6c3;margin:6px 10px 0">
        * Doses here are placeholders for demo. Paste your verified Kotlin logic where indicated.
      </p>
    </div>
  `;

  const form = root.querySelector("#ccp");
  const out  = root.querySelector("#ccpOut");
  const estBtn = root.querySelector("#estWeight");
  const weightRow = root.querySelector("#weightRow");
  const ageRow = root.querySelector("#ageRow");

  // Switch between Age/Weight modes
  form.mode.forEach(r => r.addEventListener("change", ()=>{
    const useAge = form.mode.value === "age";
    ageRow.style.display = useAge ? "grid" : "none";
    weightRow.style.display = useAge ? "none" : "grid";
  }));

  // Placeholder Broselow-like simple estimate (DEMO ONLY)
  estBtn.addEventListener("click", ()=>{
    const ageVal = Number(form.ageVal.value || 0);
    const unit = form.ageUnit.value;
    let years = unit === "months" ? ageVal/12 : ageVal;
    years = Math.max(0, years);
    // very rough toy model: 3.5 kg @ birth → +2.5 kg/yr up to 10, then +3 kg/yr
    let w = (years<=0.5) ? 6
        : (years<=10 ? 3.5 + 2.5*years
                     : 3.5 + 2.5*10 + 3*(years-10));
    w = Math.round(w*10)/10;
    form.weight.value = String(w);
    // Flip to weight mode automatically
    form.mode.value = "weight";
    ageRow.style.display = "none"; weightRow.style.display = "grid";
  });

  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const mode  = fd.get("mode");
    const route = String(fd.get("route"));
    const med   = String(fd.get("med"));

    // Weight resolution
    let weightKg = 0;
    if (mode === "weight"){
      weightKg = Number(fd.get("weight") || 0);
    } else {
      // If user didn't hit "Estimate Weight" button, estimate now as safety net
      const ageVal = Number(fd.get("ageVal") || 0);
      const unit   = String(fd.get("ageUnit") || "years");
      let years = unit === "months" ? ageVal/12 : ageVal;
      let w = (years<=0.5) ? 6 : (years<=10 ? 3.5 + 2.5*years : 3.5 + 25 + 3*(years-10));
      weightKg = Math.max(0, Math.round(w*10)/10);
    }

    // -------------------------------
    // PLACEHOLDER DOSING (replace with your Kotlin logic)
    const MEDS = {
      adenosine:  { label:"Adenosine",   dMgPerKg:0.1,  maxMg:6,  note:"1st dose (IV push rapid). 2nd dose often 0.2 mg/kg; adjust per protocol." },
      amiodarone:{ label:"Amiodarone",  dMgPerKg:5,    maxMg:300, note:"Over 20–60 min per local protocol." },
      ketamine:   { label:"Ketamine",    dMgPerKg:1,    maxMg:100, note:"IV 1 mg/kg (analgesia/sedation) — demo only." },
      midazolam:  { label:"Midazolam",   dMgPerKg:0.1,  maxMg:10,  note:"0.1 mg/kg IV/IO (max 10 mg) — demo only." }
    };
    const cfg = MEDS[med];

    // Compute
    const doseMg = Math.min(cfg.maxMg, Math.round(cfg.dMgPerKg * weightKg * 10)/10);
    const volMl  = Math.round((doseMg / 5) * 100)/100; // assume 5 mg/mL for demo

    out.innerHTML = `
      <div style="border:1px solid #2b3140;border-radius:12px;padding:12px">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div><b>${cfg.label}</b> (${route.toUpperCase()})</div>
          <div>Weight: <b>${weightKg} kg</b></div>
        </div>
        <div style="margin-top:8px">Calculated dose: <b>${doseMg} mg</b></div>
        <div>Approx volume: <b>${volMl} mL</b> <span style="color:#9aa6c3">(assumed 5 mg/mL)</span></div>
        <div style="margin-top:8px;color:#9aa6c3;font-size:12px">${cfg.note}</div>
      </div>
    `;

    // deep-link core state
    const p = new URLSearchParams(location.hash.replace(/^#/, ""));
    p.set("tool","ccp"); p.set("med",med); p.set("route",route); p.set("w",String(weightKg));
    history.replaceState(null,"",`#${p.toString()}`);
  });

  // prefill from deep-link
  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  if (h.get("med"))   root.querySelector('[name="med"]').value = h.get("med");
  if (h.get("route")) root.querySelector('[name="route"]').value = h.get("route");
  if (h.get("w"))     root.querySelector('[name="weight"]').value = h.get("w");
}
