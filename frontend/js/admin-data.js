/* ═══════════════════════════════════════════════════════════════════
   ConectorLatam — Admin Panel · Datos Ficticios y Funciones de Render
   Cubre: Estado APIs, Alertas, Métricas Globales, Clientes, Usuarios,
          Facturación, Config. Planes, Auditoría
   ═══════════════════════════════════════════════════════════════════ */

// ─── Admin Clock ────────────────────────────────────────────────────────────────
(function startAdminClock() {
  function tick() {
    const el = document.getElementById('admin-header-time');
    if (el) el.textContent = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
  }
  tick();
  setInterval(tick, 1000);
})();

// ════════════════════════════════════════════════════════════════════════════════
// DATOS FICTICIOS
// ════════════════════════════════════════════════════════════════════════════════

function ADMIN_API_HEALTH() {
  return [
    {
      id: 'sri-ec', name: 'SRI Ecuador', flag: '🇪🇨', country: 'Ecuador',
      endpoint: 'https://sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantes',
      status: 'ONLINE', latency_ms: 312, uptime_30d: 99.7, last_check: isoNow(45),
      version: 'v2.1.0', cert_valid_until: '2027-03-15', incident_count: 0,
      total_calls_today: 14820, success_calls_today: 14790, error_calls_today: 30,
    },
    {
      id: 'sat-mx', name: 'SAT México', flag: '🇲🇽', country: 'México',
      endpoint: 'https://cfdi.sat.gob.mx/cfd/ConsultaCFDI/ConsultaCFDIService',
      status: 'DEGRADED', latency_ms: 1840, uptime_30d: 97.2, last_check: isoNow(30),
      version: 'v3.3.3', cert_valid_until: '2026-11-30', incident_count: 1,
      total_calls_today: 9340, success_calls_today: 8950, error_calls_today: 390,
    },
    {
      id: 'sunat-pe', name: 'SUNAT Perú', flag: '🇵🇪', country: 'Perú',
      endpoint: 'https://e-factura.sunat.gob.pe/ol-ti-itcpe/billService',
      status: 'ONLINE', latency_ms: 490, uptime_30d: 98.9, last_check: isoNow(60),
      version: 'v1.8.2', cert_valid_until: '2026-09-22', incident_count: 0,
      total_calls_today: 4210, success_calls_today: 4185, error_calls_today: 25,
    },
    {
      id: 'dian-co', name: 'DIAN Colombia', flag: '🇨🇴', country: 'Colombia',
      endpoint: 'https://catalogo-vpfe.dian.gov.co/WcfDianCustomerServices.svc',
      status: 'ONLINE', latency_ms: 275, uptime_30d: 99.5, last_check: isoNow(20),
      version: 'v4.1.0', cert_valid_until: '2027-01-08', incident_count: 0,
      total_calls_today: 6670, success_calls_today: 6660, error_calls_today: 10,
    },
  ];
}

function ADMIN_INCIDENTS() {
  return [
    {
      id: 'inc-001', api: 'SAT México', flag: '🇲🇽', severity: 'WARNING',
      title: 'Latencia elevada en endpoint CFDI',
      description: 'El endpoint de consulta de CFDI presenta latencias superiores a 1.5s desde las 14:30 UTC. Se están ejecutando 3 reintentos automáticos por request. Se monitorea continuamente.',
      started_at: isoNow(5400), affected_clients: 12, status: 'INVESTIGATING',
    },
  ];
}

function ADMIN_ALERTS() {
  return [
    {
      id: 'alrt-001', severity: 'ERROR', api: 'SAT México', flag: '🇲🇽',
      title: 'Latencia elevada (> 1.5s) detectada',
      detail: 'El endpoint CFDI del SAT México ha registrado latencias de 1840ms en el último ciclo de verificación. Se han disparado 3 alertas a los clientes afectados.',
      timestamp: isoNow(5400), acknowledged: false,
    },
    {
      id: 'alrt-002', severity: 'WARNING', api: 'SUNAT Perú', flag: '🇵🇪',
      title: 'Certificado TLS próximo a vencer',
      detail: 'El certificado TLS del endpoint de SUNAT Perú vence el 2026-09-22 (en 98 días). Se recomienda renovar antes del 2026-09-08.',
      timestamp: isoNow(18000), acknowledged: false,
    },
    {
      id: 'alrt-003', severity: 'INFO', api: 'SRI Ecuador', flag: '🇪🇨',
      title: 'Mantenimiento programado SRI',
      detail: 'El SRI Ecuador ha anunciado una ventana de mantenimiento el 2026-06-20 de 02:00 a 04:00 UTC. Los pipelines se pausarán automáticamente.',
      timestamp: isoNow(86400), acknowledged: true,
    },
  ];
}

function ADMIN_GLOBAL_METRICS() {
  return {
    total_organizations: 47,
    active_subscriptions: 42,
    mrr_usd: 14830,
    arr_usd: 177960,
    total_records_processed: 4218750,
    records_this_month: 312480,
    pipelines_active: 89,
    avg_success_rate: 98.1,
    avg_latency_ms: 479,
    churn_rate: 2.1,
    nps_score: 74,
    revenue_by_plan: [
      { plan: 'Starter', clients: 18, mrr: 2682, color: '#6366f1' },
      { plan: 'Growth',  clients: 21, mrr: 6279, color: '#a855f7' },
      { plan: 'Multi-LATAM', clients: 8, mrr: 3992, color: '#06b6d4' },
      { plan: 'Trial',  clients: 5,  mrr: 0,    color: '#64748b' },
    ],
    api_calls_by_country: [
      { country: 'SRI Ecuador',    calls: 1482000, pct: 38.2 },
      { country: 'SAT México',     calls: 1124000, pct: 29.0 },
      { country: 'DIAN Colombia',  calls: 712000,  pct: 18.4 },
      { country: 'SUNAT Perú',     calls: 557000,  pct: 14.4 },
    ],
  };
}

