/* ======================================================================
   TABS
   ====================================================================== */
function switchTab(name){
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
}
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ======================================================================
   HELPERS
   ====================================================================== */
function fmtBRL(v){ return v.toLocaleString('pt-BR', {style:'currency', currency:'BRL'}); }
function fmtNum(v, d=1){ return v.toLocaleString('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d}); }
function animateNumber(el, toValue, formatFn, duration){
  duration = duration || 650;
  const start = performance.now();
  function tick(now){
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = formatFn(toValue * eased);
    if(t < 1) requestAnimationFrame(tick);
    else el.textContent = formatFn(toValue);
  }
  requestAnimationFrame(tick);
}
function newId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function escapeAttr(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

const COLOR_NAMES = {
  'vermelho':'#e63946', 'azul':'#1d63d1', 'verde':'#2ecc71', 'amarelo':'#f4d03f',
  'preto':'#161616', 'branco':'#f5f5f5', 'cinza':'#8a8d93', 'roxo':'#8e44ad',
  'laranja':'#e67e22', 'rosa':'#f78fb3', 'pink':'#ff2d95', 'marrom':'#8b5a2b',
  'dourado':'#d4af37', 'ouro':'#d4af37', 'prata':'#c0c0c0', 'bege':'#e8d8c3',
  'transparente':'#dfe6e9', 'natural':'#f0e6d2', 'ciano':'#00bcd4', 'turquesa':'#1abc9c',
  'vinho':'#6b1d2f', 'grafite':'#3a3a3c', 'lilas':'#c9a0dc', 'lilás':'#c9a0dc',
  'magenta':'#d6249f', 'bronze':'#cd7f32', 'cobre':'#b87333', 'creme':'#f3e5ab',
  'azul marinho':'#1b2a4a', 'azul claro':'#7ec8f2', 'azul escuro':'#0d3b8c',
  'verde claro':'#7ed957', 'verde escuro':'#1e5631', 'verde limao':'#a8e063', 'verde limão':'#a8e063',
};
function resolveColorInput(str){
  if(!str) return null;
  const s = str.trim().toLowerCase();
  if(/^#?[0-9a-f]{6}$/i.test(s)) return '#' + s.replace('#','');
  if(COLOR_NAMES[s]) return COLOR_NAMES[s];
  return null;
}
function bindColorGroup(pickerEl, textEl){
  textEl.addEventListener('input', () => {
    const hex = resolveColorInput(textEl.value);
    if(hex) pickerEl.value = hex;
  });
  pickerEl.addEventListener('input', () => {
    textEl.value = pickerEl.value;
  });
}
function capitalizeWords(s){
  return s.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function buildFilamentName(corTexto, complemento){
  const corLabel = corTexto.trim() ? capitalizeWords(corTexto) : '';
  let nome = corLabel ? `Filamento ${corLabel}` : 'Filamento';
  if(complemento && complemento.trim()) nome += ' ' + capitalizeWords(complemento);
  return nome;
}

/* Mapeia cada coleção pra sua tabela no Supabase e converte entre o formato
   usado no app (camelCase, plano) e as colunas do banco (snake_case). */
const TABLES = {
  materials: {
    name: 'materials',
    toObj: r => ({ id: r.id, nome: r.nome, cor: r.cor, preco: Number(r.preco), estoque: Number(r.estoque) }),
    toRow: o => ({ id: o.id, nome: o.nome, cor: o.cor, preco: o.preco, estoque: o.estoque }),
  },
  products: {
    name: 'products',
    toObj: r => ({ id: r.id, nome: r.nome, preco: Number(r.preco), custo: Number(r.custo) }),
    toRow: o => ({ id: o.id, nome: o.nome, preco: o.preco, custo: o.custo }),
  },
  orders: {
    name: 'orders',
    toObj: r => ({ id: r.id, cliente: r.cliente, telefone: r.telefone, item: r.item, prazo: r.prazo || '', status: r.status, valor: Number(r.valor), criadoEm: r.criado_em }),
    toRow: o => ({ id: o.id, cliente: o.cliente || '', telefone: o.telefone || '', item: o.item || '', prazo: o.prazo || '', status: o.status || 'Pendente', valor: o.valor || 0, criado_em: o.criadoEm || new Date().toISOString() }),
  },
  sales: {
    name: 'sales',
    toObj: r => ({ id: r.id, data: r.data || '', produto: r.produto, comprador: r.comprador, contato: r.contato, valor: Number(r.valor), pedidoId: r.pedido_id || null }),
    toRow: o => ({ id: o.id, data: o.data || '', produto: o.produto || '', comprador: o.comprador || '', contato: o.contato || '', valor: o.valor || 0, pedido_id: o.pedidoId || null }),
  },
};

const ORDER_COL = { materials: 'created_at', products: 'created_at', orders: 'criado_em', sales: 'created_at' };

async function loadAll(key){
  try{
    const table = TABLES[key];
    const { data, error } = await supabaseClient
      .from(table.name)
      .select('*')
      .eq('user_id', currentUser.id)
      .order(ORDER_COL[key], { ascending: true });
    if(error) throw error;
    return (data || []).map(table.toObj);
  }catch(e){
    console.error('Erro ao carregar', key, e);
    return [];
  }
}

async function saveAll(key, arr){
  try{
    const table = TABLES[key];
    const { data: existing, error: selErr } = await supabaseClient
      .from(table.name).select('id').eq('user_id', currentUser.id);
    if(selErr) throw selErr;
    const currentIds = new Set(arr.map(o => o.id));
    const toDelete = (existing || []).map(r => r.id).filter(id => !currentIds.has(id));
    if(toDelete.length){
      const { error: delErr } = await supabaseClient.from(table.name).delete().in('id', toDelete);
      if(delErr) throw delErr;
    }
    if(arr.length){
      const rows = arr.map(o => ({ ...table.toRow(o), user_id: currentUser.id }));
      const { error: upErr } = await supabaseClient.from(table.name).upsert(rows, { onConflict: 'id' });
      if(upErr) throw upErr;
    }
  }catch(e){
    console.error('Erro ao salvar', key, e);
  }
}

/* ======================================================================
   CALCULADORA
   ====================================================================== */
const state = { colors: 1 };
const colorDefaults = ['#ff2438', '#35c4d4', '#b06bff', '#35d488'];
const collections = { materials: [], products: [], orders: [], sales: [] };
let settings = { metaMensal: 1500, orcamentoNumero: 0 };

function materialOptionsHtml(selectedId){
  let html = `<option value="">Cor/preço manual</option>`;
  collections.materials.forEach(m => {
    html += `<option value="${m.id}" ${m.id===selectedId?'selected':''}>${escapeAttr(m.nome)} — R$${fmtNum(m.preco,0)}/kg</option>`;
  });
  return html;
}

function refreshMaterialSelects(){
  document.querySelectorAll('.mat-select').forEach(sel => {
    const current = sel.value;
    sel.innerHTML = materialOptionsHtml(current);
  });
}

function onMaterialSelectChange(e){
  const idx = e.target.dataset.idx;
  const matId = e.target.value;
  if(matId){
    const m = collections.materials.find(x => x.id === matId);
    if(m){
      document.getElementById('colorSwatch'+idx).value = m.cor;
      document.getElementById('colorPrice'+idx).value = m.preco;
    }
  }
  calculate('margin');
}

function renderColorRows(weights, colors, matIds){
  const wrap = document.getElementById('colorRows');
  wrap.innerHTML = '';
  for(let i=0;i<state.colors;i++){
    const w = weights && weights[i] !== undefined ? weights[i] : (i===0 ? 130 : 0);
    const c = (colors && colors[i]) ? colors[i] : colorDefaults[i];
    const matId = (matIds && matIds[i]) ? matIds[i] : '';
    const matched = matId ? collections.materials.find(x => x.id === matId) : null;
    const price = matched ? matched.preco : 140;
    const row = document.createElement('div');
    row.className = 'color-row';
    row.innerHTML = `
      <div class="color-row-top">
        <input type="color" id="colorSwatch${i}" value="${matched ? matched.cor : c}">
        <div class="mat-select-wrap">
          <label>Material salvo (opcional)</label>
          <select class="mat-select" data-idx="${i}">${materialOptionsHtml(matId)}</select>
        </div>
      </div>
      <div class="color-row-bottom">
        <div>
          <label>Peso cor ${i+1} (g)</label>
          <input type="number" id="colorWeight${i}" value="${w}" step="0.1" min="0">
        </div>
        <div>
          <label>Preço filamento (R$/kg)</label>
          <input type="number" id="colorPrice${i}" value="${price}" step="1" min="0">
        </div>
      </div>
    `;
    wrap.appendChild(row);
  }
  document.querySelectorAll('#colorRows input').forEach(el => el.addEventListener('input', () => calculate('margin')));
  document.querySelectorAll('.mat-select').forEach(sel => sel.addEventListener('change', onMaterialSelectChange));
  const showPurge = state.colors > 1;
  document.getElementById('purgeNoteWrap').style.display = showPurge ? 'flex' : 'none';
  document.getElementById('purgeField').style.display = showPurge ? 'block' : 'none';
}

document.getElementById('colorSeg').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  state.colors = parseInt(btn.dataset.n);
  document.querySelectorAll('#colorSeg button').forEach(b => b.classList.toggle('active', b === btn));
  renderColorRows();
  calculate('margin');
});

document.getElementById('marginPresets').addEventListener('click', (e) => {
  const btn = e.target.closest('.preset-btn');
  if(!btn) return;
  const mult = parseFloat(btn.dataset.mult);
  document.getElementById('margin').value = Math.round((mult - 1) * 100);
  calculate('margin');
});

function setColorCount(n){
  n = Math.max(1, Math.min(4, n));
  state.colors = n;
  document.querySelectorAll('#colorSeg button').forEach(b => b.classList.toggle('active', parseInt(b.dataset.n) === n));
}

const LEVELING_HOURS = 5/60;

function calculate(source){
  source = source || 'margin';

  let totalWeight = 0;
  let weightedPriceSum = 0;
  const colorWeights = [];
  for(let i=0;i<state.colors;i++){
    const w = parseFloat(document.getElementById(`colorWeight${i}`).value) || 0;
    const p = parseFloat(document.getElementById(`colorPrice${i}`).value) || 0;
    colorWeights.push(w);
    totalWeight += w;
    weightedPriceSum += p;
  }
  const avgPrice = weightedPriceSum / state.colors;
  const purgeGrams = state.colors > 1 ? (parseFloat(document.getElementById('purgeGrams').value) || 0) * (state.colors - 1) : 0;

  let materialCost = 0;
  for(let i=0;i<state.colors;i++){
    const p = parseFloat(document.getElementById(`colorPrice${i}`).value) || 0;
    materialCost += (colorWeights[i]/1000) * p;
  }
  materialCost += (purgeGrams/1000) * avgPrice;

  const totalWeightUsed = totalWeight + purgeGrams;

  const hoursRaw = parseFloat(document.getElementById('printHours').value) || 0;
  const hours = hoursRaw + LEVELING_HOURS;
  const energyRate = parseFloat(document.getElementById('energyRate').value) || 0;
  const energyCost = hours * energyRate;

  const printerCost = parseFloat(document.getElementById('printerCost').value) || 0;
  const printerLife = parseFloat(document.getElementById('printerLife').value) || 1;
  const printerDep = hours * (printerCost / printerLife);

  const nozzleCost = parseFloat(document.getElementById('nozzleCost').value) || 0;
  const nozzleLife = parseFloat(document.getElementById('nozzleLife').value) || 1;
  const nozzleDep = hours * (nozzleCost / nozzleLife);
  const depreciationTotal = printerDep + nozzleDep;

  const laborRate = parseFloat(document.getElementById('laborRate').value) || 0;
  const laborHours = parseFloat(document.getElementById('laborHours').value) || 0;
  const laborCost = laborRate * laborHours;

  const insumos = parseFloat(document.getElementById('insumos').value) || 0;
  const frete = parseFloat(document.getElementById('frete').value) || 0;
  const riscoPct = parseFloat(document.getElementById('risco').value) || 0;

  const costBeforeRisk = materialCost + energyCost + laborCost + insumos + depreciationTotal;
  const riscoValue = costBeforeRisk * (riscoPct/100);
  const totalCost = costBeforeRisk + riscoValue + frete;

  const marginInput = document.getElementById('margin');
  const sellPriceInput = document.getElementById('sellPrice');
  let margin, price;

  if(source === 'price'){
    price = parseFloat(sellPriceInput.value) || 0;
    margin = totalCost > 0 ? ((price/totalCost) - 1) * 100 : 0;
    marginInput.value = margin.toFixed(0);
  } else {
    margin = parseFloat(marginInput.value) || 0;
    price = totalCost * (1 + margin/100);
    sellPriceInput.value = price.toFixed(2);
  }

  const profit = price - totalCost;
  const marginOfPricePct = price > 0 ? (profit/price*100) : 0;
  const markupPct = totalCost > 0 ? (profit/totalCost*100) : 0;

  document.getElementById('multiplierHint').textContent = fmtNum(1+margin/100, 2).replace(/,00$/,'') + 'x';

  const currentMult = 1 + margin/100;
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', Math.abs(parseFloat(b.dataset.mult) - currentMult) < 0.02);
  });

  const clamped = Math.max(0, Math.min(100, marginOfPricePct));
  const circumference = 314.16;
  const ring = document.getElementById('donutRing');
  ring.setAttribute('stroke-dashoffset', circumference * (1 - clamped/100));
  let ringVar = '--green';
  if(marginOfPricePct < 0) ringVar = '--red';
  else if(marginOfPricePct < 30) ringVar = '--salmon';
  else if(marginOfPricePct < 50) ringVar = '--blue';
  const ringColor = getComputedStyle(document.documentElement).getPropertyValue(ringVar).trim();
  ring.style.stroke = ringColor;

  document.getElementById('donutPct').textContent = fmtNum(marginOfPricePct,0) + '%';
  document.getElementById('donutPct').style.color = ringColor;
  document.getElementById('profitAmount').textContent = (profit>=0?'+':'') + fmtBRL(profit);
  document.getElementById('profitAmount').style.color = profit>=0 ? '' : ringColor;
  document.getElementById('markupPct').textContent = fmtNum(markupPct,0) + '%';

  const badge = document.getElementById('qualityBadge');
  let badgeText, badgeColor, badgeBg, badgeBorder, icon;
  if(marginOfPricePct < 0){
    badgeText = 'Prejuízo. O preço não cobre o custo.'; badgeColor='var(--red)'; badgeBg='#ff5b5b1a'; badgeBorder='#ff5b5b55'; icon='⚠';
  } else if(marginOfPricePct < 30){
    badgeText = `Margem de ${fmtNum(marginOfPricePct,0)}%. Baixa — considere revisar o preço.`; badgeColor='var(--salmon)'; badgeBg='#ffb7341a'; badgeBorder='#ffb73455'; icon='⚠';
  } else if(marginOfPricePct < 50){
    badgeText = `Margem de ${fmtNum(marginOfPricePct,0)}%. Razoável.`; badgeColor='var(--blue)'; badgeBg='#35c4d41a'; badgeBorder='#35c4d455'; icon='✓';
  } else if(marginOfPricePct < 70){
    badgeText = `Margem de ${fmtNum(marginOfPricePct,0)}%. Boa.`; badgeColor='var(--green)'; badgeBg='#35d48818'; badgeBorder='#35d48850'; icon='✓';
  } else {
    badgeText = `Margem de ${fmtNum(marginOfPricePct,0)}%. Excelente.`; badgeColor='var(--green)'; badgeBg='#35d48818'; badgeBorder='#35d48850'; icon='✓';
  }
  badge.style.color = badgeColor;
  badge.style.background = badgeBg;
  badge.style.borderColor = badgeBorder;
  badge.innerHTML = `<span>${icon}</span><span>${badgeText}</span>`;

  document.getElementById('outTotalCost').textContent = fmtBRL(totalCost);
  document.getElementById('outEffectiveHours').textContent = `${fmtNum(hours,2)}h`;
  document.getElementById('outWeight').textContent = `${fmtNum(totalWeightUsed,1)} g`;

  const parts = [
    {label:'Filamento', value: materialCost, color: 'var(--green)'},
    {label:'Energia', value: energyCost, color: 'var(--accent)'},
    {label:'Mão de obra', value: laborCost, color: 'var(--blue)'},
    {label:'Insumos', value: insumos, color: 'var(--purple)'},
    {label:'Depreciação', value: depreciationTotal, color: 'var(--red)'},
    {label:'Risco de falha', value: riscoValue, color: 'var(--salmon)'},
    {label:'Frete + embalagem', value: frete, color: 'var(--text-faint)'},
  ];
  const layersEl = document.getElementById('layers');
  const legendEl = document.getElementById('legend');
  layersEl.innerHTML = '';
  legendEl.innerHTML = '';
  parts.forEach(p => {
    const pct = totalCost > 0 ? (p.value/totalCost*100) : 0;
    const seg = document.createElement('div');
    seg.style.width = pct + '%';
    seg.style.background = p.color;
    layersEl.appendChild(seg);

    const item = document.createElement('div');
    item.className = 'legend-item';
    const pctTxt = pct > 0 ? `<span class="pct">${fmtNum(pct,0)}%</span>` : '';
    item.innerHTML = `<span class="lbl"><span class="swatch" style="background:${p.color}"></span>${p.label}</span><span class="right">${pctTxt}<span class="val">${fmtBRL(p.value)}</span></span>`;
    legendEl.appendChild(item);
  });

  updateOrcMaterialSuggestion();
  updateOrcPreview();
}

function parseTimeToHours(str){
  let h = 0;
  const d = str.match(/(\d+)\s*d/i); if(d) h += parseInt(d[1]) * 24;
  const hh = str.match(/(\d+)\s*h/i); if(hh) h += parseInt(hh[1]);
  const mm = str.match(/(\d+)\s*m(?!s)/i); if(mm) h += parseInt(mm[1]) / 60;
  const ss = str.match(/(\d+)\s*s/i); if(ss) h += parseInt(ss[1]) / 3600;
  return h;
}

function lengthMetersToGrams(lengthM, densityGcm3, diameterMm){
  densityGcm3 = densityGcm3 || 1.24;
  diameterMm = diameterMm || 1.75;
  const areaMm2 = Math.PI * Math.pow(diameterMm/2, 2);
  const volumeMm3 = (lengthM*1000) * areaMm2;
  const volumeCm3 = volumeMm3/1000;
  return volumeCm3 * densityGcm3;
}

function parseGcode(text){
  const result = { timeHours: null, weights: [], colors: [], slicer: null, estimated: false, colorsFound: false };

  let m = text.match(/;\s*model printing time:\s*([^;\n]+)/i);
  if(!m) m = text.match(/;\s*total estimated time:\s*([^;\n]+)/i);
  if(!m) m = text.match(/;\s*estimated printing time \(normal mode\)\s*=\s*([^\n]+)/i);
  if(m){ result.timeHours = parseTimeToHours(m[1]); result.slicer = 'Bambu Studio / OrcaSlicer / PrusaSlicer'; }

  let wm = text.match(/;\s*total filament weight \[g\]\s*:\s*([\d.,\s]+)/i);
  if(!wm) wm = text.match(/;\s*filament used \[g\]\s*=\s*([\d.,\s]+)/i);
  let rawWeights = [];
  if(wm){
    rawWeights = wm[1].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if(!result.slicer) result.slicer = 'Bambu Studio / OrcaSlicer / PrusaSlicer';
  }

  // real filament colors from the slicer's config block — this is what was missing before,
  // which is why the swatches showed generic placeholder colors instead of the real ones
  let cm = text.match(/;\s*filament_colou?r\s*=\s*([^\n]+)/i);
  let rawColors = [];
  if(cm){
    rawColors = cm[1].split(/[;,]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => (s.startsWith('#') ? s : '#' + s).slice(0,7))
      .filter(s => /^#[0-9a-fA-F]{6}$/.test(s));
    if(rawColors.length) result.colorsFound = true;
  }

  if(result.timeHours === null){
    const tm = text.match(/;TIME:(\d+)/i);
    if(tm){ result.timeHours = parseInt(tm[1]) / 3600; result.slicer = result.slicer || 'Cura'; }
  }

  if(rawWeights.length === 0){
    const lm = text.match(/;\s*Filament used:\s*([\d.,\s m]+)/i);
    if(lm){
      const lengths = lm[1].split(',').map(s => parseFloat(s)).filter(n => !isNaN(n));
      if(lengths.length){
        rawWeights = lengths.map(l => Math.round(lengthMetersToGrams(l) * 100)/100);
        result.estimated = true;
        result.slicer = result.slicer || 'Cura';
      }
    }
  }

  // pair each weight with the color at the same slot index, and drop unused (near-zero) AMS
  // slots so the colors don't shift out of place — this was the source of the wrong-color bug
  rawWeights.forEach((w, i) => {
    if(w > 0.05){
      result.weights.push(w);
      result.colors.push(rawColors[i] || null);
    }
  });

  return result;
}

function hexToRgb(hex){
  hex = (hex || '').replace('#','');
  if(hex.length !== 6) return [0,0,0];
  return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
}
function colorDistance(hex1, hex2){
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}
function findClosestMaterial(hex, threshold){
  threshold = threshold || 60;
  let best = null, bestDist = Infinity;
  collections.materials.forEach(m => {
    if(!m.cor) return;
    const d = colorDistance(hex, m.cor);
    if(d < bestDist){ bestDist = d; best = m; }
  });
  return (best && bestDist <= threshold) ? best : null;
}

function handleGcodeText(text, filename){
  const statusEl = document.getElementById('gcodeStatus');
  const r = parseGcode(text);

  if(r.timeHours === null && r.weights.length === 0){
    statusEl.className = 'gcode-status err';
    statusEl.textContent = `Não consegui identificar tempo/peso em "${filename}". Preencha os campos manualmente.`;
    return;
  }

  if(r.timeHours !== null){
    document.getElementById('printHours').value = Math.round(r.timeHours * 100) / 100;
  }
  let matchedCount = 0;
  if(r.weights.length > 0){
    const n = Math.min(4, r.weights.length);
    setColorCount(n);
    const colorsSlice = r.colors.slice(0, n);
    const matIds = colorsSlice.map(hex => {
      if(!hex) return '';
      const m = findClosestMaterial(hex);
      if(m) matchedCount++;
      return m ? m.id : '';
    });
    renderColorRows(r.weights.slice(0, n), colorsSlice, matIds);
  }

  calculate('margin');

  const h = r.timeHours !== null ? `${fmtNum(r.timeHours,2)}h` : '—';
  const wtxt = r.weights.length ? `${r.weights.map(w=>fmtNum(w,1)).join(' + ')} g (${r.weights.length} ${r.weights.length>1?'cores':'cor'})` : '—';
  const colorNote = (r.weights.length > 1 && !r.colorsFound) ? ' — cores reais não encontradas no arquivo, confira as cores nos seletores' : '';
  const matchNote = matchedCount > 0 ? ` · ${matchedCount} ${matchedCount>1?'materiais vinculados':'material vinculado'} automaticamente` : '';
  statusEl.className = 'gcode-status ok';
  statusEl.textContent = `Detectado via ${r.slicer} em "${filename}": ${h} (+5min de nivelamento no cálculo) · ${wtxt}${colorNote}${matchNote}${r.estimated ? ' (peso estimado a partir do comprimento — confira o valor)' : ''}`;
}

const dropzone = document.getElementById('dropzone');
const gcodeFile = document.getElementById('gcodeFile');

dropzone.addEventListener('click', () => gcodeFile.click());
gcodeFile.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => handleGcodeText(ev.target.result, f.name);
  reader.readAsText(f);
});
['dragover','dragenter'].forEach(evt => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('drag'); }));
['dragleave','dragend'].forEach(evt => dropzone.addEventListener(evt, () => { dropzone.classList.remove('drag'); }));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('drag');
  const f = e.dataTransfer.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => handleGcodeText(ev.target.result, f.name);
  reader.readAsText(f);
});

