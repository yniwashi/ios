// /tools/apgar.js
// Full-screen APGAR tool, same sizing as GCS, different colors.
// iOS-friendly: labels not wrapping selects, strong tap targets, solid reset.
export async function run(root){
  root.innerHTML = `
    <div class="tool-root apgar" style="padding:18px;max-width:640px;margin:0 auto;">
      <form id="apgar">
        <h2 style="margin-top:0;font-size:24px;text-align:center;font-weight:900;letter-spacing:.2px">APGAR Score</h2>

        <div style="display:grid;grid-template-columns:1fr;gap:18px;margin-top:22px">
          <div>
            <label for="sel-appearance" style="display:block;font-size:18px;font-weight:700">Appearance (Color)</label>
            <select id="sel-appearance" name="appearance" required class="apgar-sel">
              <option value="0">0 — Blue/pale</option>
              <option value="1">1 — Body pink, extremities blue</option>
              <option value="2">2 — Completely pink</option>
            </select>
          </div>

          <div>
            <label for="sel-pulse" style="display:block;font-size:18px;font-weight:700">Pulse (Heart Rate)</label>
            <select id="sel-pulse" name="pulse" required class="apgar-sel">
              <option value="0">0 — Absent</option>
              <option value="1">1 — &lt; 100 bpm</option>
              <option value="2">2 — ≥ 100 bpm</option>
            </select>
          </div>

          <div>
            <label for="sel-grimace" style="display:block;font-size:18px;font-weight:700">Grimace (Reflex)</label>
            <select id="sel-grimace" name="grimace" required class="apgar-sel">
              <option value="0">0 — No response</option>
              <option value="1">1 — Grimace/weak response</option>
              <option value="2">2 — Cough/sneeze/pulls away</option>
            </select>
          </div>

          <div>
            <label for="sel-activity" style="display:block;font-size:18px;font-weight:700">Activity (Muscle Tone)</label>
            <select id="sel-activity" name="activity" required class="apgar-sel">
              <option value="0">0 — Limp</option>
              <option value="1">1 — Some flexion</option>
              <option value="2">2 — Active motion</option>
            </select>
          </div>

          <div>
            <label for="sel-resp" style="display:block;font-size:18px;font-weight:700">Respiration</label>
            <select id="sel-resp" name="resp" required class="apgar-sel">
              <option value="0">0 — Absent</option>
              <option value="1">1 — Slow/irregular</option>
              <option value="2">2 — Good cry</option>
            </select>
          </div>
        </div>

        <div style="margin-top:26px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center">
          <button type="submit" class="apgar-btn apgar-primary">Compute</button>
          <button type="button" id="reset" class="apgar-btn apgar-muted">Reset</button>
        </div>
      </form>

      <div id="out" style="margin-top:26px"></div>
    </div>
  `;

  // Bigger, tappable controls (APGAR gets a purple/pink theme)
  const selCss = `
    margin-top:10px;
    padding:14px 16px;
    border-radius:14px;
    border:1px solid #3b2b56;  /* darker purple edge */
    background:transparent;
    color:inherit;
    font-size:18px;
    width:100%;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
    touch-action: manipulation;
  `;
  root.querySelectorAll(".apgar-sel").forEach(sel=>sel.style.cssText=selCss);

  const btnBase = `
    padding:14px 20px;
    border-radius:14px;
    border:1px solid #3b2b56;
    color:#fff;
    font-weight:900;
    font-size:18px;
    letter-spacing:.3px;
    min-width:140px;
    touch-action: manipulation;
  `;
  // Primary: purple → pink
  root.querySelector(".apgar-btn.apgar-primary").style.cssText = btnBase + "background:linear-gradient(180deg,#7a5cff,#e34e8a)";
  // Muted: slate
  root.querySelector(".apgar-btn.apgar-muted").style.cssText   = btnBase + "background:linear-gradient(180deg,#64748b,#475569)";

  const form = root.querySelector("#apgar");
  const out  = root.querySelector("#out");
  const resetBtn = root.querySelector("#reset");

  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const A = Number(fd.get("appearance"));
    const P = Number(fd.get("pulse"));
    const G = Number(fd.get("grimace"));
    const Ac= Number(fd.get("activity"));
    const R = Number(fd.get("resp"));
    const total = A + P + G + Ac + R;

    // Simple interpretation band (you can adjust text as you prefer)
    let interp = "Severely depressed (0–3)";
    if (total >= 7) interp = "Normal (7–10)";
    else if (total >= 4) interp = "Moderately depressed (4–6)";

    out.innerHTML = `
      <div style="border:1px solid #3b2b56;border-radius:16px;padding:20px">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div style="font-size:22px;font-weight:900">APGAR = ${total}/10</div>
          <div style="opacity:.8">A:${A} P:${P} G:${G} Ac:${Ac} R:${R}</div>
        </div>
        <div style="margin-top:10px;padding:12px;border-radius:12px;
             background:linear-gradient(180deg,rgba(122,92,255,.15),rgba(227,78,138,.12));
             border:1px solid rgba(59,43,86,.35); font-weight:700">
          ${interp}
        </div>
      </div>
    `;

    // deep link state
    const p = new URLSearchParams(location.hash.replace(/^#/, ""));
    p.set("tool","apgar");
    p.set("A",String(A)); p.set("P",String(P)); p.set("G",String(G));
    p.set("Ac",String(Ac)); p.set("R",String(R));
    history.replaceState(null,"",`#${p.toString()}`);
  });

  // Robust reset (iOS-safe)
  resetBtn.addEventListener("click", ()=>{
    form.reset();
    form.querySelectorAll('select').forEach(s => {
      s.selectedIndex = 0;
      s.dispatchEvent(new Event('change', { bubbles: true }));
    });
    out.innerHTML = "";
    history.replaceState(null,"",location.pathname + location.search + "#tool=apgar");
    (document.activeElement && document.activeElement.blur && document.activeElement.blur());
  });

  // Prefill from deep-link if present
  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  const map = {A:"appearance",P:"pulse",G:"grimace",Ac:"activity",R:"resp"};
  Object.entries(map).forEach(([hashKey,name])=>{
    if (h.get(hashKey)) {
      const el = root.querySelector(`[name="${name}"]`);
      if (el) el.value = h.get(hashKey);
    }
  });
}
