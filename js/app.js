(function () {
  'use strict';

  // Constants
  const CATEGORIES = ['Food', 'Transport', 'Fun'];
  const STORAGE_KEY = 'expense-visualizer.transactions.v1';
  const MAX_CENTS = 99999999999; // 999,999,999.99

  // In-memory state
  let transactions = []; // Transaction[], newest first
  let chart = null;      // Chart.js instance or null

  // Pure: parse an amount string into integer cents using string arithmetic.
  // Returns { ok: true, cents } or { ok: false, reason } where reason is one of
  // 'empty' | 'nonnumeric' | 'nonpositive' | 'precision' | 'range'.
  function parseAmountToCents(str) {
    const s = typeof str === 'string' ? str.trim() : '';
    if (s === '') return { ok: false, reason: 'empty' };

    // Negative numbers are reported as nonpositive.
    if (/^-\s*\d*\.?\d+$/.test(s) || /^-\s*\d+\.$/.test(s)) {
      return { ok: false, reason: 'nonpositive' };
    }
    // More than 2 decimals on an otherwise numeric value.
    if (/^\d+\.\d{3,}$/.test(s)) return { ok: false, reason: 'precision' };
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return { ok: false, reason: 'nonnumeric' };

    const parts = s.split('.');
    const frac = ((parts[1] || '') + '00').slice(0, 2);
    const digits = (parts[0] + frac).replace(/^0+/, '');
    if (digits === '') return { ok: false, reason: 'nonpositive' };
    // MAX_CENTS has 11 digits; longer strings are always out of range.
    if (digits.length > String(MAX_CENTS).length) return { ok: false, reason: 'range' };
    const cents = Number(digits);
    if (cents > MAX_CENTS) return { ok: false, reason: 'range' };
    return { ok: true, cents: cents };
  }

  const AMOUNT_MESSAGES = {
    empty: 'Amount is required.',
    nonnumeric: 'Amount must be a number.',
    nonpositive: 'Amount must be greater than zero.',
    precision: 'Amount may have at most 2 decimal places (max 999,999,999.99).',
    range: 'Amount must not exceed 999,999,999.99 (at most 2 decimal places).'
  };

  // Pure: validate raw form input; reports all invalid fields at once.
  function validateInput(input) {
    const raw = input || {};
    const errors = {};

    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (name === '') {
      errors.name = 'Item name is required.';
    } else if (name.length > 100) {
      errors.name = 'Item name must be 100 characters or fewer.';
    }

    const parsed = parseAmountToCents(raw.amount);
    if (!parsed.ok) errors.amount = AMOUNT_MESSAGES[parsed.reason];

    if (CATEGORIES.indexOf(raw.category) === -1) {
      errors.category = 'Please select a category.';
    }

    if (Object.keys(errors).length > 0) return { valid: false, errors: errors };
    return {
      valid: true,
      value: { name: name, amountCents: parsed.cents, category: raw.category }
    };
  }

  // Pure: format integer cents as "$1,234.50".
  function formatCurrency(cents) {
    const n = Math.max(0, Math.floor(Number(cents) || 0));
    const whole = Math.floor(n / 100);
    const frac = String(n % 100).padStart(2, '0');
    return 'Rp ' + String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + frac;
  }

  // Pure: exact integer sum of amountCents.
  function sumCents(list) {
    let total = 0;
    for (const t of list || []) total += t.amountCents;
    return total;
  }

  // Pure: per-category cent totals; every category present (0 if none).
  function categoryTotals(list) {
    const totals = {};
    CATEGORIES.forEach(function (c) { totals[c] = 0; });
    for (const t of list || []) {
      if (Object.prototype.hasOwnProperty.call(totals, t.category)) {
        totals[t.category] += t.amountCents;
      }
    }
    return totals;
  }

  // Pure: serialize transactions to a JSON string.
  function serialize(list) {
    return JSON.stringify(list || []);
  }

  // Pure: parse and validate stored text. All-or-nothing.
  function deserialize(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { ok: false };
    }
    if (!Array.isArray(data)) return { ok: false };
    const out = [];
    for (const t of data) {
      if (
        t === null || typeof t !== 'object' ||
        typeof t.id !== 'string' ||
        typeof t.name !== 'string' || t.name.length < 1 || t.name.length > 100 ||
        typeof t.amountCents !== 'number' || !Number.isInteger(t.amountCents) ||
        t.amountCents < 1 || t.amountCents > MAX_CENTS ||
        CATEGORIES.indexOf(t.category) === -1
      ) {
        return { ok: false };
      }
      out.push({ id: t.id, name: t.name, amountCents: t.amountCents, category: t.category });
    }
    return { ok: true, transactions: out };
  }

  // Pure: new list with transaction first, rest in original order.
  function addToList(list, transaction) {
    return [transaction].concat(list || []);
  }

  // Pure: new list without the transaction matching id; order preserved.
  function removeFromList(list, id) {
    return (list || []).filter(function (t) { return t.id !== id; });
  }

  // Unique id: crypto.randomUUID() with timestamp + counter fallback.
  let idCounter = 0;
  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    idCounter += 1;
    return Date.now().toString(36) + '-' + idCounter.toString(36) + '-' +
      Math.random().toString(36).slice(2, 8);
  }

  // Storage: load from localStorage. Never throws.
  // status: 'ok' | 'empty' (key absent) | 'corrupt' (read, parse, or shape failure).
  function loadTransactions() {
    let text;
    try {
      text = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return { transactions: [], status: 'corrupt' };
    }
    if (text === null || text === undefined) return { transactions: [], status: 'empty' };
    const result = deserialize(text);
    if (!result.ok) return { transactions: [], status: 'corrupt' };
    return { transactions: result.transactions, status: 'ok' };
  }

  // Storage: save to localStorage. Returns true on success, false on any failure.
  function saveTransactions(list) {
    try {
      window.localStorage.setItem(STORAGE_KEY, serialize(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  // View: render the transaction list (textContent only) and toggle the empty state.
  function renderList(list) {
    const items = list || [];
    const ul = document.getElementById('transaction-list');
    const empty = document.getElementById('empty-state');
    if (ul) {
      ul.textContent = '';
      items.forEach(function (t) {
        const li = document.createElement('li');
        li.setAttribute('data-id', t.id);

        const name = document.createElement('span');
        name.className = 'item-name';
        name.textContent = t.name;

        const amount = document.createElement('span');
        amount.className = 'item-amount';
        amount.textContent = formatCurrency(t.amountCents);

        const category = document.createElement('span');
        category.className = 'item-category';
        category.textContent = t.category;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'delete-btn';
        btn.setAttribute('data-id', t.id);
        btn.setAttribute('aria-label', 'Delete ' + t.name);
        btn.textContent = 'Delete';

        li.appendChild(name);
        li.appendChild(amount);
        li.appendChild(category);
        li.appendChild(btn);
        ul.appendChild(li);
      });
    }
    if (empty) empty.hidden = items.length > 0;
  }

  // View: render the total balance; data is never altered.
  function renderTotal(list) {
    const el = document.getElementById('total-balance');
    if (!el) return;
    const total = sumCents(list);
    el.textContent = total > MAX_CENTS
      ? 'Maximum displayable balance exceeded'
      : formatCurrency(total);
  }

  const CATEGORY_COLORS = { Food: '#e4572e', Transport: '#2e86ab', Fun: '#f2b134' };

  // Pure: chart labels/values/colors for categories with a total above 0.
  function chartData(totals) {
    const labels = [];
    const values = [];
    const colors = [];
    CATEGORIES.forEach(function (c) {
      const v = totals && totals[c];
      if (v > 0) {
        labels.push(c);
        values.push(v);
        colors.push(CATEGORY_COLORS[c]);
      }
    });
    return { labels: labels, values: values, colors: colors };
  }

  // View: create/update the pie chart. Never throws; data is never altered.
  function renderChart(totals) {
    const canvas = document.getElementById('spending-chart');
    const msg = document.getElementById('chart-message');
    if (!canvas || !msg) return;
    const d = chartData(totals);

    function showMessage(text, hideCanvas) {
      canvas.hidden = hideCanvas;
      msg.textContent = text;
      msg.hidden = false;
    }

    if (typeof Chart === 'undefined') {
      chart = null;
      showMessage('Chart unavailable', true);
      return;
    }

    if (d.values.length === 0) {
      canvas.hidden = true;
      msg.textContent = 'No spending data to display yet.';
      msg.hidden = false;
      return;
    }

    try {
      if (chart) {
        chart.data.labels = d.labels;
        chart.data.datasets[0].data = d.values;
        chart.data.datasets[0].backgroundColor = d.colors;
        chart.update();
      } else {
        chart = new Chart(canvas, {
          type: 'pie',
          data: {
            labels: d.labels,
            datasets: [{ data: d.values, backgroundColor: d.colors }]
          },
          options: { plugins: { legend: { display: true } } }
        });
      }
      canvas.hidden = false;
      msg.textContent = '';
      msg.hidden = true;
    } catch (e) {
      try { if (chart) chart.destroy(); } catch (e2) { /* ignore */ }
      chart = null;
      showMessage('Chart unavailable', true);
    }
  }

  const BANNER_MESSAGES = {
    loadFailed: 'Saved data could not be loaded',
    saveFailed: 'Data was not saved'
  };
  const FORM_FIELDS = { name: 'item-name', amount: 'amount', category: 'category' };

  // View: show an inline error beside each invalid field at once.
  // Entered values are left untouched.
  function showFormErrors(errors) {
    const errs = errors || {};
    Object.keys(FORM_FIELDS).forEach(function (key) {
      const el = document.getElementById(FORM_FIELDS[key] + '-error');
      const input = document.getElementById(FORM_FIELDS[key]);
      const msg = typeof errs[key] === 'string' ? errs[key] : '';
      if (el) el.textContent = msg;
      if (input) {
        if (msg) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    });
  }

  // View: clear all inline errors; entered values are kept.
  function clearFormErrors() {
    showFormErrors({});
  }

  // View: show a banner message. kind: 'loadFailed' | 'saveFailed' (or raw text).
  // Call with no argument (or '') to hide it.
  function showBanner(kind) {
    const el = document.getElementById('banner');
    if (!el) return;
    const text = kind ? (BANNER_MESSAGES[kind] || String(kind)) : '';
    el.textContent = text;
    el.hidden = text === '';
  }

  // View: redraw list, total, and chart from state. Each part is isolated so a
  // failure in one (e.g. chart) cannot stop the others from updating.
  function render() {
    try { renderList(transactions); } catch (e) { /* keep going */ }
    try { renderTotal(transactions); } catch (e) { /* keep going */ }
    try { renderChart(categoryTotals(transactions)); } catch (e) { /* chart errors isolated */ }
  }

  // Controller: validate, add, save, re-render. Returns true if added.
  function addTransaction(rawInput) {
    const result = validateInput(rawInput);
    if (!result.valid) {
      showFormErrors(result.errors);
      return false;
    }
    const t = {
      id: generateId(),
      name: result.value.name,
      amountCents: result.value.amountCents,
      category: result.value.category
    };
    transactions = addToList(transactions, t);
    if (!saveTransactions(transactions)) showBanner('saveFailed');
    clearFormErrors();
    render();
    return true;
  }

  // Controller: remove by id, save, re-render.
  function deleteTransaction(id) {
    transactions = removeFromList(transactions, id);
    if (!saveTransactions(transactions)) showBanner('saveFailed');
    render();
  }

  // Startup wiring.
  function init() {
    const loaded = loadTransactions();
    transactions = loaded.transactions;
    if (loaded.status === 'corrupt') showBanner('loadFailed');
    else showBanner();

    const form = document.getElementById('input-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const added = addTransaction({
          name: document.getElementById('item-name').value,
          amount: document.getElementById('amount').value,
          category: document.getElementById('category').value
        });
        if (added) {
          form.reset();
          document.getElementById('category').value = '';
        }
      });
    }

    // Event delegation for delete buttons built by renderList.
    const list = document.getElementById('transaction-list');
    if (list) {
      list.addEventListener('click', function (e) {
        const btn = e.target.closest ? e.target.closest('.delete-btn') : null;
        if (btn) deleteTransaction(btn.getAttribute('data-id'));
      });
    }

    render();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Public API.
  const api = {
    CATEGORIES: CATEGORIES,
    STORAGE_KEY: STORAGE_KEY,
    MAX_CENTS: MAX_CENTS,
    parseAmountToCents: parseAmountToCents,
    validateInput: validateInput,
    formatCurrency: formatCurrency,
    sumCents: sumCents,
    categoryTotals: categoryTotals,
    serialize: serialize,
    deserialize: deserialize,
    addToList: addToList,
    removeFromList: removeFromList,
    generateId: generateId,
    loadTransactions: loadTransactions,
    saveTransactions: saveTransactions,
    renderList: renderList,
    renderTotal: renderTotal,
    chartData: chartData,
    renderChart: renderChart,
    showFormErrors: showFormErrors,
    clearFormErrors: clearFormErrors,
    showBanner: showBanner,
    render: render,
    addTransaction: addTransaction,
    deleteTransaction: deleteTransaction
  };

  if (typeof window !== 'undefined') {
    window.ExpenseApp = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
