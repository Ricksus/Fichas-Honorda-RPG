/* ════════════════════════════════════════════════════
   CONSTANTES E ESTADO
════════════════════════════════════════════════════ */
const STORE_KEY = 'honorda_chars_v3';
const CHAR_PREFIX = 'honorda_char_v3_';

const TECNICAS_ZERO = new Set(['Arte','Ciências','Linguagem','Pilotagem','Tecnologia','Poder','Religião','Medicina']);

const TECNICAS = [
  "Acrobacia","Adestramento","Analisar","Armas Brancas","Armas de Fogo",
  "Arquearia","Arremesso","Arte","Atletismo","Ciências","Computação",
  "Encontrar","Escutar","Furtividade","Intimidar","Intuição","Lábia",
  "Lembrar","Linguagem","Lutar","Medicina","Percepção","Persuasão",
  "Pilotagem","Poder","Religião","Sobrevivência","Tecnologia","Truques"
];

let currentCharId = null;
let currentSheetType = 'survivor';
let saveTimeout = null;
let isAppLoadingData = false;
/* ════════════════════════════════════════════════════
   GERENCIAMENTO DE PERSONAGENS (INDEX)
════════════════════════════════════════════════════ */
function getCharList() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch(e) { return []; }
}
function saveCharList(list) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}
function getCharData(id) {
  try { return JSON.parse(localStorage.getItem(CHAR_PREFIX + id)) || {}; }
  catch(e) { return {}; }
}
function saveCharData(id, data) {
  localStorage.setItem(CHAR_PREFIX + id, JSON.stringify(data));
  const list = getCharList();
  const entry = list.find(c => c.id === id);
  if (entry) {
    entry.name = data.personagem_nome || entry.name;
    entry.occ = data.ocupacao || '';
    entry.fisico = data.apt_fisico || 0;
    entry.mental = data.apt_mental || 0;
    entry.alma = data.apt_alma || 0;
    saveCharList(list);
  }
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function renderIndex() {
  const list = getCharList();
  document.getElementById('agent-count').textContent = list.length;

  const gridSurvivors = document.getElementById('grid-survivors');
  const gridCreatures = document.getElementById('grid-creatures');
  gridSurvivors.innerHTML = '';
  gridCreatures.innerHTML = '';

  const survivors = [];
  const creatures = [];

  list.forEach(char => {
    const data = getCharData(char.id);
    const isCreature = data.__sheetType === 'creature' || char.type === 'creature';
    if (isCreature) creatures.push({ char, data });
    else survivors.push({ char, data });
  });

  document.getElementById('count-survivors').textContent = survivors.length;
  document.getElementById('count-creatures').textContent = creatures.length;

  document.getElementById('section-survivors').style.display = survivors.length === 0 && creatures.length > 0 ? 'none' : '';
  document.getElementById('section-creatures').style.display = creatures.length === 0 ? 'none' : '';

  if (list.length === 0) {
    gridSurvivors.innerHTML = `<div class="empty-state">
      <span class="empty-icon">☽</span>
      <h3>Nenhuma Ficha Registrada</h3>
      <p>O silêncio antecede o caos.<br>Crie seu primeiro personagem para começar.</p>
    </div>`;
    return;
  }

  function buildCard(char, data, i) {
    const initial = (data.personagem_nome || char.name || '?').charAt(0).toUpperCase();
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.style.animationDelay = (i * 0.05) + 's';
    card.style.cursor = 'pointer';

    const dateStr = new Date(char.createdAt).toLocaleDateString('pt-BR');
    const occ = data.ocupacao || char.occ || '—';
    const fisico = data.apt_fisico !== undefined ? data.apt_fisico : '—';
    const mental = data.apt_mental !== undefined ? data.apt_mental : '—';
    const alma = data.apt_alma !== undefined ? data.apt_alma : '—';
    const nome = data.personagem_nome || char.name || 'Sem nome';
    const isCreature = data.__sheetType === 'creature' || char.type === 'creature';

    const avatarHTML = data.__avatar
      ? `<img class="card-avatar-img" src="${data.__avatar}" alt="${nome}">`
      : `<div class="card-avatar">${initial}</div>`;

    const statLabel1 = isCreature ? 'ND' : 'Físico';
    const statLabel2 = isCreature ? 'Carne' : 'Mental';
    const statLabel3 = 'Alma';
    const statVal1 = isCreature ? (data.c_nd || '—') : fisico;
    const statVal2 = isCreature ? (data.c_carne_total || '—') : mental;
    const statVal3 = isCreature ? (data.c_apt_alma || '—') : alma;

    card.innerHTML = `
      <div class="card-header" style="cursor:pointer;">
        ${avatarHTML}
        <div class="card-info">
          <div class="card-name">${nome}</div>
          <div class="card-occ">${isCreature ? (data.c_tipo || '—') : occ}</div>
          <div class="card-date">Criado em ${dateStr}</div>
        </div>
      </div>
      <div class="card-stats" style="cursor:pointer;">
        <div class="card-stat"><div class="card-stat-val">${statVal1}</div><div class="card-stat-lbl">${statLabel1}</div></div>
        <div class="card-stat"><div class="card-stat-val">${statVal2}</div><div class="card-stat-lbl">${statLabel2}</div></div>
        <div class="card-stat"><div class="card-stat-val">${statVal3}</div><div class="card-stat-lbl">${statLabel3}</div></div>
      </div>
      <div class="card-footer">
        <span class="card-btn-open">Acessar Ficha →</span>
        <button class="card-btn-del" title="Apagar personagem">⌫ Apagar</button>
      </div>
    `;

    const charId = char.id;
    card.querySelector('.card-header').addEventListener('click', () => openSheet(charId));
    card.querySelector('.card-stats').addEventListener('click', () => openSheet(charId));
    card.querySelector('.card-btn-open').addEventListener('click', () => openSheet(charId));
    card.querySelector('.card-btn-del').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChar(charId, e);
    });
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.card-btn-del')) openSheet(charId);
    });

    return card;
  }

  survivors.forEach(({ char, data }, i) => gridSurvivors.appendChild(buildCard(char, data, i)));
  creatures.forEach(({ char, data }, i) => gridCreatures.appendChild(buildCard(char, data, i)));
}

function openNewCharModal() {
  document.getElementById('modal-new-char').classList.add('open');
  setTimeout(() => document.getElementById('modal-char-name').focus(), 100);
}
function closeModal() {
  document.getElementById('modal-new-char').classList.remove('open');
  document.getElementById('modal-char-name').value = '';
  document.getElementById('modal-player-name').value = '';
  setModalType('survivor');
}
document.getElementById('modal-new-char').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && document.getElementById('modal-new-char').classList.contains('open')) createNewChar();
});

function createNewChar() {
  const name = document.getElementById('modal-char-name').value.trim() || (modalCharType === 'creature' ? 'Criatura Sem Nome' : 'Sobrevivente Sem Nome');
  const player = document.getElementById('modal-player-name').value.trim();
  const id = generateId();
  const list = getCharList();

  list.unshift({ id, name, occ: '', createdAt: Date.now(), type: modalCharType });
  saveCharList(list);

  const initData = { personagem_nome: name, jogador_nome: player, __sheetType: modalCharType };

  if (modalCharType === 'survivor') {
    TECNICAS.forEach((t, i) => { initData[`tec_${i}`] = TECNICAS_ZERO.has(t) ? 0 : 1; });
    initData.res_bloqueio = 1; initData.res_esquiva = 1; initData.res_revidar = 1;
    initData.res_constituicao = 1; initData.res_emocional = 1; initData.res_obscura = 1;
    initData.extremos_atual = 0; initData.extremos_total = 30; initData.corrompidos_atual = 0;
    // Aptidões iniciam em 2
    initData.apt_fisico = 2; initData.apt_destreza = 2; initData.apt_mental = 2;
    initData.apt_presenca = 2; initData.apt_alma = 2;
    // Níveis mínimos
    initData.nivel_alma = 1; initData.nivel_sobrevivente = 1;
  } else {
    TECNICAS.forEach((t, i) => { initData[`c_tec_${i}`] = TECNICAS_ZERO.has(t) ? 0 : 1; });
    initData.c_res_bloqueio = 1; initData.c_res_esquiva = 1; initData.c_res_revidar = 1;
    initData.c_res_constituicao = 1; initData.c_res_emocional = 1; initData.c_res_obscura = 1;
  }

  saveCharData(id, initData);
  closeModal();
  openSheet(id);
}

function deleteChar(id, e) {
  if(e) e.stopPropagation();
  const list = getCharList();
  const char = list.find(c => c.id === id);
  if (!confirm(`Apagar o personagem "${char?.name || 'este sobrevivente'}"? Esta ação não pode ser desfeita.`)) return;
  
  if (typeof markCharDeleted === 'function') markCharDeleted(id);
  
  const newList = list.filter(c => c.id !== id);
  saveCharList(newList);
  localStorage.removeItem(CHAR_PREFIX + id);
  renderIndex();
  showToast('Ficha apagada');
}

/* ════════════════════════════════════════════════════
   NAVEGAÇÃO
════════════════════════════════════════════════════ */
function goToIndex() {
  if (currentCharId) {
    flushSave();
    if (typeof forceGistSync === 'function') forceGistSync();
  }
  currentCharId = null;
  document.getElementById('screen-sheet').style.display = 'none';
  document.getElementById('screen-index').style.display = 'flex';
  renderIndex();
}

function openSheet(id) {
  currentCharId = id;
  document.getElementById('screen-index').style.display = 'none';
  document.getElementById('screen-sheet').style.display = 'block';
  loadSheet(id);
}

/* ════════════════════════════════════════════════════
   GERAÇÃO DINÂMICA
════════════════════════════════════════════════════ */
function buildDynamicElements() {
  const diamondsRow = document.getElementById('diamonds-row');
  diamondsRow.innerHTML = '';
  for (let i = 1; i <= 20; i++) {
    const d = document.createElement('div');
    d.className = 'diamond-check';
    d.dataset.id = `descontrole_${i}`;
    d.dataset.slot = i;
    d.addEventListener('click', () => {
      d.classList.toggle('checked');
      recalcCorrompidos();
      schedSave();
    });
    diamondsRow.appendChild(d);
  }

  // equip-list is now dynamic via addEquip()

  const tecBody = document.getElementById('tecnicas-body');
  tecBody.innerHTML = '';
  TECNICAS.forEach((tec, idx) => {
    const div = document.createElement('div');
    div.className = 'tec-item';
    div.innerHTML = `<label>${tec}</label><input type="number" id="tec_${idx}" min="0" max="6">`;
    tecBody.appendChild(div);
  });

  const traumaList = document.getElementById('trauma-temp-list');
  traumaList.innerHTML = '';
  for (let i = 1; i <= 20; i++) {
    const row = document.createElement('div');
    row.className = 'trauma-row';
    row.innerHTML = `
      <input type="text" id="trauma_temp_${i}" placeholder="Descreva o trauma...">
      <div class="trauma-toggle" data-id="trauma_temp_ativo_${i}"></div>
    `;
    traumaList.appendChild(row);
    row.querySelector('.trauma-toggle').addEventListener('click', function() {
      this.classList.toggle('checked');
      schedSave();
    });
  }

  document.querySelectorAll('.check-label').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('checked');
      schedSave();
    });
  });

  setupEssencias();

  const cTecBody = document.getElementById('c-tecnicas-body');
  if (cTecBody) {
    cTecBody.innerHTML = '';
    TECNICAS.forEach((tec, idx) => {
      const div = document.createElement('div');
      div.className = 'tec-item';
      div.innerHTML = `<label>${tec}</label><input type="number" id="c_tec_${idx}" min="0" max="6">`;
      cTecBody.appendChild(div);
    });
  }

  const fraquezaList = document.getElementById('fraqueza-list');
  if (fraquezaList) {
    fraquezaList.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const row = document.createElement('div');
      row.className = 'fraqueza-row';
      row.innerHTML = `<input type="text" id="c_fraqueza_${i}" placeholder="Descreva a fraqueza...">`;
      fraquezaList.appendChild(row);
    }
  }
}