document.getElementById('sellPrice').addEventListener('input', () => calculate('price'));
document.querySelectorAll('#tab-calc input').forEach(el => {
  if(el.id === 'sellPrice') return;
  el.addEventListener('input', () => calculate('margin'));
});

renderColorRows();
calculate('margin');

document.getElementById('deductStockBtn').addEventListener('click', async () => {
  const updates = [];
  for(let i=0;i<state.colors;i++){
    const sel = document.querySelector(`.mat-select[data-idx="${i}"]`);
    if(sel && sel.value){
      const m = collections.materials.find(x => x.id === sel.value);
      if(m){
        const w = parseFloat(document.getElementById(`colorWeight${i}`).value) || 0;
        m.estoque = Math.max(0, (m.estoque || 0) - w);
        updates.push(`${m.nome}: -${fmtNum(w,1)}g`);
      }
    }
  }
  const msg = document.getElementById('stockDeductMsg');
  msg.classList.add('show');
  if(updates.length){
    await saveAll('materials', collections.materials);
    renderMateriais();
    msg.textContent = 'Estoque atualizado — ' + updates.join(' · ');
  } else {
    msg.textContent = 'Nenhum material vinculado nas cores desta peça — selecione um material no seletor de cada cor pra descontar do estoque.';
  }
});

