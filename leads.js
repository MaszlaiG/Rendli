

/* A beérkező rendeléseket a Rendli Firestore-inboxából (inbox/{uid}/items)
   ÉLŐBEN behúzza a state.leads-be, majd törli az inbox-dokumentumot. */
function showLeadsSyncError(msg) {
  const el = document.getElementById('leads-sync-error');
  if (!el) return;
  if (msg) { el.textContent = msg; el.style.display = 'block'; }
  else { el.style.display = 'none'; }
}

let _inboxUnsub = null;
function initPortfolioInboxSync() {
  if (!currentUid) return;
  showLeadsSyncError(null);
  let fs;
  try { fs = firebase.firestore(); } catch (e) { return; }
  if (_inboxUnsub) { try { _inboxUnsub(); } catch (e) {} _inboxUnsub = null; }
  _inboxUnsub = fs.collection('inbox').doc(currentUid).collection('items')
    .onSnapshot(snap => {
      let changed = false;
      snap.forEach(docSnap => {
        const entry = docSnap.data() || {};
        const key = entry.id || docSnap.id;
        if (!state.importedLeadIds[key]) {
          state.leads[key] = { ...entry, id: key, status: entry.status || 'uj', price: entry.price || 0 };
          state.importedLeadIds[key] = true;
          changed = true;
        }
        // Importálás után töröljük az inboxból (a szabály a tulajnak engedi).
        docSnap.ref.delete().catch(() => {});
      });
      if (changed) {
        save();
        renderLeadsTable();
        updateLeadBadge();
        if (typeof renderOrders === 'function') renderOrders();
        if (typeof renderClients === 'function') renderClients();
      }
    }, err => {
      console.warn('[Rendli] inbox listener:', err);
      showLeadsSyncError('A beérkező rendelések szinkronizálása most szünetel.');
    });
}

function refreshPortfolioLeads() {
  showLeadsSyncError(null);
  initPortfolioInboxSync();
}

function newLeadsCount() {
  return Object.values(state.leads).filter(l => l.status === 'uj').length;
}
function updateLeadBadge() {
  const btn = document.querySelector('nav button[data-tab="orders"]');
  if (!btn) return;
  const old = btn.querySelector('.lead-badge');
  if (old) old.remove();
  const count = newLeadsCount();
  if (count > 0) {
    const b = document.createElement('span');
    b.className = 'lead-badge';
    b.textContent = count;
    b.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-width:17px;height:17px;border-radius:20px;background:var(--red);color:#fff;font-size:10px;font-weight:700;margin-left:6px;padding:0 4px;line-height:1';
    btn.appendChild(b);
  }
}

const LEAD_STATUS_MAP = {
  'uj':          { label: 'Új megkeresés',     badge: 'badge-red'    },
  'ajanlat':     { label: 'Ajánlat elküldve',  badge: 'badge-cyan'   },
  'megrendelve': { label: 'Megrendelve',       badge: 'badge-green'  },
  'atirva':      { label: 'Projektté alakítva', badge: 'badge-purple' },
};

function addLead() {
  const lastname  = (document.getElementById('ld-lastname').value || '').trim();
  const firstname = (document.getElementById('ld-firstname').value || '').trim();
  const email     = (document.getElementById('ld-email').value || '').trim();
  const phone     = (document.getElementById('ld-phone').value || '').trim();
  const clientType= document.getElementById('ld-clienttype').value;
  const type      = document.getElementById('ld-type').value;
  const topic     = (document.getElementById('ld-topic').value || '').trim();
  const budget    = document.getElementById('ld-budget').value;
  const message   = (document.getElementById('ld-message').value || '').trim();
  const date      = document.getElementById('ld-date').value || new Date().toISOString().slice(0, 10);

  if (!lastname && !firstname) { uiAlert('Add meg a megkereső nevét!'); return; }

  const id = 'lead_' + Date.now().toString(36);
  const name = [lastname, firstname].filter(Boolean).join(' ');

  state.leads[id] = {
    id, name, email, phone, clientType, type, topic, budget, message,
    date, createdAt: Date.now(),
    status: 'uj', price: 0, deadline: ''
  };

  save();

  ['ld-lastname','ld-firstname','ld-email','ld-phone','ld-topic','ld-message'].forEach(fid => {
    const el = document.getElementById(fid); if (el) el.value = '';
  });
  const dEl = document.getElementById('ld-date');
  if (dEl) dEl.value = new Date().toISOString().slice(0, 10);

  closeModal('lead-modal');
  renderLeadsTable();
  updateLeadBadge();
  if (typeof renderOrders === 'function') renderOrders();
}