/* ════════════════════════════════════════════════════
   CÁLCULOS AUTOMÁTICOS
════════════════════════════════════════════════════ */
function aptToCrit(val) {
  const map = { 2: 'd4', 3: 'd6', 4: 'd8', 5: 'd10', 6: 'd12' };
  return map[val] || '—';
}

function recalcCrit(aptId) {
  const val = parseInt(document.getElementById(aptId)?.value) || 0;
  const critEl = document.getElementById(aptId + '_crit');
  if (!critEl) return;
  const dado = aptToCrit(val);
  critEl.textContent = dado;
  critEl.classList.toggle('active', dado !== '—');
  schedSave();
}

function recalcAllCrits() {
  ['apt_fisico','apt_destreza','apt_mental','apt_presenca','apt_alma'].forEach(recalcCrit);
}

function recalcCreatureCrit(aptId) {
  const val = parseInt(document.getElementById(aptId)?.value) || 0;
  const critEl = document.getElementById(aptId + '_crit');
  if (!critEl) return;
  const dado = aptToCrit(val);
  critEl.textContent = dado;
  critEl.classList.toggle('active', dado !== '—');
  schedSave();
}

function recalcCreature() {
  ['c_apt_fisico','c_apt_destreza','c_apt_mental','c_apt_presenca','c_apt_alma'].forEach(recalcCreatureCrit);
  schedSave();
}

function recalcAll() {
  const fisico = parseInt(document.getElementById('apt_fisico').value) || 0;
  const const_ = parseInt(document.getElementById('res_constituicao').value) || 0;
  const alma = parseInt(document.getElementById('apt_alma').value) || 0;

  const carne = 6 + fisico + const_;
  const energia = 8 + alma;

  document.getElementById('carne-formula').textContent = `6 + ${fisico} + ${const_} = ${carne}`;
  document.getElementById('energia-formula').textContent = `8 + ${alma} = ${energia}`;

  const carneTotal = document.getElementById('carne_total');
  const energiaTotal = document.getElementById('energia_total');
  if (!carneTotal.dataset.manualEdit) carneTotal.value = carne;
  if (!energiaTotal.dataset.manualEdit) energiaTotal.value = energia;

  const invTotal = document.getElementById('inv_total');
  if (invTotal) invTotal.value = fisico * 3;

  recalcInvAtual();
  recalcCorrompidos();
  recalcAllCrits();
  schedSave();
}

function recalcInvAtual() {
  let total = 0;
  document.querySelectorAll('.equip-card').forEach(card => {
    const id = card.dataset.equipId;
    const raw = (document.getElementById(`eq_peso_${id}`)?.value || '').toString().replace(',', '.');
    const val = parseFloat(raw);
    if (!isNaN(val)) total += val;
  });
  const invAtual = document.getElementById('inv_atual');
  if (invAtual) invAtual.value = Number.isInteger(total) ? total : parseFloat(total.toFixed(2));
}

function getMaxMarcas() {
  const mental = parseInt(document.getElementById('apt_mental')?.value) || 0;
  const bonus = parseInt(document.getElementById('descontrole_bonus_manual')?.value) || 0;
  return 4 + Math.max(0, mental - 2) + bonus;
}

function recalcCorrompidos() {
  const maxMarcas = getMaxMarcas();
  document.querySelectorAll('.diamond-check').forEach(d => {
    const slot = parseInt(d.dataset.slot);
    if (slot <= maxMarcas) {
      d.style.display = '';
      d.style.pointerEvents = '';
      d.style.opacity = '';
    } else {
      d.style.display = 'none';
      d.classList.remove('checked');
    }
  });
  const corrompidosMax = maxMarcas * 2;
  document.getElementById('corrompidos_total').value = corrompidosMax;
  document.getElementById('corrompidos-hint').textContent = `Máx. marcas: ${maxMarcas} × 2 = ${corrompidosMax}`;
  schedSave();
}

document.addEventListener('DOMContentLoaded', () => {
  ['carne_total', 'energia_total'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
      this.dataset.manualEdit = '1';
    });
  });
});

/* ════════════════════════════════════════════════════
   AJUSTE RÁPIDO (+/-) — Carne, Energia e Corrompidos
════════════════════════════════════════════════════ */
function sanitizeAjusteInput(el) {
  // Permite apenas dígitos e os sinais + e -
  el.value = el.value.replace(/[^0-9+\-]/g, '');
}

function applyAjuste(atualId, ajusteId, totalId) {
  const ajusteEl = document.getElementById(ajusteId);
  const atualEl = document.getElementById(atualId);
  if (!ajusteEl || !atualEl) return;

  const raw = ajusteEl.value.trim();
  if (raw === '' || raw === '+' || raw === '-') { ajusteEl.value = ''; return; }

  const delta = parseInt(raw, 10);
  if (isNaN(delta)) { ajusteEl.value = ''; return; }

  let atual = parseInt(atualEl.value, 10) || 0;
  atual += delta;
  if (atual < 0) atual = 0;

  if (totalId) {
    const totalEl = document.getElementById(totalId);
    const total = parseInt(totalEl?.value, 10);
    if (!isNaN(total) && atual > total) atual = total;
  }

  atualEl.value = atual;
  ajusteEl.value = '';
  schedSave();
}

/* ════════════════════════════════════════════════════
   TABS
════════════════════════════════════════════════════ */
document.querySelectorAll('.tab-btn:not(.creature-tab)').forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = btn.dataset.tab;
    document.querySelectorAll('.tab-btn:not(.creature-tab)').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-page:not(.creature-page)').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${idx}`).classList.add('active');
  });
});

document.querySelectorAll('.creature-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = btn.dataset.ctab;
    document.querySelectorAll('.creature-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.creature-page').forEach(p => { p.style.display = 'none'; });
    btn.classList.add('active');
    document.getElementById(`ctab-${idx}`).style.display = 'block';
  });
});

/* ════════════════════════════════════════════════════
   SALVAR / CARREGAR
════════════════════════════════════════════════════ */
function collectSheetData() {
  const data = {};

  document.querySelectorAll('#screen-sheet input[id], #screen-sheet textarea[id]').forEach(el => {
    if (el.id) data[el.id] = el.value;
  });

  document.querySelectorAll('.diamond-check').forEach(el => {
    data[el.dataset.id] = el.classList.contains('checked');
  });

  document.querySelectorAll('.essencia-dot').forEach(el => {
    data[el.dataset.id] = el.classList.contains('checked');
  });

  document.querySelectorAll('.check-label').forEach(el => {
    if (el.dataset.id) data[el.dataset.id] = el.classList.contains('checked');
  });

  document.querySelectorAll('.trauma-toggle').forEach(el => {
    data[el.dataset.id] = el.classList.contains('checked');
  });

  ['carne_total','energia_total'].forEach(id => {
    const el = document.getElementById(id);
    if (el?.dataset.manualEdit) data['__manualEdit_' + id] = true;
  });

  const avatarImg = document.getElementById('profile-avatar-img');
  if (avatarImg && avatarImg.src && avatarImg.style.display !== 'none') {
    data['__avatar'] = avatarImg.src;
  } else {
    data['__avatar'] = '';
  }

  data['__acoes'] = collectAcoes();
  data['__equips'] = collectEquips();
  data['__habsSurv'] = collectHabilidadesSurv();
  data['__energiasSurv'] = collectEnergiasSurv();
  data['__poderesSurv'] = collectPoderesSurv();
  data['__sheetType'] = currentSheetType;

  return data;
}

function loadSheet(id) {
  isAppLoadingData = true; // <-- BLOQUEIA GATILHOS DE SALVAMENTO AO ABRIR A FICHA
  const data = getCharData(id);

  document.querySelectorAll('#screen-sheet input[id], #screen-sheet textarea[id]').forEach(el => {
    el.value = '';
    delete el.dataset.manualEdit;
  });
  document.querySelectorAll('.diamond-check, .essencia-dot').forEach(el => el.classList.remove('checked'));
  document.querySelectorAll('.check-label').forEach(el => el.classList.remove('checked'));
  document.querySelectorAll('.trauma-toggle').forEach(el => el.classList.remove('checked'));

  document.querySelectorAll('#screen-sheet input[id], #screen-sheet textarea[id]').forEach(el => {
    if (data[el.id] !== undefined) el.value = data[el.id];
  });

  // Trava valores de fichas antigas que possam ter passado do limite (aptidões, técnicas, resistências)
  document.querySelectorAll('#screen-sheet input[type="number"]').forEach(el => {
    if (el.value === '') return;
    const maxAttr = el.getAttribute('max');
    const minAttr = el.getAttribute('min');
    let v = parseInt(el.value, 10);
    if (isNaN(v)) return;
    if (maxAttr !== null && v > parseInt(maxAttr, 10)) v = parseInt(maxAttr, 10);
    if (minAttr !== null && v < parseInt(minAttr, 10)) v = parseInt(minAttr, 10);
    if (String(v) !== el.value) el.value = v;
  });

  document.querySelectorAll('.diamond-check').forEach(el => {
    if (data[el.dataset.id] === true) el.classList.add('checked');
  });
  document.querySelectorAll('.essencia-dot').forEach(el => {
    if (data[el.dataset.id] === true) el.classList.add('checked');
  });
  document.querySelectorAll('.check-label').forEach(el => {
    if (el.dataset.id && data[el.dataset.id] === true) el.classList.add('checked');
  });
  document.querySelectorAll('.trauma-toggle').forEach(el => {
    if (data[el.dataset.id] === true) el.classList.add('checked');
  });

  ['carne_total','energia_total'].forEach(id => {
    if (data['__manualEdit_' + id]) {
      const el = document.getElementById(id);
      if (el) el.dataset.manualEdit = '1';
    }
  });

  const avatarImg = document.getElementById('profile-avatar-img');
  const placeholder = document.getElementById('profile-avatar-placeholder');
  const removeBtn = document.getElementById('profile-avatar-remove');
  if (data['__avatar']) {
    avatarImg.src = data['__avatar'];
    avatarImg.style.display = 'block';
    placeholder.style.display = 'none';
    removeBtn.style.display = 'block';
  } else {
    avatarImg.src = '';
    avatarImg.style.display = 'none';
    placeholder.style.display = 'flex';
    removeBtn.style.display = 'none';
  }

  restoreAcoes(data['__acoes'] || []);
  restoreEquips(data['__equips'] || []);
  restoreHabilidadesSurv(data['__habsSurv'] || []);
  restoreEnergiasSurv(data['__energiasSurv'] || []);
  restorePoderesSurv(data['__poderesSurv'] || []);

  currentSheetType = data['__sheetType'] || 'survivor';
  applySheetType(currentSheetType);

  const isFresh = !data.apt_fisico && !data.tec_0;
  if (isFresh && currentSheetType === 'survivor') {
    TECNICAS.forEach((t, i) => {
      const el = document.getElementById(`tec_${i}`);
      if (el && !el.value) el.value = TECNICAS_ZERO.has(t) ? 0 : 1;
    });
    ['res_bloqueio','res_esquiva','res_revidar','res_constituicao','res_emocional','res_obscura'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = 1;
    });
    const ext = document.getElementById('extremos_total');
    if (ext && !ext.value) ext.value = 30;
    // Aptidões iniciam em 2
    ['apt_fisico','apt_destreza','apt_mental','apt_presenca','apt_alma'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = 2;
    });
    // Níveis mínimos = 1
    const nAlma = document.getElementById('nivel_alma');
    if (nAlma && (!nAlma.value || nAlma.value == 0)) nAlma.value = 1;
    const nSobr = document.getElementById('nivel_sobrevivente');
    if (nSobr && (!nSobr.value || nSobr.value == 0)) nSobr.value = 1;
  }

  recalcAll();
  recalcAllCrits();
  recalcCreature();
  updateXpTotal();

  // Enforce minimum values on loaded data
  ['nivel_alma', 'nivel_sobrevivente'].forEach(id => {
    const el = document.getElementById(id);
    if (el && (el.value === '' || parseInt(el.value) < 1)) el.value = 1;
  });
  ['apt_fisico','apt_destreza','apt_mental','apt_presenca','apt_alma'].forEach(id => {
    const el = document.getElementById(id);
    if (el && (el.value === '' || parseInt(el.value) < 1)) el.value = 1;
  });
  
  isAppLoadingData = false; // <-- LIBERA O SALVAMENTO APÓS CARREGAR
}

