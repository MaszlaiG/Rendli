function showLeadsSyncError(msg) {
  const el = document.getElementById('leads-sync-error');
  if (!el) return;
  if (msg) {
    el.textContent = msg;
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}
let _inboxUnsub = null;
function initPortfolioInboxSync() {
  if (!currentUid) return;
  showLeadsSyncError(null);
  let fs;
  try {
    fs = firebase.firestore();
  } catch (e) {
    return;
  }
  if (_inboxUnsub) {
    try {
      _inboxUnsub();
    } catch (e) {}
    _inboxUnsub = null;
  }
  _inboxUnsub = fs
    .collection('inbox')
    .doc(currentUid)
    .collection('items')
    .onSnapshot(
      (snap) => {
        let changed = false;
        snap.forEach((docSnap) => {
          const entry = docSnap.data() || {};
          // Ajánlat-elfogadás jelzés (a megrendelő az e-mailből / ajanlat.html-ből
          // fogadta el) — nem új lead, hanem a meglévő megkeresés elfogadottá tétele.
          if (entry.accept === true) {
            const lead = entry.leadId && state.leads[entry.leadId];
            if (lead && lead.offer && lead.offer.sentAt && !lead.offer.accepted) {
              lead.offer.accepted = true;
              lead.offer.acceptedAt = entry.at || new Date().toISOString();
              lead.offer.acceptedVia = 'email';
              if (['uj', 'ajanlat', 'elfogadva'].indexOf(lead.status) >= 0) {
                lead.status = 'elfogadva';
              }
              changed = true;
            }
            docSnap.ref.delete().catch(() => {});
            return;
          }
          // Szerződés-aláírás jelzés (a megrendelő a szerzodes.html-en írt alá).
          if (entry.contractSign === true) {
            const lead = entry.leadId && state.leads[entry.leadId];
            if (lead && lead.contract && !lead.contract.signed) {
              lead.contract.signed = true;
              lead.contract.signerName = entry.signerName || '';
              lead.contract.signedAt = entry.signedAt || new Date().toISOString();
              lead.status = 'megrendelve';
              // Automatikus projektbe emelés (ha még nincs) — a Projektek közé kerül.
              if (!state.orders.find((o) => o.leadId === lead.id)) {
                state.orders.push(_leadToOrder(lead));
              }
              changed = true;
              // A végleges aláírt példányt (kézjegy-képpel) a contracts dokumentumba
              // írjuk vissza, hogy a vault kicsi maradjon.
              if (entry.contractId) {
                try {
                  firebase
                    .firestore()
                    .collection('contracts')
                    .doc(currentUid)
                    .collection('docs')
                    .doc(entry.contractId)
                    .set(
                      {
                        signed: true,
                        signerName: entry.signerName || '',
                        signedAt: lead.contract.signedAt,
                        signaturePng: entry.signaturePng || ''
                      },
                      { merge: true }
                    )
                    .catch(() => {});
                } catch (e) {}
              }
            }
            docSnap.ref.delete().catch(() => {});
            return;
          }
          const key = entry.id || docSnap.id;
          if (!state.importedLeadIds[key]) {
            state.leads[key] = {
              ...entry,
              id: key,
              status: entry.status || 'uj',
              price: entry.price || 0
            };
            state.importedLeadIds[key] = true;
            changed = true;
          }
          docSnap.ref.delete().catch(() => {});
        });
        if (changed) {
          save();
          renderLeadsTable();
          updateLeadBadge();
          if (typeof renderOrders === 'function') renderOrders();
          if (typeof renderClients === 'function') renderClients();
        }
      },
      (err) => {
        console.warn('[Rendli] inbox listener:', err);
        showLeadsSyncError('A beérkező rendelések szinkronizálása most szünetel.');
      }
    );
}
function refreshPortfolioLeads() {
  showLeadsSyncError(null);
  initPortfolioInboxSync();
}
function newLeadsCount() {
  return Object.values(state.leads).filter((l) => l.status === 'uj').length;
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
    b.style.cssText =
      'display:inline-flex;align-items:center;justify-content:center;min-width:17px;height:17px;border-radius:20px;background:var(--red);color:#fff;font-size:10px;font-weight:700;margin-left:6px;padding:0 4px;line-height:1';
    btn.appendChild(b);
  }
}
const LEAD_STATUS_MAP = {
  uj: {
    label: 'Új megkeresés',
    badge: 'badge-red'
  },
  ajanlat: {
    label: 'Ajánlat elküldve',
    badge: 'badge-cyan'
  },
  elfogadva: {
    label: 'Ajánlat elfogadva',
    badge: 'badge-yellow'
  },
  szerzodes: {
    label: 'Szerződéskötésre vár',
    badge: 'badge-purple'
  },
  megrendelve: {
    label: 'Megrendelve',
    badge: 'badge-green'
  },
  atirva: {
    label: 'Projektté alakítva',
    badge: 'badge-purple'
  }
};
function canSendContract(lead) {
  return !!(lead && lead.offer && lead.offer.sentAt && lead.offer.accepted);
}
function addLead() {
  const lastname = (document.getElementById('ld-lastname').value || '').trim();
  const firstname = (document.getElementById('ld-firstname').value || '').trim();
  const email = (document.getElementById('ld-email').value || '').trim();
  const phone = (document.getElementById('ld-phone').value || '').trim();
  const clientType = document.getElementById('ld-clienttype').value;
  const type = document.getElementById('ld-type').value;
  const topic = (document.getElementById('ld-topic').value || '').trim();
  const budget = document.getElementById('ld-budget').value;
  const message = (document.getElementById('ld-message').value || '').trim();
  const date = document.getElementById('ld-date').value || new Date().toISOString().slice(0, 10);
  if (!lastname && !firstname) {
    uiAlert('Add meg a megkereső nevét!');
    return;
  }
  const id = 'lead_' + Date.now().toString(36);
  const name = [lastname, firstname].filter(Boolean).join(' ');
  state.leads[id] = {
    id,
    name,
    email,
    phone,
    clientType,
    type,
    topic,
    budget,
    message,
    date,
    createdAt: Date.now(),
    status: 'uj',
    price: 0,
    deadline: ''
  };
  save();
  ['ld-lastname', 'ld-firstname', 'ld-email', 'ld-phone', 'ld-topic', 'ld-message'].forEach(
    (fid) => {
      const el = document.getElementById(fid);
      if (el) el.value = '';
    }
  );
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
  if (
    !(await uiConfirm('Biztosan törlöd ezt a megkeresést?', {
      title: 'Megerősítés'
    }))
  )
    return;
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
  if (status === 'ajanlat') {
    openOfferModal(id);
    renderLeadsTable();
    return;
  }
  if (status === 'elfogadva') {
    if (!(lead.offer && lead.offer.sentAt)) {
      uiAlert('Ehhez előbb el kell küldened az árajánlatot.', {
        title: 'Nincs elküldött ajánlat'
      });
      renderLeadsTable();
      return;
    }
    lead.offer.accepted = true;
    lead.offer.acceptedAt = new Date().toISOString();
    lead.status = 'elfogadva';
    save();
    renderLeadsTable();
    updateLeadBadge();
    return;
  }
  if (status === 'szerzodes') {
    if (!canSendContract(lead)) {
      uiAlert(
        'Szerződést csak azután készíthetsz, hogy az árajánlat kiment, és a megrendelő elfogadta. Állítsd előbb „Ajánlat elfogadva" állapotra.',
        {
          title: 'Előbb elfogadott ajánlat kell'
        }
      );
      renderLeadsTable();
      return;
    }
    openContractModal(id);
    renderLeadsTable();
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
// Megkeresésből projekt (order) objektum — mellékhatás nélkül, csak visszaadja.
function _leadToOrder(lead) {
  const order = {
    id: 'ord_' + Date.now().toString(36),
    leadId: lead.id,
    name: lead.name || [lead.lastname, lead.firstname].filter(Boolean).join(' '),
    type: lead.type || 'Egyéb',
    price: lead.price || 0,
    date: lead.date || new Date().toISOString().slice(0, 10),
    deadline: lead.deadline || '',
    status: 'folyamatban',
    note: [
      lead.clientType ? lead.clientType : '',
      lead.email,
      lead.phone ? '📞 ' + lead.phone : '',
      lead.budget && lead.budget !== 'Nem megadott' ? '💰 ' + lead.budget : '',
      lead.message ? lead.message.slice(0, 160) : ''
    ]
      .filter(Boolean)
      .join(' · '),
    lastname: lead.lastname || '',
    firstname: lead.firstname || '',
    email: lead.email,
    phone: lead.phone,
    clientType: lead.clientType,
    topic: lead.topic,
    budget: lead.budget,
    currency: lead.currency === 'EUR' ? 'EUR' : 'HUF',
    fxRate: Number(lead.fxRate) || 0,
    paidDate: ''
  };
  order.num = nextOrderNum(order.date);
  return order;
}
function convertLeadToOrder(id) {
  const lead = state.leads[id];
  if (!lead) return;
  const existing = state.orders.find((o) => o.leadId === id);
  if (existing) {
    uiAlert('Ez a megkeresés már projektté lett alakítva.');
    showTab('orders');
    return;
  }
  state.orders.push(_leadToOrder(lead));
  lead.status = 'atirva';
  save();
  renderAll();
  showTab('orders');
}
function renderLeadsTable() {
  const countEl = document.getElementById('leads-new-count');
  if (countEl) {
    const n = newLeadsCount();
    if (n > 0) {
      countEl.textContent = n + ' ' + (typeof L === 'function' ? L('új', 'new') : 'új');
      countEl.style.display = 'inline-block';
    } else {
      countEl.style.display = 'none';
    }
  }
  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;
  const leads = Object.values(state.leads)
    .filter((l) => l.status !== 'atirva')
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (!leads.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="color:var(--muted);text-align:center;padding:24px">Még nincs rögzített megkeresés. Új felvétele a „+ Megkeresés" gombbal.</td></tr>';
    return;
  }
  tbody.innerHTML = leads
    .map((lead) => {
      const isNew = lead.status === 'uj';
      const LEAD_CLASS = {
        uj: 's-red',
        ajanlat: 's-cyan',
        elfogadva: 's-yellow',
        szerzodes: 's-purple',
        megrendelve: 's-green'
      };
      const cls = LEAD_CLASS[lead.status] || 's-gray';
      const statusSelect = `
      <select class="status-select ${cls}" onchange="setLeadStatus('${lead.id}', this.value);this.className='status-select '+(({'uj':'s-red','ajanlat':'s-cyan','elfogadva':'s-yellow','szerzodes':'s-purple','megrendelve':'s-green'})[this.value]||'s-gray')">
        ${Object.entries(LEAD_STATUS_MAP)
          .filter(([k]) => k !== 'atirva')
          .map(
            ([k, v]) =>
              `<option value="${k}"${k === lead.status ? ' selected' : ''}>${v.label}</option>`
          )
          .join('')}
      </select>`;
      const _fmtSec = (iso) => escHtml((iso || '').replace('T', ' ').slice(0, 19));
      const offerAccepted = !!(lead.offer && lead.offer.accepted);
      const contractSigned = !!(lead.contract && lead.contract.signed);
      // Ajánlat-gomb csak addig, amíg NINCS elfogadva; utána zöld, másodpercre pontos info + megnézés.
      const offerBtn = offerAccepted
        ? ''
        : `<button class="btn btn-secondary btn-sm" onclick="openOfferModal('${lead.id}')" title="Árajánlat összeállítása és küldése"
        style="margin-left:6px">✉ Ajánlat</button>`;
      const offerSent = offerAccepted
        ? `<div style="font-size:9.5px;color:#1e7a34;margin-top:4px;white-space:nowrap">✓ Ajánlat elfogadva: ${_fmtSec(lead.offer.acceptedAt || lead.offer.sentAt)} · <a onclick="viewOffer('${lead.id}')" style="color:#1e7a34;text-decoration:underline;cursor:pointer">megnézés</a></div>`
        : lead.offer && lead.offer.sentAt
        ? `<div style="font-size:9.5px;color:var(--accent2);margin-top:4px;white-space:nowrap">✓ Ajánlat elküldve: ${escHtml((lead.offer.sentAt || '').slice(0, 10))}</div>`
        : '';
      const contractReady = canSendContract(lead);
      // Szerződés-gomb csak addig, amíg NINCS aláírva.
      const contractBtn = contractSigned
        ? ''
        : contractReady
        ? `<button class="btn btn-secondary btn-sm" onclick="openContractModal('${lead.id}')" title="Megbízási szerződés összeállítása és küldése"
          style="margin-left:6px">📄 Szerződés</button>`
        : `<button class="btn btn-secondary btn-sm" disabled
          title="Előbb küldd el az árajánlatot, majd állítsd „Ajánlat elfogadva” állapotra"
          style="margin-left:6px;opacity:.5;cursor:not-allowed">📄 Szerződés</button>`;
      const contractSent = contractSigned
        ? `<div style="font-size:9.5px;color:#1e7a34;margin-top:4px;white-space:nowrap">✍ Aláírva: ${_fmtSec(lead.contract.signedAt)}${lead.contract.signerName ? ' — ' + escHtml(lead.contract.signerName) : ''} · <a onclick="viewSignedContract('${lead.id}')" style="color:#1e7a34;text-decoration:underline;cursor:pointer">megnézés</a></div>`
        : lead.contract && lead.contract.sentAt
        ? `<div style="font-size:9.5px;color:var(--purple);margin-top:4px;white-space:nowrap">✓ Szerződés elküldve: ${escHtml((lead.contract.sentAt || '').slice(0, 10))}</div>`
        : '';
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
        ${offerBtn || contractBtn ? `<div style="margin-top:6px">${offerBtn}${contractBtn}</div>` : ''}
        ${offerSent}
        ${contractSent}
      </td>
    </tr>`;
    })
    .join('');
}
const _origShowTab = window.showTab;
window.showTab = function (id) {
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
function _offerFt(n) {
  return Math.round(Number(n) || 0).toLocaleString('hu-HU') + ' Ft';
}
function offerAddRow(desc, qty, price) {
  const box = document.getElementById('offer-items');
  if (!box) return;
  const row = document.createElement('div');
  row.className = 'offer-row';
  row.style.cssText =
    'display:grid;grid-template-columns:1fr 58px 104px 30px;gap:8px;align-items:center;margin-bottom:8px';
  row.innerHTML =
    '<input type="text" class="of-desc" placeholder="Megnevezés" oninput="offerRecalc()">' +
    '<input type="number" class="of-qty" value="' +
    (qty != null ? qty : 1) +
    '" min="0" step="any" oninput="offerRecalc()">' +
    '<input type="number" class="of-price" placeholder="Egységár" min="0" step="any" oninput="offerRecalc()">' +
    '<button class="btn btn-danger btn-sm" title="Tétel törlése" onclick="this.parentElement.remove();offerRecalc()">×</button>';
  box.appendChild(row);
  if (desc != null) row.querySelector('.of-desc').value = desc;
  if (price != null) row.querySelector('.of-price').value = price;
  offerRecalc();
}
function _offerRows() {
  return [...document.querySelectorAll('#offer-items .offer-row')].map((r) => ({
    desc: (r.querySelector('.of-desc').value || '').trim(),
    qty: parseFloat(r.querySelector('.of-qty').value) || 0,
    price: parseFloat(r.querySelector('.of-price').value) || 0
  }));
}
function offerRecalc() {
  const si = state.sellerInfo || {};
  const vatReg = !!si.vatRegistered;
  const vatRate = si.vatRate == null ? 27 : si.vatRate;
  const net = _offerRows().reduce((s, it) => s + it.qty * it.price, 0);
  const vat = vatReg ? (net * vatRate) / 100 : 0;
  const gross = net + vat;
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set('offer-net', _offerFt(net));
  const vatRow = document.getElementById('offer-vat-row');
  if (vatRow) vatRow.style.display = vatReg ? 'flex' : 'none';
  set('offer-vat-label', 'ÁFA (' + vatRate + '%)');
  set('offer-vat', _offerFt(vat));
  set('offer-total-label', vatReg ? 'Végösszeg (bruttó)' : 'Végösszeg');
  set('offer-total', _offerFt(gross));
  const note = document.getElementById('offer-vat-note');
  if (note) note.value = vatReg ? 'ÁFA-alany · ' + vatRate + '%' : 'Alanyi adómentes (AAM)';
  return {
    net,
    vat,
    gross,
    vatReg,
    vatRate
  };
}
function openOfferModal(id) {
  const lead = state.leads[id];
  if (!lead) return;
  document.getElementById('offer-lead-id').value = id;
  const nm = document.getElementById('offer-to-name');
  const em = document.getElementById('offer-to-email');
  if (nm) nm.textContent = lead.name || '—';
  if (em) em.textContent = lead.email || '(nincs e-mail cím)';
  const box = document.getElementById('offer-items');
  if (box) box.innerHTML = '';
  const prev = lead.offer;
  if (prev && Array.isArray(prev.items) && prev.items.length) {
    prev.items.forEach((it) => offerAddRow(it.desc, it.qty, it.price));
  } else {
    const desc = lead.topic || lead.type || 'Szolgáltatás';
    offerAddRow(desc, 1, lead.price || 0);
  }
  const msg = document.getElementById('offer-message');
  if (msg)
    msg.value =
      (prev && prev.message) ||
      'Kedves ' +
        (lead.name || '') +
        '!\n\nKöszönjük az érdeklődésed. Az alábbi árajánlatot állítottuk össze a kérésed alapján. Kérdés esetén szívesen állunk rendelkezésedre.';
  const valid = document.getElementById('offer-valid');
  if (valid) {
    if (prev && prev.validUntil) {
      valid.value = prev.validUntil;
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      valid.value = d.toISOString().slice(0, 10);
    }
  }
  const noteEl = document.getElementById('offer-note');
  if (noteEl) {
    noteEl.textContent = '';
    noteEl.className = 'mode-note';
  }
  offerRecalc();
  openModal('offer-modal');
}
function closeOfferModal() {
  closeModal('offer-modal');
  renderLeadsTable();
}
function _offerDetailsHtml(items, t, validUntil) {
  const B = '#e4eaf5',
    L = '#5d6b85',
    V = '#171c28',
    AC = '#3b5bdb';
  const th =
    'padding:9px 10px;border-bottom:2px solid #171c28;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:' +
    L +
    ';text-align:left';
  let rows = items
    .map(
      (it) =>
        '<tr>' +
        '<td style="padding:11px 10px;border-bottom:1px solid ' +
        B +
        ';font-size:13px;color:' +
        V +
        '">' +
        escHtml(it.desc) +
        '</td>' +
        '<td style="padding:11px 10px;border-bottom:1px solid ' +
        B +
        ';font-size:13px;color:' +
        V +
        ';text-align:center;white-space:nowrap">' +
        it.qty +
        '</td>' +
        '<td style="padding:11px 10px;border-bottom:1px solid ' +
        B +
        ';font-size:13px;color:' +
        V +
        ';text-align:right;white-space:nowrap">' +
        _offerFt(it.price) +
        '</td>' +
        '<td style="padding:11px 10px;border-bottom:1px solid ' +
        B +
        ';font-size:13px;font-weight:600;color:' +
        V +
        ';text-align:right;white-space:nowrap">' +
        _offerFt(it.qty * it.price) +
        '</td>' +
        '</tr>'
    )
    .join('');
  let totals =
    '<tr><td colspan="3" style="padding:8px 10px;text-align:right;font-size:12.5px;color:' +
    L +
    '">Nettó összesen</td>' +
    '<td style="padding:8px 10px;text-align:right;font-size:13px;color:' +
    V +
    ';white-space:nowrap">' +
    _offerFt(t.net) +
    '</td></tr>';
  if (t.vatReg) {
    totals +=
      '<tr><td colspan="3" style="padding:8px 10px;text-align:right;font-size:12.5px;color:' +
      L +
      '">ÁFA (' +
      t.vatRate +
      '%)</td>' +
      '<td style="padding:8px 10px;text-align:right;font-size:13px;color:' +
      V +
      ';white-space:nowrap">' +
      _offerFt(t.vat) +
      '</td></tr>';
  }
  totals +=
    '<tr><td colspan="3" style="padding:12px 10px;text-align:right;font-size:13px;font-weight:800;color:' +
    V +
    ';border-top:2px solid ' +
    B +
    '">' +
    (t.vatReg ? 'Végösszeg (bruttó)' : 'Végösszeg') +
    '</td>' +
    '<td style="padding:12px 10px;text-align:right;font-size:17px;font-weight:800;color:' +
    AC +
    ';border-top:2px solid ' +
    B +
    ';white-space:nowrap">' +
    _offerFt(t.gross) +
    '</td></tr>';
  const validRow = validUntil
    ? '<tr><td colspan="4" style="padding:14px 10px 0;font-size:12px;color:' +
      L +
      '">Az ajánlat érvényes: <strong style="color:' +
      V +
      '">' +
      escHtml(validUntil) +
      '</strong>-ig.</td></tr>'
    : '';
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">' +
    '<thead><tr><th style="' +
    th +
    '">Tétel</th><th style="' +
    th +
    ';text-align:center">Menny.</th><th style="' +
    th +
    ';text-align:right">Egységár</th><th style="' +
    th +
    ';text-align:right">Összeg</th></tr></thead>' +
    '<tbody>' +
    rows +
    totals +
    validRow +
    '</tbody></table>'
  );
}
function viewOffer(leadId) {
  const lead = state.leads[leadId];
  if (!lead || !lead.offer || !Array.isArray(lead.offer.items)) {
    uiAlert('Ehhez a megkereséshez nincs elmentett árajánlat.');
    return;
  }
  const o = lead.offer;
  const details = _offerDetailsHtml(
    o.items,
    { net: o.net, vat: o.vat, gross: o.gross, vatReg: o.vatReg, vatRate: o.vatRate },
    o.validUntil || ''
  );
  const si = state.sellerInfo || {};
  const bizName = si.name || 'Rendli';
  const to = lead.name
    ? '<p style="font-size:13px;color:#5d6b85;margin:0 0 14px">Címzett: <strong style="color:#171c28">' +
      escHtml(lead.name) +
      '</strong></p>'
    : '';
  const msg = o.message
    ? '<p style="font-size:13.5px;color:#26303f;white-space:pre-line;margin:0 0 16px">' +
      escHtml(o.message) +
      '</p>'
    : '';
  const acc = o.accepted
    ? '<p style="margin-top:22px;font-size:12.5px;color:#1e7a34;font-weight:700">✓ Az ügyfél elfogadta az ajánlatot: ' +
      escHtml((o.acceptedAt || '').replace('T', ' ').slice(0, 19)) +
      '</p>'
    : '';
  const win = window.open('', '_blank', 'width=900,height=1160');
  if (!win) {
    uiAlert('A böngésző blokkolta a felugró ablakot. Engedélyezd az oldal számára.');
    return;
  }
  win.document.write(
    '<!DOCTYPE html><html lang="hu"><head><meta charset="UTF-8"><title>Árajánlat – ' +
      escHtml(bizName) +
      '</title>' +
      "<style>@page{margin:16mm}body{font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#1a1a1a;max-width:820px;margin:0 auto;padding:28px 24px}h1{color:#171c28;font-size:22px}" +
      '.print-btn{position:fixed;top:14px;right:14px;background:#3b5bdb;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer}' +
      '@media print{.print-btn{display:none}}</style></head><body>' +
      '<button class="print-btn" onclick="window.print()">Nyomtatás / Mentés PDF-ként</button>' +
      '<h1>Árajánlatunk</h1>' +
      to +
      msg +
      details +
      acc +
      '</body></html>'
  );
  win.document.close();
}
async function sendOffer() {
  const id = document.getElementById('offer-lead-id').value;
  const lead = state.leads[id];
  const noteEl = document.getElementById('offer-note');
  const setNote = (msg, err) => {
    if (noteEl) {
      noteEl.textContent = msg;
      noteEl.className = 'mode-note' + (err ? ' err' : '');
      noteEl.style.color = err ? 'var(--red)' : 'var(--accent2)';
    }
  };
  if (!lead) return;
  if (!lead.email) {
    setNote('Ehhez a megkereséshez nincs e-mail cím — nem küldhető ajánlat.', true);
    return;
  }
  if (!emailjsReady()) {
    setNote('Az EmailJS nincs beállítva (EMAILJS_CFG). Lásd: dokumentumok/BEALLITAS-EmailJS.txt', true);
    return;
  }
  const items = _offerRows().filter((it) => it.desc);
  if (!items.length) {
    setNote('Adj meg legalább egy tételt megnevezéssel.', true);
    return;
  }
  const t = offerRecalc();
  const message = (document.getElementById('offer-message').value || '').trim();
  const validUntil = document.getElementById('offer-valid').value || '';
  const si = state.sellerInfo || {};
  const bizName = si.name || 'Rendli';
  const ownerMail = si.email || (LocalStore.currentUser && LocalStore.currentUser.email) || '';
  const details = _offerDetailsHtml(items, t, validUntil);
  // Letölthető PDF-nézet linkje: az ajánlat adata base64url-ként a link # részében
  // utazik → nincs backend/Firestore, a megrendelő az ajanlat.html oldalon menti PDF-be.
  let pdfUrl = '';
  try {
    const offerPayload = {
      uid: currentUid || '',
      leadId: id,
      biz: bizName,
      email: ownerMail,
      phone: si.phone || '',
      addr: si.address || '',
      tax: si.tax || '',
      to: lead.name || '',
      msg: message,
      items: items.map((it) => ({ d: it.desc, q: it.qty, p: it.price })),
      vatReg: t.vatReg,
      vatRate: t.vatRate,
      net: t.net,
      vat: t.vat,
      gross: t.gross,
      valid: validUntil,
      date: new Date().toISOString().slice(0, 10)
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(offerPayload))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    pdfUrl = new URL('ajanlat.html', location.href).href + '#o=' + b64;
  } catch (e) {
    pdfUrl = '';
  }
  // Az "Elfogadom" gomb ugyanezt az oldalt nyitja, de elfogadás-szándékkal (a=1):
  // ott egy explicit kattintással írja be a megrendelő az elfogadást a Firestore-ba.
  const acceptUrl = pdfUrl ? pdfUrl + '&a=1' : '';
  // A gombokat a KÓD építi kész HTML-ként (a sablon {{{actions}}}-ként szúrja be) —
  // az EmailJS alapmotorja nem tudja a {{#if}} blokkokat, ezért itt oldjuk meg.
  const qMail =
    'mailto:' + ownerMail + '?subject=K%C3%A9rd%C3%A9sem%20van%20az%20%C3%A1raj%C3%A1nlatr%C3%B3l';
  const acceptHref =
    acceptUrl || 'mailto:' + ownerMail + '?subject=Elfogadom%20az%20%C3%A1raj%C3%A1nlatot';
  let actions = '';
  if (pdfUrl)
    actions +=
      '<a href="' +
      pdfUrl +
      '" style="display:inline-block;background:#3b5bdb;color:#ffffff;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;text-decoration:none;margin:0 8px 8px 0">&#128196; Letöltés PDF-ben</a>';
  actions +=
    '<a href="' +
    acceptHref +
    '" style="display:inline-block;background:#1e7a34;color:#ffffff;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;text-decoration:none;margin:0 8px 8px 0">&#10003; Elfogadom az ajánlatot</a>';
  actions +=
    '<a href="' +
    qMail +
    '" style="display:inline-block;background:#ffffff;color:#3b5bdb;font-weight:700;font-size:14px;padding:10px 20px;border:2px solid #3b5bdb;border-radius:10px;text-decoration:none;margin:0 8px 8px 0">Kérdésem van</a>';
  const btn = document.getElementById('offer-send-btn');
  if (btn) btn.disabled = true;
  setNote('Küldés folyamatban…', false);
  const params = {
    to_email: lead.email,
    to_name: lead.name || '',
    from_name: bizName,
    brand_initial: (bizName.trim()[0] || 'R').toUpperCase(),
    tagline: 'Árajánlat',
    reply_to: ownerMail,
    subject: 'Árajánlat – ' + bizName,
    heading: 'Árajánlatunk',
    intro: message,
    details: details,
    actions: actions
  };
  try {
    await emailjsSend(EMAILJS_CFG.templateOffer, params);
    lead.offer = {
      items,
      message,
      validUntil,
      net: t.net,
      vat: t.vat,
      gross: t.gross,
      vatReg: t.vatReg,
      vatRate: t.vatRate,
      sentAt: new Date().toISOString()
    };
    lead.status = 'ajanlat';
    lead.price = t.gross;
    save();
    renderLeadsTable();
    updateLeadBadge();
    closeModal('offer-modal');
    uiAlert('Az árajánlatot elküldtük ' + (lead.name || 'a megrendelőnek') + ' e-mail címére.', {
      title: 'Ajánlat elküldve'
    });
  } catch (err) {
    setNote(
      'A küldés nem sikerült: ' +
        ((err && err.message) || 'ismeretlen hiba') +
        '. Ellenőrizd az EMAILJS_CFG-t és az internetkapcsolatot.',
      true
    );
  } finally {
    if (btn) btn.disabled = false;
  }
}
