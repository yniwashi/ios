// /tools/gcs.js
export async function run(root){
  root.innerHTML = `
    <div class="tool-root gcs" style="padding:18px;max-width:640px;margin:0 auto;">
      <form id="gcs">
        <h2 style="margin-top:0;font-size:24px;text-align:center;font-weight:900;letter-spacing:.2px">Glasgow Coma Scale</h2>

        <div style="display:grid;grid-template-columns:1fr;gap:18px;margin-top:22px">
          <label style="display:flex;flex-direction:column;font-size:18px;font-weight:700">
            Eye (E)
            <select name="e" required class="gcs-sel">
              <option value="4">4 — Spontaneous</option>
              <option value="3">3 — To speech</option>
              <option value="2">2 — To pain</option>
              <option value="1">1 — None</option>
            </select>
          </label>

          <label style="display:flex;flex-direction:column;font-size:18px;font-weight:700">
            Verbal (V)
            <select name="v" required class="gcs-sel">
              <option value="5">5 — Oriented</option>
              <option value="4">4 — Confused</option>
              <option value="3">3 — Inappropriate</option>
              <option value="2">2 — Incomprehensible</option>
              <option value="1">1 — None</option>
            </select>
          </label>

          <label style="display:flex;flex-direction:column;font-size:18px;font-weight:700">
            Motor (M)
            <select name="m" required class="gcs-sel">
              <option value="6">6 — Obeys</option>
              <option value="5">5 — Localizes</option>
              <option value="4">4 — Withdraws</option>
              <option value="3">3 — Flexion</option>
              <option value="2">2 — Extension</option>
              <option value="1">1 — None</option>
            </select>
          </label>
        </div>

        <div style="margin-top:26px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center">
          <button type="submit" class="gcs-btn gcs-primary">Compute</button>
          <button type="button" id="reset" class="gcs-btn gcs-muted">Reset</button>
        </div>
      </form>

      <div id="out" style="margin-top:26px"></div>
    </div>
  `;

  // controls size + padding
  const selCss = `
    margin-top:10px;
    padding:14px 16px;
    border-radius:14px;
    border:1px solid #2b3140;
    background:transparent;
    color:inherit;
    font-size:18px;
    width:100%;
  `;
  root.querySelectorAll(".gcs-sel").forEach(sel=>sel.style.cssText=selCss);

  const btnBase = `
    padding:14px 20px;
    border-radius:14px;
    border:1px solid #2b3140;
    color:#fff;
    font-weight:900;
    font-size:18px;
    letter-spacing:.3px;
    min-width:140px;
  `;
  root.querySelector(".gcs-btn.gcs-primary").style.cssText = btnBase + "background:linear-gradient(180deg,#22c1b9,#169e97)";
  root.querySelector(".gcs-btn.gcs-muted").style.cssText   = btnBase + "background:linear-gradient(180deg,#64748b,#475569)";

  const form = root.querySelector("#gcs");
  const out  = root.querySelector("#out");
  const resetBtn = root.querySelector("#reset");

  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const eVal = Number(fd.get("e")), vVal = Number(fd.get("v")), mVal = Number(fd.get("m"));
    const score = eVal + vVal + mVal;

    out.innerHTML = `
      <div style="border:1px solid #2b3140;border-radius:16px;padding:20px;text-align:center">
        <div style="font-size:36px;font-weight:900;margin-bottom:10px">GCS = ${score}</div>
        <div style="font-size:18px;opacity:.85">Eye ${eVal} + Verbal ${vVal} + Motor ${mVal}</div>
      </div>
    `;

    const p = new URLSearchParams(location.hash.replace(/^#/, ""));
    p.set("tool","gcs"); p.set("e",String(eVal)); p.set("v",String(vVal)); p.set("m",String(mVal));
    history.replaceState(null,"",`#${p.toString()}`);
  });

// ...keep the rest of the file the same

resetBtn.addEventListener("click", ()=>{
  // 1) Reset the form to defaults
  form.reset();

  // 2) Force selects back to their first option (iOS Safari can be stubborn)
  form.querySelectorAll('select').forEach(s => {
    s.selectedIndex = 0;
    // fire change so any listeners update UI
    s.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // 3) Clear results
  out.innerHTML = "";

  // 4) Clean up URL hash (leave only the tool for deep-linking)
  history.replaceState(
    null,
    "",
    location.pathname + location.search + "#tool=gcs"
  );

  // 5) Remove any lingering focus (prevents odd keyboard/picker states)
  (document.activeElement && document.activeElement.blur && document.activeElement.blur());
});


  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  ["e","v","m"].forEach(k=>{
    if (h.get(k)) root.querySelector(`[name="${k}"]`).value = h.get(k);
  });
}