async function deleteLead(id) {
  const lead = state.leads[id];
  if (!lead) return;
  if (!await uiConfirm('Biztosan törlöd ezt a megkeresést?', { title: 'Megerősítés' })) return;
  delete state.leads[id];
  save();
  renderLeadsTable();
  updateLeadBadge();
  if (typeof renderOrders === 'function') renderOrders();
}

function setLeadStatus(id, status) {
  const lead = state.leads[id];
  if (!lead) return;

  if (status === 'megrendelve') {
    convertLeadToOrder(id);
    return;
  }

  lead.status = status;
  save();
  renderLeadsTable();
  updateLeadBadge();
}

function setLeadPrice(id, price) {
  const lead = state.leads[id];
  if (!lead) return;
  lead.price = price;
  save();
}

function setLeadDeadline(id, deadline) {
  const lead = state.leads[id];
  if (!lead) return;
  lead.deadline = deadline;
  save();
}

function convertLeadToOrder(id) {
  const lead = state.leads[id];
  if (!lead) return;

  const existing = state.orders.find(o => o.leadId === id);
  if (existing) {
    uiAlert('Ez a megkeresés már projektté lett alakítva.');
    showTab('orders');
    return;
  }

  const order = {
    id:       'ord_' + Date.now().toString(36),
    leadId:   id,
    name:     lead.name || [lead.lastname, lead.firstname].filter(Boolean).join(' '),
    type:     lead.type || 'Egyéb',
    price:    lead.price || 0,
    date:     lead.date || new Date().toISOString().slice(0, 10),
    deadline: lead.deadline || '',
    status:   'folyamatban',
    note:     [
      lead.clientType ? lead.clientType : '',
      lead.email,
      lead.phone  ? '📞 ' + lead.phone : '',
      lead.budget && lead.budget !== 'Nem megadott' ? '💰 ' + lead.budget : '',
      lead.message ? lead.message.slice(0, 160) : ''
    ].filter(Boolean).join(' · '),

    lastname: lead.lastname || '', firstname: lead.firstname || '',
    email: lead.email, phone: lead.phone, clientType: lead.clientType,
    topic: lead.topic, budget: lead.budget,
    currency: lead.currency === 'EUR' ? 'EUR' : 'HUF',
    fxRate: Number(lead.fxRate) || 0,
    paidDate: ''
  };
  order.num = nextOrderNum(order.date);

  state.orders.push(order);

  lead.status = 'atirva';
  save();
  renderAll();
  showTab('orders');
}