function ADMIN_CLIENTS() {
  return [
    { id:'org-001', name:'Corporación Demo LATAM S.A.',       country:'🇪🇨 Ecuador',  plan:'Multi-LATAM', pipelines:4, records_cycle:48320, users:8, status:'ACTIVE',  since:'2025-09-01' },
    { id:'org-002', name:'Grupo Industrial Norte S.A. de C.V.',country:'🇲🇽 México',   plan:'Growth',     pipelines:2, records_cycle:21480, users:5, status:'ACTIVE',  since:'2025-11-15' },
    { id:'org-003', name:'Importaciones del Pacífico S.R.L.', country:'🇵🇪 Perú',    plan:'Starter',    pipelines:1, records_cycle:8320,  users:3, status:'ACTIVE',  since:'2026-01-10' },
    { id:'org-004', name:'Constructora Andina S.A.S.',        country:'🇨🇴 Colombia', plan:'Growth',     pipelines:2, records_cycle:17640, users:4, status:'ACTIVE',  since:'2025-12-01' },
    { id:'org-005', name:'Fintech Pago Seguro S.A.',          country:'🇪🇨 Ecuador',  plan:'Growth',     pipelines:2, records_cycle:31820, users:6, status:'ACTIVE',  since:'2026-02-20' },
    { id:'org-006', name:'Distribuidora El Progreso Ltda.',   country:'🇨🇴 Colombia', plan:'Starter',    pipelines:1, records_cycle:5810,  users:2, status:'TRIAL',   since:'2026-06-01' },
    { id:'org-007', name:'TechSolutions CFDI S. de R.L.',     country:'🇲🇽 México',   plan:'Multi-LATAM', pipelines:3, records_cycle:29140, users:7, status:'ACTIVE',  since:'2025-10-18' },
    { id:'org-008', name:'Aurex Mining Group S.A.',           country:'🇵🇪 Perú',    plan:'Starter',    pipelines:1, records_cycle:4230,  users:2, status:'ACTIVE',  since:'2026-03-05' },
    { id:'org-009', name:'LogiTrack Express SAS',             country:'🇨🇴 Colombia', plan:'Growth',     pipelines:2, records_cycle:12870, users:4, status:'ACTIVE',  since:'2026-01-22' },
    { id:'org-010', name:'Exportadora Costa Verde S.A.',      country:'🇪🇨 Ecuador',  plan:'Starter',    pipelines:1, records_cycle:3940,  users:2, status:'SUSPENDED', since:'2025-08-14' },
    { id:'org-011', name:'Consultora Digital MXN S.C.',       country:'🇲🇽 México',   plan:'Growth',     pipelines:2, records_cycle:18950, users:5, status:'ACTIVE',  since:'2025-10-30' },
    { id:'org-012', name:'Inversiones Pacífico Norte S.A.',   country:'🇵🇪 Perú',    plan:'Multi-LATAM', pipelines:4, records_cycle:39120, users:9, status:'ACTIVE',  since:'2025-07-19' },
  ];
}

function ADMIN_USERS() {
  return [
    { id:'usr-001', name:'Carlos Mendoza',   email:'c.mendoza@demo-latam.com',  role:'Admin',    org:'Corporación Demo LATAM S.A.',        plan:'Multi-LATAM', last_login: isoNow(1800),  status:'ACTIVE' },
    { id:'usr-002', name:'Ana García',       email:'a.garcia@demo-latam.com',   role:'Operator', org:'Corporación Demo LATAM S.A.',        plan:'Multi-LATAM', last_login: isoNow(7200),  status:'ACTIVE' },
    { id:'usr-003', name:'Pedro Ramírez',    email:'p.ramirez@gnorte.mx',       role:'Admin',    org:'Grupo Industrial Norte S.A. de C.V.', plan:'Growth',      last_login: isoNow(3600),  status:'ACTIVE' },
    { id:'usr-004', name:'Laura Torres',     email:'l.torres@gnorte.mx',        role:'Viewer',   org:'Grupo Industrial Norte S.A. de C.V.', plan:'Growth',      last_login: isoNow(28800), status:'ACTIVE' },
    { id:'usr-005', name:'José Herrera',     email:'j.herrera@pacífico.pe',     role:'Admin',    org:'Importaciones del Pacífico S.R.L.',  plan:'Starter',     last_login: isoNow(14400), status:'ACTIVE' },
    { id:'usr-006', name:'Claudia Ríos',     email:'c.rios@andina.co',          role:'Operator', org:'Constructora Andina S.A.S.',         plan:'Growth',      last_login: isoNow(10800), status:'ACTIVE' },
    { id:'usr-007', name:'Miguel Salazar',   email:'m.salazar@fintechps.ec',    role:'Admin',    org:'Fintech Pago Seguro S.A.',           plan:'Growth',      last_login: isoNow(900),   status:'ACTIVE' },
    { id:'usr-008', name:'Valentina Cruz',   email:'v.cruz@techcfdi.mx',        role:'Operator', org:'TechSolutions CFDI S. de R.L.',      plan:'Multi-LATAM', last_login: isoNow(5400),  status:'ACTIVE' },
    { id:'usr-009', name:'Roberto Castillo', email:'r.castillo@logit.co',       role:'Viewer',   org:'LogiTrack Express SAS',              plan:'Growth',      last_login: isoNow(43200), status:'INACTIVE' },
    { id:'usr-010', name:'Gabriela Mora',    email:'g.mora@aurex.pe',           role:'Admin',    org:'Aurex Mining Group S.A.',            plan:'Starter',     last_login: isoNow(86400), status:'ACTIVE' },
  ];
}

