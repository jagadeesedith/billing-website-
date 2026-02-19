/* ═══════════════════════════════════════════
   ROADSTOP HOTEL BILLING — app.js
   ═══════════════════════════════════════════ */

/* ══════════════════════════════
   CONFIG — Change UPI ID here!
══════════════════════════════ */
const UPI_ID   = 'roadstop@upi';   // ← PUT YOUR UPI ID HERE
const UPI_NAME = 'RoadStop Hotel'; // ← PUT YOUR HOTEL NAME HERE

/* ══════════════════════════════
   FOOD IMAGES (Wikimedia Commons — Free CC License)
══════════════════════════════ */
const IMG = {
  Poratta:     'images/poratta.jpg',
  dosa:        'images/dosa.png',
  chapathi:    'images/chappathi.png',
  halfboil:   'images/halfboil.png',
  fullboil:   'images/fullboil.jpg',
  omelette:   'images/ombelette.jpg',
  chickenrice:'images/chicken rice.webp',
  Eggrice:    'images/egg rice.jpg',
};


/* ══════════════════════════════
   MENU DATA
   To add/edit items: change name, price, imgKey here
══════════════════════════════ */
const menu = [
  {
    category: 'Foods',
    items: [
      { id: 1,  name: 'Poratta',       price: 15,  imgKey: 'Poratta'     },
      { id: 2,  name: 'Dosa',          price: 20,  imgKey: 'dosa'        },
      { id: 3,  name: 'Chappathi',     price: 20,  imgKey: 'chapathi'    },
      { id: 9,  name: 'Half Boil',     price: 10,  imgKey: 'halfboil'   },
      { id: 10, name: 'Full Boil',     price: 10,  imgKey: 'fullboil'   },
      { id: 11, name: 'Omelette',      price: 15,  imgKey: 'omelette'   },
      { id: 14, name: 'Chicken Rice',  price: 90,  imgKey: 'chickenrice' },
      { id: 15, name: 'Egg Rice',      price: 50,  imgKey: 'Eggrice'     },
    ],
  },
];

/* ══════════════════════════════
   STATE
══════════════════════════════ */
let cart           = {};
let activeCategory = menu[0].category;
let activeRecTab   = 'today';
let billCounter    = +(localStorage.getItem('rs_ctr') || 0);
let bills          = JSON.parse(localStorage.getItem('rs_bills') || '[]');

function saveBills() {
  localStorage.setItem('rs_bills', JSON.stringify(bills));
  localStorage.setItem('rs_ctr', billCounter);
}

function getImg(key) {
  if (!key) return 'images/placeholder.jpg';
  return IMG[key] ? IMG[key] : 'images/placeholder.jpg';
}


/* ══════════════════════════════
   TABS
══════════════════════════════ */
function renderTabs() {
  document.getElementById('tabs').innerHTML = menu
    .map(c => `<button class="tab ${c.category === activeCategory ? 'active' : ''}"
       onclick="switchCategory('${c.category}')">${c.category}</button>`)
    .join('');
}

function switchCategory(cat) {
  activeCategory = cat;
  renderTabs();
  renderMenu();
}