function flushSave() {
  if (!currentCharId) return;
  clearTimeout(saveTimeout);
  const data = collectSheetData();
  saveCharData(currentCharId, data);
}

function schedSave() {
  if (isAppLoadingData) return; // <-- SE ESTIVER CARREGANDO, IGNORA O SALVAMENTO
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(flushSave, 400);
}

function schedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(flushSave, 400); // <-- Tempo de reação mais rápido
}

function autoSave() { schedSave(); }

/* ════════════════════════════════════════════════════
   SISTEMA DE NÍVEL DE ALMA
════════════════════════════════════════════════════ */
function onNivelAlmaChange() {
  const el = document.getElementById('nivel_alma');
  if (!el) return;
  let v = parseInt(el.value, 10);
  if (isNaN(v) || v < 1) v = 1;
  if (v > 10) v = 10;
  el.value = v;
  // Desmarca todas as essências
  document.querySelectorAll('.essencia-dot').forEach(dot => dot.classList.remove('checked'));
  schedSave();
}

/* ════════════════════════════════════════════════════
   SISTEMA DE NÍVEL DE SOBREVIVENTE / XP
════════════════════════════════════════════════════ */
function calcXpParaProxNivel(nivelAtual) {
  return nivelAtual * 10;
}

function updateXpTotal() {
  const nivelEl = document.getElementById('nivel_sobrevivente');
  const xpTotalEl = document.getElementById('xp_total');
  if (!nivelEl || !xpTotalEl) return;
  const nivel = parseInt(nivelEl.value, 10) || 0;
  xpTotalEl.value = calcXpParaProxNivel(nivel);
}

function onNivelSobreviventeChange() {
  const el = document.getElementById('nivel_sobrevivente');
  if (!el) return;
  let v = parseInt(el.value, 10);
  if (isNaN(v) || v < 1) v = 1;
  if (v > 10) v = 10;
  el.value = v;
  // Zera XP atual ao mudar nível manualmente
  const xpAtualEl = document.getElementById('xp_atual');
  if (xpAtualEl) xpAtualEl.value = 0;
  updateXpTotal();
  schedSave();
}

function onXpAtualChange() {
  const nivelEl = document.getElementById('nivel_sobrevivente');
  const xpAtualEl = document.getElementById('xp_atual');
  const xpTotalEl = document.getElementById('xp_total');
  if (!nivelEl || !xpAtualEl || !xpTotalEl) return;

  let nivel = parseInt(nivelEl.value, 10) || 0;
  const xpNecessario = calcXpParaProxNivel(nivel);
  let xpAtual = parseInt(xpAtualEl.value, 10);
  if (isNaN(xpAtual) || xpAtual < 0) { xpAtual = 0; xpAtualEl.value = 0; }

  // Limita ao máximo necessário
  if (xpAtual > xpNecessario) { xpAtual = xpNecessario; xpAtualEl.value = xpAtual; }

  // Se atingiu o total, sobe de nível
  if (xpAtual >= xpNecessario) {
    nivel = Math.min(nivel + 1, 10);
    nivelEl.value = nivel;
    xpAtualEl.value = 0;
    updateXpTotal();
    showToast('Nível de Sobrevivente aumentou para ' + nivel + '!');
  }
  schedSave();
}

/* ════════════════════════════════════════════════════
   ESSÊNCIAS DE ALMA — auto-level ao marcar 3
════════════════════════════════════════════════════ */
function setupEssencias() {
  document.querySelectorAll('.essencia-dot').forEach(dot => {
    dot.addEventListener('click', function() {
      this.classList.toggle('checked');
      const checked = document.querySelectorAll('.essencia-dot.checked').length;
      if (checked >= 3) {
        // Desmarca todas e sobe nível de alma
        document.querySelectorAll('.essencia-dot').forEach(d => d.classList.remove('checked'));
        const nivelEl = document.getElementById('nivel_alma');
        if (nivelEl) {
          let nivel = parseInt(nivelEl.value, 10) || 0;
          nivel = Math.min(nivel + 1, 10);
          nivelEl.value = nivel;
          showToast('Nível de Alma aumentou para ' + nivel + '!');
        }
      }
      schedSave();
    });
  });
}

document.getElementById('screen-sheet').addEventListener('blur', e => {
  const el = e.target;
  if (el.tagName !== 'INPUT' || el.type !== 'number') return;
  if (el.value === '' || el.value === null) {
    const minAttr = el.getAttribute('min');
    const minVal = (minAttr !== null) ? parseInt(minAttr, 10) : 0;
    el.value = isNaN(minVal) ? 0 : minVal;
    // Trigger recalc if needed
    const id = el.id;
    if (['apt_fisico','res_constituicao','apt_alma'].includes(id)) recalcAll();
    else if (['apt_destreza','apt_mental','apt_presenca'].includes(id)) { recalcCrit(id); if (id === 'apt_mental') recalcCorrompidos(); }
    else if (['nivel_alma'].includes(id)) onNivelAlmaChange();
    else if (['nivel_sobrevivente'].includes(id)) onNivelSobreviventeChange();
    schedSave();
  }
}, true); // capture phase so we catch it before it bubbles

document.getElementById('screen-sheet').addEventListener('input', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    const id = e.target.id;

    // Trava campos numéricos dentro do limite definido
    if (e.target.tagName === 'INPUT' && e.target.type === 'number' && e.target.value !== '') {
      const maxAttr = e.target.getAttribute('max');
      const minAttr = e.target.getAttribute('min');
      let v = parseInt(e.target.value, 10);
      if (!isNaN(v)) {
        if (maxAttr !== null && v > parseInt(maxAttr, 10)) v = parseInt(maxAttr, 10);
        if (minAttr !== null && v < parseInt(minAttr, 10)) v = parseInt(minAttr, 10);
        if (String(v) !== e.target.value) e.target.value = v;
      }
    }

    if (['apt_fisico','res_constituicao'].includes(id)) recalcAll();
    else if (['apt_destreza','apt_mental','apt_presenca'].includes(id)) {
      recalcCrit(id);
      if (id === 'apt_mental') recalcCorrompidos();
    }
    else if (id === 'apt_alma') recalcAll();
    else if (['c_apt_fisico','c_apt_destreza','c_apt_mental','c_apt_presenca','c_apt_alma'].includes(id)) {
      recalcCreatureCrit(id);
    }
    else if (id === 'descontrole_bonus_manual') recalcCorrompidos();
    else schedSave();
  }
});

function exportSheet() {
  if (!currentCharId) return;
  flushSave();
  const data = getCharData(currentCharId);
  const name = data.personagem_nome || 'investigador';
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `honorda_${name.replace(/\s+/g,'_').toLowerCase()}.json`;
  a.click();
  showToast('Ficha exportada');
}

function importSheetFromIndex() {
  document.getElementById('file-import').click();
}

document.getElementById('file-import').addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const id = generateId();
      const list = getCharList();
      list.unshift({
        id,
        name: data.personagem_nome || 'Ficha Importada',
        occ: data.ocupacao || '',
        createdAt: Date.now(),
        type: data.__sheetType || 'survivor'
      });
      saveCharList(list);
      saveCharData(id, data);
      renderIndex();
      showToast('Ficha importada');
      openSheet(id);
    } catch {
      showToast('Erro ao importar arquivo');
    }
  };
  reader.readAsText(file);
  this.value = '';
});

function deleteCurrentSheet() {
  if (!currentCharId) return;
  const data = getCharData(currentCharId);
  const name = data.personagem_nome || 'este sobrevivente';
  if (!confirm(`Apagar a ficha de "${name}"? Esta ação não pode ser desfeita.`)) return;
  
  const idToDel = currentCharId;
  currentCharId = null; // impede de tentar salvar a ficha antes de sair
  
  if (typeof markCharDeleted === 'function') markCharDeleted(idToDel);
  
  const list = getCharList().filter(c => c.id !== idToDel);
  saveCharList(list);
  localStorage.removeItem(CHAR_PREFIX + idToDel);
  
  goToIndex();
  if (typeof forceGistSync === 'function') forceGistSync();
  showToast('Ficha apagada');
}

/* ════════════════════════════════════════════════════
   TOAST
════════════════════════════════════════════════════ */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ════════════════════════════════════════════════════
   MODAL TYPE (Sobrevivente vs Criatura)
════════════════════════════════════════════════════ */
let modalCharType = 'survivor';

function setModalType(type) {
  modalCharType = type;
  document.getElementById('modal-type-survivor').classList.toggle('active', type === 'survivor');
  document.getElementById('modal-type-creature').classList.toggle('active', type === 'creature');
  document.getElementById('modal-title-text').textContent = type === 'survivor' ? '✦ Novo Sobrevivente' : '✦ Nova Criatura';
  document.getElementById('btn-modal-create').textContent = type === 'survivor' ? 'Criar Sobrevivente' : 'Criar Criatura';
  document.getElementById('modal-name-label').textContent = type === 'survivor' ? 'Nome do Personagem' : 'Nome da Criatura';
  document.getElementById('modal-player-field').style.display = type === 'survivor' ? '' : 'none';
  document.getElementById('modal-char-name').placeholder = type === 'survivor' ? 'Ex: Morgana Rocha' : 'Ex: Aranha Sombria';
}

/* ════════════════════════════════════════════════════
   AVATAR / IMAGEM DE PERFIL
════════════════════════════════════════════════════ */
let cropImgSrc = null;
let cropX = 0, cropY = 0, cropZoom = 1;
let cropDragging = false, cropStartX, cropStartY;
let cropNaturalW, cropNaturalH;