function ADMIN_BILLING() {
  return {
    kpis: {
      mrr_usd: 14830, arr_usd: 177960,
      pending_amount: 1490, overdue_amount: 299,
      invoices_this_month: 42, avg_ticket: 353,
    },
    invoices: [
      { id:'INV-2026-0642', org:'Corporación Demo LATAM S.A.',       plan:'Multi-LATAM', amount:499, method:'Stripe · Visa ····4242', status:'PAID',     date:'2026-06-01' },
      { id:'INV-2026-0641', org:'Grupo Industrial Norte S.A. de C.V.',plan:'Growth',     amount:299, method:'PayPal',                  status:'PAID',     date:'2026-06-01' },
      { id:'INV-2026-0640', org:'Importaciones del Pacífico S.R.L.', plan:'Starter',    amount:149, method:'Stripe · MC ····8871',  status:'PAID',     date:'2026-06-01' },
      { id:'INV-2026-0639', org:'Constructora Andina S.A.S.',        plan:'Growth',     amount:299, method:'Stripe · Visa ····9913', status:'PAID',     date:'2026-06-01' },
      { id:'INV-2026-0638', org:'Fintech Pago Seguro S.A.',          plan:'Growth',     amount:299, method:'Stripe · Visa ····3371', status:'PENDING',  date:'2026-06-01' },
      { id:'INV-2026-0637', org:'TechSolutions CFDI S. de R.L.',     plan:'Multi-LATAM', amount:499, method:'Stripe · MC ····5589',  status:'PAID',     date:'2026-06-01' },
      { id:'INV-2026-0636', org:'Inversiones Pacífico Norte S.A.',   plan:'Multi-LATAM', amount:499, method:'Stripe · Visa ····7734', status:'PAID',     date:'2026-06-01' },
      { id:'INV-2026-0635', org:'Exportadora Costa Verde S.A.',      plan:'Starter',    amount:149, method:'PayPal',                  status:'OVERDUE',  date:'2026-05-01' },
      { id:'INV-2026-0634', org:'LogiTrack Express SAS',             plan:'Growth',     amount:299, method:'Stripe · Visa ····2201', status:'PAID',     date:'2026-06-01' },
      { id:'INV-2026-0633', org:'Aurex Mining Group S.A.',           plan:'Starter',    amount:149, method:'Stripe · MC ····6643',  status:'PAID',     date:'2026-06-01' },
      { id:'INV-2026-0632', org:'Distribuidora El Progreso Ltda.',   plan:'Trial',      amount:0,   method:'—',                       status:'TRIAL',    date:'2026-06-01' },
      { id:'INV-2026-0631', org:'Consultora Digital MXN S.C.',       plan:'Growth',     amount:299, method:'Stripe · Visa ····5512', status:'PENDING',  date:'2026-06-01' },
    ],
  };
}

function ADMIN_PLANS_CONFIG() {
  return [
    {
      id:'starter', name:'Starter', icon:'⚡', price_usd:149, margin_pct:65,
      countries_limit:1, destinations_limit:1, records_limit:10000,
      users_limit:3, support:'Email · 48h', sla_pct: 99.0,
      features:['1 País fiscal','1 Destino DWH','Deduplicación RF18','Historial 30 días','Soporte Email'],
    },
    {
      id:'growth', name:'Growth', icon:'📈', price_usd:299, margin_pct:72,
      countries_limit:2, destinations_limit:2, records_limit:50000,
      users_limit:5, support:'Email · 24h + Chat', sla_pct: 99.5,
      features:['2 Países fiscales','2 Destinos DWH','Programación automática RF08','Historial 90 días','Dashboard avanzado','Chat en vivo'],
    },
    {
      id:'multilatam', name:'Multi-LATAM', icon:'🌎', price_usd:499, margin_pct:78,
      countries_limit:4, destinations_limit:3, records_limit:200000,
      users_limit:10, support:'Slack dedicado · 24/7', sla_pct: 99.9,
      features:['4 Países (SRI·SAT·SUNAT·DIAN)','3 Destinos simultáneos','SLA 99.9% garantizado','Soporte prioritario 24/7','Multi-empresa RF15','API Key empresarial'],
    },
  ];
}

