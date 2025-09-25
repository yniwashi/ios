// /tools/gcs.js
export async function run(root){
  root.innerHTML = `
    <form id="gcs" style="padding:8px 4px 14px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <label>Eye (E)
          <select name="e" required class="gcs-sel">
            <option value="4">4 — Spontaneous</option>
            <option value="3">3 — To speech</option>
            <option value="2">2 — To pain</option>
            <option value="1">1 — None</option>
          </select>
        </label>
        <label>Verbal (V)
          <select name="v" required class="gcs-sel">
            <option value="5">5 — Oriented</option>
            <option value="4">4 — Confused</option>
            <option value="3">3 — Inappropriate</option>
            <option value="2">2 — Incomprehensible</option>
            <option value="1">1 — None</option>
          </select>
        </label>
        <label>Motor (M)
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

      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
        <button type="submit" class="gcs-btn gcs-primary">Compute</button>
        <button type="button" id="reset" class="gcs-btn gcs-muted">Reset</button>
      </div>
    </form>

    <div id="out" style="padding:4px 4px 10px"></div>
  `;

  // Mobile-friendly controls
  const selCss = "margin-top:6px;padding:12px;border-radius:10px;border:1px solid #2b3140;background:transparent;color:inherit;width:100%";
  root.querySelectorAll(".gcs-sel").forEach(sel=>sel.style.cssText = selCss);

  const btnBase = "padding:12px 16px;border-radius:12px;border:1px solid #2b3140;color:#fff;font-weight:800;letter-spacing:.2px";
  const primary = "background:linear-gradient(180deg,#22c1b9,#169e97)";
  const muted   = "background:linear-gradient(180deg,#64748b,#475569)";
  root.querySelector(".gcs-btn.gcs-primary").style.cssText = `${btnBase};${primary}`;
  root.querySelector(".gcs-btn.gcs-muted").style.cssText   = `${btnBase};${muted}`;

  const form = root.querySelector("#gcs");
  const out  = root.querySelector("#out");
  const resetBtn = root.querySelector("#reset");

  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const eVal = Number(fd.get("e")), vVal = Number(fd.get("v")), mVal = Number(fd.get("m"));
    const score = eVal + vVal + mVal;

    out.innerHTML = `
      <div style="border:1px solid #2b3140;border-radius:14px;padding:14px">
        <div style="font-weight:900;margin-bottom:6px;font-size:18px">GCS = ${score}</div>
        <div style="opacity:.85">E:${eVal} &nbsp; V:${vVal} &nbsp; M:${mVal}</div>
      </div>
    `;

    const p = new URLSearchParams(location.hash.replace(/^#/, ""));
    p.set("tool","gcs"); p.set("e",String(eVal)); p.set("v",String(vVal)); p.set("m",String(mVal));
    history.replaceState(null,"",`#${p.toString()}`);
  });

  resetBtn.addEventListener("click", ()=>{
    form.reset(); out.innerHTML = "";
    const p = new URLSearchParams(location.hash.replace(/^#/, ""));
    p.delete("e"); p.delete("v"); p.delete("m"); p.set("tool","gcs");
    history.replaceState(null,"",`#${p.toString()}`);
  });

  // Deep-link prefill
  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  ["e","v","m"].forEach(k=>{
    if (h.get(k)) root.querySelector(`[name="${k}"]`).value = h.get(k);
  });
}