function triggerAvatarUpload() {
  document.getElementById('avatar-file-input').click();
}

function onAvatarFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    cropImgSrc = e.target.result;
    openCropModal(cropImgSrc);
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function openCropModal(src) {
  const modal = document.getElementById('modal-crop');
  const img = document.getElementById('crop-img');
  img.src = src;
  img.onload = () => {
    cropNaturalW = img.naturalWidth;
    cropNaturalH = img.naturalHeight;
    cropZoom = 1;
    document.getElementById('crop-zoom').value = 1;
    const container = document.getElementById('crop-container');
    const cW = container.clientWidth;
    const cH = container.clientHeight;
    const baseScale = Math.min(cW / cropNaturalW, cH / cropNaturalH);
    const dispW = cropNaturalW * baseScale;
    const dispH = cropNaturalH * baseScale;
    cropX = (cW - dispW) / 2;
    cropY = (cH - dispH) / 2;
    applyCropTransform();
  };
  modal.classList.add('open');
  setupCropEvents();
}

function applyCropTransform() {
  const container = document.getElementById('crop-container');
  const img = document.getElementById('crop-img');
  const cW = container.clientWidth;
  const cH = container.clientHeight;
  const baseScale = Math.min(cW / cropNaturalW, cH / cropNaturalH);
  const scale = baseScale * cropZoom;
  const dispW = cropNaturalW * scale;
  const dispH = cropNaturalH * scale;
  img.style.width = dispW + 'px';
  img.style.height = dispH + 'px';
  img.style.left = cropX + 'px';
  img.style.top = cropY + 'px';
}

function setupCropEvents() {
  const container = document.getElementById('crop-container');
  const zoomSlider = document.getElementById('crop-zoom');

  const newContainer = container.cloneNode(true);
  container.parentNode.replaceChild(newContainer, container);
  const img = document.getElementById('crop-img');

  zoomSlider.oninput = () => {
    const c = document.getElementById('crop-container');
    const cW = c.clientWidth, cH = c.clientHeight;
    const oldBase = Math.min(cW / cropNaturalW, cH / cropNaturalH);
    const oldScale = oldBase * cropZoom;
    cropZoom = parseFloat(zoomSlider.value);
    const newScale = oldBase * cropZoom;
    const ratio = newScale / oldScale;
    cropX = cW / 2 - (cW / 2 - cropX) * ratio;
    cropY = cH / 2 - (cH / 2 - cropY) * ratio;
    applyCropTransform();
  };

  newContainer.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const newZoom = Math.min(4, Math.max(0.2, cropZoom + delta));
    const c = document.getElementById('crop-container');
    const cW = c.clientWidth, cH = c.clientHeight;
    const baseScale = Math.min(cW / cropNaturalW, cH / cropNaturalH);
    const oldScale = baseScale * cropZoom;
    const newScale = baseScale * newZoom;
    const ratio = newScale / oldScale;
    cropX = cW / 2 - (cW / 2 - cropX) * ratio;
    cropY = cH / 2 - (cH / 2 - cropY) * ratio;
    cropZoom = newZoom;
    zoomSlider.value = cropZoom;
    applyCropTransform();
  }, { passive: false });

  newContainer.addEventListener('mousedown', e => {
    cropDragging = true;
    cropStartX = e.clientX - cropX;
    cropStartY = e.clientY - cropY;
    newContainer.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!cropDragging) return;
    cropX = e.clientX - cropStartX;
    cropY = e.clientY - cropStartY;
    applyCropTransform();
  });
  window.addEventListener('mouseup', () => {
    if (!cropDragging) return;
    cropDragging = false;
    const c = document.getElementById('crop-container');
    if (c) c.style.cursor = 'grab';
  });

  newContainer.addEventListener('touchstart', e => {
    cropDragging = true;
    cropStartX = e.touches[0].clientX - cropX;
    cropStartY = e.touches[0].clientY - cropY;
  });
  newContainer.addEventListener('touchmove', e => {
    if (!cropDragging) return;
    cropX = e.touches[0].clientX - cropStartX;
    cropY = e.touches[0].clientY - cropStartY;
    applyCropTransform();
    e.preventDefault();
  }, { passive: false });
  newContainer.addEventListener('touchend', () => { cropDragging = false; });
}

function closeCropModal() {
  cropDragging = false;
  document.getElementById('modal-crop').classList.remove('open');
}

function applyCrop() {
  const container = document.getElementById('crop-container');
  const img = document.getElementById('crop-img');
  const cW = container.clientWidth;
  const cH = container.clientHeight;

  const circleSize = 200;
  const circleX = (cW - circleSize) / 2;
  const circleY = (cH - circleSize) / 2;

  const baseScale = Math.min(cW / cropNaturalW, cH / cropNaturalH);
  const scale = baseScale * cropZoom;

  const sx = (circleX - cropX) / scale;
  const sy = (circleY - cropY) / scale;
  const sw = circleSize / scale;
  const sh = circleSize / scale;

  const canvas = document.createElement('canvas');
  canvas.width = 200; canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(100, 100, 100, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 200, 200);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  setAvatarImage(dataUrl);
  closeCropModal();
}

function setAvatarImage(dataUrl) {
  const imgEl = document.getElementById('profile-avatar-img');
  const placeholder = document.getElementById('profile-avatar-placeholder');
  const removeBtn = document.getElementById('profile-avatar-remove');
  imgEl.src = dataUrl;
  imgEl.style.display = 'block';
  placeholder.style.display = 'none';
  removeBtn.style.display = 'block';
  schedSave();
}

function removeAvatar() {
  const imgEl = document.getElementById('profile-avatar-img');
  const placeholder = document.getElementById('profile-avatar-placeholder');
  const removeBtn = document.getElementById('profile-avatar-remove');
  imgEl.src = '';
  imgEl.style.display = 'none';
  placeholder.style.display = 'flex';
  removeBtn.style.display = 'none';
  schedSave();
}

/* ════════════════════════════════════════════════════
   AÇÕES DA CRIATURA
════════════════════════════════════════════════════ */
let acaoCounter = 0;

/* ════════════════════════════════════════════════════
   MINIMIZAR / MAXIMIZAR CARDS (Itens, Habilidades, Energias)
════════════════════════════════════════════════════ */
function headerToggleCollapse(event) {
  if (event.target.closest('input, select, textarea, button')) return;
  const card = event.currentTarget.closest('.equip-card, .hab-surv-card, .energia-surv-card');
  if (card) card.classList.toggle('card-collapsed');
}

/* ════════════════════════════════════════════════════
   SISTEMA DE EQUIPAMENTOS (CARDS)
════════════════════════════════════════════════════ */
let equipCounter = 0;

function addEquip(entry, tipo) {
  const id = entry ? entry.id : ++equipCounter;
  if (!entry) equipCounter = Math.max(equipCounter, id);
  const isSimples = (entry ? entry.tipo : tipo) === 'simples';
  const list = document.getElementById('equip-list');
  const card = document.createElement('div');
  card.className = 'equip-card';
  card.dataset.equipId = id;
  card.dataset.equipTipo = isSimples ? 'simples' : 'completo';

  const fieldsHtml = isSimples ? `
      <div class="equip-field-row">
        <span class="equip-field-label">Peso</span>
        <input class="equip-field-input" type="text" id="eq_peso_${id}" placeholder="Ex: 1" style="max-width:80px;" value="${entry?.peso||''}">
      </div>
      <div class="equip-field-row" style="align-items:flex-start;">
        <span class="equip-field-label" style="padding-top:3px;">Descrição</span>
        <textarea class="equip-field-input" id="eq_desc_${id}" style="min-height:56px;width:100%;" placeholder="Descreva o item...">${entry?.desc||''}</textarea>
      </div>` : `
      <div class="equip-field-row">
        <span class="equip-field-label">Efeito / Dano</span>
        <input class="equip-field-input" type="text" id="eq_efeito_${id}" placeholder="Ex: 1d6+2 ou reduz 1 dano" value="${entry?.efeito||''}">
      </div>
      <div class="equip-field-row">
        <span class="equip-field-label">Materiais</span>
        <input class="equip-field-input" type="text" id="eq_mat_${id}" placeholder="Ex: Aço, Couro" value="${entry?.mat||''}">
      </div>
      <div class="equip-field-row">
        <span class="equip-field-label">Peso</span>
        <input class="equip-field-input" type="text" id="eq_peso_${id}" placeholder="Ex: 1" style="max-width:80px;" value="${entry?.peso||''}">
      </div>
      <div class="equip-field-row">
        <span class="equip-field-label">Empunhadura</span>
        <select class="equip-empunhadura-select" id="eq_emp_${id}">
          <option value="">—</option>
          <option value="Vestimenta"${entry?.emp==='Vestimenta'?' selected':''}>Vestimenta</option>
          <option value="Versátil"${entry?.emp==='Versátil'?' selected':''}>Versátil</option>
          <option value="Uma Mão"${entry?.emp==='Uma Mão'?' selected':''}>Uma Mão</option>
          <option value="Duas Mãos"${entry?.emp==='Duas Mãos'?' selected':''}>Duas Mãos</option>
        </select>
      </div>`;

  card.innerHTML = `
    <div class="equip-card-header" onclick="headerToggleCollapse(event)">
      <span class="card-toggle-icon">⌄</span>
      <span class="equip-type-tag">${isSimples ? 'Item Simples' : 'Item'}</span>
      <input class="equip-name-input" type="text" id="eq_nome_${id}" placeholder="Nome do item..." value="${entry?.nome||''}">
      <button class="acao-remove-btn" onclick="removeEquip(${id})">✕</button>
    </div>
    <div class="equip-fields">${fieldsHtml}</div>`;

  list.appendChild(card);
  card.querySelectorAll('input, select, textarea').forEach(el => el.addEventListener('change', schedSave));
  card.querySelectorAll('input, textarea').forEach(el => el.addEventListener('input', schedSave));
  document.getElementById(`eq_peso_${id}`)?.addEventListener('input', recalcInvAtual);
  recalcInvAtual();
  if (!entry) { card.querySelector('.equip-name-input').focus(); schedSave(); }
}

function addEquipSimples() {
  addEquip(null, 'simples');
}

function removeEquip(id) {
  const card = document.querySelector(`[data-equip-id="${id}"]`);
  if (card) { card.remove(); recalcInvAtual(); schedSave(); }
}

function collectEquips() {
  const items = [];
  document.querySelectorAll('.equip-card').forEach(card => {
    const id = card.dataset.equipId;
    const tipo = card.dataset.equipTipo || 'completo';
    const item = {
      id,
      tipo,
      nome: document.getElementById(`eq_nome_${id}`)?.value || '',
      peso: document.getElementById(`eq_peso_${id}`)?.value || '',
    };
    if (tipo === 'simples') {
      item.desc = document.getElementById(`eq_desc_${id}`)?.value || '';
    } else {
      item.efeito = document.getElementById(`eq_efeito_${id}`)?.value || '';
      item.mat = document.getElementById(`eq_mat_${id}`)?.value || '';
      item.emp = document.getElementById(`eq_emp_${id}`)?.value || '';
    }
    items.push(item);
  });
  return items;
}