function ADMIN_AUDIT_LOG() {
  return [
    { ts: isoNow(300),   user:'Juan Espinosa (Admin)',  action:'ADMIN_LOGIN',          resource:'Panel Admin',          detail:'IP: 190.23.45.12 · Ecuador',      result:'SUCCESS' },
    { ts: isoNow(900),   user:'Juan Espinosa (Admin)',  action:'CLIENT_SUSPENDED',     resource:'org-010',              detail:'Exportadora Costa Verde S.A.',    result:'SUCCESS' },
    { ts: isoNow(1800),  user:'Juan Espinosa (Admin)',  action:'ALERT_ACKNOWLEDGED',   resource:'alrt-003',             detail:'Mantenimiento SRI programado',    result:'SUCCESS' },
    { ts: isoNow(5400),  user:'Sistema (cron)',         action:'API_HEALTH_CHECK',      resource:'SAT México',           detail:'Latencia: 1840ms · DEGRADED',    result:'WARNING' },
    { ts: isoNow(7200),  user:'Sistema (cron)',         action:'INVOICE_GENERATED',    resource:'INV-2026-0642',        detail:'Multi-LATAM · $499 · org-001',   result:'SUCCESS' },
    { ts: isoNow(10800), user:'Juan Espinosa (Admin)',  action:'PLAN_PRICE_UPDATED',   resource:'plan-starter',         detail:'Precio: $139 → $149',            result:'SUCCESS' },
    { ts: isoNow(14400), user:'Sistema (cron)',         action:'PIPELINE_SCHEDULED',   resource:'conn-087',             detail:'org-007 · SAT México → BQ',      result:'SUCCESS' },
    { ts: isoNow(18000), user:'Juan Espinosa (Admin)',  action:'USER_ROLE_CHANGED',    resource:'usr-009',              detail:'Operator → Viewer · LogiTrack',  result:'SUCCESS' },
    { ts: isoNow(21600), user:'Sistema (cron)',         action:'API_HEALTH_CHECK',      resource:'SUNAT Perú',           detail:'Latencia: 490ms · ONLINE',       result:'SUCCESS' },
    { ts: isoNow(28800), user:'Sistema (cron)',         action:'PAYMENT_PROCESSED',    resource:'INV-2026-0641',        detail:'Growth · $299 · Grupo Industrial',result:'SUCCESS' },
    { ts: isoNow(36000), user:'Juan Espinosa (Admin)',  action:'ORG_ONBOARDED',        resource:'org-006',              detail:'Distribuidora El Progreso · Trial',result:'SUCCESS' },
    { ts: isoNow(43200), user:'Sistema (cron)',         action:'CERT_EXPIRY_ALERT',    resource:'SUNAT Perú',           detail:'TLS vence en 98 días',           result:'WARNING' },
    { ts: isoNow(50400), user:'Carlos Mendoza (org-001)',action:'PIPELINE_EXECUTED',   resource:'conn-001',             detail:'SRI Ecuador · 150 registros',    result:'SUCCESS' },
    { ts: isoNow(57600), user:'Pedro Ramírez (org-002)', action:'CONNECTOR_CREATED',   resource:'conn-089',             detail:'SAT México → Snowflake',         result:'SUCCESS' },
    { ts: isoNow(64800), user:'Sistema (cron)',         action:'INVOICE_OVERDUE',      resource:'INV-2026-0635',        detail:'Exportadora Costa Verde · $149', result:'WARNING' },
    { ts: isoNow(72000), user:'Juan Espinosa (Admin)',  action:'ADMIN_LOGIN',          resource:'Panel Admin',          detail:'IP: 190.23.45.12 · Ecuador',     result:'SUCCESS' },
  ];
}

// ════════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE RENDER — PANEL ADMIN
// ════════════════════════════════════════════════════════════════════════════════

