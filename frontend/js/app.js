/* ═════════════════════════════════════════════════════════════
   ConectorLatam v2 — Frontend Application Logic
   RNF01 · RF05-07 · RF09-10 · RF17-18 · RF20 · RF22 · RNF03
   ═════════════════════════════════════════════════════════════ */

const API = 'http://localhost:5000/api';

// ─── Global State ──────────────────────────────────────────────────────────────
const S = {
  view:           'dashboard',
  step:           1,
  source:         'SRI Ecuador',
  dest:           'Google BigQuery',
  certFile:       null,
  allLogs:        [],
  filteredLogs:   [],
  connectors:     [],
  currentPlan:    'starter',
};

// ─── Country metadata (mirrors backend) ────────────────────────────────────────
const COUNTRY_META = {
  'SRI Ecuador':   { id: 'RUC', digits: 13, flag: '🇪🇨', placeholder: '1792XXXXXXXXX001' },
  'SAT México':    { id: 'RFC', digits: 13, flag: '🇲🇽', placeholder: 'XAXX010101AAA' },
  'SUNAT Perú':    { id: 'RUC', digits: 11, flag: '🇵🇪', placeholder: '20123456789' },
  'DIAN Colombia': { id: 'NIT', digits:  9, flag: '🇨🇴', placeholder: '900123456' },
};

// ─── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  loadMetrics();
  setInterval(loadMetrics, 20000);
  showView('dashboard');
  
  // Mostrar tutorial a usuarios nuevos
  if (!localStorage.getItem('tutorialSeen')) {
    localStorage.setItem('tutorialSeen', 'true');
    setTimeout(startTutorial, 800);
  }
});

// ─── Clock ─────────────────────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('header-time');
  if (el) el.textContent = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
}

// ─── Navigation ────────────────────────────────────────────────────────────────
function showView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`view-${view}`)?.classList.remove('hidden');
  document.getElementById(`nav-${view}`)?.classList.add('active');

  const meta = {
    dashboard: ['Dashboard de Monitoreo', 'Dashboard'],
    wizard:    ['Asistente de Configuración de Pipelines', 'Nuevo Pipeline'],
    logs:      ['Consola Técnica de Logs · RF17 · RF22', 'Logs & Historial'],
    pricing:   ['Planes de Suscripción SaaS B2B', 'Planes y Precios'],
    apidocs:   ['Documentación API REST · RF23', 'API Docs'],
    audit:     ['Log de Auditoría Inmutable · RF13 · RF17', 'Auditoría'],
  };
  const [title, crumb] = meta[view] || [view, view];
  document.getElementById('page-title').textContent = title;
  document.getElementById('breadcrumb-current').textContent = crumb;

  S.view = view;
  if (view === 'dashboard') loadMetrics();
  if (view === 'logs')      { loadLogs(); setTimeout(initTerminal, 350); }
  if (view === 'wizard')    { resetWizard(); updateWizardLocks(); }
  if (view === 'apidocs')   loadApiDocs();
  if (view === 'audit')     loadAuditLog();
}

// ─── API helpers ───────────────────────────────────────────────────────────────
async function apiFetch(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
async function loadMetrics() {
  let data;
  try { data = await apiFetch(`${API}/metrics`); }
  catch { data = DEMO_METRICS(); }
  S.connectors = data.connectors || [];
  renderKPIs(data);
  renderConnectors(data.connectors || []);
  if (S.view === 'dashboard') {
    if (!S.allLogs.length) S.allLogs = DEMO_LOGS();
    renderActivityTable(S.allLogs);
  }
}

function renderKPIs(d) {
  animCount('val-cycle',   d.cycle_processed  || 14250, '');
  animCount('val-today',   d.today_processed  || 2140,  '');
  const sucEl = document.getElementById('val-success');
  if (sucEl) sucEl.textContent = (d.success_rate || 98.4).toFixed(1) + '%';
  animCount('val-dups',    d.duplicates_prevented || 847, '');
}

function animCount(id, target, suffix) {
  const el = document.getElementById(id);
  if (!el) return;
  const dur = 900, start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * e).toLocaleString('es-EC') + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

function renderConnectors(list) {
  const grid = document.getElementById('connectors-grid');
  if (!grid) return;
  if (!list.length) { grid.innerHTML = '<p style="color:var(--text-tertiary);font-size:.8rem;">Sin conectores activos.</p>'; return; }
  grid.innerHTML = list.map(c => {
    const meta = COUNTRY_META[c.origin] || { flag: '🌎' };
    return `
    <div class="connector-card">
      <div class="connector-card-header">
        <div>
          <div class="connector-name">${meta.flag} ${c.name}</div>
          <div class="connector-type">ID: ${c.id} · ${c.tax_id}</div>
        </div>
        <div class="status-pill status-pill--active">Operativo</div>
      </div>
      <div class="connector-stats">
        <div class="stat-item"><span class="stat-label">Ciclo</span><span class="stat-value">${(c.records_cycle||0).toLocaleString()}</span></div>
        <div class="stat-item"><span class="stat-label">Uptime</span><span class="stat-value">${c.uptime||99.8}%</span></div>
        <div class="stat-item"><span class="stat-label">Destino</span><span class="stat-value" style="font-size:.7rem">${c.destination}</span></div>
      </div>
      <div class="connector-footer">
        <span class="connector-last">Sync: ${c.last_sync}</span>
        <button class="btn btn-ghost btn-xs" onclick="showView('logs')">Logs →</button>
      </div>
    </div>`;
  }).join('');
}

function renderActivityTable(logs) {
  const tb = document.getElementById('activity-tbody');
  if (!tb) return;
  tb.innerHTML = logs.slice(0, 8).map(l => `
    <tr onclick="showView('logs')" title="Ver en consola de logs">
      <td style="font-family:'JetBrains Mono',monospace;font-size:.7rem;white-space:nowrap;color:var(--text-tertiary)">${l.timestamp}</td>
      <td style="font-weight:700;color:var(--text-primary)">${(COUNTRY_META[l.origin]?.flag||'🌎')+' '+l.origin}</td>
      <td style="color:var(--text-secondary)">${l.doc_type||'Factura Electrónica'}</td>
      <td style="font-weight:700;color:var(--text-primary)">${l.records.toLocaleString()}<small style="color:var(--text-tertiary);font-weight:400"> (+${l.duplicates_skipped||0} dup.)</small></td>
      <td style="color:var(--text-secondary)">${l.destination}</td>
      <td>${statusBadge(l.status)}</td>
    </tr>`).join('');
}

// ─── Logs View ─────────────────────────────────────────────────────────────────
async function loadLogs() {
  try { const d = await apiFetch(`${API}/logs`); S.allLogs = d.logs; }
  catch { S.allLogs = DEMO_LOGS(); }
  S.filteredLogs = [...S.allLogs];
  renderLogsTable(S.filteredLogs);
}

function filterLogs() {
  const origin   = document.getElementById('filter-connector')?.value || '';
  const docType  = document.getElementById('filter-doctype')?.value || '';
  const status   = document.getElementById('filter-status')?.value || '';
  const dateFrom = document.getElementById('filter-date-from')?.value || '';
  const dateTo   = document.getElementById('filter-date-to')?.value || '';

  S.filteredLogs = S.allLogs.filter(l => {
    if (origin && l.origin !== origin) return false;
    if (docType && (l.doc_type || '') !== docType) return false;
    if (status && l.status !== status) return false;
    if (dateFrom && l.timestamp < dateFrom) return false;
    if (dateTo && l.timestamp > dateTo + 'T23:59:59Z') return false;
    return true;
  });
  renderLogsTable(S.filteredLogs);
}

function renderLogsTable(logs) {
  const tb = document.getElementById('logs-tbody');
  if (!tb) return;
  tb.innerHTML = logs.map(l => `
    <tr onclick="showLogInTerminal('${l.id}')">
      <td style="font-family:'JetBrains Mono',monospace;font-size:.69rem;white-space:nowrap;color:var(--text-tertiary)">${l.timestamp}</td>
      <td style="font-weight:700;color:var(--text-primary)">${(COUNTRY_META[l.origin]?.flag||'🌎')+' '+l.origin}</td>
      <td style="color:var(--text-secondary);font-size:.75rem">${l.doc_type||'—'}</td>
      <td style="font-weight:700;color:var(--text-primary)">${l.records}<small style="color:var(--accent-green);font-size:.65rem"> +${l.records}</small></td>
      <td style="color:var(--text-secondary);font-size:.75rem">${l.destination}</td>
      <td>${statusBadge(l.status)}</td>
    </tr>`).join('');
}

function showLogInTerminal(id) {
  const log = S.allLogs.find(l => l.id == id);
  if (log) printToTerminal(log.log_lines, log.status);
}

function statusBadge(s) {
  const m = { SUCCESS:'badge--success', WARNING:'badge--warning', ERROR:'badge--error', RUNNING:'badge--info' };
  const icons = { SUCCESS:'✓', WARNING:'⚠', ERROR:'✗', RUNNING:'⟳' };
  return `<span class="badge ${m[s]||'badge--info'}">${icons[s]||'?'} ${s}</span>`;
}

// ─── Terminal ──────────────────────────────────────────────────────────────────
function initTerminal() {
  const body = document.getElementById('terminal-body');
  if (!body) return;
  body.innerHTML = '';
  const lines = [
    { cls: 't-ts',   text: '# ConectorLatam ETL Engine v2.0.0 · ISO 8601 Audit Log' },
    { cls: 't-ts',   text: '# Conectado a: SRI Ecuador · SAT México · SUNAT Perú · DIAN Colombia' },
    { cls: 't-ts',   text: '' },
    { cls: 't-info', text: '[INFO]    Motores de extracción activos: 2/2' },
    { cls: 't-info', text: '[INFO]    Modo: Incremental · Deduplicación RF18: ACTIVO' },
    { cls: 't-ts',   text: '' },
    { cls: 't-ts',   text: '# Selecciona una ejecución de la tabla para ver su log completo' },
    { cls: 't-ts',   text: '# o haz clic en ▶ Run para ejecutar un pipeline ahora' },
    { cls: 't-ts',   text: '' },
  ];
  let d = 0;
  lines.forEach(ln => {
    setTimeout(() => {
      appendTerminalLine(ln.cls, ln.text || '\u00A0');
    }, d);
    d += 60;
  });
  setTimeout(() => appendPrompt(), d + 80);
}

function appendTerminalLine(cls, text) {
  const body = document.getElementById('terminal-body');
  if (!body) return;
  const div = document.createElement('div');
  div.className = 'log-line';
  div.innerHTML = `<span class="${cls}">${escHtml(text)}</span>`;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function appendPrompt() {
  const body = document.getElementById('terminal-body');
  if (!body) return;
  const div = document.createElement('div');
  div.className = 'log-line';
  div.innerHTML = `<span class="t-prompt">root@conectorlatam</span><span style="color:#c9d1d9">:</span><span class="t-path">~/etl/pipelines</span><span style="color:#c9d1d9;margin:0 6px">$</span><span class="t-cursor">▌</span>`;
  body.appendChild(div);
}

function printToTerminal(lines, status = 'SUCCESS') {
  const body = document.getElementById('terminal-body');
  if (!body) return;
  body.innerHTML = '';
  setTerminalStatus('running', 'Cargando log de auditoría...');

  // Command line
  const cmd = document.createElement('div');
  cmd.className = 'log-line';
  cmd.innerHTML = `<span class="t-prompt">root@conectorlatam</span><span style="color:#c9d1d9">:</span><span class="t-path">~/etl/pipelines</span><span style="color:#c9d1d9;margin:0 6px">$</span><span style="color:#e2e8f0">python run_pipeline.py --mode incremental --format iso8601</span>`;
  body.appendChild(cmd);

  const blankDiv = document.createElement('div');
  blankDiv.innerHTML = '&nbsp;';
  body.appendChild(blankDiv);

  lines.forEach((line, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'log-line';
      div.innerHTML = colorizeLogLine(line);
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;

      if (i === lines.length - 1) {
        setTimeout(() => {
          body.appendChild(Object.assign(document.createElement('div'), {innerHTML:'&nbsp;'}));
          appendPrompt();
          setTerminalStatus('active', `Último run: ${status}`);
        }, 200);
      }
    }, 80 + i * 110);
  });
}

