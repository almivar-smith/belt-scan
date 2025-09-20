(function beltsApp() {
  const baseYields = window.beltBaseYields || {};
  const cfg = window.beltConfig || {};
  const STORAGE = 'beltApp:v1.3.rev2';

  // Helpers
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function fmt(n,d=1){ if(!isFinite(Number(n))) return '0'; return Number(n).toLocaleString('es',{minimumFractionDigits:d,maximumFractionDigits:d}); }
  function fmtMoney(n){ if(!isFinite(Number(n))) return '0'; if(Math.abs(n)>=1_000_000) return Number(n).toLocaleString('es',{maximumFractionDigits:0}); return Number(n).toLocaleString('es',{minimumFractionDigits:0,maximumFractionDigits:2}); }
  function parseLocale(s){ if(s==null) return 0; s=String(s).trim(); if(s==='') return 0; const hasDot=s.indexOf('.')>=0, hasComma=s.indexOf(',')>=0; if(hasDot&&hasComma){ const ld=s.lastIndexOf('.'), lc=s.lastIndexOf(','); if(lc>ld) s=s.replace(/\./g,'').replace(',','.'); else s=s.replace(/,/g,''); } else if(hasComma&&!hasDot) s=s.replace(',','.'); else s=s.replace(/,/g,''); const n=Number(s); return Number.isFinite(n)?n:0; }
  function normalize(s){return String(s||'').trim().toLowerCase();}

  // DOM
  const scanInput = document.getElementById('scanInput');
  const runBtn = document.getElementById('runBtn'), clearBtn = document.getElementById('clearBtn');
  const resultsContainer = document.getElementById('resultsContainer');
  const pilotListEl = document.getElementById('pilotList'), totalRateEl = document.getElementById('totalRate');
  const applyDefaultsBtn = document.getElementById('applyDefaultsBtn');
  const globalModulesEl = document.getElementById('globalModules'), globalM3PerCycleEl = document.getElementById('globalM3PerCycle'), globalCycleSecEl = document.getElementById('globalCycleSec');

  // defaults
  const DEFAULTS = (cfg.defaultPilots && cfg.defaultPilots.length) ? cfg.defaultPilots : [
    { name: 'ALPHA', modules:2, m3PerCycle:1800, cycleSec:50 },
    { name: 'BRAVO', modules:2, m3PerCycle:1800, cycleSec:50 },
    { name: 'CHARLY', modules:2, m3PerCycle:1800, cycleSec:50 },
    { name: 'DELTA', modules:2, m3PerCycle:1800, cycleSec:50 },
    { name: 'EPSYLON', modules:2, m3PerCycle:1800, cycleSec:50 }
  ];

  // state load
  let state = { pilots: [], scanText: '' };
  try{ const raw = localStorage.getItem(STORAGE); if(raw){ const p = JSON.parse(raw); if(Array.isArray(p.pilots)) state.pilots = p.pilots; if(typeof p.scanText === 'string') state.scanText = p.scanText; } }catch(e){}

  let pilots = (state.pilots && state.pilots.length) ? state.pilots : DEFAULTS.map(p => ({ ...p }));

  if(state.scanText) scanInput.value = state.scanText;
  globalModulesEl.value = globalModulesEl.value || 2;
  globalM3PerCycleEl.value = globalM3PerCycleEl.value || 1800;
  globalCycleSecEl.value = globalCycleSecEl.value || 50;

  function save(){ try{ const toSave = { pilots, scanText: scanInput.value }; localStorage.setItem(STORAGE, JSON.stringify(toSave)); }catch(e){} }

  function computeRateForPilot(p){
    const modules = Math.max(1, Number(p.modules) || 0);
    const m3 = Number(p.m3PerCycle) || 0;
    const cycle = Math.max(1, Number(p.cycleSec) || 1);
    const perMin = m3 * modules * (60 / cycle);
    return Math.round(perMin * 10) / 10;
  }

  function updateTotalRate(){
    const total = pilots.reduce((s,p) => s + computeRateForPilot(p), 0);
    totalRateEl.textContent = fmt(total,1);
    return total;
  }

  function renderPilots(){
    pilotListEl.innerHTML = '';
    pilots.forEach((p,i) => {
      const row = document.createElement('div');
      row.className = 'pilot-row';
      row.innerHTML = `
        <input class="pilot-name" data-i="${i}" value="${esc(p.name)}" />
        <input class="pilot-modules" data-i="${i}" type="number" min="1" value="${esc(p.modules)}" />
        <input class="pilot-m3" data-i="${i}" type="number" step="0.1" value="${esc(p.m3PerCycle)}" />
        <input class="pilot-cycle" data-i="${i}" type="number" min="1" value="${esc(p.cycleSec)}" />
        <input class="pilot-rate" data-i="${i}" type="number" step="0.1" value="${esc(computeRateForPilot(p))}" disabled />
        <div class="pilot-actions">
          <button class="btn-ghost btn-copy" data-i="${i}">📋</button>
          <button class="btn-ghost btn-remove" data-i="${i}">🗑️</button>
        </div>
      `;
      pilotListEl.appendChild(row);

      const nameEl = row.querySelector('.pilot-name');
      const modulesEl = row.querySelector('.pilot-modules');
      const m3El = row.querySelector('.pilot-m3');
      const cycleEl = row.querySelector('.pilot-cycle');
      const rateEl = row.querySelector('.pilot-rate');
      const copyBtn = row.querySelector('.btn-copy');
      const removeBtn = row.querySelector('.btn-remove');

      nameEl.addEventListener('input', ()=>{ pilots[i].name = nameEl.value; save(); });
      modulesEl.addEventListener('input', ()=>{ pilots[i].modules = Math.max(1, parseLocale(modulesEl.value)||1); rateEl.value = computeRateForPilot(pilots[i]); updateTotalRate(); save(); });
      m3El.addEventListener('input', ()=>{ pilots[i].m3PerCycle = parseLocale(m3El.value)||0; rateEl.value = computeRateForPilot(pilots[i]); updateTotalRate(); save(); });
      cycleEl.addEventListener('input', ()=>{ pilots[i].cycleSec = Math.max(1, parseLocale(cycleEl.value)||1); rateEl.value = computeRateForPilot(pilots[i]); updateTotalRate(); save(); });
      copyBtn.addEventListener('click', ()=>navigator.clipboard.writeText(String(rateEl.value)).catch(()=>{}));
      removeBtn.addEventListener('click', ()=>{ pilots.splice(i,1); if(!pilots.length) pilots = DEFAULTS.map(p => ({ ...p })); renderPilots(); save(); });
    });
    updateTotalRate();
  }

  // parse dscan
  function parseScan(text){
    if(!text) return { ores: [], ignored: 0 };
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const ores = []; let ignored = 0;
    lines.forEach(line=>{
      if(/^={3,}$/.test(line)) return;
      const parts = line.split(/\t|\s{2,}/).map(p=>p.trim()).filter(Boolean);
      if(parts.length < 2){ ignored++; return; }
      const name = parts[0];
      let qtyRaw = parts[1] || '0';
      let volRaw = parts.length >= 3 ? parts[2] : '0';
      qtyRaw = qtyRaw.replace(/[^0-9.,-]/g,''); volRaw = volRaw.replace(/[^0-9.,-]/g,'');
      const qty = parseLocale(qtyRaw), vol = parseLocale(volRaw);
      if(!name || (qty===0 && vol===0)){ ignored++; return; }
      const variantMatch = String(name).match(/^(Augmented|Boosted|Doped|Dull|Serrated|Fragrant|Intoxicating|Ambrosial)\b/i);
      const variant = variantMatch ? variantMatch[0] : null;
      const base = variant ? name.replace(variant,'').trim() : name;
      ores.push({ rawName: name, base, variant, quantity: qty, volume: vol });
    });
    return { ores, ignored };
  }

  // calculation helpers
  function getCompressionRatio(base){
    const k = Object.keys(cfg.compressionRatios||{}).find(x=>normalize(x)===normalize(base));
    return k ? Number(cfg.compressionRatios[k]) : 0.01;
  }
  function getCompressedPrice(base){
    const k = Object.keys(cfg.compressedPrices||{}).find(x=>normalize(x)===normalize(base));
    return k ? Number(cfg.compressedPrices[k]) : 0;
  }
  function getVariantMultiplier(v){
    if(!v) return 1; const k = Object.keys(cfg.variants||{}).find(x=>normalize(x)===normalize(v)); return k?Number(cfg.variants[k]):1;
  }
  function compressedVolume(o){ return o.quantity * getCompressionRatio(o.base); }
  function priceOf(o){ return compressedVolume(o) * getCompressedPrice(o.base) * getVariantMultiplier(o.variant); }
  function rawMinerals(o){ const yields = baseYields[o.base] || {}; const mult = getVariantMultiplier(o.variant); const out = {}; Object.keys(yields).forEach(m => out[m] = o.quantity * yields[m] * mult); return out; }

  // render results
  function renderResults(parsed){
    const ores = parsed.ores || []; const ignored = parsed.ignored || 0;
    if(!ores.length){ resultsContainer.innerHTML = `<div class="muted">No hay datos para procesar.</div>${ignored?`<div class="muted">Líneas ignoradas: ${ignored}</div>`:''}`; return; }
    const byBase = {}; let totalVol=0, totalComp=0, totalVal=0; const globalRaw = {};
    ores.forEach(o => {
      const base = o.base, variant = o.variant || 'Normal';
      if(!byBase[base]) byBase[base] = { variants: {}, totalVolume: 0 };
      if(!byBase[base].variants[variant]) byBase[base].variants[variant] = { qty:0, vol:0, comp:0, val:0 };
      const comp = compressedVolume(o), val = priceOf(o);
      byBase[base].variants[variant].qty += o.quantity;
      byBase[base].variants[variant].vol += o.volume;
      byBase[base].variants[variant].comp += comp;
      byBase[base].variants[variant].val += val;
      byBase[base].totalVolume += o.volume;
      totalVol += o.volume; totalComp += comp; totalVal += val;
      const raw = rawMinerals(o);
      Object.keys(raw).forEach(k => globalRaw[k] = (globalRaw[k]||0)+raw[k]);
    });

    // compute total rate from pilots
    const rates = pilots.map(p => computeRateForPilot(p));
    const totalRate = rates.reduce((s,r)=>s+r,0);
    const minutesTotal = totalRate>0 ? totalVol / totalRate : Infinity;

    // build html
    let html = `<div class="results"><h3>Resultados del Escaneo</h3>`;
    Object.entries(byBase).forEach(([base,data])=>{
      html += `<div class="mineral-group"><h4 class="mineral-name">${esc(base)}</h4>`;
      Object.entries(data.variants).forEach(([variant,stats])=>{
        html += `<div class="mineral-item"><div class="mini"><strong>${esc(variant)}</strong> — Cant: <strong>${fmt(stats.qty,1)}</strong>, Vol: <strong>${fmt(stats.vol,1)} m³</strong>, Comp: <strong>${fmt(stats.comp,1)} m³</strong>, Valor: <strong>${fmtMoney(stats.val)} ISK</strong></div></div>`;
      });
      const rawPerBase = {};
      ores.forEach(o => { if(normalize(o.base)===normalize(base)){ const r = rawMinerals(o); Object.keys(r).forEach(k=>rawPerBase[k]=(rawPerBase[k]||0)+r[k]); }});
      if(Object.keys(rawPerBase).length){
        html += `<div class="mini">Minerales: ${Object.entries(rawPerBase).map(([m,q])=>`<span class="raw-item raw-${m.toLowerCase()}"><span class="label ${'raw-'+m.toLowerCase()}">${m}:</span> ${fmt(q,1)}</span>`).join(' ')}</div>`;
      }
      html += `<div class="mini">Subtotal volumen: <strong>${fmt(data.totalVolume,1)} m³</strong></div></div>`;
    });

    if(Object.keys(globalRaw).length){
      html += `<div style="margin-top:10px"><strong>Totales minerales (raw)</strong>: ${Object.entries(globalRaw).map(([m,q])=>`<span class="raw-item raw-${m.toLowerCase()}"><span class="label ${'raw-'+m.toLowerCase()}">${m}:</span> ${fmt(q,1)}</span>`).join(' ')}</div>`;
    }

    html += `<div class="totals summary"><h4>Totales</h4>`;
    html += `<div>Volumen total: <strong>${fmt(totalVol,1)}</strong> m³</div>`;
    html += `<div>Volumen comprimido: <strong>${fmt(totalComp,1)}</strong> m³</div>`;
    html += `<div>Valor total: <strong>${fmtMoney(totalVal)} ISK</strong></div>`;
    html += `<div class="mini">Tiempo estimado del belt (total rate ${fmt(totalRate,1)} m³/min): <strong>${isFinite(minutesTotal)? Math.floor(minutesTotal/60)+'h '+Math.round(minutesTotal%60)+'m' : '—'}</strong></div>`;

    html += `<div style="margin-top:10px"><h4>Distribución por piloto</h4>`;
    if(!isFinite(minutesTotal) || totalRate<=0){ html += `<div class="muted">No es posible calcular distribución por piloto: tasa inválida.</div>`; }
    else {
      html += `<table class="pilot-table"><thead><tr><th>Piloto</th><th>Modules</th><th>m³/ciclo</th><th>Ciclo s</th><th>Rate m³/min</th><th>%</th><th>Valor asignado (ISK)</th><th>ISK/h</th></tr></thead><tbody>`;
      pilots.forEach((p,idx)=>{
        const rate = computeRateForPilot(p);
        const share = totalRate>0 ? rate/totalRate : 0;
        const assigned = totalVal * share;
        const hours = minutesTotal/60;
        const iskph = hours>0? assigned/hours : 0;
        html += `<tr><td>${esc(p.name)}</td><td>${p.modules}</td><td>${fmt(p.m3PerCycle,1)}</td><td>${p.cycleSec}</td><td>${fmt(rate,1)}</td><td>${(share*100).toFixed(1)}%</td><td>${fmtMoney(assigned)} ISK</td><td>${fmt(iskph,1)} ISK/h</td></tr>`;
      });
      html += `</tbody></table>`;
    }
    html += `</div></div>`;
    resultsContainer.innerHTML = html;
  }

  function renderAllFromText(text){ const segs = text.split(/^\={3,}$/m).map(s=>s.trim()).filter(Boolean); if(segs.length<=1){ renderResults(parseScan(text)); return; } const all={ores:[],ignored:0}; segs.forEach(s => { const p = parseScan(s); all.ores.push(...p.ores); all.ignored += p.ignored; }); renderResults(all); }

  function applyDefaultsToPilots(){
    pilots = pilots.map(p => ({
      name: p.name || 'PILOT',
      modules: p.modules || Number(globalModulesEl.value) || 2,
      m3PerCycle: p.m3PerCycle || Number(globalM3PerCycleEl.value) || 1800,
      cycleSec: p.cycleSec || Number(globalCycleSecEl.value) || 50
    }));
    renderPilots(); save();
  }

  // init pilots UI
  function renderPilots(){
    pilotListEl.innerHTML = '';
    pilots.forEach((p,i)=>{
      const row = document.createElement('div'); row.className = 'pilot-row';
      row.innerHTML = `
        <input class="pilot-name" data-i="${i}" value="${esc(p.name)}" />
        <input class="pilot-modules" data-i="${i}" type="number" min="1" value="${esc(p.modules)}" />
        <input class="pilot-m3" data-i="${i}" type="number" step="0.1" value="${esc(p.m3PerCycle)}" />
        <input class="pilot-cycle" data-i="${i}" type="number" min="1" value="${esc(p.cycleSec)}" />
        <input class="pilot-rate" data-i="${i}" type="number" step="0.1" value="${esc(computeRateForPilot(p))}" disabled />
        <div class="pilot-actions">
          <button class="btn-ghost btn-copy" data-i="${i}">📋</button>
          <button class="btn-ghost btn-remove" data-i="${i}">🗑️</button>
        </div>`;
      pilotListEl.appendChild(row);

      const nameEl = row.querySelector('.pilot-name'), modulesEl = row.querySelector('.pilot-modules'),
            m3El = row.querySelector('.pilot-m3'), cycleEl = row.querySelector('.pilot-cycle'),
            rateEl = row.querySelector('.pilot-rate'), copyBtn = row.querySelector('.btn-copy'), removeBtn = row.querySelector('.btn-remove');

      nameEl.addEventListener('input', ()=>{ pilots[i].name = nameEl.value; save(); });
      modulesEl.addEventListener('input', ()=>{ pilots[i].modules = Math.max(1, parseLocale(modulesEl.value)||1); rateEl.value = computeRateForPilot(pilots[i]); updateTotalRate(); save(); });
      m3El.addEventListener('input', ()=>{ pilots[i].m3PerCycle = parseLocale(m3El.value)||0; rateEl.value = computeRateForPilot(pilots[i]); updateTotalRate(); save(); });
      cycleEl.addEventListener('input', ()=>{ pilots[i].cycleSec = Math.max(1, parseLocale(cycleEl.value)||1); rateEl.value = computeRateForPilot(pilots[i]); updateTotalRate(); save(); });
      copyBtn.addEventListener('click', ()=>navigator.clipboard.writeText(String(rateEl.value)).catch(()=>{}));
      removeBtn.addEventListener('click', ()=>{ pilots.splice(i,1); if(!pilots.length) pilots = DEFAULTS.map(p => ({ ...p })); renderPilots(); save(); });
    });
    updateTotalRate();
  }

  // events
  runBtn.addEventListener('click', ()=>{ save(); renderAllFromText(scanInput.value); });
  clearBtn.addEventListener('click', ()=>{ scanInput.value=''; resultsContainer.innerHTML=''; save(); });
  scanInput.addEventListener('keydown', e=>{ if(e.ctrlKey && e.key.toLowerCase()==='enter') runBtn.click(); });
  applyDefaultsBtn.addEventListener('click', applyDefaultsToPilots);

  // initial render
  renderPilots();
  updateTotalRate();
  save();

})();