// ─── API Health ─────────────────────────────────────────────────────────────────
function loadApiHealth() {
  const apis = ADMIN_API_HEALTH();
  const grid = document.getElementById('api-health-grid');
  if (!grid) return;

  grid.innerHTML = apis.map(api => {
    const statusCls = { ONLINE: 'status-pill--active', DEGRADED: 'status-pill--warning', OFFLINE: 'status-pill--error' }[api.status] || 'status-pill--active';
    const statusIcon = { ONLINE: '✓', DEGRADED: '⚠', OFFLINE: '✗' }[api.status] || '?';
    const latencyColor = api.latency_ms < 500 ? 'var(--accent-green)' : api.latency_ms < 1000 ? '#f59e0b' : '#ff6b6b';
    const errPct = api.total_calls_today ? ((api.error_calls_today / api.total_calls_today) * 100).toFixed(1) : '0.0';
    return `
    <div class="admin-card" style="padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
        <div>
          <div style="font-size:1.5rem;margin-bottom:4px;">${api.flag}</div>
          <div style="font-weight:700;color:var(--text-primary);font-size:.9rem;">${api.name}</div>
          <div style="color:var(--text-tertiary);font-size:.68rem;font-family:'JetBrains Mono',monospace;margin-top:2px;">${api.endpoint.slice(0, 45)}…</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <span class="status-pill ${statusCls}" style="font-size:.7rem;">${statusIcon} ${api.status}</span>
          ${api.incident_count > 0 ? `<span class="badge badge--warning" style="font-size:.6rem;">⚠ ${api.incident_count} incidente</span>` : ''}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
        <div style="background:var(--bg-hover);border-radius:var(--radius-sm);padding:10px;text-align:center;">
          <div style="font-size:.65rem;color:var(--text-tertiary);margin-bottom:2px;">Latencia</div>
          <div style="font-size:1.1rem;font-weight:800;color:${latencyColor};">${api.latency_ms}<small style="font-size:.6rem;font-weight:400;"> ms</small></div>
        </div>
        <div style="background:var(--bg-hover);border-radius:var(--radius-sm);padding:10px;text-align:center;">
          <div style="font-size:.65rem;color:var(--text-tertiary);margin-bottom:2px;">Uptime 30d</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--accent-green);">${api.uptime_30d}%</div>
        </div>
        <div style="background:var(--bg-hover);border-radius:var(--radius-sm);padding:10px;text-align:center;">
          <div style="font-size:.65rem;color:var(--text-tertiary);margin-bottom:2px;">Calls hoy</div>
          <div style="font-size:1rem;font-weight:700;color:var(--text-primary);">${api.total_calls_today.toLocaleString()}</div>
        </div>
        <div style="background:var(--bg-hover);border-radius:var(--radius-sm);padding:10px;text-align:center;">
          <div style="font-size:.65rem;color:var(--text-tertiary);margin-bottom:2px;">Tasa error</div>
          <div style="font-size:1rem;font-weight:700;color:${parseFloat(errPct)>2?'#ff6b6b':'var(--accent-green)'};">${errPct}%</div>
        </div>
      </div>
      <div style="font-size:.66rem;color:var(--text-tertiary);display:flex;justify-content:space-between;">
        <span>Versión: ${api.version}</span>
        <span>Cert. TLS: ${api.cert_valid_until}</span>
        <span>Check: ${api.last_check.slice(11, 19)} UTC</span>
      </div>
    </div>`;
  }).join('');

  // Incidents
  const incidents = ADMIN_INCIDENTS();
  const panel = document.getElementById('incidents-panel');
  if (!panel) return;
  if (!incidents.length) {
    panel.innerHTML = `<div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:20px;text-align:center;color:var(--accent-green);font-size:.85rem;">✓ Sin incidentes activos en este momento</div>`;
    return;
  }
  panel.innerHTML = incidents.map(inc => `
    <div style="background:var(--bg-card);border:1px solid ${inc.severity==='ERROR'?'rgba(255,107,107,.3)':'rgba(245,158,11,.3)'};border-radius:var(--radius-md);padding:18px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:1.1rem;">${inc.flag}</span>
          <div>
            <span style="font-weight:700;color:var(--text-primary);font-size:.88rem;">${inc.title}</span>
            <div style="font-size:.68rem;color:var(--text-tertiary);font-family:'JetBrains Mono',monospace;">${inc.api} · Iniciado: ${inc.started_at.slice(11,19)} UTC</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <span class="badge ${inc.severity==='ERROR'?'badge--error':'badge--warning'}" style="font-size:.65rem;">${inc.severity}</span>
          <span class="badge badge--info" style="font-size:.65rem;">${inc.status}</span>
        </div>
      </div>
      <p style="color:var(--text-secondary);font-size:.78rem;line-height:1.5;margin-bottom:10px;">${inc.description}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:.7rem;color:var(--text-tertiary);">Clientes afectados: <strong style="color:var(--text-primary)">${inc.affected_clients}</strong></span>
        <button class="btn btn-ghost btn-xs" onclick="acknowledgeIncident('${inc.id}')">✓ Marcar resuelto</button>
      </div>
    </div>`).join('');
}

function acknowledgeIncident(id) {
  showToast(`Incidente ${id} marcado como resuelto`, 'success');
}

// ─── System Alerts ───────────────────────────────────────────────────────────────
function loadAdminAlerts() {
  const alerts = ADMIN_ALERTS();
  const list = document.getElementById('alerts-list');
  const badge = document.getElementById('alerts-count-badge');
  const navBadge = document.getElementById('anav-badge-alerts');

  const unread = alerts.filter(a => !a.acknowledged).length;
  if (badge) badge.textContent = unread;
  if (navBadge) navBadge.textContent = unread;

  if (!list) return;
  list.innerHTML = alerts.map(a => {
    const sevCls = { ERROR: 'badge--error', WARNING: 'badge--warning', INFO: 'badge--info' }[a.severity] || 'badge--info';
    const bg = a.acknowledged ? 'var(--bg-card)' : a.severity==='ERROR' ? 'rgba(255,107,107,.04)' : a.severity==='WARNING' ? 'rgba(245,158,11,.04)' : 'var(--bg-card)';
    const border = a.acknowledged ? 'var(--border-dim)' : a.severity==='ERROR' ? 'rgba(255,107,107,.35)' : a.severity==='WARNING' ? 'rgba(245,158,11,.35)' : 'var(--border-subtle)';
    return `
    <div style="background:${bg};border:1px solid ${border};border-radius:var(--radius-md);padding:18px;margin-bottom:10px;transition:all .2s;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:1.1rem;">${a.flag}</span>
          <div>
            <span style="font-weight:700;color:var(--text-primary);font-size:.88rem;">${a.title}</span>
            <div style="font-size:.68rem;color:var(--text-tertiary);font-family:'JetBrains Mono',monospace;margin-top:2px;">${a.api} · ${a.timestamp.slice(0,16).replace('T',' ')} UTC</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <span class="badge ${sevCls}" style="font-size:.65rem;">${a.severity}</span>
          ${a.acknowledged ? '<span class="badge badge--success" style="font-size:.62rem;">✓ Revisado</span>' : ''}
        </div>
      </div>
      <p style="color:var(--text-secondary);font-size:.78rem;line-height:1.5;margin-bottom:10px;">${a.detail}</p>
      ${!a.acknowledged ? `<button class="btn btn-ghost btn-xs" onclick="acknowledgeAlert('${a.id}', this)">✓ Marcar como revisado</button>` : ''}
    </div>`;
  }).join('');
}

function acknowledgeAlert(id, btn) {
  btn.closest('div[style]').style.opacity = '0.5';
  if (btn) btn.remove();
  showToast(`Alerta ${id} marcada como revisada`, 'success');
}