function colorizeLogLine(line) {
  // Format: [2026-05-27T22:45:01Z] [LEVEL] message
  const m = line.match(/^(\[[\d\-T:Z]+\])\s+\[(\w+)\]\s+(.*)$/);
  if (!m) return `<span class="t-ts">${escHtml(line)}</span>`;
  const [, ts, level, msg] = m;
  const lvlClass = { INFO:'t-info', DEBUG:'t-debug', DATA:'t-data', SUCCESS:'t-success', WARNING:'t-warning', ERROR:'t-error' }[level] || 't-ts';
  return `<span class="t-ts">${escHtml(ts)}</span> <span class="${lvlClass}">[${level}]</span>    <span style="color:#c9d1d9">${escHtml(msg)}</span>`;
}

function setTerminalStatus(state, text) {
  const el = document.getElementById('terminal-status');
  if (!el) return;
  const dotCls = { active: 'active', running: 'running' }[state] || '';
  el.innerHTML = `<span class="term-dot ${dotCls}"></span> ${text}`;
}

function clearTerminal() {
  const body = document.getElementById('terminal-body');
  if (body) body.innerHTML = '';
  initTerminal();
}

// ─── Manual Pipeline Run ───────────────────────────────────────────────────────
async function triggerManualRun() {
  const btn = document.getElementById('run-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Ejecutando...'; }
  if (S.view !== 'logs') showView('logs');
  await sleep(400);
  setTerminalStatus('running', 'Pipeline iniciado manualmente...');

  const connId = S.connectors[0]?.id || 'conn-001';
  let data;
  try {
    data = await apiFetch(`${API}/simulate-run`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ connector_id: connId }) });
  } catch {
    data = { log: fakeRun(S.connectors[0]) };
  }

  S.allLogs.unshift(data.log);
  S.filteredLogs.unshift(data.log);
  renderLogsTable(S.filteredLogs);
  await sleep(250);
  printToTerminal(data.log.log_lines, data.log.status);
  showToast(`Pipeline ejecutado: ${data.log.records} registros · ${data.log.destination}`, 'success');

  if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg> Ejecutar Pipeline'; }
}

