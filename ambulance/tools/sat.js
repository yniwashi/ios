// tools/sat.js
export async function run(mountEl){
  mountEl.innerHTML = `
    <style>
      /* ========= SAT Score (scoped) ========= */
      .sat-wrap{ padding:12px }
      .sat-card{
        background:var(--surface,#fff);
        border:1px solid var(--border,#e7ecf3);
        border-radius:14px; padding:14px;
        box-shadow:0 8px 18px rgba(0,0,0,.12);
      }

      .sat-head{ display:flex; align-items:center; justify-content:space-between }
      .sat-title{ margin:0; font-weight:900; font-size:16px; color:var(--text,#0c1230) }

      .sat-strip{ height:6px; border-radius:6px; margin:10px 0 14px 0;
        background:linear-gradient(90deg,#0ea5e9,#6366f1);
      }

      .sat-section{ margin-bottom:12px }
      .sat-label{ margin:0 0 6px 2px; font-size:12px; font-weight:900; letter-spacing:.12em; color:#6e7b91 }
      .sat-group{ display:flex; flex-wrap:wrap; gap:8px }

      /* LANDMARK A — option "chips" behave like radios */
      .sat-chip{
        border-radius:12px; padding:10px 12px; cursor:pointer; user-select:none;
        background:var(--surface,#f6f8fd); border:1px solid var(--border,#e7ecf3);
        color:var(--text,#0c1230); font-weight:800; font-size:13px;
      }
      .sat-chip small{ display:block; font-weight:600; color:#6e7b91; font-size:11px }
      .sat-chip[data-active="true"]{
        background:#e0e7ff; border-color:#6366f1; color:#0b1a3a;
      }

      .sat-actions{ display:flex; gap:10px; margin:6px 0 4px }
      .sat-btn{
        border:none; border-radius:12px; padding:10px 14px; font-weight:900; cursor:pointer;
        box-shadow:0 6px 14px rgba(0,0,0,.12); background:var(--surface,#f3f6fb);
        border:1px solid var(--border,#dbe0ea); color:var(--text,#0c1230);
      }

      /* LANDMARK B — result block */
      .sat-result{
        margin-top:10px; padding:12px; border-radius:12px;
        background:var(--surface,#f6f8fd); border:1px solid var(--border,#e7ecf3);
      }
      .sat-scoreline{ display:flex; align-items:baseline; gap:10px }
      .sat-score{ font-size:42px; line-height:1; font-weight:900 }
      .sat-msg{ font-weight:800 }

      /* colors by risk */
      .sat-result[data-level="warn"]{ background:#fff4e5; border-color:#ffd9a8 }
      .sat-result[data-level="ok"]{ background:#eef8ff; border-color:#cfe8ff }

      /* ---------- Dark tweaks ---------- */
      :root[data-theme="dark"] .sat-card{ background:#151921; border-color:#232a37 }
      :root[data-theme="dark"] .sat-chip,
      :root[data-theme="dark"] .sat-result,
      :root[data-theme="dark"] .sat-btn{ background:#12151c; border-color:#232a37; color:#eef2ff }
      :root[data-theme="dark"] .sat-chip[data-active="true"]{ background:#26376b; border-color:#3f5bd7; color:#e6edff }
      :root[data-theme="dark"] .sat-result[data-level="warn"]{ background:#3b2a14; border-color:#6b4a1b }
      :root[data-theme="dark"] .sat-result[data-level="ok"]{ background:#132235; border-color:#1f3a57 }
    </style>

    <div class="sat-wrap">
      <div class="sat-card">
        <div class="sat-head">
          <h3 class="sat-title">SAT Score</h3>
        </div>

        <div class="sat-strip"></div>

        <!-- LANDMARK 1 — Response group -->
        <section class="sat-section">
          <p class="sat-label">RESPONSE</p>
          <div id="grpResponse" class="sat-group">
            <button class="sat-chip" data-score="3">
              Combative<br><small>violent / out of control</small>
            </button>
            <button class="sat-chip" data-score="2">
              Very anxious<br><small>and restless</small>
            </button>
            <button class="sat-chip" data-score="1">
              Anxious<br><small>and restless</small>
            </button>
            <button class="sat-chip" data-score="0">
              Normal response<br><small>speaks in normal tone</small>
            </button>
            <button class="sat-chip" data-score="-1">
              Loudly to name<br><small>needs raised voice</small>
            </button>
            <button class="sat-chip" data-score="-2">
              To pain<br><small>physical stimulation</small>
            </button>
            <button class="sat-chip" data-score="-3">
              Unresponsive
            </button>
          </div>
        </section>

        <!-- LANDMARK 2 — Speech group -->
        <section class="sat-section">
          <p class="sat-label">SPEECH</p>
          <div id="grpSpeech" class="sat-group">
            <button class="sat-chip" data-score="3">
              Continual outbursts
            </button>
            <button class="sat-chip" data-score="2">
              Loud outbursts
            </button>
            <button class="sat-chip" data-score="1">
              Talkative<br><small>normal/talkative</small>
            </button>
            <button class="sat-chip" data-score="0">
              Speaks normally
            </button>
            <button class="sat-chip" data-score="-1">
              Slurred / slowed
            </button>
            <button class="sat-chip" data-score="-2">
              Few words
            </button>
            <button class="sat-chip" data-score="-3">
              No speech
            </button>
          </div>
        </section>

        <div class="sat-actions">
          <button id="btnClear" class="sat-btn">Clear</button>
        </div>

        <!-- LANDMARK 3 — Result -->
        <div id="result" class="sat-result" data-level="ok" aria-live="polite">
          <div class="sat-scoreline">
            <div id="score" class="sat-score">—</div>
            <div id="msg" class="sat-msg">Pick one option in each group.</div>
          </div>
          <div id="sub" class="sat-sub" style="margin-top:6px;opacity:.9"></div>
        </div>
      </div>
    </div>
  `;

  /* ===== Helpers ===== */
  const $  = sel => mountEl.querySelector(sel);
  const $$ = sel => [...mountEl.querySelectorAll(sel)];

  const grpResponse = $('#grpResponse');
  const grpSpeech   = $('#grpSpeech');
  const resultBox   = $('#result');
  const scoreEl     = $('#score');
  const msgEl       = $('#msg');
  const subEl       = $('#sub');

  // LANDMARK C — set active chip and return its score
  function pick(groupEl, target){
    if (!target.matches('.sat-chip')) return null;
    groupEl.querySelectorAll('.sat-chip').forEach(b => b.dataset.active = 'false');
    target.dataset.active = 'true';
    return Number(target.dataset.score);
  }

  function getActiveScore(groupEl){
    const a = groupEl.querySelector('.sat-chip[data-active="true"]');
    return a ? Number(a.dataset.score) : null;
  }

  function compute(){
    const r = getActiveScore(grpResponse);
    const s = getActiveScore(grpSpeech);
    if (r == null || s == null){
      scoreEl.textContent = '—';
      msgEl.textContent = 'Pick one option in each group.';
      subEl.textContent = '';
      resultBox.dataset.level = 'ok';
      return;
    }

    // Kotlin rule: SAT = max(responseScore, speechScore)
    const sat = Math.max(r, s);
    scoreEl.textContent = String(sat);

    if (sat >= 2){
      msgEl.textContent = `SAT score is (${sat}) — strong predictor for the need for sedation.`;
      subEl.textContent = '';
      resultBox.dataset.level = 'warn';
    } else {
      msgEl.textContent = `SAT score is (${sat}).`;
      subEl.textContent = '';
      resultBox.dataset.level = 'ok';
    }
  }

  function clearAll(){
    $$('.sat-chip').forEach(b => b.dataset.active = 'false');
    scoreEl.textContent = '—';
    msgEl.textContent   = 'Pick one option in each group.';
    subEl.textContent   = '';
    resultBox.dataset.level = 'ok';
  }

  // Wire up (instant updates)
  grpResponse.addEventListener('click', e => { if (pick(grpResponse, e.target)) compute(); });
  grpSpeech  .addEventListener('click', e => { if (pick(grpSpeech,   e.target)) compute(); });
  $('#btnClear').addEventListener('click', clearAll);

  // init
  clearAll();
}