// ─── Global Metrics ──────────────────────────────────────────────────────────────
function loadAdminMetrics() {
  const m = ADMIN_GLOBAL_METRICS();

  // KPI Cards
  const grid = document.getElementById('admin-kpi-grid');
  if (grid) {
    const kpis = [
      { icon:'🏢', label:'Organizaciones', value: m.total_organizations, sub:`${m.active_subscriptions} activas`, color:'purple' },
      { icon:'💰', label:'MRR',            value: `$${m.mrr_usd.toLocaleString()}`, sub:`ARR: $${m.arr_usd.toLocaleString()}`, color:'green' },
      { icon:'📊', label:'Registros (Mes)', value: m.records_this_month.toLocaleString(), sub:`Total: ${(m.total_records_processed/1e6).toFixed(2)}M`, color:'cyan' },
      { icon:'⚡', label:'Tasa de Éxito', value: `${m.avg_success_rate}%`, sub:`Latencia prom.: ${m.avg_latency_ms}ms`, color:'amber' },
      { icon:'🔄', label:'Pipelines Activos', value: m.pipelines_active, sub:`En producción`, color:'purple' },
      { icon:'📉', label:'Churn Rate',    value: `${m.churn_rate}%`, sub:`↓ mejora vs mes anterior`, color:'green' },
      { icon:'⭐', label:'NPS Score',     value: m.nps_score, sub:`Promotores · 74% satisfacción`, color:'cyan' },
      { icon:'💳', label:'Facturación Pendiente', value: `$${m.pending_amount}`, sub:`$${m.arr_usd.toLocaleString()} anualizado`, color:'amber' },
    ];
    grid.innerHTML = kpis.map(k => `
      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--${k.color}" style="font-size:1.2rem;display:flex;align-items:center;justify-content:center;">${k.icon}</div>
        <div class="kpi-content">
          <span class="kpi-label">${k.label}</span>
          <span class="kpi-value" style="font-size:1.5rem;">${k.value}</span>
          <span class="kpi-sub">${k.sub}</span>
        </div>
      </div>`).join('');
  }

  // Revenue by plan chart (bar)
  const revCard = document.getElementById('admin-revenue-card');
  if (revCard) {
    const maxMrr = Math.max(...m.revenue_by_plan.map(p => p.mrr), 1);
    revCard.innerHTML = `
      <div style="font-size:.82rem;font-weight:700;color:var(--text-primary);margin-bottom:16px;">💰 MRR por Plan</div>
      ${m.revenue_by_plan.map(p => `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:.73rem;margin-bottom:4px;">
            <span style="color:var(--text-secondary);">${p.plan} <small style="color:var(--text-tertiary);">(${p.clients} clientes)</small></span>
            <span style="font-weight:700;color:var(--text-primary);">$${p.mrr.toLocaleString()}</span>
          </div>
          <div style="background:var(--bg-hover);border-radius:6px;height:8px;overflow:hidden;">
            <div style="background:${p.color};height:100%;width:${p.mrr/maxMrr*100}%;border-radius:6px;transition:width .8s ease;"></div>
          </div>
        </div>`).join('')}`;
  }

  // API calls by country
  const apiCard = document.getElementById('admin-api-summary-card');
  if (apiCard) {
    const maxCalls = Math.max(...m.api_calls_by_country.map(c => c.calls), 1);
    const flags = {'SRI Ecuador':'🇪🇨','SAT México':'🇲🇽','DIAN Colombia':'🇨🇴','SUNAT Perú':'🇵🇪'};
    apiCard.innerHTML = `
      <div style="font-size:.82rem;font-weight:700;color:var(--text-primary);margin-bottom:16px;">🌎 Llamadas API por País</div>
      ${m.api_calls_by_country.map(c => `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:.73rem;margin-bottom:4px;">
            <span style="color:var(--text-secondary);">${flags[c.country]||'🌎'} ${c.country}</span>
            <span style="font-weight:700;color:var(--text-primary);">${(c.calls/1000).toFixed(0)}K <small style="color:var(--text-tertiary);">(${c.pct}%)</small></span>
          </div>
          <div style="background:var(--bg-hover);border-radius:6px;height:8px;overflow:hidden;">
            <div style="background:linear-gradient(90deg,#6366f1,#a855f7);height:100%;width:${c.pct}%;border-radius:6px;transition:width .8s ease;"></div>
          </div>
        </div>`).join('')}`;
  }
}

// ─── Clients (Organizations) ─────────────────────────────────────────────────────
let _allClients = [];
function loadAdminClients() {
  _allClients = ADMIN_CLIENTS();
  const badge = document.getElementById('clients-count-badge');
  if (badge) badge.textContent = _allClients.length;
  renderClientsTable(_allClients);
}

function filterClients() {
  const q = (document.getElementById('client-search')?.value || '').toLowerCase();
  renderClientsTable(q ? _allClients.filter(c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)) : _allClients);
}