function restoreEquips(items) {
  const list = document.getElementById('equip-list');
  if (!list) return;
  list.innerHTML = '';
  equipCounter = 0;
  if (!items || !items.length) return;
  items.forEach(entry => {
    equipCounter = Math.max(equipCounter, parseInt(entry.id) || 0);
    addEquip(entry);
  });
}

/* ════════════════════════════════════════════════════
   HABILIDADES DO SOBREVIVENTE (CARDS)
════════════════════════════════════════════════════ */
let habSurvCounter = 0;

function addHabilidadeSurv(entry) {
  const id = entry ? entry.id : ++habSurvCounter;
  if (!entry) habSurvCounter = Math.max(habSurvCounter, id);
  const list = document.getElementById('habilidades-surv-list');
  const card = document.createElement('div');
  card.className = 'hab-surv-card';
  card.dataset.habSurvId = id;

  card.innerHTML = `
    <div class="acao-card-header" onclick="headerToggleCollapse(event)">
      <span class="card-toggle-icon">⌄</span>
      <span class="acao-type-tag habilidade">Habilidade</span>
      <input class="acao-name-input" type="text" id="hab_surv_nome_${id}" placeholder="Nome da habilidade..." value="${entry?.nome||''}">
      <button class="acao-remove-btn" onclick="removeHabilidadeSurv(${id})">✕</button>
    </div>
    <div class="acao-fields">
      <div class="acao-field-row">
        <span class="acao-field-label">Custo</span>
        <input class="acao-field-input" type="text" id="hab_surv_custo_${id}" placeholder="Ex: 2 PE / 1 Ação / 1 MD" value="${entry?.custo||''}">
      </div>
      <div class="acao-field-row" style="align-items:flex-start;">
        <span class="acao-field-label" style="padding-top:3px;">Efeito</span>
        <textarea class="acao-field-input" id="hab_surv_efeito_${id}" style="min-height:56px;" placeholder="Descreva o efeito da habilidade...">${entry?.efeito||''}</textarea>
      </div>
    </div>`;

  list.appendChild(card);
  card.querySelectorAll('input, textarea').forEach(el => el.addEventListener('input', schedSave));
  if (!entry) { card.querySelector('.acao-name-input').focus(); schedSave(); }
}

function removeHabilidadeSurv(id) {
  const card = document.querySelector(`[data-hab-surv-id="${id}"]`);
  if (card) { card.remove(); schedSave(); }
}

function collectHabilidadesSurv() {
  const items = [];
  document.querySelectorAll('.hab-surv-card').forEach(card => {
    const id = card.dataset.habSurvId;
    items.push({
      id,
      nome: document.getElementById(`hab_surv_nome_${id}`)?.value || '',
      custo: document.getElementById(`hab_surv_custo_${id}`)?.value || '',
      efeito: document.getElementById(`hab_surv_efeito_${id}`)?.value || '',
    });
  });
  return items;
}

function restoreHabilidadesSurv(items) {
  const list = document.getElementById('habilidades-surv-list');
  if (!list) return;
  list.innerHTML = '';
  habSurvCounter = 0;
  if (!items || !items.length) return;
  items.forEach(entry => {
    habSurvCounter = Math.max(habSurvCounter, parseInt(entry.id) || 0);
    addHabilidadeSurv(entry);
  });
}

/* ════════════════════════════════════════════════════
   ENERGIAS DO SOBREVIVENTE (CARDS)
════════════════════════════════════════════════════ */
let energiaSurvCounter = 0;

function addEnergiaSurv(entry) {
  const id = entry ? entry.id : ++energiaSurvCounter;
  if (!entry) energiaSurvCounter = Math.max(energiaSurvCounter, id);
  const list = document.getElementById('energias-surv-list');
  const card = document.createElement('div');
  card.className = 'energia-surv-card';
  card.dataset.energiaSurvId = id;

  card.innerHTML = `
    <div class="acao-card-header" onclick="headerToggleCollapse(event)">
      <span class="card-toggle-icon">⌄</span>
      <span class="energia-type-tag">Energia</span>
      <input class="energia-name-input" type="text" id="en_surv_nome_${id}" placeholder="Nome da energia..." value="${entry?.nome||''}">
      <button class="acao-remove-btn" onclick="removeEnergiaSurv(${id})">✕</button>
    </div>
    <div class="acao-fields">
      <div class="acao-field-row">
        <span class="acao-field-label">Custo</span>
        <input class="acao-field-input" type="text" id="en_surv_custo_${id}" placeholder="Ex: 2 PE / 1 Ação / 1 MD" value="${entry?.custo||''}">
      </div>
      <div class="acao-field-row">
        <span class="acao-field-label">Capacidade</span>
        <select class="energia-cap-select" id="en_surv_cap_${id}">
          <option value="">—</option>
          <option value="1ª Capacidade"${entry?.cap==='1ª Capacidade'?' selected':''}>1ª Capacidade</option>
          <option value="2ª Capacidade"${entry?.cap==='2ª Capacidade'?' selected':''}>2ª Capacidade</option>
          <option value="3ª Capacidade"${entry?.cap==='3ª Capacidade'?' selected':''}>3ª Capacidade</option>
          <option value="4ª Capacidade"${entry?.cap==='4ª Capacidade'?' selected':''}>4ª Capacidade</option>
        </select>
      </div>
      <div class="energia-efeitos-grid" style="margin-top:6px;">
        <div>
          <div class="energia-efeito-label">Efeito</div>
          <textarea class="acao-field-input" id="en_surv_efeito_${id}" style="min-height:70px;width:100%;" placeholder="Descreva o efeito...">${entry?.efeito||''}</textarea>
        </div>
        <div>
          <div class="energia-efeito-label corrupto">Efeito Corrompido</div>
          <textarea class="acao-field-input" id="en_surv_corrupto_${id}" style="min-height:70px;width:100%;border-color:rgba(140,60,160,0.3);" placeholder="Efeito ao usar corrompido...">${entry?.corrupto||''}</textarea>
        </div>
      </div>
    </div>`;

  list.appendChild(card);
  card.querySelectorAll('input, textarea, select').forEach(el => el.addEventListener('input', schedSave));
  card.querySelectorAll('select').forEach(el => el.addEventListener('change', schedSave));
  if (!entry) { card.querySelector('.energia-name-input').focus(); schedSave(); }
}

function removeEnergiaSurv(id) {
  const card = document.querySelector(`[data-energia-surv-id="${id}"]`);
  if (card) { card.remove(); schedSave(); }
}

function collectEnergiasSurv() {
  const items = [];
  document.querySelectorAll('.energia-surv-card').forEach(card => {
    const id = card.dataset.energiaSurvId;
    items.push({
      id,
      nome: document.getElementById(`en_surv_nome_${id}`)?.value || '',
      custo: document.getElementById(`en_surv_custo_${id}`)?.value || '',
      cap: document.getElementById(`en_surv_cap_${id}`)?.value || '',
      efeito: document.getElementById(`en_surv_efeito_${id}`)?.value || '',
      corrupto: document.getElementById(`en_surv_corrupto_${id}`)?.value || '',
    });
  });
  return items;
}

function restoreEnergiasSurv(items) {
  const list = document.getElementById('energias-surv-list');
  if (!list) return;
  list.innerHTML = '';
  energiaSurvCounter = 0;
  if (!items || !items.length) return;
  items.forEach(entry => {
    energiaSurvCounter = Math.max(energiaSurvCounter, parseInt(entry.id) || 0);
    addEnergiaSurv(entry);
  });
}

/* ════════════════════════════════════════════════════
   PODERES DO SOBREVIVENTE (CARDS)
═══════════════════════════════════════════════════ */
let poderSurvCounter = 0;

function addPoderSurv(entry) {
  const id = entry ? entry.id : ++poderSurvCounter;
  if (!entry) poderSurvCounter = Math.max(poderSurvCounter, id);
  const list = document.getElementById('poderes-surv-list');
  const card = document.createElement('div');
  card.className = 'poder-surv-card energia-surv-card';
  card.dataset.poderSurvId = id;

  card.innerHTML = `
    <div class="acao-card-header" onclick="headerToggleCollapse(event)">
      <span class="card-toggle-icon">⌄</span>
      <span class="energia-type-tag" style="border-color: rgb(115 0 135 / 50%);color: #dd55ff;background: rgb(129 1 139 / 10%);">Poder</span>
      <input class="energia-name-input" type="text" id="poder_surv_nome_${id}" placeholder="Nome do poder..." value="${entry?.nome||''}">
      <button class="acao-remove-btn" onclick="removePoderSurv(${id})">✕</button>
    </div>
    <div class="acao-fields">
      <div class="acao-field-row">
        <span class="acao-field-label">Custo</span>
        <input class="acao-field-input" type="text" id="poder_surv_custo_${id}" placeholder="Ex: 2 PE / 1 Ação / 1 MD" value="${entry?.custo||''}">
      </div>
      <div class="acao-field-row" style="align-items:flex-start;">
        <span class="acao-field-label" style="padding-top:3px;">Efeito</span>
        <textarea class="acao-field-input" id="poder_surv_efeito_${id}" style="min-height:70px;width:100%;" placeholder="Descreva o efeito do poder...">${entry?.efeito||''}</textarea>
      </div>
    </div>`;

  list.appendChild(card);
  card.querySelectorAll('input, textarea').forEach(el => el.addEventListener('input', schedSave));
  if (!entry) { card.querySelector('.energia-name-input').focus(); schedSave(); }
}

function removePoderSurv(id) {
  const card = document.querySelector(`[data-poder-surv-id="${id}"]`);
  if (card) { card.remove(); schedSave(); }
}

function collectPoderesSurv() {
  const items = [];
  document.querySelectorAll('.poder-surv-card').forEach(card => {
    const id = card.dataset.poderSurvId;
    items.push({
      id,
      nome: document.getElementById(`poder_surv_nome_${id}`)?.value || '',
      custo: document.getElementById(`poder_surv_custo_${id}`)?.value || '',
      efeito: document.getElementById(`poder_surv_efeito_${id}`)?.value || '',
    });
  });
  return items;
}

function restorePoderesSurv(items) {
  const list = document.getElementById('poderes-surv-list');
  if (!list) return;
  list.innerHTML = '';
  poderSurvCounter = 0;
  if (!items || !items.length) return;
  items.forEach(entry => {
    poderSurvCounter = Math.max(poderSurvCounter, parseInt(entry.id) || 0);
    addPoderSurv(entry);
  });
}

