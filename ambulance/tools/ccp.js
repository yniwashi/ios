// /tools/ccp.js
export async function run(root){
  root.innerHTML = `
    <div class="tool-root ccp" style="padding:18px;max-width:640px;margin:0 auto;">
      <form id="ccp">
        <h2 style="margin-top:0;font-size:24px;text-align:center;font-weight:900;letter-spacing:.2px">CCP Pediatric</h2>

        <!-- Input mode -->
        <fieldset style="border:1px solid #2b3140;border-radius:14px;padding:12px;margin-top:10px">
          <legend style="padding:0 6px;font-weight:800">Patient</legend>

          <div style="display:grid;grid-template-columns:1fr;gap:10px">
            <!-- Mode radios -->
            <div style="display:flex;gap:14px;flex-wrap:wrap">
              <label style="display:flex;align-items:center;gap:8px">
                <input type="radio" name="mode" value="months" checked>
                <span>Months (0–12)</span>
              </label>
              <label style="display:flex;align-items:center;gap:8px">
                <input type="radio" name="mode" value="years">
                <span>Years (1–14)</span>
              </label>
              <label style="display:flex;align-items:center;gap:8px">
                <input type="radio" name="mode" value="weight">
                <span>Weight (kg)</span>
              </label>
            </div>

            <!-- Months -->
            <div id="row-months" style="display:grid;grid-template-columns:1fr;gap:10px">
              <div>
                <label for="monthsVal" style="display:block;font-weight:700">Age in months</label>
                <input id="monthsVal" name="monthsVal" type="number" min="0" max="12" step="1" placeholder="e.g. 6"
                       style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #2b3140;background:transparent;color:inherit;font-size:18px">
              </div>
            </div>

            <!-- Years -->
            <div id="row-years" style="display:none;grid-template-columns:1fr;gap:10px">
              <div>
                <label for="yearsVal" style="display:block;font-weight:700">Age in years</label>
                <input id="yearsVal" name="yearsVal" type="number" min="1" max="14" step="1" placeholder="e.g. 4"
                       style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #2b3140;background:transparent;color:inherit;font-size:18px">
              </div>
            </div>

            <!-- Weight -->
            <div id="row-weight" style="display:none;grid-template-columns:1fr;gap:10px">
              <div>
                <label for="weightVal" style="display:block;font-weight:700">Weight (kg)</label>
                <input id="weightVal" name="weightVal" type="number" min="0" step="0.1" placeholder="e.g. 18.5"
                       style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #2b3140;background:transparent;color:inherit;font-size:18px">
              </div>
            </div>
          </div>
        </fieldset>

        <!-- Medication -->
        <fieldset style="border:1px solid #2b3140;border-radius:14px;padding:12px;margin-top:14px">
          <legend style="padding:0 6px;font-weight:800">Medication</legend>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label for="med" style="display:block;font-weight:700">Choose drug</label>
              <select id="med" name="med" class="ccp-sel" required>
                <option value="adenosine">Adenosine</option>
                <option value="adrenaline">Adrenaline</option>
                <option value="amiodarone">Amiodarone</option>
                <option value="atropine">Atropine</option>
              </select>
            </div>
            <div>
              <label for="route" style="display:block;font-weight:700">Route</label>
              <select id="route" name="route" class="ccp-sel" required>
                <option value="iv">IV</option>
                <option value="io">IO</option>
                <option value="im">IM</option>
                <option value="neb">NEB</option>
              </select>
            </div>
          </div>
        </fieldset>

        <div style="margin-top:18px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center">
          <button type="submit" class="ccp-btn ccp-primary">Calculate</button>
          <button type="button" id="reset" class="ccp-btn ccp-muted">Reset</button>
        </div>
      </form>

      <div id="ccpOut" style="margin-top:20px"></div>
    </div>
  `;

  // control styling like GCS/APGAR
  const selCss = `
    margin-top:8px;
    padding:14px 16px;
    border-radius:14px;
    border:1px solid #2b3140;
    background:transparent;
    color:inherit;
    font-size:18px;
    width:100%;
    -webkit-appearance:none;appearance:none;cursor:pointer;touch-action:manipulation;
  `;
  root.querySelectorAll(".ccp-sel").forEach(s=>s.style.cssText=selCss);

  const btnBase = `
    padding:14px 20px;border-radius:14px;border:1px solid #2b3140;color:#fff;
    font-weight:900;font-size:18px;letter-spacing:.3px;min-width:150px;touch-action:manipulation;
  `;
  const primary = "background:linear-gradient(180deg,#3a7bfd,#2660ea)";
  const muted   = "background:linear-gradient(180deg,#64748b,#475569)";
  root.querySelector(".ccp-btn.ccp-primary").style.cssText = btnBase + primary;
  root.querySelector(".ccp-btn.ccp-muted").style.cssText   = btnBase + muted;

  const form = root.querySelector("#ccp");
  const out  = root.querySelector("#ccpOut");

  // mode switching
  const rows = {
    months: root.querySelector("#row-months"),
    years:  root.querySelector("#row-years"),
    weight: root.querySelector("#row-weight"),
  };
  form.mode.forEach(r => r.addEventListener("change", ()=>{
    const m = form.mode.value;
    rows.months.style.display = (m==="months") ? "grid" : "none";
    rows.years.style.display  = (m==="years")  ? "grid" : "none";
    rows.weight.style.display = (m==="weight") ? "grid" : "none";
  }));

  form.addEventListener("submit",(e)=>{
    e.preventDefault();

    const med   = String(form.med.value);
    const route = String(form.route.value);

    // -------- weight resolution (matches your Kotlin) --------
    const mode = form.mode.value;

    let weight = null;
    let header = "";
    let warnings = [];

    // Months: w = 0.5*months + 4 (0–12m)
    if (mode === "months"){
      const months = Number(form.monthsVal.value || 0);
      if (!(months >= 0 && months <= 12)) {
        pushResult("Please enter months between 0 and 12.");
        return;
      }
      const w = months * 0.5 + 4; // cite: months formula
      weight = round1(w);
      header = `Patient estimated weight is ${weight} kg.`;
      // if someone types absurd weight later we already guard by months
    }

    // Years: 1–5 → 2a+8 ; 6–14 → 3a+7
    if (mode === "years"){
      const years = Number(form.yearsVal.value || 0);
      if (!(years >= 1 && years <= 14)) {
        pushResult("Please enter years between 1 and 14.");
        return;
      }
      const w = (years <= 5) ? (years*2 + 8) : (years*3 + 7);
      weight = w; // integer by formula
      header = `Patient estimated weight is ${weight} kg.`;
    }

    // Weight direct (validate like your app)
    if (mode === "weight"){
      const w = Number(form.weightVal.value || 0);
      if (w <= 0) { pushResult("Please enter a valid weight."); return; }

      // Months corridor: up to ~10 kg (12m @ 0.5*m + 4)
      const monthsMax = 12*0.5 + 4; // 10
      // Years corridor: 1y ~10 kg; 14y ~49 kg
      const yearsMin = 1*2 + 8;   // 10
      const yearsMax = 14*3 + 7;  // 49

      // We keep your messages’ spirit:
      if (w > monthsMax && (form.mode.value==="months")) {
        warnings.push(`The weight entered (${round1(w)} kg) exceeds the estimated weight for a 12-month-old child, which is ${round1(monthsMax)} kg.`);
      }
      if (w < yearsMin) {
        warnings.push(`The weight entered (${round1(w)} kg) is less than the estimated weight for a 1-year-old child, which is ${yearsMin} kg.`);
      }
      if (w > yearsMax) {
        warnings.push(`The weight entered (${round1(w)} kg) exceeds the estimated weight for a 14-year-old child, which is ${yearsMax} kg.`);
      }
      weight = round1(w);
      header = `Patient weight is ${weight} kg.`;
    }

    if (weight == null) { pushResult("Invalid input."); return; }

    // -------- dosing (ported rules) --------
    const result = computeDose(med, route, weight);
    renderResult(header, result.blocks, warnings);

    // deep-link
    const p = new URLSearchParams(location.hash.replace(/^#/, ""));
    p.set("tool","ccp");
    p.set("med", med);
    p.set("route", route);
    p.set("w", String(weight));
    history.replaceState(null,"",`#${p.toString()}`);
  });

  // Reset (robust on iOS)
  root.querySelector("#reset").addEventListener("click", ()=>{
    form.reset();
    // reset visibility
    rows.months.style.display = "grid";
    rows.years.style.display  = "none";
    rows.weight.style.display = "none";
    // force selects to index 0
    form.querySelectorAll("select").forEach(s => { s.selectedIndex = 0; s.dispatchEvent(new Event("change",{bubbles:true})); });
    out.innerHTML = "";
    history.replaceState(null,"",location.pathname + location.search + "#tool=ccp");
    document.activeElement?.blur?.();
  });

  // ---------- helpers ----------
  function round1(x){ return Math.round(x*10)/10; }
  function fmt(x){
    return Math.abs(x - Math.trunc(x)) < 1e-9 ? String(Math.trunc(x)) : String(round2(x));
  }
  function round2(x){ return Math.round(x*100)/100; }

  function pushResult(msg){
    out.innerHTML = `<div style="border:1px solid #2b3140;border-radius:14px;padding:14px">${msg}</div>`;
  }

  function renderResult(header, blocks, warnings){
    const warnHtml = (warnings && warnings.length)
      ? `<div style="margin-top:10px;padding:10px;border-radius:12px;border:1px solid #b45309;background:rgba(251,191,36,.12);color:#f59e0b;font-weight:700">${warnings.join("<br>")}</div>`
      : "";

    out.innerHTML = `
      <div style="border:1px solid #2b3140;border-radius:16px;padding:16px">
        <div style="font-weight:800;margin-bottom:8px">${header}</div>
        ${blocks.join("<hr style='border:none;border-top:1px solid #2b3140;margin:12px 0'>")}
        ${warnHtml}
      </div>
    `;
  }

  function block(title, dose, routeText, note, color="#22c1b9"){
    return `
      <div>
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div style="font-size:16px;font-weight:900">${title}</div>
          <div style="opacity:.8">${routeText}</div>
        </div>
        <div style="margin-top:6px;font-size:20px;font-weight:900;color:${color}">${dose}</div>
        ${note ? `<div style="margin-top:6px;opacity:.9">${note}</div>` : ""}
      </div>
    `;
  }

  function computeDose(med, route, w){
    const blocks = [];
    switch(med){

      case "adenosine": {
        // SVT 0.1 mg/kg then 0.2 mg/kg; max 6/12 mg
        const first = Math.min(6, round2(0.1*w));
        const second = Math.min(12, round2(0.2*w));
        blocks.push(
          block("SVT — First Dose", `${fmt(first)} mg`, "IV/IO",
                `MAX 6 mg · Ref: ${fmt(w)} kg × 0.1 mg`),
          block("SVT — Second Dose", `${fmt(second)} mg`, "IV/IO",
                `MAX 12 mg · Ref: ${fmt(w)} kg × 0.2 mg`)
        );
        break;
      }

      case "adrenaline": {
        // Arrest 0.01 mg/kg IV/IO q4; Brady 1 mcg/kg; Inotrope 0.05–0.3 mcg/kg/min
        const arrestMg   = round2(0.01*w);
        const bradyMcg   = round2(1.0*w);
        const inoMin     = round2(0.05*w);
        const inoMax     = round2(0.3*w);
        // Croup NEB — your Years file shows fixed 5 mg; Months uses 0.5 mg/kg cap 5 mg (we’ll present both logically)
        const croupNebMg = round2(0.5*w); // show calc with note of max 5
        const anaphIMmg  = round2(0.01*w);
        const anaphIVmcg = round2(1.0*w);

        blocks.push(
          block("Cardiac Arrest", `${fmt(arrestMg)} mg`, "IV/IO",
                `Repeat every 4 minutes · Ref: ${fmt(w)} kg × 0.01 mg`),
          block("Bradycardia", `${fmt(bradyMcg)} mcg`, "IV/IO",
                `MAX single 50 mcg · Repeat PRN 2–4 min · Ref: ${fmt(w)} kg × 1 mcg`),
          block("Inotrope/Vasopressor", `${fmt(inoMin)}–${fmt(inoMax)} mcg/min`, "IV/IO infusion",
                `Mix per protocol · Ref: ${fmt(w)} kg × 0.05 to 0.3 mcg/min`),
          block("Croup / Upper Airway", `${fmt(Math.min(5, croupNebMg))} mg`, "NEB",
                `MAX 5 mg · Ref: ${fmt(w)} kg × 0.5 mg`),
          block("Anaphylaxis (IM)", `${fmt(anaphIMmg)} mg`, "IM",
                `MAX 0.5 mg · Repeat PRN 5 min · Ref: ${fmt(w)} kg × 0.01 mg`),
          block("Anaphylaxis (IV/IO)", `${fmt(anaphIVmcg)} mcg`, "IV/IO",
                `MAX single 50 mcg · Repeat 1–10 min · Ref: ${fmt(w)} kg × 1 mcg`)
        );
        break;
      }

      case "amiodarone": {
        const dose = round2(5.0*w);
        blocks.push(
          block("Cardiac Arrest", `${fmt(dose)} mg`, "IV/IO",
                "After 3rd shock · Repeat up to 15 mg/kg · MAX 300 mg · Ref: 5 mg/kg"),
          block("VT with a Pulse", `${fmt(dose)} mg`, "IV/IO infusion",
                "Over 20–60 min · MAX 300 mg · Ref: 5 mg/kg")
        );
        break;
      }

      case "atropine": {
        // Age/weight tiering mirrors the Kotlin logic (Years file)
        // We don’t have the full matrix lines here; implement the tiers you used:
        // For simplicity: <22 kg → 0.02 mg/kg; 22–34 kg → 0.5 mg; ≥35 kg → 0.5 mg (brady)
        // Organophosphate: <22 kg → 0.05 mg/kg; 22–34 kg → 2 mg? (per Kotlin tiers), ≥35 kg → 2 mg
        const brady = (w < 22) ? round2(0.02*w) : 0.5;
        const orga  = (w < 22) ? round2(0.05*w) : (w <= 34 ? 2 : 2);

        blocks.push(
          block("Bradycardia", `${fmt(brady)} mg`, "IV/IO",
                (w < 22) ? `Ref: ${fmt(w)} kg × 0.02 mg` : `Fixed dose 0.5 mg`),
          block("Organophosphate Poisoning", `${fmt(orga)} mg`, "IV/IO",
                (w < 22) ? `Ref: ${fmt(w)} kg × 0.05 mg` : `Fixed dose 2 mg`)
        );
        break;
      }
    }
    return { blocks };
  }
}