function renderClientsTable(list) {
  const tb = document.getElementById('admin-clients-tbody');
  if (!tb) return;
  const planCls = { 'Multi-LATAM':'badge--info', 'Growth':'badge--success', 'Starter':'badge--warning', 'Trial':'badge--error' };
  const statusCls = { 'ACTIVE':'badge--success', 'TRIAL':'badge--info', 'SUSPENDED':'badge--error' };
  tb.innerHTML = list.map(c => `
    <tr>
      <td style="font-weight:700;color:var(--text-primary);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${c.name}">${c.name}</td>
      <td style="color:var(--text-secondary);font-size:.78rem;">${c.country}</td>
      <td><span class="badge ${planCls[c.plan]||'badge--info'}" style="font-size:.65rem;">${c.plan}</span></td>
      <td style="font-weight:700;text-align:center;color:var(--text-primary);">${c.pipelines}</td>
      <td style="font-weight:700;color:var(--text-primary);">${c.records_cycle.toLocaleString()}</td>
      <td style="text-align:center;color:var(--text-secondary);">${c.users}</td>
      <td><span class="badge ${statusCls[c.status]||'badge--info'}" style="font-size:.65rem;">${c.status}</span></td>
      <td>
        <button class="btn btn-ghost btn-xs" onclick="viewOrgDetail('${c.id}')" title="Ver detalle">🔍</button>
        <button class="btn btn-ghost btn-xs" onclick="showToast('Función disponible en producción','info')" title="Editar">✏️</button>
      </td>
    </tr>`).join('');
}

function viewOrgDetail(id) {
  const org = _allClients.find(c => c.id === id);
  if (org) showToast(`${org.name} · ${org.plan} · Desde ${org.since}`, 'info');
}

// ─── Users ───────────────────────────────────────────────────────────────────────
function loadAdminUsers() {
  const users = ADMIN_USERS();
  const badge = document.getElementById('users-count-badge');
  if (badge) badge.textContent = users.length;
  const tb = document.getElementById('admin-users-tbody');
  if (!tb) return;
  const roleCls = { Admin:'badge--error', Operator:'badge--warning', Viewer:'badge--info' };
  const statusCls = { ACTIVE:'badge--success', INACTIVE:'badge--warning' };
  tb.innerHTML = users.map(u => `
    <tr>
      <td style="font-weight:700;color:var(--text-primary);">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:800;color:#fff;flex-shrink:0;">
            ${u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
          </div>
          ${u.name}
        </div>
      </td>
      <td style="color:var(--text-secondary);font-size:.75rem;">${u.email}</td>
      <td><span class="badge ${roleCls[u.role]||'badge--info'}" style="font-size:.62rem;">${u.role}</span></td>
      <td style="color:var(--text-secondary);font-size:.74rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${u.org}">${u.org}</td>
      <td style="font-size:.72rem;color:var(--text-tertiary);">${u.plan}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:.68rem;color:var(--text-tertiary);">${u.last_login.slice(0,16).replace('T',' ')}</td>
      <td><span class="badge ${statusCls[u.status]||'badge--info'}" style="font-size:.62rem;">${u.status}</span></td>
    </tr>`).join('');
}

// ─── Billing ────────────────────────────────────────────────────────────────────
function loadAdminBilling() {
  const data = ADMIN_BILLING();

  // KPI Cards
  const kpiGrid = document.getElementById('billing-kpi-grid');
  if (kpiGrid) {
    const kpis = [
      { icon:'💰', label:'MRR', value:`$${data.kpis.mrr_usd.toLocaleString()}`, sub:'Ingreso mensual recurrente', color:'green' },
      { icon:'📅', label:'ARR', value:`$${data.kpis.arr_usd.toLocaleString()}`, sub:'Ingreso anual proyectado', color:'purple' },
      { icon:'⏳', label:'Pendiente', value:`$${data.kpis.pending_amount}`, sub:`${data.kpis.invoices_this_month} facturas este mes`, color:'amber' },
      { icon:'⚠', label:'Vencido', value:`$${data.kpis.overdue_amount}`, sub:'Requiere seguimiento', color:'cyan' },
    ];
    kpiGrid.innerHTML = kpis.map(k => `
      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--${k.color}" style="font-size:1.1rem;display:flex;align-items:center;justify-content:center;">${k.icon}</div>
        <div class="kpi-content">
          <span class="kpi-label">${k.label}</span>
          <span class="kpi-value" style="font-size:1.4rem;">${k.value}</span>
          <span class="kpi-sub">${k.sub}</span>
        </div>
      </div>`).join('');
  }

  // Invoices Table
  const tb = document.getElementById('admin-billing-tbody');
  if (!tb) return;
  const statusCls = { PAID:'badge--success', PENDING:'badge--warning', OVERDUE:'badge--error', TRIAL:'badge--info' };
  const statusIcon = { PAID:'✓', PENDING:'⏳', OVERDUE:'⚠', TRIAL:'🆓' };
  tb.innerHTML = data.invoices.map(inv => `
    <tr>
      <td style="font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--text-tertiary);">${inv.id}</td>
      <td style="font-weight:600;color:var(--text-primary);font-size:.78rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${inv.org}">${inv.org}</td>
      <td><span class="badge badge--info" style="font-size:.6rem;">${inv.plan}</span></td>
      <td style="font-weight:800;color:var(--text-primary);">$${inv.amount.toLocaleString()}</td>
      <td style="color:var(--text-secondary);font-size:.72rem;">${inv.method}</td>
      <td><span class="badge ${statusCls[inv.status]||'badge--info'}" style="font-size:.65rem;">${statusIcon[inv.status]} ${inv.status}</span></td>
      <td style="color:var(--text-tertiary);font-size:.72rem;">${inv.date}</td>
    </tr>`).join('');
}