function addAcao(type) {
  const id = ++acaoCounter;
  const listId = (type === 'habilidade') ? 'habilidades-list' : 'acoes-list';
  const list = document.getElementById(listId);

  const card = document.createElement('div');
  card.className = `acao-card ${type}`;
  card.dataset.acaoId = id;
  card.dataset.acaoType = type;

  const typeLabel = type === 'ataque' ? 'Ataque' : type === 'acao-comum' ? 'Ação Comum' : 'Habilidade';
  const typeClass = type === 'ataque' ? 'ataque' : type === 'acao-comum' ? 'acao-comum' : 'habilidade';

  let extraFields = '';
  if (type === 'ataque') {
    extraFields = `
      <div class="acao-field-row"><span class="acao-field-label">Aptidão</span><input class="acao-field-input" type="text" id="acao_apt_${id}" placeholder="Ex: Físico com Lutar"></div>
      <div class="acao-field-row"><span class="acao-field-label">Ações</span><input class="acao-field-input" type="text" id="acao_acoes_${id}" placeholder="Ex: 1 Ação Útil"></div>
      <div class="acao-field-row"><span class="acao-field-label">Dano</span><input class="acao-field-input" type="text" id="acao_dano_${id}" placeholder="Ex: 1d6+2"></div>
      <div class="acao-field-row"><span class="acao-field-label">Efeito</span><input class="acao-field-input" type="text" id="acao_efeito_${id}" placeholder="Efeito adicional (opcional)"></div>`;
  } else if (type === 'acao-comum') {
    extraFields = `
      <div class="acao-field-row"><span class="acao-field-label">Aptidão</span><input class="acao-field-input" type="text" id="acao_apt_${id}" placeholder="Ex: Físico com Lutar"></div>
      <div class="acao-field-row"><span class="acao-field-label">Ações</span><input class="acao-field-input" type="text" id="acao_acoes_${id}" placeholder="Ex: 2 Ações Úteis"></div>
      <div class="acao-field-row"><span class="acao-field-label">Efeito</span><textarea class="acao-field-input" id="acao_efeito_${id}" style="min-height:50px;" placeholder="Descreva o efeito..."></textarea></div>`;
  } else {
    extraFields = `
      <div class="acao-field-row"><span class="acao-field-label">Ações</span><input class="acao-field-input" type="text" id="acao_acoes_${id}" placeholder="Ex: Passiva / 1 Ação Útil / 2 Rodadas"></div>
      <div class="acao-field-row"><span class="acao-field-label">Efeito</span><textarea class="acao-field-input" id="acao_efeito_${id}" style="min-height:60px;" placeholder="Descreva o efeito da habilidade..."></textarea></div>`;
  }

  card.innerHTML = `
    <div class="acao-card-header">
      <span class="acao-type-tag ${typeClass}">${typeLabel}</span>
      <input class="acao-name-input" type="text" id="acao_nome_${id}" placeholder="Nome da ação...">
      <button class="acao-remove-btn" onclick="removeAcao(${id})">✕</button>
    </div>
    <div class="acao-fields">${extraFields}</div>`;

  list.appendChild(card);
  card.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', schedSave);
  });
  card.querySelector('.acao-name-input').focus();
  schedSave();
}

function removeAcao(id) {
  const card = document.querySelector(`[data-acao-id="${id}"]`);
  if (card) { card.remove(); schedSave(); }
}

function collectAcoes() {
  const acoes = [];
  document.querySelectorAll('.acao-card').forEach(card => {
    const id = card.dataset.acaoId;
    const type = card.dataset.acaoType;
    const entry = { id, type, nome: document.getElementById(`acao_nome_${id}`)?.value || '' };
    const apt = document.getElementById(`acao_apt_${id}`);
    const acoes_ = document.getElementById(`acao_acoes_${id}`);
    const dano = document.getElementById(`acao_dano_${id}`);
    const efeito = document.getElementById(`acao_efeito_${id}`);
    if (apt) entry.apt = apt.value;
    if (acoes_) entry.acoes = acoes_.value;
    if (dano) entry.dano = dano.value;
    if (efeito) entry.efeito = efeito.value;
    acoes.push(entry);
  });
  return acoes;
}

function restoreAcoes(acoes) {
  document.getElementById('acoes-list').innerHTML = '';
  document.getElementById('habilidades-list').innerHTML = '';
  acaoCounter = 0;
  if (!acoes || !acoes.length) return;
  acoes.forEach(entry => {
    acaoCounter = Math.max(acaoCounter, parseInt(entry.id) || 0);
    const listId = (entry.type === 'habilidade') ? 'habilidades-list' : 'acoes-list';
    const list = document.getElementById(listId);
    const card = document.createElement('div');
    card.className = `acao-card ${entry.type}`;
    card.dataset.acaoId = entry.id;
    card.dataset.acaoType = entry.type;

    const typeLabel = entry.type === 'ataque' ? 'Ataque' : entry.type === 'acao-comum' ? 'Ação Comum' : 'Habilidade';
    const typeClass = entry.type === 'ataque' ? 'ataque' : entry.type === 'acao-comum' ? 'acao-comum' : 'habilidade';

    let extraFields = '';
    if (entry.type === 'ataque') {
      extraFields = `
        <div class="acao-field-row"><span class="acao-field-label">Aptidão</span><input class="acao-field-input" type="text" id="acao_apt_${entry.id}" placeholder="Ex: Físico com Lutar" value="${entry.apt||''}"></div>
        <div class="acao-field-row"><span class="acao-field-label">Ações</span><input class="acao-field-input" type="text" id="acao_acoes_${entry.id}" placeholder="Ex: 1 Ação Útil" value="${entry.acoes||''}"></div>
        <div class="acao-field-row"><span class="acao-field-label">Dano</span><input class="acao-field-input" type="text" id="acao_dano_${entry.id}" placeholder="Ex: 1d6+2" value="${entry.dano||''}"></div>
        <div class="acao-field-row"><span class="acao-field-label">Efeito</span><input class="acao-field-input" type="text" id="acao_efeito_${entry.id}" placeholder="Efeito adicional (opcional)" value="${entry.efeito||''}"></div>`;
    } else if (entry.type === 'acao-comum') {
      extraFields = `
        <div class="acao-field-row"><span class="acao-field-label">Aptidão</span><input class="acao-field-input" type="text" id="acao_apt_${entry.id}" placeholder="Ex: Físico com Lutar" value="${entry.apt||''}"></div>
        <div class="acao-field-row"><span class="acao-field-label">Ações</span><input class="acao-field-input" type="text" id="acao_acoes_${entry.id}" placeholder="Ex: 2 Ações Úteis" value="${entry.acoes||''}"></div>
        <div class="acao-field-row"><span class="acao-field-label">Efeito</span><textarea class="acao-field-input" id="acao_efeito_${entry.id}" style="min-height:50px;">${entry.efeito||''}</textarea></div>`;
    } else {
      extraFields = `
        <div class="acao-field-row"><span class="acao-field-label">Ações</span><input class="acao-field-input" type="text" id="acao_acoes_${entry.id}" placeholder="Ex: Passiva / 1 Ação Útil / 2 Rodadas" value="${entry.acoes||''}"></div>
        <div class="acao-field-row"><span class="acao-field-label">Efeito</span><textarea class="acao-field-input" id="acao_efeito_${entry.id}" style="min-height:60px;">${entry.efeito||''}</textarea></div>`;
    }

    card.innerHTML = `
      <div class="acao-card-header">
        <span class="acao-type-tag ${typeClass}">${typeLabel}</span>
        <input class="acao-name-input" type="text" id="acao_nome_${entry.id}" placeholder="Nome da ação..." value="${entry.nome||''}">
        <button class="acao-remove-btn" onclick="removeAcao(${entry.id})">✕</button>
      </div>
      <div class="acao-fields">${extraFields}</div>`;
    list.appendChild(card);
    card.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('input', schedSave);
    });
  });
}

/* ════════════════════════════════════════════════════
   TIPO DE FICHA (Sobrevivente vs Criatura)
════════════════════════════════════════════════════ */
function applySheetType(type) {
  const isSurvivor = (type !== 'creature');
  document.getElementById('sheet-tab-nav').style.display = isSurvivor ? '' : 'none';
  document.getElementById('creature-tab-nav').style.display = isSurvivor ? 'none' : '';

  ['tab-0','tab-1','tab-2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isSurvivor ? '' : 'none';
  });
  document.querySelectorAll('.creature-page').forEach(el => {
    el.style.display = isSurvivor ? 'none' : 'none';
  });

  if (!isSurvivor) {
    document.querySelectorAll('.creature-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.creature-page').forEach(p => { p.style.display = 'none'; });
    const firstBtn = document.querySelector('.creature-tab[data-ctab="0"]');
    if (firstBtn) firstBtn.classList.add('active');
    const firstPage = document.getElementById('ctab-0');
    if (firstPage) firstPage.style.display = 'block';
  } else {
    document.querySelectorAll('.tab-btn:not(.creature-tab)').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-page:not(.creature-page)').forEach(p => p.classList.remove('active'));
    const firstBtn = document.querySelector('[data-tab="0"]');
    if (firstBtn) firstBtn.classList.add('active');
    const firstPage = document.getElementById('tab-0');
    if (firstPage) firstPage.classList.add('active');
  }
}

/* ════════════════════════════════════════════════════
   GITHUB GIST SYNC (REAL-TIME SMART MERGE)
════════════════════════════════════════════════════ */
const GIST_TOKEN_KEY    = 'honorda_gist_token';
const GIST_ID_KEY       = 'honorda_gist_id';
const GIST_FILENAME     = 'honorda-fichas.json';
const GIST_LAST_KEY     = 'honorda_gist_last_saved';
const GIST_HASH_KEY     = 'honorda_gist_last_hash';
const DEVICE_ID_KEY     = 'honorda_device_id';
const DEVICES_REG_KEY   = 'honorda_devices';
const DELETED_CHARS_KEY = 'honorda_deleted_chars';
const POLL_MS           = 4000;

let gistIsSyncing   = false;
let gistSyncTimer   = null;
let gistPollTimer   = null;
let gistLastETag    = '';
let gistLastSavedAt = localStorage.getItem(GIST_LAST_KEY) || '';

// ── DEVICE IDENTITY & CONFLICTS ──
function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + Math.random().toString(36).substr(2,4);
    localStorage.setItem(DEVICE_ID_KEY, id);
    localStorage.setItem('honorda_device_is_new', 'true');
  }
  return id;
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = 'Browser', os = 'Unknown', dtype = 'desktop';
  if (/Firefox/.test(ua)) browser = 'Firefox';
  else if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\//.test(ua)) browser = 'Opera';
  else if (/Chrome/.test(ua)) browser = 'Chrome';
  else if (/Safari/.test(ua)) browser = 'Safari';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Macintosh/.test(ua)) os = 'macOS';
  else if (/Android/.test(ua)) { os = 'Android'; dtype = 'mobile'; }
  else if (/iPhone/.test(ua)) { os = 'iPhone'; dtype = 'mobile'; }
  else if (/iPad/.test(ua)) { os = 'iPad'; dtype = 'tablet'; }
  else if (/Linux/.test(ua)) os = 'Linux';
  const isPWA = !!(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
  return { id: getDeviceId(), name: browser + ' · ' + os, browser, os, deviceType: dtype, isPWA, lastSeen: new Date().toISOString() };
}

function loadDeviceReg() {
  try { return JSON.parse(localStorage.getItem(DEVICES_REG_KEY) || '[]'); } catch { return []; }
}
function saveDeviceReg(list) { localStorage.setItem(DEVICES_REG_KEY, JSON.stringify(list)); }

function registerDevice() {
  const info = getDeviceInfo();
  const list = loadDeviceReg();
  const idx = list.findIndex(d => d.id === info.id);
  if (idx >= 0) list[idx] = info; else list.push(info);
  saveDeviceReg(list);
  return list;
}

