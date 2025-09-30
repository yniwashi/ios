// tools/websites.js
export async function run(mountEl){
  mountEl.innerHTML = `
    <style>
      /* ===== Useful Websites (scoped) ===== */
      .web-wrap{ padding:12px }
      .web-card{
        background:var(--surface,#fff);
        border:1px solid var(--border,#e7ecf3);
        border-radius:14px; padding:14px;
        box-shadow:0 8px 18px rgba(0,0,0,.12);
      }

      .web-head{ display:flex; align-items:center; justify-content:space-between; gap:10px }
      .web-title{ margin:0; font-weight:900; font-size:16px; color:var(--text,#0c1230) }

      .web-strip{ height:6px; border-radius:6px; margin:10px 0 14px 0;
        background:linear-gradient(90deg,#10b981,#4caf50);
      }

      /* filter */
      .web-filter-wrap{ position:relative; margin-bottom:10px }
      .web-filter{
        width:100%; box-sizing:border-box;
        font-size:14px; font-weight:700; color:var(--text,#0c1230);
        background:var(--surface,#f3f6fb); border:1px solid var(--border,#dbe0ea);
        border-radius:12px; padding:10px 14px; outline:none;
      }

      /* list */
      .web-list{ display:flex; flex-direction:column; gap:8px; margin-top:6px }
      .web-item{
        display:flex; align-items:center; gap:10px;
        padding:12px; border-radius:12px;
        background:var(--surface,#f6f8fd);
        border:1px solid var(--border,#e7ecf3);
        text-decoration:none; color:var(--text,#0c1230);
        font-weight:800;
        transition:transform .18s ease, box-shadow .18s ease;
      }
      .web-item:hover{ transform:translateY(-1px); box-shadow:0 8px 18px rgba(0,0,0,.12) }
      .web-emoji{ font-size:18px; width:22px; text-align:center; }
      .web-label{ flex:1; line-height:1.2 }

      /* small "open" chevron */
      .web-open{ font-size:18px; opacity:.7 }

      /* Dark theme */
      :root[data-theme="dark"] .web-card{ background:#151921; border-color:#232a37 }
      :root[data-theme="dark"] .web-filter{
        background:#12151c; border-color:#232a37; color:#eef2ff;
      }
      :root[data-theme="dark"] .web-item{
        background:#12151c; border-color:#232a37; color:#eef2ff;
      }
    </style>

    <div class="web-wrap">
      <div class="web-card">
        <div class="web-head">
          <h3 class="web-title">Useful Websites</h3>
        </div>

        <div class="web-strip"></div>

        <div class="web-filter-wrap">
          <input id="webSearch" class="web-filter" placeholder="Filter… e.g. Oracle, Email, CPD" />
        </div>

        <div id="webList" class="web-list"></div>
      </div>
    </div>
  `;

  // ----- Data (from your Kotlin list) -----
  const LINKS = [
    { emoji:"🔗", label:"Ambulance App Linktree",              url:"https://bit.ly/qambulance" },
    { emoji:"🌐", label:"Oracle - Leave, Salary, etc.",        url:"http://ebusiness.hamad.qa" },
    { emoji:"📧", label:"HMC - Email",                         url:"https://outlook.office365.com/mail" },
    { emoji:"🚨", label:"HMC - OVA",                           url:"https://rmpf-hamadqa.msappproxy.net/RL6_Prod/Homecenter/Client/Login.aspx/" },
    { emoji:"📱", label:"Hamad App Store",                     url:"https://mobilestore.hamad.qa/" },
    { emoji:"🖥", label:"HMC Apps - Azure Portal",             url:"https://myapps.hamad.qa/" },
    { emoji:"🛠", label:"HMC - SelfService Portal",            url:"https://selfservice.hamad.qa/m/home" },
    { emoji:"🎓", label:"E-Taleem - Training Courses",         url:"https://lms.etaleem.qa/index" },
    { emoji:"📝", label:"Questbase - Training Tests",          url:"https://auth.questbase.com/#/account/emstraining.ems" },
    { emoji:"📂", label:"DHP - CPD Portfolio",                 url:"https://accreditation.moph.gov.qa/_layouts/15/Accred_Website/Login/AccreditationUserLogin.aspx?ReturnUrl=%2f_layouts%2f15%2fAuthenticate.aspx%3fSource%3d%252F&Source=%2F" },
    { emoji:"🛂", label:"DHP - Licensing Login Page",          url:"https://dhpportal.moph.gov.qa/en/_layouts/15/LogIn.aspx?ReturnUrl=%2fen%2f_layouts%2fAuthenticate.aspx%3fSource=%2Fen%2FPages%2Fdefault%2Easpx" },
    { emoji:"🗓️", label:"Upcoming CPD Activities",            url:"https://accreditation.moph.gov.qa/_layouts/15/Accred_Website/Other/UpcomingCPDActivityList.aspx" },
    { emoji:"🎙️", label:"PICU Doc On Call Podcast",           url:"https://picudoconcall.org/episodes" },
    { emoji:"🏥", label:"HMC - My Health",                     url:"https://www.hamad.qa/EN/Patient-Information/Patient-Portal/Pages/default.aspx" },
    { emoji:"🔗", label:"HMC - Sogha Website",                 url:"https://soghahealth-hamadqa.msappproxy.net/Pages/default.aspx" },
    { emoji:"📥", label:"Install MS Office",                   url:"https://portal.office.com/account#installs" },
    { emoji:"💳", label:"Download Sogha Digital Card",         url:"https://itawasol.hamad.qa/EN/HR-Portal/Sogha/Pages/SOGHA-Digital-Card.aspx" },
    { emoji:"🔒", label:"HMC - Account Security Settings",     url:"https://mysignins.microsoft.com/security-info" },
    { emoji:"📱", label:"My HMC Account Devices",              url:"https://myaccount.microsoft.com/device-list" },
    { emoji:"🌍", label:"Ambulance App Website",               url:"https://niwashibase.com" },
  ];

  const listEl = mountEl.querySelector('#webList');
  const searchEl = mountEl.querySelector('#webSearch');

  function render(filter=''){
    const q = filter.trim().toLowerCase();
    listEl.innerHTML = '';
    LINKS.filter(item => {
      if (!q) return true;
      return (item.label.toLowerCase().includes(q));
    }).forEach(item => {
      const a = document.createElement('a');
      a.className = 'web-item';
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = `
        <span class="web-emoji">${item.emoji}</span>
        <span class="web-label">${item.label}</span>
        <span class="web-open">↗</span>
      `;
      listEl.appendChild(a);
    });
  }

  searchEl.addEventListener('input', () => render(searchEl.value));
  render();
}