/* ======================================================================
   ORÇAMENTO EM PDF
   ====================================================================== */
function updateOrcMaterialSuggestion(){
  const field = document.getElementById('orcMaterial');
  if(!field || field.value.trim()) return;
  const names = [];
  for(let i=0;i<state.colors;i++){
    const sel = document.querySelector(`.mat-select[data-idx="${i}"]`);
    if(sel && sel.value){
      const m = collections.materials.find(x => x.id === sel.value);
      if(m && !names.includes(m.nome)) names.push(m.nome);
    }
  }
  if(names.length) field.value = names.join(' + ');
}

function updateOrcPreview(){
  const wrap = document.getElementById('orcValuePreview');
  if(!wrap) return;
  const base = parseFloat(document.getElementById('sellPrice').value) || 0;
  const forma1 = document.getElementById('orcForma1').value.trim() || 'Forma de pagamento 1';
  const desc1 = parseFloat(document.getElementById('orcDesconto1').value) || 0;
  const forma2 = document.getElementById('orcForma2').value.trim();
  const desc2 = parseFloat(document.getElementById('orcDesconto2').value) || 0;

  const val1 = base * (1 - desc1/100);
  let html = `Valor do orçamento: <b>${fmtBRL(base)}</b><br>${forma1}${desc1>0?` (${desc1}% off)`:''}: <b>${fmtBRL(val1)}</b>`;
  if(forma2){
    const val2 = base * (1 - desc2/100);
    html += `<br>${forma2}${desc2>0?` (${desc2}% off)`:''}: <b>${fmtBRL(val2)}</b>`;
  }
  wrap.innerHTML = html;
}
['orcForma1','orcDesconto1','orcForma2','orcDesconto2'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateOrcPreview);
});