function mergeDeviceReg(remote) {
  if (!Array.isArray(remote)) return;
  const local = loadDeviceReg();
  const map = Object.fromEntries(local.map(d => [d.id, d]));
  remote.forEach(rd => { const ld = map[rd.id]; if (!ld || new Date(rd.lastSeen) > new Date(ld.lastSeen)) map[rd.id] = rd; });
  const cur = getDeviceInfo(); map[cur.id] = cur;
  saveDeviceReg(Object.values(map).sort((a,b) => new Date(b.lastSeen)-new Date(a.lastSeen)));
  
  // Confirmação se é um dispositivo já conhecido mas com ID recriado
  if (localStorage.getItem('honorda_device_is_new') === 'true') {
    const matches = remote.filter(d => d.id !== cur.id && d.name === cur.name).sort((a,b) => new Date(b.lastSeen) - new Date(a.lastSeen));
    if (matches.length > 0) {
       if (confirm(`Encontramos um histórico anterior deste dispositivo (${matches[0].name}). Deseja assumir a identidade dele para manter os logs corretos?`)) {
          localStorage.setItem(DEVICE_ID_KEY, matches[0].id);
       }
    }
    localStorage.removeItem('honorda_device_is_new');
  }
}

// ── TOMBSTONES (Fichas Apagadas) ──
function getDeletedChars() {
  try { return JSON.parse(localStorage.getItem(DELETED_CHARS_KEY) || '[]'); } catch { return []; }
}
function markCharDeleted(id) {
  const deleted = getDeletedChars();
  if (!deleted.find(d => d.id === id)) {
    deleted.push({ id, deletedAt: new Date().toISOString() });
    localStorage.setItem(DELETED_CHARS_KEY, JSON.stringify(deleted));
  }
}

function getGistToken()  { return localStorage.getItem(GIST_TOKEN_KEY) || ''; }
function getGistId()     { return localStorage.getItem(GIST_ID_KEY) || ''; }

function buildGistPayload() {
  const devices = registerDevice();
  const list = getCharList();
  const deleted = getDeletedChars();
  const chars = {};
  list.forEach(c => { chars[c.id] = getCharData(c.id); });
  return JSON.stringify({ list, chars, deleted, savedAt: new Date().toISOString(), savedBy: getDeviceId(), devices }, null, 2);
}

function buildDataHash() {
  const listStr = getCharList().map(c => c.id + ':' + (c.updatedAt || c.createdAt)).join('|');
  const delStr = getDeletedChars().map(d => d.id + ':' + d.deletedAt).join('|');
  return listStr + '||' + delStr;
}
function hasUnpushed() { return buildDataHash() !== (localStorage.getItem(GIST_HASH_KEY) || ''); }
function markPushed() { localStorage.setItem(GIST_HASH_KEY, buildDataHash()); }

async function pullFromGist(token, gistId) {
  const headers = { Authorization: 'token ' + token };
  if (gistLastETag) headers['If-None-Match'] = gistLastETag;
  const res = await fetch('https://api.github.com/gists/' + gistId, { headers });
  if (res.status === 304) return null;
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const etag = res.headers.get('ETag');
  if (etag) gistLastETag = etag;
  const data = await res.json();
  const content = data.files && data.files[GIST_FILENAME] && data.files[GIST_FILENAME].content;
  if (!content) throw new Error('Arquivo não encontrado no Gist');
  return JSON.parse(content);
}

async function pushToGist(silent) {
  const token = getGistToken(), gistId = getGistId();
  if (!token) return;
  if (!navigator.onLine) { setSyncDots('off'); return; }
  if (gistId && !hasUnpushed()) { setSyncDots('ok'); return; }
  
  setSyncDots('ing');
  const payload = buildGistPayload();
  
  try {
    let res;
    if (gistId) {
      res = await fetch('https://api.github.com/gists/' + gistId, {
        method: 'PATCH',
        headers: { Authorization: 'token ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: { [GIST_FILENAME]: { content: payload } } })
      });
    } else {
      res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: { Authorization: 'token ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Honorda RPG Fichas', public: false, files: { [GIST_FILENAME]: { content: payload } } })
      });
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    
    const data = await res.json();
    if (!gistId) { 
      localStorage.setItem(GIST_ID_KEY, data.id); 
      if (!silent) showToast('Gist criado com sucesso!'); 
    }
    
    const sent = JSON.parse(payload);
    gistLastSavedAt = sent.savedAt;
    localStorage.setItem(GIST_LAST_KEY, gistLastSavedAt);
    markPushed();
    gistLastETag = '';
    setSyncDots('ok');
    
  } catch(e) {
    setSyncDots('err');
    if (!silent) showToast('Erro ao enviar: ' + e.message);
    throw e;
  }
}

// ── SMART MERGE DE FICHAS ──
function applyRemoteData(remote) {
  if (!remote || !remote.list || !remote.chars) return false;
  
  const localList = getCharList();
  const localDeleted = getDeletedChars();
  let changed = false;
  
  const listMap = new Map();
  localList.forEach(c => listMap.set(c.id, c));

  // 1. Processa Fichas Apagadas
  if (remote.deleted) {
    remote.deleted.forEach(rd => {
      const lc = listMap.get(rd.id);
      if (lc) {
        const lt = new Date(lc.updatedAt || lc.createdAt || 0).getTime();
        const rt = new Date(rd.deletedAt).getTime();
        // Se a deleção remota for mais nova que a nossa última edição, apagamos localmente
        if (rt > lt) {
          listMap.delete(rd.id);
          localStorage.removeItem(CHAR_PREFIX + rd.id);
          changed = true;
          if (!localDeleted.find(d => d.id === rd.id)) localDeleted.push(rd);
        }
      }
    });
    localStorage.setItem(DELETED_CHARS_KEY, JSON.stringify(localDeleted));
  }

  // 2. Processa Fichas Novas/Editadas
  remote.list.forEach(rc => {
    // Impede reviver fichas se nós as apagamos depois que o outro dispositivo salvou
    const isDelLocally = localDeleted.find(d => d.id === rc.id);
    if (isDelLocally && new Date(isDelLocally.deletedAt).getTime() > new Date(rc.updatedAt || rc.createdAt || 0).getTime()) {
      return; 
    }

    const lc = listMap.get(rc.id);
    if (!lc) {
      listMap.set(rc.id, rc);
      localStorage.setItem(CHAR_PREFIX + rc.id, JSON.stringify(remote.chars[rc.id] || {}));
      changed = true;
    } else {
      const lt = new Date(lc.updatedAt || lc.createdAt || 0).getTime();
      const rt = new Date(rc.updatedAt || rc.createdAt || 0).getTime();
      if (rt > lt) {
        listMap.set(rc.id, { ...lc, ...rc });
        localStorage.setItem(CHAR_PREFIX + rc.id, JSON.stringify(remote.chars[rc.id] || {}));
        changed = true;
      }
    }
  });
  
  if (changed) {
    const merged = Array.from(listMap.values()).sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
    _origSaveCharList(merged); // Salva sem disparar loop de sync
  }
  return changed;
}

async function fullSync(silent) {
  const token = getGistToken(), gistId = getGistId();
  if (!token || gistIsSyncing || !navigator.onLine) return;
  gistIsSyncing = true;
  setSyncDots('ing');
  try {
    let needsPush = hasUnpushed();
    
    if (gistId) {
      const remote = await pullFromGist(token, gistId);
      if (!remote) {
        if (needsPush) await pushToGist(true);
        else setSyncDots('ok');
        return;
      }
      if (remote.devices) mergeDeviceReg(remote.devices);
      
      if (remote.savedAt && remote.savedAt !== gistLastSavedAt) {
        const changed = applyRemoteData(remote);
        gistLastSavedAt = remote.savedAt;
        localStorage.setItem(GIST_LAST_KEY, gistLastSavedAt);
        
        if (changed) {
          renderIndex();
          if (currentCharId && remote.chars && remote.chars[currentCharId]) {
            loadSheet(currentCharId);
          }
          if (!silent) showToast('Fichas atualizadas do Gist!');
          
          if (!needsPush) {
            markPushed();
          }
        }
      }
    } else { 
      needsPush = true; 
    }
    
    if (needsPush) await pushToGist(true);
    else setSyncDots('ok');
    
  } catch(e) {
    setSyncDots('err');
    console.error('Sync error:', e);
  } finally { 
    gistIsSyncing = false; 
  }
}

function scheduleGistSync() {
  if (!getGistToken()) return;
  clearTimeout(gistSyncTimer);
  setSyncDots('ing'); // Muda a bolinha para "Sincronizando..." instantaneamente na tela
  gistSyncTimer = setTimeout(() => fullSync(true), 1500); // Envia após 1,5 segundos sem editar
}

function forceGistSync() {
  if (!getGistToken()) return;
  clearTimeout(gistSyncTimer);
  fullSync(true); // Envia instantaneamente
}

async function silentPoll() {
  const token = getGistToken(), gistId = getGistId();
  if (!token || !gistId || !navigator.onLine || gistIsSyncing) return;
  try {
    const remote = await pullFromGist(token, gistId);
    if (!remote) return;
    if (remote.devices) mergeDeviceReg(remote.devices);
    if (remote.savedAt && remote.savedAt !== gistLastSavedAt) {
      const changed = applyRemoteData(remote);
      gistLastSavedAt = remote.savedAt;
      localStorage.setItem(GIST_LAST_KEY, gistLastSavedAt);
      if (changed) {
        renderIndex();
        if (currentCharId && remote.chars && remote.chars[currentCharId]) loadSheet(currentCharId);
        showToast('Fichas sincronizadas automaticamente');
        setSyncDots('ok');
        await pushToGist(true);
      }
    }
  } catch(e) { /* silencioso */ }
}

function startGistPolling() { silentPoll(); clearInterval(gistPollTimer); gistPollTimer = setInterval(silentPoll, POLL_MS); }
function stopGistPolling()  { clearInterval(gistPollTimer); }

function startSmartGistMonitor() {
  const fn = () => { 
    if (document.visibilityState === 'visible') { 
      silentPoll(); 
      startGistPolling(); 
    } else {
      stopGistPolling();
      // Ao minimizar ou fechar o app, se houver edição, envia para a nuvem em plano de fundo
      if (currentCharId) flushSave();
      if (hasUnpushed()) forceGistSync();
    }
  };
  document.addEventListener('visibilitychange', fn);
  window.addEventListener('focus', fn);
  if (document.visibilityState === 'visible') { silentPoll(); startGistPolling(); }
}

window.addEventListener('online',  async () => { setSyncDots('ing'); await fullSync(true); startGistPolling(); });
window.addEventListener('offline', () => { stopGistPolling(); if (getGistToken()) setSyncDots('off'); });

function setSyncDots(state) {
  const colors = { ok: '#4caf50', ing: '#f0a030', err: '#c0392b', off: 'var(--text-dim)' };
  const shadows = { ok: '0 0 8px rgba(76,175,80,0.8)', ing: '0 0 8px rgba(240,160,48,0.8)', err: '0 0 8px rgba(192,57,43,0.8)', off: 'none' };
  const c = colors[state] || colors.off;
  const s = shadows[state] || 'none';
  [document.getElementById('sync-dot-header'), document.getElementById('sync-dot-sheet')].forEach(el => {
    if (el) { el.style.background = c; el.style.boxShadow = s; }
  });
  const dot = document.getElementById('sync-status-dot');
  if (dot) { dot.style.background = c; dot.style.boxShadow = s; }
  const labels = { ok: 'Sincronizado', ing: 'Sincronizando...', err: 'Erro', off: 'Offline' };
  const lb = document.getElementById('sync-label-header');
  if (lb) lb.textContent = labels[state] || 'Sync';
  const stxt = document.getElementById('sync-status-text');
  if (stxt) stxt.textContent = (labels[state] || 'Sync').toUpperCase();
}