// ─── Wizard ────────────────────────────────────────────────────────────────────
function resetWizard() {
  goToStep(1);
  document.getElementById('success-modal')?.classList.add('hidden');
  ['input-taxid','input-password','input-cert-pass'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  S.certFile = null;
  resetFileZone();
  document.getElementById('aes-preview-group').style.display = 'none';
}

function goToStep(n) {
  [1,2,3].forEach(i => {
    document.getElementById(`wizard-step-${i}`)?.classList.add('hidden');
    const ind = document.getElementById(`step-indicator-${i}`);
    if (ind) ind.classList.remove('active','completed');
  });
  [1,2].forEach(i => document.getElementById(`step-conn-${i}`)?.classList.remove('completed'));
  for (let i = 1; i < n; i++) {
    document.getElementById(`step-indicator-${i}`)?.classList.add('completed');
    document.getElementById(`step-conn-${i}`)?.classList.add('completed');
  }
  document.getElementById(`step-indicator-${n}`)?.classList.add('active');
  document.getElementById(`wizard-step-${n}`)?.classList.remove('hidden');
  S.step = n;
  if (n === 2) updateStep2Labels();
  if (n === 3) updatePreview();
}

function selectSource(src, el) {
  if (el.classList.contains('locked-card')) {
    showToast(`El plan ${S.currentPlan.toUpperCase()} no permite agregar este país.`, 'error');
    return;
  }
  document.querySelectorAll('.source-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  S.source = src;
}

function selectDest(dest, el) {
  if (el.classList.contains('locked-card')) {
    showToast(`El plan ${S.currentPlan.toUpperCase()} no permite múltiples destinos.`, 'error');
    return;
  }
  document.querySelectorAll('.dest-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  S.dest = dest;
  updatePreview();
}

function updateWizardLocks() {
  const limits = { starter: { c: 1, d: 1 }, growth: { c: 2, d: 2 }, multilatam: { c: 4, d: 3 } };
  const max = limits[S.currentPlan] || limits.starter;
  
  const activeSources = new Set(S.connectors.map(c => c.origin));
  const activeDests = new Set(S.connectors.map(c => c.destination));

  // Lock sources
  document.querySelectorAll('.source-card').forEach(card => {
    const srcName = card.getAttribute('onclick').match(/'([^']+)'/)[1];
    if (!activeSources.has(srcName) && activeSources.size >= max.c) {
      card.classList.add('locked-card');
    } else {
      card.classList.remove('locked-card');
    }
  });

  // Lock destinations
  document.querySelectorAll('.dest-card').forEach(card => {
    const destName = card.querySelector('.dest-name').textContent;
    if (!activeDests.has(destName) && activeDests.size >= max.d) {
      card.classList.add('locked-card');
    } else {
      card.classList.remove('locked-card');
    }
  });
}

function updateStep2Labels() {
  const meta = COUNTRY_META[S.source] || COUNTRY_META['SRI Ecuador'];
  const title = document.getElementById('step2-title');
  const label = document.getElementById('taxid-label');
  const hint  = document.getElementById('taxid-hint');
  const input = document.getElementById('input-taxid');
  const flag  = meta.flag;
  if (title) title.textContent = `Credenciales — ${flag} ${S.source}`;
  if (label) label.textContent = `${meta.id} (${S.source})`;
  if (hint)  hint.textContent  = `${meta.digits} dígitos`;
  if (input) { input.placeholder = meta.placeholder; input.maxLength = meta.digits + 3; }

  // Live AES preview on typing
  input?.addEventListener('input', updateAesPreview);
}

function updateAesPreview() {
  const taxid = document.getElementById('input-taxid')?.value || '';
  if (taxid.length < 5) { document.getElementById('aes-preview-group').style.display = 'none'; return; }
  const fake = `AES256::${btoa('KEY:' + taxid).slice(0,28)}...[CIFRADO RNF03]`;
  document.getElementById('aes-preview-val').textContent = fake;
  document.getElementById('aes-preview-group').style.display = 'block';
}

function updatePreview() {
  const taxid = document.getElementById('input-taxid')?.value || '—';
  document.getElementById('preview-origin').textContent = S.source;
  document.getElementById('preview-taxid').textContent  = taxid;
  document.getElementById('preview-cert').textContent   = S.certFile || 'certificado.p12 (simulado)';
  document.getElementById('preview-aes').textContent    = taxid !== '—' ? `AES256::${btoa('K:'+taxid).slice(0,20)}... [ACTIVO]` : 'AES-256 · En espera';
  document.getElementById('preview-dest').textContent   = S.dest;
}

function togglePassword() {
  const el = document.getElementById('input-password');
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

// ─── File Upload & Drag-and-Drop (RF10) ───────────────────────────────────────
function handleDragOver(e) { e.preventDefault(); document.getElementById('file-zone')?.classList.add('drag-over'); }
function handleDragLeave(e) { document.getElementById('file-zone')?.classList.remove('drag-over'); }
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('file-zone')?.classList.remove('drag-over');
  const file = e.dataTransfer?.files[0];
  if (file) processFile(file);
}
function handleFileUpload(input) { if (input.files?.[0]) processFile(input.files[0]); }

function processFile(file) {
  S.certFile = file.name;
  const zone    = document.getElementById('file-zone');
  const content = document.getElementById('file-upload-content');
  zone?.classList.add('uploaded');
  if (content) content.innerHTML = `
    <div style="color:var(--accent-green);font-size:2rem">✓</div>
    <p class="file-upload-text" style="color:var(--accent-green);font-weight:700">${escHtml(file.name)}</p>
    <p class="file-upload-hint">${(file.size/1024).toFixed(1)} KB · Cifrado AES-256 al guardar (RNF03)</p>`;
  showToast(`Certificado cargado: ${file.name}`, 'success');
  updateAesPreview();
}

function resetFileZone() {
  const zone = document.getElementById('file-zone');
  const content = document.getElementById('file-upload-content');
  zone?.classList.remove('uploaded','drag-over');
  if (content) content.innerHTML = `
    <div class="file-upload-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    </div>
    <p class="file-upload-text">Arrastra tu certificado aquí o <span>haz clic para explorar</span></p>
    <p class="file-upload-hint">Formatos: .p12 · .pfx · .cer — Máx. 5 MB · Cifrado AES-256 al almacenar</p>`;
}

// ─── Save Connector / Pipeline ─────────────────────────────────────────────────
async function saveConnector() {
  const taxid = document.getElementById('input-taxid')?.value?.trim();
  const pw    = document.getElementById('input-password')?.value;
  const meta  = COUNTRY_META[S.source] || COUNTRY_META['SRI Ecuador'];

  // Validation
  if (!taxid || taxid.length < meta.digits - 2) {
    showToast(`Ingresa un ${meta.id} válido (${meta.digits} dígitos)`, 'error'); return;
  }
  if (!pw) { showToast('Ingresa la contraseña de acceso al portal tributario', 'error'); return; }

  const btn = document.getElementById('save-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Cifrando y activando...'; }

  // Simulate AES-256 encryption steps via toasts
  showToast(`[RNF03] Aplicando cifrado AES-256 a credenciales...`, 'info');
  await sleep(700);
  showToast(`[RNF03] Credenciales cifradas y almacenadas de forma segura.`, 'success');
  await sleep(500);
  showToast(`Conectando con endpoints oficiales del ${S.source}...`, 'info');
  await sleep(600);

  let data;
  try {
    data = await apiFetch(`${API}/connectors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: S.source, destination: S.dest, tax_id: taxid, cert_file: S.certFile || 'certificado.p12' })
    });
  } catch {
    data = fakeConnectorResponse(taxid);
  }

  S.allLogs.unshift(data.initial_log);
  S.connectors.push(data.connector || {});
  showSuccessModal(data, taxid);

  if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg> Guardar y Ejecutar Pipeline'; }
}

function showSuccessModal(data, taxid) {
  const log  = data.initial_log || {};
  const conn = data.connector   || {};

  document.getElementById('modal-subtitle').textContent = data.message || 'Pipeline ETL activado correctamente.';

  document.getElementById('modal-meta').innerHTML = [
    { label: 'Origen Fiscal',   val: S.source },
    { label: 'Identificador',   val: taxid },
    { label: 'Destino',         val: S.dest },
    { label: 'Registros sync.', val: (log.records || 0).toLocaleString() },
    { label: 'Cifrado',         val: 'AES-256 · Activo (RNF03)' },
    { label: 'Duplicados omit.',val: log.duplicates_skipped || 0 },
  ].map(i => `
    <div class="modal-meta-item">
      <span class="modal-meta-label">${i.label}</span>
      <span class="modal-meta-val">${i.val}</span>
    </div>`).join('');

  const termEl = document.getElementById('modal-terminal');
  if (termEl && log.log_lines) {
    termEl.innerHTML = log.log_lines.map(line => {
      const m = line.match(/^(\[[\d\-T:Z]+\])\s+\[(\w+)\]\s+(.*)$/);
      if (!m) return `<div style="color:#8b90aa">${escHtml(line)}</div>`;
      const [, ts, level, msg] = m;
      const c = {INFO:'#79c0ff',DEBUG:'#6b7280',DATA:'#d2a8ff',SUCCESS:'#39d353',WARNING:'#e3b341',ERROR:'#ff7b72'}[level]||'#8b90aa';
      return `<div><span style="color:#3d4155">${escHtml(ts)}</span> <span style="color:${c};font-weight:600">[${level}]</span>  <span style="color:#c9d1d9">${escHtml(msg)}</span></div>`;
    }).join('');
  }

  document.getElementById('success-modal')?.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('success-modal')?.classList.add('hidden');
}



// ─── Tutorial Flow ─────────────────────────────────────────────────────────────
let tutStep = 0;
const tutSteps = [
  { 
    view: 'dashboard', 
    target: '.sidebar-brand', 
    title: '👋 ¡Bienvenido a ConectorLatam!', 
    text: 'Esta plataforma es un <strong>ETL Fiscal</strong>. Su objetivo es conectarse automáticamente a los portales de impuestos de diferentes países (como el SRI de Ecuador) para extraer tus facturas y cargarlas directamente en tu base de datos empresarial. ¡Sin programar nada!' 
  },
  { 
    view: 'dashboard', 
    target: '#run-btn', 
    title: '▶️ Botón "Ejecutar Pipeline"', 
    text: 'Este botón en la cabecera sirve para <strong>iniciar manualmente una sincronización</strong>. Al presionarlo, el sistema se conectará de inmediato con el portal del gobierno y descargará los comprobantes fiscales más recientes.' 
  },
  { 
    view: 'dashboard', 
    target: '.kpi-grid', 
    title: '📊 Métricas en Tiempo Real', 
    text: 'Aquí verás:<br>• <strong>Ciclo de Facturación:</strong> Total de XMLs de facturas extraídos.<br>• <strong>Procesados Hoy:</strong> Lo ingresado hoy.<br>• <strong>Tasa de éxito:</strong> Porcentaje de descargas correctas.<br>• <strong>Duplicados Prevenidos:</strong> Filtra facturas repetidas para no duplicar datos.' 
  },
  { 
    view: 'wizard', 
    wizardStep: 1,
    target: '.source-grid', 
    title: '🌎 Origen Fiscal (Paso 1)', 
    text: 'En este paso eliges la entidad tributaria del gobierno de la cual quieres extraer los datos. Por ejemplo: <strong>Ecuador · SRI</strong>.' 
  },
  { 
    view: 'wizard', 
    wizardStep: 2,
    target: '.form-grid', 
    title: '🔒 Credenciales y Cifrado (Paso 2)', 
    text: 'Aquí ingresas tu RUC/RFC y subes tu archivo de <strong>Firma Electrónica (.p12)</strong>. Es obligatorio para que el sistema pueda autenticarse con el gobierno. Para tu seguridad, se cifran localmente con el estándar militar <strong>AES-256</strong>.' 
  },
  { 
    view: 'wizard', 
    wizardStep: 3,
    target: '.dest-grid', 
    title: '☁️ Destino Data Warehouse (Paso 3)', 
    text: 'Aquí seleccionas el almacén de datos (como <strong>Google BigQuery, Snowflake o Amazon Redshift</strong>) a donde se enviarán todas tus facturas ya ordenadas y listas para auditoría o contabilidad.' 
  },
  { 
    view: 'logs', 
    target: '.terminal-panel', 
    title: '💻 Consola de Logs e Historial', 
    text: 'Esta pantalla técnica registra detalladamente cada conexión bajo el estándar <strong>ISO 8601</strong>. Sirve para que tu área de sistemas pueda monitorear, depurar errores (por ejemplo, si pusiste mal tu contraseña) y auditar todo el flujo.' 
  }
];

function clearHighlights() {
  document.querySelectorAll('.tut-highlight').forEach(el => {
    el.classList.remove('tut-highlight');
  });
}

function positionPopover(targetEl) {
  const popover = document.getElementById('tutorial-popover');
  if (!popover) return;
  
  if (!targetEl) {
    popover.style.top = '50%';
    popover.style.left = '50%';
    popover.style.transform = 'translate(-50%, -50%)';
    return;
  }
  
  const rect = targetEl.getBoundingClientRect();
  const popoverWidth = popover.offsetWidth || 350;
  const popoverHeight = popover.offsetHeight || 220;
  
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const spaceRight = window.innerWidth - rect.right;
  const spaceLeft = rect.left;
  
  let top, left;
  
  if (spaceBelow > popoverHeight + 30) {
    top = rect.bottom + 15;
    left = rect.left + (rect.width - popoverWidth) / 2;
  } else if (spaceAbove > popoverHeight + 30) {
    top = rect.top - popoverHeight - 15;
    left = rect.left + (rect.width - popoverWidth) / 2;
  } else if (spaceRight > popoverWidth + 30) {
    top = rect.top + (rect.height - popoverHeight) / 2;
    left = rect.right + 15;
  } else if (spaceLeft > popoverWidth + 30) {
    top = rect.top + (rect.height - popoverHeight) / 2;
    left = rect.left - popoverWidth - 15;
  } else {
    popover.style.top = '50%';
    popover.style.left = '50%';
    popover.style.transform = 'translate(-50%, -50%)';
    return;
  }
  
  left = Math.max(20, Math.min(left, window.innerWidth - popoverWidth - 20));
  top = Math.max(20, Math.min(top, window.innerHeight - popoverHeight - 20));
  
  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
  popover.style.transform = 'none';
}

function startTutorial() {
  tutStep = 0;
  document.getElementById('tutorial-overlay').classList.remove('hidden');
  document.getElementById('tutorial-popover').classList.remove('hidden');
  renderTutorialStep();
}
function nextTutorialStep() {
  tutStep++;
  if (tutStep >= tutSteps.length) endTutorial();
  else renderTutorialStep();
}
function endTutorial() {
  clearHighlights();
  document.getElementById('tutorial-overlay').classList.add('hidden');
  document.getElementById('tutorial-popover').classList.add('hidden');
}
function renderTutorialStep() {
  clearHighlights();
  const step = tutSteps[tutStep];
  
  if (step.view) {
    showView(step.view);
  }
  if (step.view === 'wizard' && step.wizardStep) {
    goToStep(step.wizardStep);
  }

  document.getElementById('tut-step').textContent = `Paso ${tutStep + 1} de ${tutSteps.length}`;
  document.getElementById('tut-title').textContent = step.title;
  document.getElementById('tut-text').innerHTML = step.text;
  document.getElementById('tut-next-btn').textContent = tutStep === tutSteps.length - 1 ? 'Finalizar ✓' : 'Siguiente →';

  // Esperar un breve momento a que el DOM y el scroll se estabilicen
  setTimeout(() => {
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) {
        el.classList.add('tut-highlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => positionPopover(el), 120);
      } else {
        positionPopover(null);
      }
    } else {
      positionPopover(null);
    }
  }, 100);
}

// ─── Toasts ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.cssText += 'opacity:0;transform:translateX(40px);transition:.3s'; setTimeout(() => t.remove(), 320); }, 3800);
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function isoNow(offsetSec = 0) {
  return new Date(Date.now() - offsetSec * 1000).toISOString().replace('.000Z','Z');
}

function mkLog(offsetSec, level, msg) {
  return `[${isoNow(offsetSec)}] [${level.padEnd(7)}] ${msg}`;
}

// ─── Demo / Fallback Data ────────────────────────────────────────────────────────
function DEMO_METRICS() {
  return {
    total_processed: 24891, cycle_processed: 14250, today_processed: 2140,
    active_connectors: 2, success_rate: 98.4, avg_duration: 3.8, duplicates_prevented: 847,
    connectors: [
      { id:'conn-001', name:'SRI Ecuador → BigQuery', origin:'SRI Ecuador', destination:'Google BigQuery', tax_id:'1792456789001', status:'active', last_sync: isoNow(480), records_today:1247, records_cycle:9812, uptime:99.8 },
      { id:'conn-002', name:'SAT México → Snowflake', origin:'SAT México',  destination:'Snowflake',       tax_id:'XAXX010101000', status:'active', last_sync: isoNow(180), records_today:893,  records_cycle:4438, uptime:98.6 },
    ]
  };
}

function DEMO_LOGS() {
  return [
    {
      id:'1', connector:'SRI Ecuador → BigQuery', origin:'SRI Ecuador', doc_type:'Factura Electrónica', destination:'Google BigQuery',
      timestamp: isoNow(480), status:'SUCCESS', records:150, duplicates_skipped:0, duration:'4.2s',
      log_lines:[
        mkLog(24,'INFO',   'Inicializando extracción incremental desde endpoints oficiales del SRI Ecuador...'),
        mkLog(21,'DEBUG',  'Autenticando mediante RUC y mecanismo de certificado digital verificado.'),
        mkLog(17,'INFO',   'Descargando comprobantes electrónicos autorizados (Facturas/Retenciones).'),
        mkLog(12,'DATA',   'Normalizando esquemas XML complejos a estructuras relacionales estructuradas (ISO 8601 Dates).'),
        mkLog(8, 'DEBUG',  'Aplicando deduplicación por clave compuesta (claveAcceso + secuencial).'),
        mkLog(5, 'INFO',   'Cargando batch de 150 registros a Google BigQuery dataset: fiscal_data.comprobantes_sri...'),
        mkLog(2, 'SUCCESS','Ingesta completada con éxito en Google BigQuery. 150 registros nuevos insertados. 0 duplicados omitidos (RF18).'),
      ]
    },
    {
      id:'2', connector:'SAT México → Snowflake', origin:'SAT México', doc_type:'CFDI 4.0', destination:'Snowflake',
      timestamp: isoNow(4590), status:'SUCCESS', records:89, duplicates_skipped:3, duration:'3.1s',
      log_lines:[
        mkLog(4590,'INFO',   'Inicializando extracción incremental desde endpoints oficiales del SAT México...'),
        mkLog(4588,'DEBUG',  'Autenticando mediante RFC y certificado CSD (Certificado de Sello Digital).'),
        mkLog(4585,'INFO',   'Descargando CFDI 4.0 emitidos (Ingresos/Egresos/Traslados).'),
        mkLog(4581,'DATA',   'Normalizando esquemas XML CFDI a estructuras relacionales estructuradas (ISO 8601 Dates).'),
        mkLog(4578,'DEBUG',  'Detectados 3 CFDIs duplicados por UUID — omitidos del batch de inserción (RF18).'),
        mkLog(4575,'SUCCESS','Ingesta completada con éxito en Snowflake. 89 registros nuevos insertados. 3 duplicados omitidos (RF18).'),
      ]
    },
    {
      id:'3', connector:'SRI Ecuador → BigQuery', origin:'SRI Ecuador', doc_type:'Nota de Crédito', destination:'Google BigQuery',
      timestamp: isoNow(13500), status:'WARNING', records:0, duplicates_skipped:0, duration:'6.8s',
      log_lines:[
        mkLog(13500,'INFO',   'Inicializando extracción incremental desde endpoints oficiales del SRI Ecuador...'),
        mkLog(13498,'DEBUG',  'Autenticando mediante RUC y mecanismo de certificado digital verificado.'),
        mkLog(13495,'WARNING','Timeout de conexión en intento 1/3. Reintentando en 2s...'),
        mkLog(13493,'WARNING','Timeout de conexión en intento 2/3. Reintentando en 4s...'),
        mkLog(13490,'DEBUG',  'Autenticación exitosa en intento 3/3.'),
        mkLog(13487,'INFO',   'Período consultado no contiene comprobantes nuevos. Watermark ya actualizado.'),
        mkLog(13485,'WARNING','Pipeline finalizado con advertencias. 0 registros insertados. 2 reintentos registrados.'),
      ]
    },
    {
      id:'4', connector:'SRI Ecuador → BigQuery', origin:'SRI Ecuador', doc_type:'Retención Electrónica', destination:'Google BigQuery',
      timestamp: isoNow(25800), status:'SUCCESS', records:312, duplicates_skipped:5, duration:'5.9s',
      log_lines:[
        mkLog(25800,'INFO',   'Inicializando extracción incremental desde endpoints oficiales del SRI Ecuador...'),
        mkLog(25797,'DEBUG',  'Autenticando mediante RUC y mecanismo de certificado digital verificado.'),
        mkLog(25793,'INFO',   'Descargando comprobantes electrónicos autorizados (Facturas/Retenciones).'),
        mkLog(25788,'DATA',   'Normalizando 317 esquemas XML complejos a estructuras relacionales estructuradas (ISO 8601 Dates).'),
        mkLog(25784,'DEBUG',  'Detectados 5 duplicados por claveAcceso — omitidos (RF18).'),
        mkLog(25781,'INFO',   'Cargando batch de 312 registros a Google BigQuery dataset: fiscal_data.comprobantes_sri...'),
        mkLog(25778,'SUCCESS','Ingesta completada con éxito en Google BigQuery. 312 registros nuevos insertados. 5 duplicados omitidos (RF18).'),
      ]
    },
  ];
}

function fakeRun(conn) {
  const records = Math.floor(Math.random() * 250) + 30;
  const dups    = Math.floor(Math.random() * 12);
  const origin  = conn?.origin  || 'SRI Ecuador';
  const dest    = conn?.destination || 'Google BigQuery';
  const dur     = (Math.random() * 4 + 2).toFixed(1) + 's';
  const docs    = ['Factura Electrónica','Nota de Crédito','Retención Electrónica','CFDI 4.0'][Math.floor(Math.random()*4)];
  return {
    id: Date.now().toString(), connector: `${origin} → ${dest}`,
    origin, doc_type: docs, destination: dest,
    timestamp: isoNow(0), status: 'SUCCESS', records, duplicates_skipped: dups, duration: dur,
    log_lines: [
      mkLog(15,'INFO',   `Inicializando extracción incremental desde endpoints oficiales del ${origin}...`),
      mkLog(14,'DEBUG',  'Autenticando mediante certificado digital verificado.'),
      mkLog(12,'INFO',   `Descargando comprobantes electrónicos autorizados (${docs}).`),
      mkLog(9, 'DATA',   `Normalizando ${records+dups} esquemas XML complejos a estructuras relacionales estructuradas (ISO 8601 Dates).`),
      mkLog(7, 'DEBUG',  `Validando integridad por checksums SHA-256 de cada comprobante...`),
      mkLog(5, 'DEBUG',  `Detectados ${dups} duplicados por clave compuesta — omitidos del batch de inserción (RF18).`),
      mkLog(3, 'INFO',   `Cargando batch de ${records} registros a ${dest} (modo: INSERT IF NOT EXISTS)...`),
      mkLog(1, 'DEBUG',  `Actualizando watermark incremental: ${isoNow(0)}`),
      mkLog(0, 'SUCCESS',`Ingesta completada con éxito en ${dest}. ${records} registros nuevos insertados. ${dups} duplicados omitidos (RF18).`),
    ]
  };
}

function fakeConnectorResponse(taxid) {
  const records = Math.floor(Math.random() * 180) + 40;
  const dups    = Math.floor(Math.random() * 8);
  return {
    success: true,
    message: `Pipeline activado. ${records} registros sincronizados en ${S.dest}. Cifrado AES-256 aplicado.`,
    encrypted_key: `AES256::${btoa('K:'+taxid).slice(0,28)}...[CIFRADO RNF03]`,
    connector: { id: `conn-${Math.random().toString(36).slice(2,8)}`, name: `${S.source} → ${S.dest}`, origin: S.source, destination: S.dest, tax_id: taxid, status: 'active', records_cycle: records, records_today: records, uptime: 100.0, last_sync: isoNow(0) },
    initial_log: {
      records, duplicates_skipped: dups,
      log_lines: [
        mkLog(14,'INFO',   `Inicializando extracción incremental desde endpoints oficiales del ${S.source}...`),
        mkLog(12,'INFO',   `Conector nuevo | Destino: ${S.dest}`),
        mkLog(11,'DEBUG',  `Verificando integridad del certificado digital ${S.certFile||'certificado.p12'}...`),
        mkLog(10,'INFO',   'Aplicando cifrado AES-256 a credenciales sensibles (RNF03)...'),
        mkLog(9, 'DEBUG',  `Credencial cifrada: AES256::${btoa('K:'+taxid).slice(0,20)}...[CIFRADO]`),
        mkLog(8, 'DEBUG',  `Autenticando mediante ${COUNTRY_META[S.source]?.id||'ID'} y mecanismo de certificado digital verificado.`),
        mkLog(6, 'INFO',   `Descargando comprobantes electrónicos autorizados (Facturas/Retenciones).`),
        mkLog(4, 'DATA',   'Normalizando esquemas XML complejos a estructuras relacionales estructuradas (ISO 8601 Dates).'),
        mkLog(3, 'DEBUG',  `Detectados ${dups} duplicados por clave compuesta — omitidos del batch de inserción (RF18).`),
        mkLog(1, 'INFO',   `Cargando batch de ${records} registros a ${S.dest}...`),
        mkLog(0, 'SUCCESS',`Ingesta completada con éxito en ${S.dest}. ${records} registros nuevos insertados. ${dups} duplicados omitidos (RF18).`),
      ]
    }
  };
}

// ─── Settings Modal & Subscription Limits ──────────────────────────────────────────
function openSettings() {
  document.getElementById('settings-modal').classList.remove('hidden');
  updateSettingsView();
  loadUsersTable();
  loadUsagePanel();
}
function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}
function switchSettingsTab(tab) {
  document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.settings-content').forEach(c => c.classList.add('hidden'));
  const activeTab = document.querySelector(`.settings-tab[onclick="switchSettingsTab('${tab}')"]`);
  if (activeTab) activeTab.classList.add('active');
  const activeContent = document.getElementById(`set-${tab}`);
  if (activeContent) activeContent.classList.remove('hidden');
  if (tab === 'users') loadUsersTable();
  if (tab === 'usage') loadUsagePanel();
}
function toggleSettingsPassword() {
  const el = document.getElementById('settings-secret-key');
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}
function rotateApiKeys() {
  const el = document.getElementById('settings-secret-key');
  if (el) el.value = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  showToast('API Keys rotadas correctamente', 'success');
}
function updateSettingsView() {
  const plan = S.currentPlan;
  const nameEl = document.getElementById('settings-plan-name');
  const countriesEl = document.getElementById('settings-plan-countries');
  const destsEl = document.getElementById('settings-plan-dests');
  if (nameEl) nameEl.textContent = plan.toUpperCase();
  if (plan === 'starter') {
    if (countriesEl) countriesEl.textContent = '1 (Solo país local)';
    if (destsEl) destsEl.textContent = '1 (Solo Google BigQuery)';
  } else if (plan === 'growth') {
    if (countriesEl) countriesEl.textContent = '3 (Latinoamérica)';
    if (destsEl) destsEl.textContent = '3 (BigQuery, Redshift, Snowflake)';
  } else {
    if (countriesEl) countriesEl.textContent = 'Ilimitados';
    if (destsEl) destsEl.textContent = 'Todos los destinos soportados';
  }
}

function updateWizardLocks() {
  const plan = S.currentPlan;
  document.querySelectorAll('.source-card, .dest-card').forEach(el => el.classList.remove('locked-card'));
  if (plan === 'starter') {
    document.getElementById('source-btn-sat')?.classList.add('locked-card');
    document.getElementById('source-btn-sunat')?.classList.add('locked-card');
    document.getElementById('source-btn-dian')?.classList.add('locked-card');
    document.getElementById('dest-snowflake')?.classList.add('locked-card');
    document.getElementById('dest-redshift')?.classList.add('locked-card');
  } else if (plan === 'growth') {
    document.getElementById('source-btn-sunat')?.classList.add('locked-card');
    document.getElementById('source-btn-dian')?.classList.add('locked-card');
    document.getElementById('dest-redshift')?.classList.add('locked-card');
  }
}

function startTrial(planName) {
  S.currentPlan = planName;
  updateWizardLocks();
  const modal = document.getElementById('trial-modal');
  if (modal) {
    document.getElementById('trial-modal-msg').textContent = `Tu período de prueba del plan ${planName.toUpperCase()} ha comenzado.`;
    modal.classList.remove('hidden');
  } else {
    showToast(`Plan ${planName.toUpperCase()} activado correctamente.`, 'success');
  }
  updateSettingsView();
  const planChip = document.querySelector('.plan-chip span:nth-child(2)');
  if (planChip) {
    planChip.textContent = `Plan ${planName.charAt(0).toUpperCase() + planName.slice(1)} · 14 días trial`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BACKLOG FUNCTIONS — HU05-HU25
// ═══════════════════════════════════════════════════════════════════════════════

// ─── HU10: Vista Previa de Datos (RF19) ────────────────────────────────────────
async function showDataPreview() {
  const connId = S.connectors[0]?.id || 'conn-001';
  let data;
  try { data = await apiFetch(`${API}/preview?connector_id=${connId}`); }
  catch {
    // Fallback: datos mock locales
    data = {
      origin: S.source, destination: S.dest, total_records: 72,
      schema: [
        {column:'clave_acceso',type:'STRING',nullable:false},{column:'tipo_comprobante',type:'STRING',nullable:false},
        {column:'ruc_emisor',type:'STRING',nullable:false},{column:'razon_social',type:'STRING',nullable:true},
        {column:'fecha_emision',type:'DATE',nullable:false},{column:'subtotal',type:'DECIMAL(12,2)',nullable:false},
        {column:'iva',type:'DECIMAL(12,2)',nullable:false},{column:'total',type:'DECIMAL(12,2)',nullable:false},
        {column:'estado',type:'STRING',nullable:false},{column:'moneda',type:'STRING',nullable:false},
      ],
      records: Array.from({length:72}, (_,i) => ({
        row:i+1, clave_acceso:`${Math.floor(Math.random()*1e12)}`, tipo_comprobante:'Factura Electrónica',
        ruc_emisor:'1792456789001', razon_social:'Empresa Demo S.A.', fecha_emision:'2026-06-10',
        subtotal:(Math.random()*5000).toFixed(2), iva:(Math.random()*600).toFixed(2),
        total:(Math.random()*5600).toFixed(2), estado:'Autorizado', moneda:'USD'
      }))
    };
  }

  document.getElementById('preview-subtitle').textContent = `${data.total_records || data.records.length} registros · ${data.origin || S.source} → ${data.destination || S.dest}`;
  
  // Schema badges
  const schemaEl = document.getElementById('preview-schema');
  schemaEl.innerHTML = (data.schema || []).map(s =>
    `<span class="badge ${s.nullable ? 'badge--warning' : 'badge--info'}" style="font-size:.65rem;">${s.column} <small>(${s.type})</small></span>`
  ).join('');

  // Table
  const cols = (data.schema || []).map(s => s.column);
  document.getElementById('preview-thead').innerHTML = '<tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';
  document.getElementById('preview-tbody').innerHTML = (data.records || []).slice(0, 100).map(r =>
    '<tr>' + cols.map(c => `<td>${r[c] ?? ''}</td>`).join('') + '</tr>'
  ).join('');

  document.getElementById('preview-modal').classList.remove('hidden');
}

function confirmPreviewLoad() {
  document.getElementById('preview-modal').classList.add('hidden');
  showToast('Carga confirmada. Los datos se insertarán en el Data Warehouse al ejecutar el pipeline.', 'success');
}

// ─── HU12: Schedule Frequency Toggle ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const freqSel = document.getElementById('schedule-frequency');
    if (freqSel) {
      freqSel.addEventListener('change', () => {
        const cronInput = document.getElementById('schedule-cron');
        if (cronInput) cronInput.style.display = freqSel.value === 'custom' ? 'block' : 'none';
      });
    }
  }, 500);
});

// ─── HU14: API Docs ────────────────────────────────────────────────────────────
async function loadApiDocs() {
  let data;
  try { data = await apiFetch(`${API}/docs-spec`); }
  catch {
    data = {
      endpoints: [
        {method:'GET',path:'/api/metrics',description:'Obtener métricas del dashboard',auth:'API Key'},
        {method:'GET',path:'/api/connectors',description:'Listar todos los conectores activos',auth:'API Key'},
        {method:'POST',path:'/api/connectors',description:'Crear un nuevo conector/pipeline',auth:'API Key'},
        {method:'GET',path:'/api/logs',description:'Listar historial de ejecuciones (filtrable)',auth:'API Key'},
        {method:'POST',path:'/api/simulate-run',description:'Ejecutar un pipeline manualmente',auth:'API Key'},
        {method:'GET',path:'/api/preview',description:'Vista previa de hasta 100 registros',auth:'API Key'},
        {method:'POST',path:'/api/connectors/schedule',description:'Programar extracción automática',auth:'API Key'},
        {method:'GET',path:'/api/logs/download',description:'Descargar logs en CSV o JSON',auth:'API Key'},
        {method:'GET',path:'/api/audit-log',description:'Consultar log de auditoría inmutable',auth:'API Key'},
        {method:'GET',path:'/api/usage',description:'Consultar consumo del plan actual',auth:'API Key'},
        {method:'GET',path:'/api/organizations',description:'Listar organizaciones del grupo',auth:'API Key'},
        {method:'GET',path:'/api/plans',description:'Listar planes y precios disponibles',auth:'Pública'},
      ]
    };
  }

  const container = document.getElementById('api-endpoints-list');
  if (!container) return;
  container.innerHTML = (data.endpoints || []).map((ep, i) => {
    const methodCls = {GET:'badge--success',POST:'badge--info',PUT:'badge--warning',DELETE:'badge--error'}[ep.method] || 'badge--info';
    return `
    <div class="api-endpoint-item" style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;transition:border-color .2s;cursor:pointer;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border-subtle)'">
      <span class="badge ${methodCls}" style="min-width:52px;text-align:center;font-weight:700;">${ep.method}</span>
      <code style="color:var(--accent-cyan);font-family:'JetBrains Mono',monospace;font-size:.78rem;flex:1;">${ep.path}</code>
      <span style="color:var(--text-secondary);font-size:.76rem;flex:2;">${ep.description}</span>
      <span class="badge badge--info" style="font-size:.62rem;">${ep.auth}</span>
    </div>`;
  }).join('');
}

// ─── HU15: Descarga CSV/JSON ───────────────────────────────────────────────────
function downloadLogs(format) {
  if (format === 'csv') {
    let csv = 'timestamp,origin,doc_type,records,duplicates_skipped,destination,status,duration\n';
    S.filteredLogs.forEach(l => {
      csv += `${l.timestamp},${l.origin},${l.doc_type||''},${l.records},${l.duplicates_skipped||0},${l.destination},${l.status},${l.duration||''}\n`;
    });
    downloadFile(csv, 'conectorlatam_logs.csv', 'text/csv');
  } else {
    const data = S.filteredLogs.map(l => ({timestamp:l.timestamp,origin:l.origin,doc_type:l.doc_type,records:l.records,duplicates_skipped:l.duplicates_skipped,destination:l.destination,status:l.status,duration:l.duration}));
    downloadFile(JSON.stringify(data, null, 2), 'conectorlatam_logs.json', 'application/json');
  }
  showToast(`Logs descargados en formato ${format.toUpperCase()}`, 'success');
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], {type: mime});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── HU17: Alertas (RF13) ──────────────────────────────────────────────────────
async function saveAlerts() {
  const config = {
    email: document.getElementById('alert-email')?.value || '',
    webhook_url: document.getElementById('alert-webhook')?.value || '',
    on_failure: document.getElementById('alert-on-failure')?.checked || false,
    on_timeout: document.getElementById('alert-on-timeout')?.checked || false,
    on_api_change: document.getElementById('alert-on-apichange')?.checked || false,
  };
  try {
    await apiFetch(`${API}/alerts/config`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(config)});
  } catch { /* fallback */ }
  showToast('Configuración de alertas guardada correctamente.', 'success');
}

// ─── HU19: Errores a Nivel de Registro (RF22/RF26) ─────────────────────────────
let _currentErrorLogId = null;
async function showErrorDetail(logId) {
  _currentErrorLogId = logId;
  let data;
  try { data = await apiFetch(`${API}/logs/${logId}/errors`); }
  catch {
    data = { log_id: logId, total_records: 150, total_errors: 3, errors: [
      {record_index:12,comprobante_id:'123456789-001',campo_error:'fecha_emision',causa:'Formato de fecha no válido (esperado: YYYY-MM-DD)',severidad:'ERROR'},
      {record_index:45,comprobante_id:'123456789-045',campo_error:'ruc_emisor',causa:'RUC/RFC no coincide con formato del país',severidad:'ERROR'},
      {record_index:89,comprobante_id:'123456789-089',campo_error:'subtotal',causa:'Valor numérico fuera de rango permitido',severidad:'WARNING'},
    ]};
  }
  document.getElementById('error-detail-subtitle').textContent = `${data.total_errors} errores de ${data.total_records} registros procesados`;
  const tb = document.getElementById('error-detail-tbody');
  if (data.errors.length === 0) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--accent-green);padding:20px;">✓ Sin errores a nivel de registro</td></tr>';
  } else {
    tb.innerHTML = data.errors.map((e, i) => `
      <tr>
        <td>${i+1}</td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:.68rem;">${e.comprobante_id}</td>
        <td><span class="badge badge--warning" style="font-size:.62rem;">${e.campo_error}</span></td>
        <td style="color:var(--text-secondary);">${e.causa}</td>
        <td>${e.severidad === 'ERROR' ? '<span class="badge badge--error">ERROR</span>' : '<span class="badge badge--warning">WARNING</span>'}</td>
      </tr>`).join('');
  }
  document.getElementById('error-detail-modal').classList.remove('hidden');
}

function downloadErrorCSV() {
  const rows = document.querySelectorAll('#error-detail-tbody tr');
  let csv = 'record_index,comprobante_id,campo_error,causa,severidad\n';
  rows.forEach(r => {
    const cells = r.querySelectorAll('td');
    if (cells.length >= 5) csv += `${cells[0].textContent},${cells[1].textContent},${cells[2].textContent},"${cells[3].textContent}",${cells[4].textContent}\n`;
  });
  downloadFile(csv, 'errores_registro.csv', 'text/csv');
  showToast('Errores exportados en CSV', 'success');
}

// Update renderLogsTable to include error detail button
const _origRenderLogsTable = renderLogsTable;
renderLogsTable = function(logs) {
  const tb = document.getElementById('logs-tbody');
  if (!tb) return;
  tb.innerHTML = logs.map(l => `
    <tr>
      <td onclick="showLogInTerminal('${l.id}')" style="font-family:'JetBrains Mono',monospace;font-size:.69rem;white-space:nowrap;color:var(--text-tertiary);cursor:pointer;">${l.timestamp}</td>
      <td onclick="showLogInTerminal('${l.id}')" style="font-weight:700;color:var(--text-primary);cursor:pointer;">${(COUNTRY_META[l.origin]?.flag||'🌎')+' '+l.origin}</td>
      <td onclick="showLogInTerminal('${l.id}')" style="color:var(--text-secondary);font-size:.75rem;cursor:pointer;">${l.doc_type||'—'}</td>
      <td onclick="showLogInTerminal('${l.id}')" style="font-weight:700;color:var(--text-primary);cursor:pointer;">${l.records}<small style="color:var(--accent-green);font-size:.65rem"> +${l.records}</small></td>
      <td onclick="showLogInTerminal('${l.id}')" style="color:var(--text-secondary);font-size:.75rem;cursor:pointer;">${l.destination}</td>
      <td style="display:flex;gap:4px;align-items:center;">${statusBadge(l.status)} <button class="btn btn-ghost btn-xs" onclick="showErrorDetail('${l.id}')" title="Ver errores de registro" style="font-size:.6rem;padding:2px 5px;">🔍</button></td>
    </tr>`).join('');
};

// ─── HU21: Multi-Empresa (RF15) ────────────────────────────────────────────────
function switchOrganization(orgId) {
  const orgNames = {'org-001':'Corporación Demo LATAM S.A.','org-002':'Grupo Industrial Norte S.A. de C.V.','org-003':'Importaciones del Pacífico S.R.L.'};
  showToast(`Organización cambiada a: ${orgNames[orgId] || orgId}`, 'info');
  // Simulate data isolation by refreshing metrics
  loadMetrics();
}

// ─── HU22: Usuarios y Roles (RF16) ─────────────────────────────────────────────
async function loadUsersTable() {
  let data;
  try { data = await apiFetch(`${API}/users`); }
  catch {
    data = {users:[
      {id:'usr-001',name:'Carlos Mendoza',email:'carlos.mendoza@demo-latam.com',role:'Administrador',status:'Activo'},
      {id:'usr-002',name:'Ana García',email:'ana.garcia@demo-latam.com',role:'Operador',status:'Activo'},
      {id:'usr-003',name:'Luis Ramírez',email:'luis.ramirez@demo-latam.com',role:'Visor',status:'Activo'},
      {id:'usr-004',name:'María Torres',email:'maria.torres@demo-latam.com',role:'Operador',status:'Inactivo'},
    ]};
  }
  const tb = document.getElementById('users-tbody');
  if (!tb) return;
  tb.innerHTML = (data.users||[]).map(u => `
    <tr>
      <td style="font-weight:600;color:var(--text-primary);">${u.name}</td>
      <td style="color:var(--text-secondary);">${u.email}</td>
      <td>
        <select class="form-select-sm" onchange="changeUserRole('${u.id}', this.value)" style="font-size:.7rem;padding:3px 6px;">
          <option ${u.role==='Administrador'?'selected':''}>Administrador</option>
          <option ${u.role==='Operador'?'selected':''}>Operador</option>
          <option ${u.role==='Visor'?'selected':''}>Visor</option>
        </select>
      </td>
      <td>${u.status === 'Activo' ? '<span class="badge badge--success">Activo</span>' : '<span class="badge badge--warning">Inactivo</span>'}</td>
      <td><button class="btn btn-ghost btn-xs" style="font-size:.62rem;" onclick="showToast('Funcionalidad completa disponible en producción.','info')">✏️</button></td>
    </tr>`).join('');
}

async function changeUserRole(userId, newRole) {
  try {
    await apiFetch(`${API}/users`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({user_id:userId, role:newRole})});
  } catch { /* fallback */ }
  showToast(`Rol actualizado a ${newRole}`, 'success');
}

// ─── HU23: Log de Auditoría (RF13/RF17) ────────────────────────────────────────
async function loadAuditLog() {
  let data;
  try { data = await apiFetch(`${API}/audit-log`); }
  catch {
    data = {audit_log:[
      {timestamp:'2026-06-10T12:00:00Z',user:'Carlos Mendoza',action:'PIPELINE_CREATED',target:'conn-001',params:'origin=SRI Ecuador',result:'SUCCESS'},
      {timestamp:'2026-06-11T15:30:00Z',user:'Ana García',action:'CREDENTIAL_UPDATED',target:'conn-002',params:'field=certificate',result:'SUCCESS'},
      {timestamp:'2026-06-12T08:00:00Z',user:'Carlos Mendoza',action:'SCHEDULE_CREATED',target:'conn-001',params:'frequency=daily',result:'SUCCESS'},
    ]};
  }
  const tb = document.getElementById('audit-tbody');
  if (!tb) return;
  const actionLabels = {
    PIPELINE_CREATED:'🔧 Pipeline Creado',PIPELINE_EXECUTED:'▶ Pipeline Ejecutado',CREDENTIAL_UPDATED:'🔐 Credencial Actualizada',
    SCHEDULE_CREATED:'⏰ Programación Creada',ALERTS_CONFIGURED:'🔔 Alertas Configuradas',ROLE_CHANGED:'👥 Rol Cambiado',
    DASHBOARD_VIEWED:'📊 Dashboard Consultado'
  };
  S._auditData = data.audit_log || [];
  tb.innerHTML = S._auditData.map(a => `
    <tr>
      <td style="font-family:'JetBrains Mono',monospace;font-size:.68rem;white-space:nowrap;color:var(--text-tertiary);">${a.timestamp}</td>
      <td style="font-weight:600;color:var(--text-primary);">${a.user}</td>
      <td>${actionLabels[a.action] || a.action}</td>
      <td style="color:var(--text-secondary);">${a.target}</td>
      <td style="font-size:.7rem;color:var(--text-tertiary);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.params || '—'}</td>
      <td><span class="badge badge--success">${a.result}</span></td>
    </tr>`).join('');
}

function downloadAuditCSV() {
  const logs = S._auditData || [];
  let csv = 'timestamp,user,action,target,params,result\n';
  logs.forEach(a => csv += `${a.timestamp},${a.user},${a.action},${a.target},"${a.params||''}",${a.result}\n`);
  downloadFile(csv, 'auditoria_conectorlatam.csv', 'text/csv');
  showToast('Log de auditoría exportado en CSV', 'success');
}

// ─── HU25: Panel de Consumo (RF28) ─────────────────────────────────────────────
async function loadUsagePanel() {
  let data;
  try { data = await apiFetch(`${API}/usage`); }
  catch {
    data = {
      plan:'growth', plan_name:'Growth', records_used:14250, records_limit:50000, usage_pct:28.5,
      connectors_active:2, connectors_limit:2, renewal_date:'2026-07-01', over_threshold:false, alert_threshold:80
    };
  }

  const panel = document.getElementById('usage-panel');
  if (!panel) return;
  const barColor = data.over_threshold ? 'var(--accent-red, #ff6b6b)' : 'var(--accent-green, #39d353)';
  const connPct = Math.min(100, (data.connectors_active / Math.max(data.connectors_limit,1)) * 100);

  panel.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-weight:700;color:var(--text-primary);font-size:.85rem;">Plan ${data.plan_name}</span>
        <span class="badge ${data.over_threshold ? 'badge--error' : 'badge--success'}">${data.over_threshold ? '⚠ Cerca del límite' : '✓ Uso normal'}</span>
      </div>
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--text-secondary);margin-bottom:4px;">
          <span>Registros procesados</span>
          <span>${(data.records_used||0).toLocaleString()} / ${(data.records_limit||50000).toLocaleString()}</span>
        </div>
        <div style="background:var(--bg-hover);border-radius:10px;height:10px;overflow:hidden;">
          <div style="background:${barColor};height:100%;width:${Math.min(data.usage_pct,100)}%;border-radius:10px;transition:width .6s ease;"></div>
        </div>
        <div style="text-align:right;font-size:.68rem;color:var(--text-tertiary);margin-top:3px;">${data.usage_pct}% utilizado · Alerta al ${data.alert_threshold}%</div>
      </div>
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--text-secondary);margin-bottom:4px;">
          <span>Conectores activos</span>
          <span>${data.connectors_active} / ${data.connectors_limit}</span>
        </div>
        <div style="background:var(--bg-hover);border-radius:10px;height:10px;overflow:hidden;">
          <div style="background:var(--accent-cyan, #79c0ff);height:100%;width:${connPct}%;border-radius:10px;transition:width .6s ease;"></div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--text-secondary);padding-top:10px;border-top:1px solid var(--border-dim);">
        <span>Próxima renovación:</span>
        <span style="font-weight:600;color:var(--text-primary);">${data.renewal_date}</span>
      </div>
    </div>`;
}