const logoDrop = document.getElementById('logoDrop');
const logoInput = document.getElementById('logoInput');
const logoPreview = document.getElementById('logoPreview');
const logoDropEmpty = document.getElementById('logoDropEmpty');
const logoRemoveBtn = document.getElementById('logoRemoveBtn');

function showLogoPreview(){
  if(settings.logoDataUrl){
    logoPreview.src = settings.logoDataUrl;
    logoPreview.style.display = 'block';
    logoDropEmpty.style.display = 'none';
    logoRemoveBtn.style.display = 'inline-block';
  } else {
    logoPreview.style.display = 'none';
    logoDropEmpty.style.display = 'block';
    logoRemoveBtn.style.display = 'none';
  }
}
logoDrop.addEventListener('click', () => logoInput.click());
logoInput.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if(!f) return;
  if(f.size > 3*1024*1024){
    const st = document.getElementById('orcStatus');
    st.className = 'orc-status show err';
    st.textContent = 'Essa imagem é muito grande — use um arquivo de até 3MB.';
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    settings.logoDataUrl = ev.target.result;
    saveSettings();
    showLogoPreview();
  };
  reader.readAsDataURL(f);
});
logoRemoveBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  settings.logoDataUrl = '';
  saveSettings();
  showLogoPreview();
});
document.getElementById('orcEmpresa').addEventListener('change', (e) => {
  settings.empresaNome = e.target.value.trim();
  saveSettings();
});

function updateOrcNumeroBadge(){
  const next = (settings.orcamentoNumero || 0) + 1;
  document.getElementById('orcNumeroBadge').textContent = '#' + String(next).padStart(3,'0');
}
function initOrcamentoFromSettings(){
  document.getElementById('orcEmpresa').value = settings.empresaNome || '';
  showLogoPreview();
  updateOrcNumeroBadge();
}