/* ══════════════════════════════
   MENU
══════════════════════════════ */
function renderMenu() {
  const cat = menu.find(c => c.category === activeCategory);
  document.getElementById('menuSection').innerHTML = `
    <div class="section-label">${cat.category}</div>
    <div class="grid">
      ${cat.items.map(item => {
        const qty    = cart[item.id]?.qty || 0;
        const imgSrc = getImg(item.imgKey);
        return `
          <div class="item-card ${qty ? 'added' : ''}" id="card-${item.id}" onclick="addToCart(${item.id})">
            <div class="qty-badge ${qty ? 'show' : ''}" id="badge-${item.id}">${qty}</div>
            <img class="item-img" 
     src="${imgSrc}" 
     alt="${item.name}" 
     loading="lazy"
     onerror="this.src='images/placeholder.jpg'"/>

            <div class="item-img-fallback" style="display:none">🍽️</div>
            <div class="item-body">
              <div class="item-name">${item.name}</div>
              <div class="item-footer">
                <div class="item-price">₹${item.price}</div>
                <div class="add-btn">${qty ? '✓' : '+'}</div>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

/* ══════════════════════════════
   CART LOGIC
══════════════════════════════ */
function findItem(id) {
  for (const c of menu) {
    const i = c.items.find(x => x.id === id);
    if (i) return i;
  }
}

function addToCart(id) {
  const item = findItem(id);
  cart[id] ? cart[id].qty++ : (cart[id] = { item, qty: 1 });
  updateCardUI(id);
  updateCartBar();
  if (navigator.vibrate) navigator.vibrate(25);
}

function changeQty(id, d) {
  if (!cart[id]) return;
  cart[id].qty += d;
  if (cart[id].qty <= 0) delete cart[id];
  updateCardUI(id);
  updateCartBar();
  renderCartSheet();
}

function updateCardUI(id) {
  const qty   = cart[id]?.qty || 0;
  const card  = document.getElementById(`card-${id}`);
  const badge = document.getElementById(`badge-${id}`);
  if (!card) return;
  card.classList.toggle('added', qty > 0);
  if (badge) { badge.classList.toggle('show', qty > 0); badge.textContent = qty; }
  const ab = card.querySelector('.add-btn');
  if (ab) ab.textContent = qty ? '✓' : '+';
}

function clearCart() {
  cart = {};
  renderMenu();
  updateCartBar();
  renderCartSheet();
}

function getTotal() { return Object.values(cart).reduce((s, e) => s + e.item.price * e.qty, 0); }
function getCount() { return Object.values(cart).reduce((s, e) => s + e.qty, 0); }

/* ── Cart Bar ── */
function updateCartBar() {
  const count = getCount(), total = getTotal();
  document.getElementById('cartCount').textContent    = count;
  document.getElementById('cartBarTotal').textContent = `₹${total}`;
  document.getElementById('cartBar').classList.toggle('visible', count > 0);
  if (!count) closeCart();
}

/* ── Cart Sheet ── */
function openCart() {
  document.getElementById('cartSheet').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  renderCartSheet();
}
function closeCart() {
  document.getElementById('cartSheet').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}
function renderCartSheet() {
  const items = Object.values(cart);
  const c     = document.getElementById('cartItems');
  document.getElementById('grandTotal').textContent = `₹${getTotal()}`;
  if (!items.length) {
    c.innerHTML = `<div class="empty-cart"><div class="icon">🛒</div><p>Your order is empty.<br>Tap items to add.</p></div>`;
    return;
  }
  c.innerHTML = items.map(({ item, qty }) => `
    <div class="cart-item">
      <img class="cart-item-img" src="${getImg(item.imgKey)}" alt="${item.name}"
        onerror="this.style.display='none'"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-unit">₹${item.price} × ${qty}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn minus" onclick="changeQty(${item.id}, -1)">−</button>
        <div class="qty-val">${qty}</div>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
      <div class="cart-item-total">₹${item.price * qty}</div>
    </div>`).join('');
}

/* ══════════════════════════════
   PAYMENT MODAL
══════════════════════════════ */
function openPayModal() {
  if (!getCount()) return;
  closeCart();
  document.getElementById('modalAmt').textContent = `₹${getTotal()}`;
  document.getElementById('payModal').classList.add('open');
  document.getElementById('payOverlay').classList.add('open');
  showStep('choose');
}
function closePayModal() {
  document.getElementById('payModal').classList.remove('open');
  document.getElementById('payOverlay').classList.remove('open');
  document.getElementById('cashGiven').value    = '';
  document.getElementById('upiPaidInput').value = '';
  resetUpiStatus();
}
function showStep(n) {
  document.getElementById('stepChoose').style.display = n === 'choose' ? 'block' : 'none';
  document.getElementById('stepCash').style.display   = n === 'cash'   ? 'block' : 'none';
  document.getElementById('stepUpi').style.display    = n === 'upi'    ? 'block' : 'none';
}
function backToChoose() { showStep('choose'); }

/* ── Cash Step ── */
function showCashStep() {
  const total = getTotal();
  document.getElementById('cashBillAmt').textContent = `₹${total}`;
  document.getElementById('cashGiven').value = '';
  const qa = [];
  [1, 5, 10, 20, 50, 100, 200, 500].forEach(d => {
    const v = Math.ceil(total / d) * d;
    if (v >= total && !qa.includes(v) && qa.length < 5) qa.push(v);
  });
  if (!qa.includes(total)) qa.unshift(total);
  document.getElementById('quickAmts').innerHTML = qa.slice(0, 6)
    .map(v => `<button class="qa-btn" onclick="setQuick(${v})">₹${v}</button>`).join('');
  calcChange();
  showStep('cash');
  setTimeout(() => document.getElementById('cashGiven').focus(), 300);
}

function setQuick(v) {
  document.getElementById('cashGiven').value = v;
  calcChange();
}

function calcChange() {
  const total  = getTotal();
  const given  = parseFloat(document.getElementById('cashGiven').value) || 0;
  const change = given - total;
  const box    = document.getElementById('changeBox');
  const amtEl  = document.getElementById('changeAmt');
  const subEl  = document.getElementById('changeSub');
  const btn    = document.getElementById('confirmCashBtn');

  box.className = 'change-box';
  if (given === 0) {
    box.classList.add('zero');
    amtEl.textContent = '₹0';
    subEl.textContent = 'Enter amount above';
    btn.className = 'confirm-cash-btn not-ready'; btn.disabled = true;
  } else if (change < 0) {
    box.classList.add('negative');
    amtEl.textContent = `₹${Math.abs(change)}`;
    subEl.textContent = `Short by ₹${Math.abs(change)} — need more`;
    btn.className = 'confirm-cash-btn not-ready'; btn.disabled = true;
  } else if (change === 0) {
    box.classList.add('zero');
    amtEl.textContent = 'Exact!';
    subEl.textContent = 'Perfect — no change needed';
    btn.className = 'confirm-cash-btn ready'; btn.disabled = false;
  } else {
    box.classList.add('positive');
    amtEl.textContent = `₹${change}`;
    subEl.textContent = `Return ₹${change} to customer`;
    btn.className = 'confirm-cash-btn ready'; btn.disabled = false;
  }
}

/* ── UPI Step ── */
function showUpiStep() {
  const total = getTotal();
  document.getElementById('upiAmtDisplay').textContent = `₹${total}`;
  document.getElementById('upiIdDisplay').textContent  = UPI_ID;
  document.getElementById('upiPaidInput').value = '';
  resetUpiStatus();
  showStep('upi');
  drawQR(total);
}

function resetUpiStatus() {
  const dot = document.getElementById('upiDot');
  const txt = document.getElementById('upiStatusText');
  const btn = document.getElementById('confirmUpiBtn');
  const inp = document.getElementById('upiPaidInput');
  if (dot) dot.className = 'upi-dot waiting';
  if (txt) { txt.textContent = 'Waiting for customer to scan…'; txt.style.color = ''; }
  if (btn) { btn.className = 'confirm-upi-btn not-ready'; btn.disabled = true; }
  if (inp) inp.className = 'upi-amount-input';
}

function checkUpiAmount() {
  const total = getTotal();
  const paid  = parseFloat(document.getElementById('upiPaidInput').value) || 0;
  const dot   = document.getElementById('upiDot');
  const txt   = document.getElementById('upiStatusText');
  const btn   = document.getElementById('confirmUpiBtn');
  const inp   = document.getElementById('upiPaidInput');
  if (paid === 0) { resetUpiStatus(); return; }
  if (paid === total) {
    dot.className = 'upi-dot received';
    txt.textContent = `✓ ₹${total} received — confirmed!`;
    txt.style.color = 'var(--green)';
    inp.className = 'upi-amount-input correct';
    btn.className = 'confirm-upi-btn ready'; btn.disabled = false;
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
  } else {
    dot.className = 'upi-dot mismatch';
    txt.textContent = paid < total
      ? `Short by ₹${total - paid} — need more`
      : `Overpaid by ₹${paid - total} — verify`;
    txt.style.color = paid < total ? 'var(--accent2)' : 'var(--accent)';
    inp.className = 'upi-amount-input wrong';
    btn.className = 'confirm-upi-btn not-ready'; btn.disabled = true;
  }
}

function drawQR(amount) {
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent('RoadStop Bill')}`;
  const canvas = document.getElementById('qrCanvas');
  const ctx    = canvas.getContext('2d');
  const size   = 180;
  canvas.width = size; canvas.height = size;
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}&bgcolor=ffffff&color=000000&margin=4`;
  const img    = new Image(); img.crossOrigin = 'anonymous';
  img.onload = () => ctx.drawImage(img, 0, 0, size, size);
  img.onerror = () => {
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('UPI QR', size / 2, size / 2 - 8);
    ctx.font = '11px sans-serif';
    ctx.fillText(UPI_ID, size / 2, size / 2 + 10);
    ctx.fillText(`₹${amount}`, size / 2, size / 2 + 28);
  };
  img.src = apiUrl;
}