async function connectSync() {
  if (!navigator.onLine) return showToast('Sem conexão com a internet.');
  const tokenInput = document.getElementById('sync-token-input');
  const token = tokenInput.value.trim();
  if (!token || token.startsWith('●')) return showToast('Insira um token válido.');
  setSyncFetchStatus('loading', 'Verificando token...');
  try {
    const meRes = await fetch('https://api.github.com/user', { headers: { Authorization: 'token ' + token } });
    if (!meRes.ok) throw new Error('Token inválido ou sem permissão');
    localStorage.setItem(GIST_TOKEN_KEY, token);

    let foundGistId = null;
    setSyncFetchStatus('loading', 'Buscando Gist existente...');
    for (let page = 1; page <= 3; page++) {
      const lr = await fetch('https://api.github.com/gists?page=' + page + '&per_page=30', { headers: { Authorization: 'token ' + token } });
      if (!lr.ok) break;
      const gists = await lr.json();
      const g = gists.find(x => x.files && x.files[GIST_FILENAME]);
      if (g) { foundGistId = g.id; break; }
      if (gists.length < 30) break;
    }

    if (foundGistId) {
      localStorage.setItem(GIST_ID_KEY, foundGistId);
      setSyncFetchStatus('loading', 'Importando fichas do Gist...');
      const remote = await pullFromGist(token, foundGistId);
      if (remote && remote.devices) mergeDeviceReg(remote.devices);
      if (remote) {
        const changed = applyRemoteData(remote);
        gistLastSavedAt = remote.savedAt || '';
        localStorage.setItem(GIST_LAST_KEY, gistLastSavedAt);
        markPushed();
        if (changed) { renderIndex(); showToast('Fichas importadas do Gist!'); }
        else showToast('Conectado — fichas já estão idênticas.');
      }
    } else {
      setSyncFetchStatus('loading', 'Criando novo Gist...');
      await pushToGist(true);
      showToast('Gist criado com suas fichas!');
    }
    setSyncFetchStatus('hidden', '');
    updateSyncUI();
    closeSyncModal();
    startGistPolling();
  } catch(e) {
    setSyncFetchStatus('error', 'Erro: ' + e.message);
  }
}

function disconnectSync() {
  if (!confirm('Desconectar do Gist? As fichas locais serão mantidas.')) return;
  localStorage.removeItem(GIST_TOKEN_KEY);
  localStorage.removeItem(GIST_ID_KEY);
  localStorage.removeItem(GIST_LAST_KEY);
  localStorage.removeItem(GIST_HASH_KEY);
  gistLastSavedAt = '';
  stopGistPolling();
  setSyncDots('off');
  updateSyncUI();
  closeSyncModal();
  showToast('Desconectado do Gist.');
}

function setSyncFetchStatus(type, msg) {
  const el = document.getElementById('sync-fetch-status');
  if (!el) return;
  if (type === 'hidden') { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.style.color = type === 'error' ? 'var(--red-bright)' : type === 'loading' ? 'var(--gold-light)' : 'var(--text-dim)';
  el.style.borderColor = type === 'error' ? 'rgba(139,16,16,0.4)' : 'var(--panel-border)';
  el.textContent = (type === 'loading' ? '⟳ ' : type === 'error' ? '✕ ' : '✓ ') + msg;
}

function timeAgoSync(iso) {
  if (!iso) return '';
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d/60000);
  if (m < 1) return 'agora mesmo';
  if (m < 60) return m + ' min atrás';
  const h = Math.floor(m/60);
  if (h < 24) return h + 'h atrás';
  return Math.floor(h/24) + 'd atrás';
}

function updateSyncUI() {
  const token = getGistToken();
  const connected = !!token;
  const stxt = document.getElementById('sync-status-text');
  const stime = document.getElementById('sync-status-time');
  const connBtn = document.getElementById('sync-connect-btn');
  const discBtn = document.getElementById('sync-disconnect-btn');
  const devSec = document.getElementById('sync-devices-section');
  if (connected) {
    setSyncDots(navigator.onLine ? 'ok' : 'off');
    if (stxt) stxt.textContent = navigator.onLine ? 'CONECTADO' : 'CONECTADO (OFFLINE)';
    if (stime) stime.textContent = timeAgoSync(gistLastSavedAt);
    if (connBtn) connBtn.textContent = 'Sincronizar Agora';
    if (discBtn) discBtn.style.display = 'block';
    if (devSec) devSec.style.display = 'block';
    document.getElementById('sync-token-input').value = '●●●●●●●●●●●●●●●';
    renderSyncDevices();
  } else {
    setSyncDots('off');
    if (stxt) stxt.textContent = 'NÃO CONFIGURADO';
    if (stime) stime.textContent = '';
    if (connBtn) connBtn.textContent = 'Conectar e Sincronizar';
    if (discBtn) discBtn.style.display = 'none';
    if (devSec) devSec.style.display = 'none';
    document.getElementById('sync-token-input').value = '';
  }
}

function renderSyncDevices() {
  const list = loadDeviceReg();
  const curId = getDeviceId();
  const el = document.getElementById('sync-devices-list');
  if (!el) return;
  if (!list.length) { el.innerHTML = '<div style="font-size:11px;color:var(--text-dim);">Nenhum dispositivo registrado ainda.</div>'; return; }
  list.sort((a,b) => { if (a.id===curId) return -1; if (b.id===curId) return 1; return new Date(b.lastSeen)-new Date(a.lastSeen); });
  el.innerHTML = list.map(dev => {
    const isCur = dev.id === curId;
    const typeIcon = dev.deviceType === 'mobile' ? '📱' : dev.deviceType === 'tablet' ? '📟' : '🖥';
    const pwaBadge = dev.isPWA ? ' <span style="font-size:8px;background:rgba(139,16,16,0.3);border:1px solid rgba(139,16,16,0.4);color:var(--red-bright);padding:1px 5px;letter-spacing:1px;">PWA</span>' : '';
    const curBadge = isCur ? ' <span style="font-size:8px;background:rgba(154,112,32,0.2);border:1px solid rgba(154,112,32,0.4);color:var(--gold-light);padding:1px 5px;letter-spacing:1px;">ESTE</span>' : '';
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--panel-border);background:rgba(255,255,255,0.02);">'
      + '<span style="font-size:16px;">' + typeIcon + '</span>'
      + '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:11px;color:var(--text-bright);font-family:var(--ff-head);">' + (dev.name||'Desconhecido') + pwaBadge + curBadge + '</div>'
      + '<div style="font-size:9px;color:var(--text-dim);margin-top:2px;">' + timeAgoSync(dev.lastSeen) + '</div>'
      + '</div></div>';
  }).join('');
}

function openSyncModal() {
  updateSyncUI();
  setSyncFetchStatus('hidden', '');
  document.getElementById('modal-sync').classList.add('open');
}
function closeSyncModal() {
  document.getElementById('modal-sync').classList.remove('open');
}
document.getElementById('modal-sync').addEventListener('click', function(e) { if (e.target === this) closeSyncModal(); });

// ── OVERRIDES PARA CAPTURAR A DATA CERTA ──
const _origSaveCharData = saveCharData;
saveCharData = function(id, data) {
  _origSaveCharData(id, data); 

  const list = getCharList();
  const entry = list.find(c => c.id === id);
  if (entry) {
    entry.updatedAt = new Date().toISOString();
    _origSaveCharList(list); 
  }
  scheduleGistSync();
};

const _origSaveCharList = saveCharList;
saveCharList = function(list) {
  _origSaveCharList(list);
  scheduleGistSync();
};

const _origDeleteChar = deleteChar;
deleteChar = function(id, e) {
  if (e) e.stopPropagation();
  const list = getCharList();
  const char = list.find(c => c.id === id);
  if (!confirm(`Apagar o personagem "${char?.name || 'este sobrevivente'}"? Esta ação não pode ser desfeita.`)) return;
  markCharDeleted(id);
  const newList = list.filter(c => c.id !== id);
  saveCharList(newList);
  localStorage.removeItem(CHAR_PREFIX + id);
  renderIndex();
  showToast('Ficha apagada');
  scheduleGistSync();
};

/* ════════════════════════════════════════════════════
   PWA — Service Worker & Install Prompt
════════════════════════════════════════════════════ */
(function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.onupdatefound = () => {
        const w = reg.installing;
        if (w) w.onstatechange = () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller)
            w.postMessage({ type: 'SKIP_WAITING' });
        };
      };
      console.log('[SW] Registrado com sucesso:', reg.scope);
    }).catch(e => console.warn('[SW] Registro falhou:', e));
  }

  const DISMISSED_KEY = 'honorda_pwa_dismissed';
  const banner        = document.getElementById('pwa-install-banner');
  const installBtn    = document.getElementById('pwa-banner-install-btn');
  const dismissBtn    = document.getElementById('pwa-banner-dismiss');
  const subText       = document.getElementById('pwa-banner-sub');

  let deferredPrompt = null;

  function wasDismissedRecently() {
    const ts = parseInt(localStorage.getItem(DISMISSED_KEY) || '0');
    return Date.now() - ts < 3 * 24 * 60 * 60 * 1000;
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function showBanner() {
    if (isStandalone() || wasDismissedRecently()) return;
    setTimeout(() => banner.classList.add('visible'), 1500);
  }

  function hideBanner() { banner.classList.remove('visible'); }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    subText.textContent = 'Acesso rápido, funciona offline.';
    showBanner();
  });

  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      hideBanner();
      if (outcome === 'accepted') showToast('Honorda instalado!');
    }
  });

  dismissBtn.addEventListener('click', () => {
    hideBanner();
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  });

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
  if (isIOS && isInSafari && !isStandalone()) {
    subText.innerHTML = 'Toque em <strong>Compartilhar ↑</strong> e depois <strong>"Tela de Início"</strong>.';
    installBtn.style.display = 'none';
    showBanner();
  }

  window.addEventListener('appinstalled', () => {
    hideBanner();
    showToast('Honorda instalado com sucesso!');
  });
})();

/* ════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════ */
document.getElementById('btn-import-index').addEventListener('click', importSheetFromIndex);
document.getElementById('btn-new-char').addEventListener('click', openNewCharModal);
document.getElementById('btn-back').addEventListener('click', goToIndex);
document.getElementById('btn-export').addEventListener('click', exportSheet);
document.getElementById('btn-delete-sheet').addEventListener('click', deleteCurrentSheet);
document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
document.getElementById('btn-modal-create').addEventListener('click', createNewChar);

buildDynamicElements();
renderIndex();
setModalType('survivor');

(async function() {
  const token = getGistToken();
  if (!token) return;
  if (!navigator.onLine) { setSyncDots('off'); return; }
  await fullSync(true);
  startSmartGistMonitor();
})();
if (getGistToken() && navigator.onLine) startSmartGistMonitor();

console.log('%cHONORDA v6 — Sistema iniciado. Bem-vindo, Sobrevivente.', 'color:#8b1010;font-family:serif;font-size:13px;');