// ─── Plan Config ─────────────────────────────────────────────────────────────────
function loadAdminPlans() {
  const plans = ADMIN_PLANS_CONFIG();
  const grid = document.getElementById('plan-config-grid');
  if (!grid) return;
  grid.innerHTML = plans.map(p => `
    <div class="admin-card" style="padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:1.4rem;">${p.icon}</span>
          <div>
            <div style="font-weight:800;color:var(--text-primary);font-size:.95rem;">Plan ${p.name}</div>
            <div style="font-size:.68rem;color:var(--text-tertiary);">Margen estimado: ~${p.margin_pct}%</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.6rem;font-weight:900;color:var(--text-primary);">$${p.price_usd}</div>
          <div style="font-size:.65rem;color:var(--text-tertiary);">/ mes · USD</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
        <div>
          <label style="font-size:.65rem;color:var(--text-tertiary);display:block;margin-bottom:3px;">Precio (USD/mes)</label>
          <input type="number" value="${p.price_usd}" style="width:100%;background:var(--bg-hover);border:1px solid var(--border-dim);color:var(--text-primary);border-radius:var(--radius-sm);padding:5px 8px;font-size:.78rem;font-family:inherit;" onchange="showToast('Precio actualizado (simulado)','success')">
        </div>
        <div>
          <label style="font-size:.65rem;color:var(--text-tertiary);display:block;margin-bottom:3px;">SLA Uptime (%)</label>
          <input type="number" value="${p.sla_pct}" step="0.1" max="100" style="width:100%;background:var(--bg-hover);border:1px solid var(--border-dim);color:var(--text-primary);border-radius:var(--radius-sm);padding:5px 8px;font-size:.78rem;font-family:inherit;" onchange="showToast('SLA actualizado (simulado)','success')">
        </div>
        <div>
          <label style="font-size:.65rem;color:var(--text-tertiary);display:block;margin-bottom:3px;">Países fiscales</label>
          <input type="number" value="${p.countries_limit}" style="width:100%;background:var(--bg-hover);border:1px solid var(--border-dim);color:var(--text-primary);border-radius:var(--radius-sm);padding:5px 8px;font-size:.78rem;font-family:inherit;" onchange="showToast('Límite actualizado (simulado)','success')">
        </div>
        <div>
          <label style="font-size:.65rem;color:var(--text-tertiary);display:block;margin-bottom:3px;">Registros / ciclo</label>
          <input type="number" value="${p.records_limit}" style="width:100%;background:var(--bg-hover);border:1px solid var(--border-dim);color:var(--text-primary);border-radius:var(--radius-sm);padding:5px 8px;font-size:.78rem;font-family:inherit;" onchange="showToast('Límite actualizado (simulado)','success')">
        </div>
      </div>
      <div style="border-top:1px solid var(--border-dim);padding-top:12px;">
        <div style="font-size:.68rem;color:var(--text-tertiary);margin-bottom:6px;">Características incluidas:</div>
        ${p.features.map(f => `<div style="font-size:.72rem;color:var(--text-secondary);padding:2px 0;">✓ ${f}</div>`).join('')}
      </div>
    </div>`).join('');
}

function savePlanConfig() {
  showToast('Configuración de planes guardada correctamente (simulado)', 'success');
}

// ─── Audit Log ──────────────────────────────────────────────────────────────────
function loadAdminAudit() {
  const logs = ADMIN_AUDIT_LOG();
  const tb = document.getElementById('admin-audit-tbody');
  if (!tb) return;

  const actionIcons = {
    ADMIN_LOGIN: '🔑', CLIENT_SUSPENDED: '🚫', ALERT_ACKNOWLEDGED: '✓',
    API_HEALTH_CHECK: '🩺', INVOICE_GENERATED: '🧾', PLAN_PRICE_UPDATED: '💲',
    PIPELINE_SCHEDULED: '⏰', USER_ROLE_CHANGED: '👥', PAYMENT_PROCESSED: '💳',
    ORG_ONBOARDED: '🏢', CERT_EXPIRY_ALERT: '⚠', PIPELINE_EXECUTED: '▶',
    CONNECTOR_CREATED: '🔗', INVOICE_OVERDUE: '⚠',
  };

  const resultCls = { SUCCESS: 'badge--success', WARNING: 'badge--warning', ERROR: 'badge--error' };

  S._adminAuditData = logs;
  tb.innerHTML = logs.map(a => `
    <tr>
      <td style="font-family:'JetBrains Mono',monospace;font-size:.67rem;white-space:nowrap;color:var(--text-tertiary);">${a.ts.slice(0,19).replace('T',' ')}</td>
      <td style="font-weight:600;color:var(--text-primary);font-size:.77rem;">${a.user}</td>
      <td style="font-size:.75rem;">${actionIcons[a.action] || '⚙'} ${a.action.replace(/_/g,' ')}</td>
      <td style="color:var(--text-secondary);font-size:.74rem;">${a.detail}</td>
      <td><span class="badge ${resultCls[a.result]||'badge--info'}" style="font-size:.62rem;">${a.result}</span></td>
    </tr>`).join('');
}

function downloadAuditCSV() {
  const logs = S._adminAuditData || [];
  let csv = 'timestamp,user,action,resource,detail,result\n';
  logs.forEach(a => csv += `"${a.ts}","${a.user}","${a.action}","${a.resource||''}","${a.detail}","${a.result}"\n`);
  downloadFile(csv, 'auditoria_admin_conectorlatam.csv', 'text/csv');
  showToast('Log de auditoría exportado en CSV', 'success');
}