/* ── Confirm Payment ── */
function confirmPayment(method) {
  const now    = new Date();
  const total  = getTotal();
  const given  = method === 'cash' ? parseFloat(document.getElementById('cashGiven').value) || total : total;
  const change = method === 'cash' ? given - total : 0;
  billCounter++;
  const bill = {
    id:             billCounter,
    billNo:         `RS${String(billCounter).padStart(4, '0')}`,
    date:           now.toISOString(),
    method,
    items:          Object.values(cart).map(({ item, qty }) => ({ name: item.name, price: item.price, qty, total: item.price * qty })),
    total,
    cashGiven:      method === 'cash' ? given  : null,
    changeReturned: method === 'cash' ? change : null,
  };
  bills.unshift(bill);
  saveBills();
  closePayModal();
  const lbl = method === 'gpay' ? 'GPay / UPI' : 'Cash';
  document.getElementById('toastMsg').textContent = 'Payment Done!';
  document.getElementById('toastSub').textContent = `${lbl} • ${bill.billNo}${method === 'cash' && change > 0 ? ' • Change ₹' + change : ''}`;
  const t = document.getElementById('toast');
  t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); clearCart(); }, 2600);
  if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
}

/* ══════════════════════════════
   RECORDS
══════════════════════════════ */
function openRecords()  { document.getElementById('recordsPanel').classList.add('open');    renderRecords(); }
function closeRecords() { document.getElementById('recordsPanel').classList.remove('open'); }