function renderLeadsTable() {
  const countEl = document.getElementById('leads-new-count');
  if (countEl) {
    const n = newLeadsCount();
    if (n > 0) { countEl.textContent = n + ' ' + (typeof L === 'function' ? L('új', 'new') : 'új'); countEl.style.display = 'inline-block'; }
    else { countEl.style.display = 'none'; }
  }

  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;

  const leads = Object.values(state.leads)
    .filter(l => l.status !== 'atirva')
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (!leads.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--muted);text-align:center;padding:24px">Még nincs rögzített megkeresés. Új felvétele a „+ Megkeresés" gombbal.</td></tr>';
    return;
  }

  tbody.innerHTML = leads.map(lead => {
    const isNew = lead.status === 'uj';

    const LEAD_CLASS = { uj:'s-red', ajanlat:'s-cyan', megrendelve:'s-green' };
    const cls = LEAD_CLASS[lead.status] || 's-gray';
    const statusSelect = `
      <select class="status-select ${cls}" onchange="setLeadStatus('${lead.id}', this.value);this.className='status-select '+(({'uj':'s-red','ajanlat':'s-cyan','megrendelve':'s-green'})[this.value]||'s-gray')">
        ${Object.entries(LEAD_STATUS_MAP)
          .filter(([k]) => k !== 'atirva')
          .map(([k, v]) => `<option value="${k}"${k === lead.status ? ' selected' : ''}>${v.label}</option>`)
          .join('')}
      </select>`;

    const deleteBtn = `
      <button title="Megkeresés törlése" onclick="deleteLead('${lead.id}')"
        style="margin-left:6px;border:none;background:transparent;color:var(--muted);cursor:pointer;font-size:14px;line-height:1;padding:2px 4px;border-radius:5px"
        onmouseover="this.style.color='var(--red)';this.style.background='var(--surface2)'"
        onmouseout="this.style.color='var(--muted)';this.style.background='transparent'">✕</button>`;

    const priceInput = `
      <input type="text" inputmode="numeric"
        value="${lead.price ? Math.round(lead.price).toLocaleString('hu-HU') : ''}"
        placeholder="0 Ft"
        style="width:100px;font-size:12px;padding:5px 8px;border-radius:6px;border:1px solid var(--border2);background:var(--surface2)"
        onblur="setLeadPrice('${lead.id}', parseInt(this.value.replace(/\\D/g,''))||0)"
        oninput="this.value=this.value.replace(/[^0-9 ]/g,'')">`;

    const deadlineInput = `
      <input type="date"
        value="${lead.deadline || ''}"
        style="font-size:12px;padding:5px 8px;border-radius:6px;border:1px solid var(--border2);background:var(--surface2)"
        onchange="setLeadDeadline('${lead.id}', this.value)">`;

    return `<tr style="${isNew ? 'background:rgba(210,59,59,0.035)' : ''}">
      <td style="color:var(--muted);font-size:11px;white-space:nowrap">${lead.date || '—'}</td>
      <td>
        <strong>${escHtml(lead.name)}</strong>
        ${lead.clientType ? `<span class="badge badge-gray" style="font-size:9.5px;margin-left:4px">${escHtml(lead.clientType)}</span>` : ''}
        <div style="font-size:10.5px;color:var(--muted)">${escHtml(lead.email)}${lead.phone ? ' · 📞 ' + escHtml(lead.phone) : ''}</div>
      </td>
      <td>
        <span class="badge badge-cyan" style="font-size:10px">${escHtml(lead.type)}</span>
        <div style="font-size:11px;color:var(--muted);margin-top:3px">${escHtml(lead.topic || '')}</div>
        ${lead.budget && lead.budget !== 'Nem megadott' ? `<div style="font-size:10px;color:var(--muted)">${escHtml(lead.budget)}</div>` : ''}
      </td>
      <td style="max-width:180px">
        <div style="font-size:11.5px;color:var(--muted);line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical">${escHtml(lead.message || '')}</div>
      </td>
      <td>${priceInput}</td>
      <td>${deadlineInput}</td>
      <td style="white-space:nowrap">
        ${statusSelect}${deleteBtn}
      </td>
    </tr>`;
  }).join('');
}

const _origShowTab = window.showTab;
window.showTab = function(id) {
  _origShowTab && _origShowTab(id);
  if (id === 'orders') {
    renderLeadsTable();
    updateLeadBadge();
  }
};

document.addEventListener('swm:ready', () => {
  const dEl = document.getElementById('ld-date');
  if (dEl && !dEl.value) dEl.value = new Date().toISOString().slice(0, 10);

  renderLeadsTable();
  updateLeadBadge();
  if (typeof renderOrders === 'function') renderOrders();

  initPortfolioInboxSync();
});