document.getElementById('orcExportBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('orcStatus');
  const empresa = document.getElementById('orcEmpresa').value.trim() || 'Minha Empresa';
  const cliente = document.getElementById('orcCliente').value.trim();
  const descricao = document.getElementById('orcDescricao').value.trim();
  const material = document.getElementById('orcMaterial').value.trim();
  const quantidade = parseFloat(document.getElementById('orcQuantidade').value) || 1;
  const prazo = document.getElementById('orcPrazo').value.trim();
  const validade = document.getElementById('orcValidade').value.trim();
  const forma1 = document.getElementById('orcForma1').value.trim();
  const desc1 = parseFloat(document.getElementById('orcDesconto1').value) || 0;
  const forma2 = document.getElementById('orcForma2').value.trim();
  const desc2 = parseFloat(document.getElementById('orcDesconto2').value) || 0;
  const obs = document.getElementById('orcObs').value.trim();
  const base = parseFloat(document.getElementById('sellPrice').value) || 0;

  if(!cliente || !descricao){
    statusEl.className = 'orc-status show err';
    statusEl.textContent = 'Preencha ao menos o nome do cliente e a descrição do serviço.';
    return;
  }

  try{
    const numero = String((settings.orcamentoNumero || 0) + 1).padStart(3,'0');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'mm', format:'a4' });
    const pageW = 210;
    let y = 20;
    let textX = 15;

    if(settings.logoDataUrl){
      try{
        const props = doc.getImageProperties(settings.logoDataUrl);
        const w = 26, h = (props.height/props.width) * w;
        doc.addImage(settings.logoDataUrl, props.fileType, 15, y-7, w, h);
        textX = 46;
      }catch(e){ /* skip broken image */ }
    }
    doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.setTextColor(20);
    doc.text(empresa, textX, y);
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(140);
    doc.text('Gerado por Nass3D', textX, y+6);

    doc.setTextColor(20); doc.setFont('helvetica','bold'); doc.setFontSize(19);
    doc.text('ORÇAMENTO', pageW-15, y, {align:'right'});
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(140);
    doc.text(`#${numero} · ${new Date().toLocaleDateString('pt-BR')}`, pageW-15, y+6, {align:'right'});
    if(validade) doc.text(`Válido por: ${validade}`, pageW-15, y+11, {align:'right'});

    y += 20;
    doc.setDrawColor(225); doc.line(15, y, pageW-15, y);
    y += 10;

    doc.setTextColor(140); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('PARA', 15, y);
    doc.setTextColor(20); doc.setFont('helvetica','normal'); doc.setFontSize(12);
    doc.text(cliente, 15, y+6);
    y += 18;

    const rows = [
      ['Descrição', descricao],
      ['Material', material || '—'],
      ['Quantidade', String(quantidade)],
      ['Prazo de entrega', prazo || '—'],
    ];
    rows.forEach(([label, val]) => {
      doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(140);
      doc.text(label, 15, y);
      doc.setFont('helvetica','normal'); doc.setFontSize(10.5); doc.setTextColor(20);
      doc.text(String(val), 65, y);
      y += 7.5;
    });

    y += 5;
    doc.setDrawColor(225); doc.line(15, y, pageW-15, y);
    y += 12;

    doc.setFont('helvetica','bold'); doc.setFontSize(12.5); doc.setTextColor(20);
    doc.text('Valor do orçamento', 15, y);
    doc.setFontSize(17);
    doc.text(fmtBRL(base), pageW-15, y, {align:'right'});
    y += 11;

    if(forma1){
      const val1 = base * (1 - desc1/100);
      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(90);
      doc.text(`${forma1}${desc1>0?` — ${desc1}% de desconto`:''}`, 15, y);
      doc.setFont('helvetica','bold'); doc.setTextColor(20);
      doc.text(fmtBRL(val1), pageW-15, y, {align:'right'});
      y += 7;
    }
    if(forma2){
      const val2 = base * (1 - desc2/100);
      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(90);
      doc.text(`${forma2}${desc2>0?` — ${desc2}% de desconto`:''}`, 15, y);
      doc.setFont('helvetica','bold'); doc.setTextColor(20);
      doc.text(fmtBRL(val2), pageW-15, y, {align:'right'});
      y += 7;
    }

    if(obs){
      y += 7;
      doc.setDrawColor(225); doc.line(15, y, pageW-15, y);
      y += 10;
      doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(140);
      doc.text('OBSERVAÇÕES', 15, y);
      y += 6;
      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(20);
      doc.text(doc.splitTextToSize(obs, pageW-30), 15, y);
    }

    doc.save(`orcamento-${numero}-${cliente.replace(/\s+/g,'-').toLowerCase()}.pdf`);

    settings.orcamentoNumero = (settings.orcamentoNumero || 0) + 1;
    await saveSettings();
    updateOrcNumeroBadge();

    collections.orders.push({
      id: newId(),
      cliente,
      telefone: '',
      item: `#${numero} ${descricao}${quantidade>1?` (${quantidade}x)`:''}`,
      prazo: '',
      criadoEm: new Date().toISOString(),
      status: 'Orçamento',
      valor: base,
    });
    await saveAll('orders', collections.orders);
    renderPedidos();

    statusEl.className = 'orc-status show ok';
    statusEl.textContent = 'PDF exportado e orçamento salvo na aba Pedidos.';
  }catch(err){
    statusEl.className = 'orc-status show err';
    statusEl.textContent = 'Não consegui gerar o PDF agora — tente de novo.';
  }
});

/* ======================================================================
   MATERIAIS
   ====================================================================== */

function renderMateriais(){
  const list = document.getElementById('matList');
  const empty = document.getElementById('matEmpty');
  list.innerHTML = '';
  document.getElementById('matCount').textContent = collections.materials.length;
  empty.style.display = collections.materials.length ? 'none' : 'block';
  collections.materials.forEach(m => {
    const row = document.createElement('div');
    row.className = 'crud-row materiais';
    const lowStock = (m.estoque||0) < 100;
    row.innerHTML = `
      <div class="color-input-group">
        <input type="color" data-id="${m.id}" data-field="cor" value="${m.cor}">
        <input type="text" class="color-text-helper" placeholder="digitar cor">
      </div>
      <input type="text" data-id="${m.id}" data-field="nome" value="${escapeAttr(m.nome)}">
      <input type="number" data-id="${m.id}" data-field="preco" value="${m.preco}" step="1" min="0">
      <input type="number" data-id="${m.id}" data-field="estoque" value="${m.estoque||0}" step="10" min="0" style="${lowStock ? 'color:var(--red);font-weight:600;' : ''}" title="${lowStock ? 'Estoque baixo' : ''}">
      <button class="btn-del" data-id="${m.id}" title="Remover">✕</button>
    `;
    list.appendChild(row);
    const picker = row.querySelector('input[type=color]');
    const textHelper = row.querySelector('.color-text-helper');
    bindColorGroup(picker, textHelper, (hex) => {
      m.cor = hex;
      saveAll('materials', collections.materials);
    });
  });
  list.querySelectorAll('input').forEach(inp => inp.addEventListener('change', (e) => {
    const field = e.target.dataset.field;
    if(!field) return;
    const id = e.target.dataset.id;
    const m = collections.materials.find(x => x.id === id);
    if(!m) return;
    m[field] = (field === 'preco' || field === 'estoque') ? (parseFloat(e.target.value)||0) : e.target.value;
    saveAll('materials', collections.materials);
    renderMateriais();
  }));
  list.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    collections.materials = collections.materials.filter(x => x.id !== id);
    saveAll('materials', collections.materials);
    renderMateriais();
  }));
  refreshMaterialSelects();
}
bindColorGroup(document.getElementById('matCorPicker'), document.getElementById('matCorText'));

function updateNamePreview(){
  const corTexto = document.getElementById('matCorText').value;
  const complemento = document.getElementById('matComplemento').value;
  document.getElementById('matNamePreview').innerHTML = `Nome: <span>${escapeAttr(buildFilamentName(corTexto, complemento))}</span>`;
}
document.getElementById('matCorText').addEventListener('input', updateNamePreview);
document.getElementById('matComplemento').addEventListener('input', updateNamePreview);
updateNamePreview();

