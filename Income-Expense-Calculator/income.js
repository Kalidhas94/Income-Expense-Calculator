const STORAGE_KEY = 'ieEntries';
let entries = [];
const entryForm = document.getElementById('entryForm');
const descriptionEl = document.getElementById('description');
const amountEl = document.getElementById('amount');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const editingIdEl = document.getElementById('editingId');
const entriesList = document.getElementById('entriesList');
const emptyState = document.getElementById('emptyState');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const balanceEl = document.getElementById('balance');
loadFromStorage();
render();
entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const type = entryForm.type.value;
  const description = descriptionEl.value.trim();
  const amount = parseFloat(amountEl.value);

  if (!description) { alert('Please enter a description.'); return; }
  if (!amount || isNaN(amount)) { alert('Please enter a valid amount.'); return; }

  const editingId = editingIdEl.value;
  if (editingId) {
    const idx = entries.findIndex(ent => ent.id === editingId);
    if (idx !== -1) {
      entries[idx].type = type;
      entries[idx].description = description;
      entries[idx].amount = amount;
      entries[idx].updatedAt = Date.now();
      saveToStorage();
      clearForm();
      render();
      submitBtn.textContent = 'Add Entry';
      return;
    }
  }

  const newEntry = {
    id: cryptoRandomId(),
    type,
    description,
    amount,
    createdAt: Date.now()
  };
  entries.unshift(newEntry);
  saveToStorage();
  clearForm();
  render();
});

resetBtn.addEventListener('click', () => {
  clearForm();
});

const filterRadios = document.querySelectorAll('.filter-radio');
filterRadios.forEach(r => r.addEventListener('change', render));

entriesList.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.classList.contains('edit-btn')) {
    startEdit(id);
  } else if (btn.classList.contains('delete-btn')) {
    if (confirm('Delete this entry?')) {
      entries = entries.filter(en => en.id !== id);
      saveToStorage();
      render();
    }
  }
});

function loadFromStorage(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    entries = raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse storage', err);
    entries = [];
  }
}

function saveToStorage(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function render(){
  const filter = document.querySelector('input[name="filter"]:checked').value;
  const filtered = entries.filter(en => filter === 'all' ? true : en.type === filter);
  entriesList.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach(en => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between p-3 rounded-lg border border-slate-100';

      const left = document.createElement('div');
      left.className = 'flex items-center gap-4';

      const badge = document.createElement('div');
      badge.className = 'flex items-center justify-center w-10 h-10 rounded-full text-white font-medium';
      badge.textContent = en.type === 'income' ? 'I' : 'E';
      badge.classList.add(en.type === 'income' ? 'bg-emerald-500' : 'bg-red-500');

      const meta = document.createElement('div');
      const desc = document.createElement('div');
      desc.className = 'font-medium';
      desc.textContent = en.description;
      const metaSmall = document.createElement('div');
      metaSmall.className = 'text-xs text-slate-500';
      const date = new Date(en.createdAt).toLocaleString();
      metaSmall.textContent = `${en.type} • ${date}`;
      meta.appendChild(desc);
      meta.appendChild(metaSmall);

      left.appendChild(badge);
      left.appendChild(meta);

      const right = document.createElement('div');
      right.className = 'flex items-center gap-4';
      const amt = document.createElement('div');
      amt.className = 'font-semibold currency';
      amt.textContent = formatCurrency(en.type === 'expense' ? -en.amount : en.amount);

      const actions = document.createElement('div');
      actions.className = 'flex items-center gap-2';

      const editBtn = document.createElement('button');
      editBtn.className = 'px-2 py-1 text-xl edit-btn';
      editBtn.dataset.id = en.id;
      editBtn.textContent = '🖊';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'px-3 py-1 text-xl delete-btn';
      deleteBtn.dataset.id = en.id;
      deleteBtn.textContent = '⛔';
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      right.appendChild(amt);
      right.appendChild(actions);

      li.appendChild(left);
      li.appendChild(right);

      entriesList.appendChild(li);
    });
  }

  const totals = entries.reduce((acc, cur) => {
    if (cur.type === 'income') acc.income += Number(cur.amount);
    else acc.expense += Number(cur.amount);
    return acc;
  }, { income: 0, expense: 0 });

  totalIncomeEl.textContent = formatCurrency(totals.income);
  totalExpenseEl.textContent = formatCurrency(totals.expense);
  balanceEl.textContent = formatCurrency(totals.income - totals.expense);
}

function startEdit(id){
  const ent = entries.find(en => en.id === id);
  if (!ent) return;
  entryForm.type.value = ent.type;
  descriptionEl.value = ent.description;
  amountEl.value = ent.amount;
  editingIdEl.value = ent.id;
  submitBtn.textContent = 'Update Entry';
  descriptionEl.focus();
}

function clearForm(){
  entryForm.reset();
  descriptionEl.value = '';
  amountEl.value = '';
  editingIdEl.value = '';
  submitBtn.textContent = 'Add Entry';
}

function cryptoRandomId(){
  return 'id_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function formatCurrency(value){
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
}

[descriptionEl, amountEl].forEach(inp => {
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') clearForm();
  });
});
