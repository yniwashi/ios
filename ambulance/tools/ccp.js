// /tools/ccp.js
export async function run(root){
  root.innerHTML =
    '<div class="tool-root ccp" style="padding:18px;max-width:640px;margin:0 auto;">' +
      '<form id="ccp">' +
        '<h2 style="margin-top:0;font-size:24px;text-align:center;font-weight:900;letter-spacing:.2px">CCP Pediatric</h2>' +

        '<fieldset style="border:1px solid #2b3140;border-radius:14px;padding:12px;margin-top:10px">' +
          '<legend style="padding:0 6px;font-weight:800">Patient</legend>' +
          '<div style="display:grid;grid-template-columns:1fr;gap:10px">' +

            '<div style="display:flex;gap:14px;flex-wrap:wrap">' +
              '<label style="display:flex;align-items:center;gap:8px">' +
                '<input type="radio" name="mode" value="months" checked> <span>Months</span>' +
              '</label>' +
              '<label style="display:flex;align-items:center;gap:8px">' +
                '<input type="radio" name="mode" value="years"> <span>Years</span>' +
              '</label>' +
              '<label style="display:flex;align-items:center;gap:8px">' +
                '<input type="radio" name="mode" value="weight"> <span>Weight (kg)</span>' +
              '</label>' +
            '</div>' +

            '<div id="row-months" style="display:grid;grid-template-columns:1fr;gap:10px">' +
              '<div>' +
                '<label for="monthsVal" style="display:block;font-weight:700">Age in months</label>' +
                '<input id="monthsVal" name="monthsVal" type="number" min="0" max="12" step="1" placeholder="e.g. 6" ' +
                       'style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #2b3140;background:transparent;color:inherit;font-size:18px">' +
              '</div>' +
            '</div>' +

            '<div id="row-years" style="display:none;grid-template-columns:1fr;gap:10px">' +
              '<div>' +
                '<label for="yearsVal" style="display:block;font-weight:700">Age in years</label>' +
                '<input id="yearsVal" name="yearsVal" type="number" min="1" max="14" step="1" placeholder="e.g. 4" ' +
                       'style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #2b3140;background:transparent;color:inherit;font-size:18px">' +
              '</div>' +
            '</div>' +

            '<div id="row-weight" style="display:none;grid-template-columns:1fr;gap:10px">' +
              '<div>' +
                '<label for="weightVal" style="display:block;font-weight:700">Weight (kg)</label>' +
                '<input id="weightVal" name="weightVal" type="number" min="0" step="0.1" placeholder="e.g. 18.5" ' +
                       'style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #2b3140;background:transparent;color:inherit;font-size:18px">' +
              '</div>' +
            '</div>' +

          '</div>' +
        '</fieldset>' +

        '<fieldset style="border:1px solid #2b3140;border-radius:14px;padding:12px;margin-top:14px">' +
          '<legend style="padding:0 6px;font-weight:800">Medication</legend>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div>' +
              '<label for="med" style="display:block;font-weight:700">Choose drug</label>' +
              '<select id="med" name="med" class="ccp-sel" required>' +
                '<option value="adenosine">Adenosine</option>' +
                '<option value="adrenaline">Adrenaline</option>' +
                '<option value="amiodarone">Amiodarone</option>' +
                '<option value="atropine">Atropine</option>' +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label for="route" style="display:block;font-weight:700">Route</label>' +
              '<select id="route" name="route" class="ccp-sel" required>' +
                '<option value="iv">IV</option>' +
                '<option value="io">IO</option>' +
                '<option value="im">IM</option>' +
                '<option value="neb">NEB</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
        '</fieldset>' +

        '<div style="margin-top:18px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center">' +
          '<button type="submit" class="ccp-btn ccp-primary">Calculate</button>' +
          '<button type="button" id="reset" class="ccp-btn ccp-muted">Reset</button>' +
        '</div>' +
      '</form>' +

      '<div id="ccpOut" style="margin-top:20px"></div>' +
    '</div>';

  // style selects and buttons
  var selCss = '' +
    'margin-top:8px;' +
    'padding:14px 16px;' +
    'border-radius:14px;' +
    'border:1px solid #2b3140;' +
    'background:transparent;' +
    'color:inherit;' +
    'font-size:18px;' +
    'width:100%;' +
    '-webkit-appearance:none;appearance:none;cursor:pointer;touch-action:manipulation;';
  var sels = root.querySelectorAll('.ccp-sel');
  for (var i=0;i<sels.length;i++){ sels[i].style.cssText = selCss; }

  var btnBase = '' +
    'padding:14px 20px;border-radius:14px;border:1px solid #2b3140;color:#fff;' +
    'font-weight:900;font-size:18px;letter-spacing:.3px;min-width:150px;touch-action:manipulation;';
  root.querySelector('.ccp-btn.ccp-primary').style.cssText = btnBase + 'background:linear-gradient(180deg,#3a7bfd,#2660ea)';
  root.querySelector('.ccp-btn.ccp-muted').style.cssText   = btnBase + 'background:linear-gradient(180deg,#64748b,#475569)';

  var form = root.querySelector('#ccp');
  var out  = root.querySelector('#ccpOut');

  var rows = {
    months: root.querySelector('#row-months'),
    years:  root.querySelector('#row-years'),
    weight: root.querySelector('#row-weight')
  };

  // radio change (Safari-safe)
  var radios = root.querySelectorAll('input[name="mode"]');
  for (var r=0;r<radios.length;r++){
    radios[r].addEventListener('change', function(){
      var m = form.mode.value;
      rows.months.style.display = (m==='months') ? 'grid' : 'none';
      rows.years.style.display  = (m==='years')  ? 'grid' : 'none';
      rows.weight.style.display = (m==='weight') ? 'grid' : 'none';
    });
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();

    var med   = String(form.med.value);
    var route = String(form.route.value);

    // weight resolution
    var mode = form.mode.value;
    var weight = null;
    var header = '';
    var warnings = [];

    if (mode === 'months'){
      var months = Number(form.monthsVal.value || 0);
      if (!(months >= 0 && months <= 12)){ return pushResult('Please enter months between 0 and 12.'); }
      var wM = months * 0.5 + 4; // months formula
      weight = round1(wM);
      header = 'Patient estimated weight is ' + weight + ' kg.';
    } else if (mode === 'years'){
      var years = Number(form.yearsVal.value || 0);
      if (!(years >= 1 && years <= 14)){ return pushResult('Please enter years between 1 and 14.'); }
      var wY = (years <= 5) ? (years*2 + 8) : (years*3 + 7);
      weight = wY;
      header = 'Patient estimated weight is ' + weight + ' kg.';
    } else if (mode === 'weight'){
      var w = Number(form.weightVal.value || 0);
      if (w <= 0){ return pushResult('Please enter a valid weight.'); }
      var monthsMax = 12*0.5 + 4; // 10 kg
      var yearsMin = 1*2 + 8;     // 10 kg
      var yearsMax = 14*3 + 7;    // 49 kg
      if (w > monthsMax && form.mode.value === 'months'){
        warnings.push('Entered weight (' + round1(w) + ' kg) exceeds typical 12-month estimate (' + round1(monthsMax) + ' kg).');
      }
      if (w < yearsMin){
        warnings.push('Entered weight (' + round1(w) + ' kg) is below typical 1-year estimate (' + yearsMin + ' kg).');
      }
      if (w > yearsMax){
        warnings.push('Entered weight (' + round1(w) + ' kg) exceeds typical 14-year estimate (' + yearsMax + ' kg).');
      }
      weight = round1(w);
      header = 'Patient weight is ' + weight + ' kg.';
    }

    if (weight === null){ return pushResult('Invalid input.'); }

    var result = computeDose(med, route, weight);
    renderResult(header, result.blocks, warnings);

    var p = new URLSearchParams((location.hash||'').replace(/^#/,''));
    p.set('tool','ccp'); p.set('med',med); p.set('route',route); p.set('w',String(weight));
    history.replaceState(null,'','#' + p.toString());
  });

  root.querySelector('#reset').addEventListener('click', function(){
    form.reset();
    rows.months.style.display = 'grid';
    rows.years.style.display  = 'none';
    rows.weight.style.display = 'none';
    var selects = form.querySelectorAll('select');
    for (var i=0;i<selects.length;i++){
      selects[i].selectedIndex = 0;
      selects[i].dispatchEvent(new Event('change', { bubbles: true }));
    }
    out.innerHTML = '';
    history.replaceState(null,'',location.pathname + location.search + '#tool=ccp');
    if (document.activeElement && document.activeElement.blur){ document.activeElement.blur(); }
  });

  // helpers
  function round1(x){ return Math.round(x*10)/10; }
  function round2(x){ return Math.round(x*100)/100; }
  function fmt(x){
    var t = Math.trunc(x);
    return Math.abs(x - t) < 1e-9 ? String(t) : String(round2(x));
  }
  function pushResult(msg){
    out.innerHTML = '<div style="border:1px solid #2b3140;border-radius:14px;padding:14px">' + msg + '</div>';
  }
  function renderResult(header, blocks, warnings){
    var warnHtml = (warnings && warnings.length)
      ? '<div style="margin-top:10px;padding:10px;border-radius:12px;border:1px solid #b45309;background:rgba(251,191,36,.12);color:#f59e0b;font-weight:700">' + warnings.join('<br>') + '</div>'
      : '';
    out.innerHTML =
      '<div style="border:1px solid #2b3140;border-radius:16px;padding:16px">' +
        '<div style="font-weight:800;margin-bottom:8px">' + header + '</div>' +
        blocks.join('<hr style=\"border:none;border-top:1px solid #2b3140;margin:12px 0\">') +
        warnHtml +
      '</div>';
  }
  function block(title, dose, routeText, note, color){
    var col = color || '#22c1b9';
    return '' +
      '<div>' +
        '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
          '<div style="font-size:16px;font-weight:900">' + title + '</div>' +
          '<div style="opacity:.8">' + routeText + '</div>' +
        '</div>' +
        '<div style="margin-top:6px;font-size:20px;font-weight:900;color:' + col + '">' + dose + '</div>' +
        (note ? '<div style="margin-top:6px;opacity:.9">' + note + '</div>' : '') +
      '</div>';
  }

  function computeDose(med, route, w){
    var blocks = [];
    if (med === 'adenosine'){
      var first = Math.min(6, round2(0.1*w));
      var second = Math.min(12, round2(0.2*w));
      blocks.push(
        block('SVT - First Dose', fmt(first) + ' mg', 'IV/IO', 'Max 6 mg; ref ' + fmt(w) + ' kg x 0.1 mg'),
        block('SVT - Second Dose', fmt(second) + ' mg', 'IV/IO', 'Max 12 mg; ref ' + fmt(w) + ' kg x 0.2 mg')
      );
    } else if (med === 'adrenaline'){
      var arrestMg = round2(0.01*w);
      var bradyMcg = round2(1.0*w);
      var inoMin = round2(0.05*w);
      var inoMax = round2(0.3*w);
      var croupNebMg = round2(0.5*w);
      var anaphIMmg = round2(0.01*w);
      var anaphIVmcg = round2(1.0*w);
      blocks.push(
        block('Cardiac Arrest', fmt(arrestMg) + ' mg', 'IV/IO', 'Repeat q4 min; ref ' + fmt(w) + ' kg x 0.01 mg'),
        block('Bradycardia', fmt(bradyMcg) + ' mcg', 'IV/IO', 'Max single 50 mcg; ref ' + fmt(w) + ' kg x 1 mcg'),
        block('Inotrope/Vasopressor', fmt(inoMin) + '-' + fmt(inoMax) + ' mcg/min', 'IV/IO infusion', 'Mix per protocol'),
        block('Croup / Upper Airway', fmt(Math.min(5, croupNebMg)) + ' mg', 'NEB', 'Max 5 mg; ref ' + fmt(w) + ' kg x 0.5 mg'),
        block('Anaphylaxis (IM)', fmt(anaphIMmg) + ' mg', 'IM', 'Max 0.5 mg; ref ' + fmt(w) + ' kg x 0.01 mg'),
        block('Anaphylaxis (IV/IO)', fmt(anaphIVmcg) + ' mcg', 'IV/IO', 'Max single 50 mcg; ref ' + fmt(w) + ' kg x 1 mcg')
      );
    } else if (med === 'amiodarone'){
      var dose = round2(5.0*w);
      blocks.push(
        block('Cardiac Arrest', fmt(dose) + ' mg', 'IV/IO', 'After 3rd shock; repeat up to 15 mg/kg; max 300 mg'),
        block('VT with Pulse', fmt(dose) + ' mg', 'IV/IO infusion', 'Over 20-60 min; max 300 mg')
      );
    } else if (med === 'atropine'){
      var brady = (w < 22) ? round2(0.02*w) : 0.5;
      var orga  = (w < 22) ? round2(0.05*w) : 2;
      blocks.push(
        block('Bradycardia', fmt(brady) + ' mg', 'IV/IO', (w < 22) ? ('Ref ' + fmt(w) + ' kg x 0.02 mg') : 'Fixed 0.5 mg'),
        block('Organophosphate', fmt(orga) + ' mg', 'IV/IO', (w < 22) ? ('Ref ' + fmt(w) + ' kg x 0.05 mg') : 'Fixed 2 mg')
      );
    }
    return { blocks: blocks };
  }
}