document.getElementById('matAddBtn').addEventListener('click', () => {
  const corTexto = document.getElementById('matCorText').value.trim();
  if(!corTexto) return;
  const complemento = document.getElementById('matComplemento').value.trim();
  collections.materials.push({
    id: newId(),
    nome: buildFilamentName(corTexto, complemento),
    cor: document.getElementById('matCorPicker').value,
    preco: parseFloat(document.getElementById('matPreco').value) || 0,
    estoque: parseFloat(document.getElementById('matEstoque').value) || 0,
  });
  saveAll('materials', collections.materials);
  document.getElementById('matCorText').value = '';
  document.getElementById('matComplemento').value = '';
  document.getElementById('matEstoque').value = '1000';
  updateNamePreview();
  renderMateriais();
});

/* ======================================================================
   PRODUTOS
   ====================================================================== */
function updateProdutoDatalist(){
  const dl = document.getElementById('prodDatalist');
  dl.innerHTML = collections.products.map(p => `<option value="${escapeAttr(p.nome)}">`).join('');
}

function renderProdutos(){
  const list = document.getElementById('prodList');
  const empty = document.getElementById('prodEmpty');
  list.innerHTML = '';
  document.getElementById('prodCount').textContent = collections.products.length;
  empty.style.display = collections.products.length ? 'none' : 'block';
  collections.products.forEach(p => {
    const row = document.createElement('div');
    row.className = 'crud-row produtos';
    row.innerHTML = `
      <input type="text" data-id="${p.id}" data-field="nome" value="${escapeAttr(p.nome)}">
      <input type="number" data-id="${p.id}" data-field="preco" value="${p.preco}" step="0.5" min="0">
      <input type="number" data-id="${p.id}" data-field="custo" value="${p.custo}" step="0.5" min="0">
      <button class="btn-del" data-id="${p.id}" title="Remover">✕</button>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('input').forEach(inp => inp.addEventListener('change', (e) => {
    const id = e.target.dataset.id, field = e.target.dataset.field;
    const p = collections.products.find(x => x.id === id);
    if(!p) return;
    p[field] = field === 'nome' ? e.target.value : (parseFloat(e.target.value)||0);
    saveAll('products', collections.products);
    updateProdutoDatalist();
  }));
  list.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    collections.products = collections.products.filter(x => x.id !== id);
    saveAll('products', collections.products);
    renderProdutos();
    updateProdutoDatalist();
  }));
  updateProdutoDatalist();
  renderPainel();
  renderRelatorio();
}
document.getElementById('prodAddBtn').addEventListener('click', () => {
  const nome = document.getElementById('prodNome').value.trim();
  if(!nome) return;
  collections.products.push({
    id: newId(),
    nome,
    preco: parseFloat(document.getElementById('prodPreco').value) || 0,
    custo: parseFloat(document.getElementById('prodCusto').value) || 0,
  });
  saveAll('products', collections.products);
  document.getElementById('prodNome').value = '';
  document.getElementById('prodPreco').value = '0';
  document.getElementById('prodCusto').value = '0';
  renderProdutos();
});

/* ======================================================================
   PEDIDOS
   ====================================================================== */
const PEDIDO_STATUS = ['Orçamento','Pendente','Em produção','Pronto','Entregue','Perdido'];

function waLink(tel){
  let digits = (tel || '').replace(/\D/g, '');
  if(!digits) return null;
  if(digits.length <= 11) digits = '55' + digits;
  return `https://wa.me/${digits}`;
}

function pedidoRowFlag(o){
  if(!o.prazo || o.status === 'Entregue' || o.status === 'Orçamento' || o.status === 'Perdido') return '';
  const today = new Date(); today.setHours(0,0,0,0);
  const prazoDate = new Date(o.prazo + 'T00:00:00');
  const diffDays = Math.round((prazoDate - today) / 86400000);
  if(diffDays < 0) return 'atrasado';
  if(diffDays <= 2) return 'urgente';
  return '';
}

function renderPedidos(){
  const list = document.getElementById('pedList');
  const empty = document.getElementById('pedEmpty');
  list.innerHTML = '';
  document.getElementById('pedCount').textContent = collections.orders.length;
  empty.style.display = collections.orders.length ? 'none' : 'block';
  collections.orders.forEach(o => {
    const row = document.createElement('div');
    const flag = pedidoRowFlag(o);
    row.className = `crud-row pedidos${flag ? ' ' + flag : ''}`;
    row.title = flag === 'atrasado' ? 'Prazo vencido' : (flag === 'urgente' ? 'Prazo perto de vencer' : '');
    row.innerHTML = `
      <input type="text" data-id="${o.id}" data-field="cliente" value="${escapeAttr(o.cliente)}">
      <div class="tel-input-wrap">
        <input type="text" data-id="${o.id}" data-field="telefone" value="${escapeAttr(o.telefone||'')}" placeholder="WhatsApp">
        ${o.telefone ? `<a class="wa-link" href="${waLink(o.telefone)}" target="_blank" title="Abrir WhatsApp">💬</a>` : ''}
      </div>
      <input type="text" data-id="${o.id}" data-field="item" value="${escapeAttr(o.item)}">
      <input type="date" data-id="${o.id}" data-field="prazo" value="${o.prazo || ''}">
      <select data-id="${o.id}" data-field="status">
        ${PEDIDO_STATUS.map(s => `<option ${s===o.status?'selected':''}>${s}</option>`).join('')}
      </select>
      <input type="number" data-id="${o.id}" data-field="valor" value="${o.valor}" step="0.5" min="0">
      <button class="btn-del" data-id="${o.id}" title="Remover">✕</button>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('input, select').forEach(inp => inp.addEventListener('change', (e) => {
    const id = e.target.dataset.id, field = e.target.dataset.field;
    const o = collections.orders.find(x => x.id === id);
    if(!o) return;
    o[field] = field === 'valor' ? (parseFloat(e.target.value)||0) : e.target.value;
    saveAll('orders', collections.orders);
    renderPedidos();
  }));
  list.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    collections.orders = collections.orders.filter(x => x.id !== id);
    saveAll('orders', collections.orders);
    renderPedidos();
  }));
  updatePedidoSelect();
  renderPainel();
  renderRelatorio();
}
document.getElementById('pedAddBtn').addEventListener('click', () => {
  const cliente = document.getElementById('pedCliente').value.trim();
  const item = document.getElementById('pedItem').value.trim();
  if(!cliente && !item) return;
  collections.orders.push({
    id: newId(),
    cliente, item,
    telefone: document.getElementById('pedTelefone').value.trim(),
    prazo: document.getElementById('pedPrazo').value,
    status: document.getElementById('pedStatus').value,
    valor: parseFloat(document.getElementById('pedValor').value) || 0,
    criadoEm: new Date().toISOString(),
  });
  saveAll('orders', collections.orders);
  document.getElementById('pedCliente').value = '';
  document.getElementById('pedTelefone').value = '';
  document.getElementById('pedItem').value = '';
  document.getElementById('pedPrazo').value = '';
  document.getElementById('pedValor').value = '0';
  renderPedidos();
});

/* ======================================================================
   VENDAS
   ====================================================================== */
function renderVendas(){
  const list = document.getElementById('venList');
  const empty = document.getElementById('venEmpty');
  list.innerHTML = '';
  document.getElementById('venCount').textContent = collections.sales.length;
  empty.style.display = collections.sales.length ? 'none' : 'block';
  let total = 0;
  collections.sales.forEach(v => {
    total += v.valor || 0;
    const row = document.createElement('div');
    row.className = 'crud-row vendas';
    row.innerHTML = `
      <input type="date" data-id="${v.id}" data-field="data" value="${v.data || ''}">
      <input type="text" data-id="${v.id}" data-field="produto" value="${escapeAttr(v.produto)}">
      <input type="text" data-id="${v.id}" data-field="comprador" value="${escapeAttr(v.comprador)}">
      <input type="text" data-id="${v.id}" data-field="contato" value="${escapeAttr(v.contato)}">
      <input type="number" data-id="${v.id}" data-field="valor" value="${v.valor}" step="0.5" min="0">
      <button class="btn-del" data-id="${v.id}" title="Remover">✕</button>
    `;
    list.appendChild(row);
  });
  document.getElementById('venTotal').textContent = `Total vendido: ${fmtBRL(total)}`;
  list.querySelectorAll('input').forEach(inp => inp.addEventListener('change', (e) => {
    const id = e.target.dataset.id, field = e.target.dataset.field;
    const v = collections.sales.find(x => x.id === id);
    if(!v) return;
    v[field] = field === 'valor' ? (parseFloat(e.target.value)||0) : e.target.value;
    saveAll('sales', collections.sales);
    renderVendas();
  }));
  list.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    collections.sales = collections.sales.filter(x => x.id !== id);
    saveAll('sales', collections.sales);
    renderVendas();
  }));
  renderPainel();
  renderRelatorio();
}

function updatePedidoSelect(){
  const sel = document.getElementById('venPedidoSelect');
  if(!sel) return;
  const current = sel.value;
  let html = '<option value="">Nenhum — venda avulsa</option>';
  collections.orders.filter(o => o.status !== 'Entregue').forEach(o => {
    html += `<option value="${o.id}">${escapeAttr(o.cliente || 'Sem nome')} — ${escapeAttr(o.item || '')}</option>`;
  });
  sel.innerHTML = html;
  if([...sel.options].some(opt => opt.value === current)) sel.value = current;
}

document.getElementById('venPedidoSelect').addEventListener('change', (e) => {
  const o = collections.orders.find(x => x.id === e.target.value);
  if(o){
    document.getElementById('venProdutoInput').value = o.item || '';
    document.getElementById('venComprador').value = o.cliente || '';
    document.getElementById('venValor').value = o.valor || 0;
  }
});

document.getElementById('venAddBtn').addEventListener('click', async () => {
  const produto = document.getElementById('venProdutoInput').value.trim();
  const comprador = document.getElementById('venComprador').value.trim();
  if(!produto && !comprador) return;
  const pedidoId = document.getElementById('venPedidoSelect').value;
  collections.sales.push({
    id: newId(),
    data: document.getElementById('venData').value,
    produto,
    comprador,
    contato: document.getElementById('venContato').value.trim(),
    valor: parseFloat(document.getElementById('venValor').value) || 0,
    pedidoId: pedidoId || null,
  });
  await saveAll('sales', collections.sales);
  if(pedidoId){
    const o = collections.orders.find(x => x.id === pedidoId);
    if(o){
      o.status = 'Entregue';
      await saveAll('orders', collections.orders);
      renderPedidos();
    }
  }
  document.getElementById('venPedidoSelect').value = '';
  document.getElementById('venProdutoInput').value = '';
  document.getElementById('venComprador').value = '';
  document.getElementById('venContato').value = '';
  document.getElementById('venValor').value = '0';
  renderVendas();
});

/* ======================================================================
   PAINEL (home dashboard)
   ====================================================================== */
const WEEKDAYS_PT = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

async function loadSettings(){
  try{
    const { data, error } = await supabaseClient
      .from('settings').select('*').eq('user_id', currentUser.id).maybeSingle();
    if(error) throw error;
    if(data){
      Object.assign(settings, {
        metaMensal: Number(data.meta_mensal),
        orcamentoNumero: data.orcamento_numero || 0,
        empresaNome: data.empresa_nome || '',
        logoDataUrl: data.logo_data_url || '',
      });
    }
  }catch(e){ /* keep defaults */ }
}
async function saveSettings(){
  try{
    const { error } = await supabaseClient.from('settings').upsert({
      user_id: currentUser.id,
      meta_mensal: settings.metaMensal,
      orcamento_numero: settings.orcamentoNumero,
      empresa_nome: settings.empresaNome || '',
      logo_data_url: settings.logoDataUrl || '',
    }, { onConflict: 'user_id' });
    if(error) throw error;
  }catch(e){
    console.error('Erro ao salvar configurações', e);
  }
}

function renderPainel(){
  document.getElementById('painelYear').textContent = new Date().getFullYear();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : (hour < 18 ? 'Boa tarde' : 'Boa noite');
  document.getElementById('greetTitle').textContent = `${greeting}, chefe! 👋`;
  document.getElementById('greetDate').textContent = `${WEEKDAYS_PT[now.getDay()]}, ${now.getDate()}/${now.getMonth()+1}`;

  const ym = now.toISOString().slice(0,7);
  let caixaMes = 0, profitSum = 0, profitCount = 0;
  collections.sales.forEach(v => {
    if(v.data && v.data.slice(0,7) === ym) caixaMes += (v.valor || 0);
    const prod = collections.products.find(p => p.nome === v.produto);
    if(prod){ profitSum += (v.valor || 0) - (prod.custo || 0); profitCount++; }
  });
  const lucroMedio = profitCount ? profitSum/profitCount : null;

  const pendentes = collections.orders.filter(o => o.status !== 'Entregue' && o.status !== 'Orçamento');
  const aReceber = pendentes.reduce((sum,o) => sum + (o.valor||0), 0);
  const emAberto = collections.orders.filter(o => o.status === 'Pendente').length;
  const emProducao = collections.orders.filter(o => o.status === 'Em produção').length;
  const orcamentosAbertos = collections.orders.filter(o => o.status === 'Orçamento').length;

  document.getElementById('receivableValue').textContent = `${fmtBRL(aReceber)} a receber`;
  document.getElementById('receivableSub').textContent = `${pendentes.length} pedido${pendentes.length===1?'':'s'} pendente${pendentes.length===1?'':'s'}`;

  // alerts
  const zeroed = collections.materials.filter(m => (m.estoque||0) <= 0).length;
  const lowStock = collections.materials.filter(m => (m.estoque||0) > 0 && (m.estoque||0) < 100).length;
  const overdue = collections.orders.filter(o => pedidoRowFlag(o) === 'atrasado').length;

  const alerts = [];
  if(zeroed > 0) alerts.push({level:'atrasado', icon:'📦', text:`${zeroed} cor${zeroed>1?'es':''} zerada${zeroed>1?'s':''} no estoque`, link:'estoque →', tab:'materiais'});
  if(overdue > 0) alerts.push({level:'atrasado', icon:'⏰', text:`${overdue} pedido${overdue>1?'s':''} com prazo vencido`, link:'pedidos →', tab:'pedidos'});
  if(lowStock > 0) alerts.push({level:'urgente', icon:'📉', text:`${lowStock} material${lowStock>1?'is':''} com estoque baixo`, link:'materiais →', tab:'materiais'});

  const alertsWrap = document.getElementById('painelAlerts');
  alertsWrap.innerHTML = '';
  if(alerts.length === 0){
    alertsWrap.innerHTML = `<div class="alert-card ok"><div class="alert-main"><span class="alert-icon">✅</span><span class="alert-text">Tudo em dia por aqui.</span></div></div>`;
  } else {
    alerts.forEach((a, idx) => {
      const card = document.createElement('div');
      card.className = `alert-card ${a.level}`;
      card.style.animationDelay = (idx * 0.06) + 's';
      card.innerHTML = `<div class="alert-main"><span class="alert-icon">${a.icon}</span><span class="alert-text">${a.text}</span></div><button class="alert-link" data-tab="${a.tab}">${a.link}</button>`;
      alertsWrap.appendChild(card);
    });
    alertsWrap.querySelectorAll('.alert-link').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  }

  // stat cards
  const stats = [
    {label:'Orçamentos', raw: orcamentosAbertos, fmt: v => String(Math.round(v)), link:'pedidos ›', tab:'pedidos', color:'var(--text)'},
    {label:'Em aberto', raw: emAberto, fmt: v => String(Math.round(v)), link:'pedidos ›', tab:'pedidos', color:'var(--salmon)'},
    {label:'Em produção', raw: emProducao, fmt: v => String(Math.round(v)), link:'pedidos ›', tab:'pedidos', color:'var(--blue)'},
    {label:'A receber', raw: aReceber, fmt: v => fmtBRL(v), link:'pedidos ›', tab:'pedidos', color:'var(--accent)'},
    {label:'Caixa do mês', raw: caixaMes, fmt: v => fmtBRL(v), link:'vendas ›', tab:'vendas', color:'var(--green)'},
    {label:'Lucro médio/venda', raw: lucroMedio, fmt: v => lucroMedio===null ? '—' : fmtBRL(v), link:'vendas ›', tab:'vendas', color:'var(--purple)'},
  ];
  const statsWrap = document.getElementById('painelStats');
  statsWrap.innerHTML = '';
  stats.forEach((s, idx) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.style.animationDelay = (idx * 0.05) + 's';
    card.innerHTML = `<div class="stat-label">${s.label}</div><div class="stat-value" style="color:${s.color}"></div><button class="stat-link" data-tab="${s.tab}">${s.link}</button>`;
    statsWrap.appendChild(card);
    const valueEl = card.querySelector('.stat-value');
    if(s.raw === null){
      valueEl.textContent = '—';
    } else {
      animateNumber(valueEl, s.raw, s.fmt);
    }
  });
  statsWrap.querySelectorAll('.stat-link').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  // monthly goal
  document.getElementById('goalCurrent').textContent = fmtBRL(caixaMes);
  const goalInput = document.getElementById('goalTarget');
  if(document.activeElement !== goalInput) goalInput.value = settings.metaMensal;
  const pct = settings.metaMensal > 0 ? Math.min(100, (caixaMes/settings.metaMensal)*100) : 0;
  document.getElementById('goalBarFill').style.width = pct + '%';
}

document.getElementById('goalTarget').addEventListener('change', (e) => {
  settings.metaMensal = parseFloat(e.target.value) || 0;
  saveSettings();
  renderPainel();
});

/* ======================================================================
   RELATÓRIO MENSAL
   ====================================================================== */
function currentYm(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}
document.getElementById('relMes').value = currentYm();

function computeRelatorio(ym){
  let receita = 0, lucro = 0;
  collections.sales.forEach(v => {
    if(v.data && v.data.slice(0,7) === ym){
      receita += (v.valor || 0);
      const prod = collections.products.find(p => p.nome === v.produto);
      if(prod) lucro += (v.valor||0) - (prod.custo||0);
    }
  });

  const criadosNoMes = collections.orders.filter(o => o.criadoEm && o.criadoEm.slice(0,7) === ym);
  const fechados = criadosNoMes.filter(o => o.status === 'Entregue').length;
  const perdidos = criadosNoMes.filter(o => o.status === 'Perdido').length;
  const emAberto = criadosNoMes.length - fechados - perdidos;

  return { receita, lucro, totalCriados: criadosNoMes.length, fechados, perdidos, emAberto };
}

function renderRelatorio(){
  const ymEl = document.getElementById('relMes');
  if(!ymEl) return;
  const ym = ymEl.value || currentYm();
  const r = computeRelatorio(ym);

  const statsWrap = document.getElementById('relStats');
  statsWrap.innerHTML = '';
  const stats = [
    {label:'Receita do mês', raw:r.receita, fmt:v=>fmtBRL(v), color:'var(--green)'},
    {label:'Lucro do mês', raw:r.lucro, fmt:v=>fmtBRL(v), color:'var(--accent)'},
    {label:'Pedidos criados', raw:r.totalCriados, fmt:v=>String(Math.round(v)), color:'var(--text)'},
    {label:'Fechados', raw:r.fechados, fmt:v=>String(Math.round(v)), color:'var(--green)'},
    {label:'Perdidos', raw:r.perdidos, fmt:v=>String(Math.round(v)), color:'var(--red)'},
  ];
  stats.forEach((s, idx) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.style.animationDelay = (idx*0.05)+'s';
    card.innerHTML = `<div class="stat-label">${s.label}</div><div class="stat-value" style="color:${s.color}"></div>`;
    statsWrap.appendChild(card);
    animateNumber(card.querySelector('.stat-value'), s.raw, s.fmt);
  });

  document.getElementById('relBreakdown').innerHTML = `
    <div class="rel-row"><span>✅ Fechados (Entregue)</span><span class="rel-count" style="color:var(--green)">${r.fechados}</span></div>
    <div class="rel-row"><span>❌ Perdidos</span><span class="rel-count" style="color:var(--red)">${r.perdidos}</span></div>
    <div class="rel-row"><span>⏳ Ainda em aberto</span><span class="rel-count" style="color:var(--salmon)">${r.emAberto}</span></div>
  `;
}
document.getElementById('relMes').addEventListener('change', renderRelatorio);

document.getElementById('relPrintBtn').addEventListener('click', () => {
  try{ window.print(); }catch(e){ /* browser may block printing in this context */ }
});

document.getElementById('relExportBtn').addEventListener('click', () => {
  const ym = document.getElementById('relMes').value || currentYm();
  const r = computeRelatorio(ym);
  const [yy, mm] = ym.split('-');
  let mesLabel = new Date(yy, mm-1, 1).toLocaleDateString('pt-BR', {month:'long', year:'numeric'});
  mesLabel = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const pageW = 210;
  let y = 20;

  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(20);
  doc.text('Relatório mensal', 15, y);
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(140);
  doc.text(mesLabel, 15, y+7);
  doc.text(`Gerado por Nass3D em ${new Date().toLocaleDateString('pt-BR')}`, pageW-15, y, {align:'right'});

  y += 20;
  doc.setDrawColor(225); doc.line(15, y, pageW-15, y);
  y += 14;

  const rows = [
    ['Receita do mês', fmtBRL(r.receita)],
    ['Lucro do mês', fmtBRL(r.lucro)],
    ['Pedidos criados no mês', String(r.totalCriados)],
    ['Fechados (Entregue)', String(r.fechados)],
    ['Perdidos', String(r.perdidos)],
    ['Ainda em aberto', String(r.emAberto)],
  ];
  rows.forEach(([label, val]) => {
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(90);
    doc.text(label, 15, y);
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(20);
    doc.text(val, pageW-15, y, {align:'right'});
    y += 10;
  });

  doc.save(`relatorio-${ym}.pdf`);
});

/* ======================================================================
   INIT
   ====================================================================== */
async function initCollections(){
  collections.materials = await loadAll('materials');
  collections.products = await loadAll('products');
  collections.orders = await loadAll('orders');
  collections.sales = await loadAll('sales');
  await loadSettings();
  initOrcamentoFromSettings();
  renderMateriais();
  renderProdutos();
  renderPedidos();
  renderVendas();
  renderPainel();
  renderRelatorio();
}