function switchRecTab(tab) {
  activeRecTab = tab;
  document.querySelectorAll('.rec-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`rtab-${tab}`).classList.add('active');
  renderRecords();
}

function filterBills(tab) {
  const now = new Date(), ts = now.toDateString(), ym = `${now.getFullYear()}-${now.getMonth()}`;
  if (tab === 'today') return bills.filter(b => new Date(b.date).toDateString() === ts);
  if (tab === 'month') return bills.filter(b => { const d = new Date(b.date); return `${d.getFullYear()}-${d.getMonth()}` === ym; });
  return bills;
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function renderRecords() {
  const f    = filterBills(activeRecTab);
  const tot  = f.reduce((s, b) => s + b.total, 0);
  const gpay = f.filter(b => b.method === 'gpay').reduce((s, b) => s + b.total, 0);
  const cash = f.filter(b => b.method === 'cash').reduce((s, b) => s + b.total, 0);
  const labels = { today: 'Today', month: 'This Month', all: 'All Time' };

  document.getElementById('recBody').innerHTML = `
    <div class="rec-section-title">${labels[activeRecTab]} Summary</div>
    <div class="summary-row">
      <div class="summary-card sc-green"><div class="s-lbl">Total Revenue</div><div class="s-val">₹${tot.toLocaleString('en-IN')}</div></div>
      <div class="summary-card sc-amber"><div class="s-lbl">Bills Raised</div><div class="s-val">${f.length}</div></div>
      <div class="summary-card sc-blue"><div class="s-lbl">GPay / UPI</div><div class="s-val">₹${gpay.toLocaleString('en-IN')}</div></div>
      <div class="summary-card sc-red"><div class="s-lbl">Cash</div><div class="s-val">₹${cash.toLocaleString('en-IN')}</div></div>
    </div>
    <div class="rec-section-title">Bills</div>
    ${!f.length
      ? `<div class="no-records"><div class="icon">📭</div><p>No bills for this period.</p></div>`
      : f.map(b => `
        <div class="bill-card">
          <div class="bill-card-header" onclick="toggleBill('${b.billNo}')">
            <div>
              <div class="bill-no">${b.billNo}</div>
              <div class="bill-meta">${fmtDate(b.date)} • ${b.items.length} item${b.items.length > 1 ? 's' : ''}</div>
            </div>
            <div class="bill-right">
              <div class="bill-total">₹${b.total}</div>
              <div class="bill-badge ${b.method === 'gpay' ? 'bb-gpay' : 'bb-cash'}">${b.method === 'gpay' ? '📱 GPay' : '💵 Cash'}</div>
            </div>
          </div>
          <div class="bill-items-list" id="bill-${b.billNo}">
            ${b.items.map(i => `<div class="bill-item-row"><span>${i.name} × ${i.qty}</span><span>₹${i.total}</span></div>`).join('')}
            <div class="bill-total-row">
              <span style="font-weight:700;color:var(--text)">Total</span>
              <span style="color:var(--green);font-weight:700;">₹${b.total}</span>
            </div>
            ${b.method === 'cash' && b.cashGiven ? `
              <div class="bill-item-row" style="margin-top:8px">
                <span style="color:var(--muted)">Cash Received</span><span>₹${b.cashGiven}</span>
              </div>
              <div class="bill-item-row">
                <span style="color:var(--muted)">Change Returned</span>
                <span style="color:var(--accent)">₹${b.changeReturned || 0}</span>
              </div>` : ''}
          </div>
        </div>`).join('')}`;
}

function toggleBill(no) {
  document.getElementById(`bill-${no}`).classList.toggle('show');
}

/* ══════════════════════════════
   EXCEL EXPORT
══════════════════════════════ */
function exportExcel() {
  if (!bills.length) { alert('No records to export yet.'); return; }
  const wb = XLSX.utils.book_new();

  function billsToRows(arr) {
    const rows = [['Bill No', 'Date', 'Time', 'Items', 'Total (₹)', 'Payment Method', 'Cash Given (₹)', 'Change Returned (₹)']];
    arr.forEach(b => {
      const d = new Date(b.date);
      rows.push([
        b.billNo,
        d.toLocaleDateString('en-IN'),
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        b.items.map(i => `${i.name} x${i.qty}`).join(', '),
        b.total,
        b.method === 'gpay' ? 'GPay/UPI' : 'Cash',
        b.method === 'cash' ? (b.cashGiven || b.total) : '',
        b.method === 'cash' ? (b.changeReturned || 0) : '',
      ]);
    });
    if (arr.length) rows.push(['', '', '', 'TOTAL', { f: `SUM(E2:E${arr.length + 1})` }, '', '', '']);
    return rows;
  }

  function addSheet(data, name) {
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 8 }, { wch: 50 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  addSheet(billsToRows(bills), 'All Bills');
  addSheet(billsToRows(filterBills('today')), "Today's Bills");
  addSheet(billsToRows(filterBills('month')), 'This Month');

  // Monthly summary
  const mmap = {};
  bills.forEach(b => {
    const d = new Date(b.date);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!mmap[k]) mmap[k] = { month: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), bills: 0, total: 0, gpay: 0, cash: 0 };
    mmap[k].bills++; mmap[k].total += b.total;
    b.method === 'gpay' ? mmap[k].gpay += b.total : mmap[k].cash += b.total;
  });
  const mrows = [['Month', 'No. of Bills', 'Total Revenue (₹)', 'GPay/UPI (₹)', 'Cash (₹)']];
  Object.values(mmap).forEach(m => mrows.push([m.month, m.bills, m.total, m.gpay, m.cash]));
  const wm = XLSX.utils.aoa_to_sheet(mrows);
  wm['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wm, 'Monthly Summary');

  // Item-wise sales
  const imap = {};
  bills.forEach(b => b.items.forEach(i => {
    if (!imap[i.name]) imap[i.name] = { name: i.name, qty: 0, revenue: 0 };
    imap[i.name].qty += i.qty; imap[i.name].revenue += i.total;
  }));
  const irows = [['Item Name', 'Qty Sold', 'Revenue (₹)']];
  Object.values(imap).sort((a, b) => b.revenue - a.revenue).forEach(i => irows.push([i.name, i.qty, i.revenue]));
  const wi = XLSX.utils.aoa_to_sheet(irows);
  wi['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wi, 'Item-wise Sales');

  const now = new Date();
  XLSX.writeFile(wb, `RoadStop_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.xlsx`);
}

/* ══════════════════════════════
   INIT
══════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  renderTabs();
  renderMenu();
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
});
