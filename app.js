console.log("app.js подключился ✅");

// =======================
// Helpers
// =======================

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const LS_KEY = "my_finance_transactions_v1";

// =======================
// Категории
// =======================

const EXPENSE_CATEGORIES = [
  { id: "products", name: "Продукты", icon: "🛒" },
  { id: "fuel", name: "Бензин", icon: "⛽" },
  { id: "insurance", name: "Страховка", icon: "🛡️" },
  { id: "transport", name: "Транспорт", icon: "🚌" },
  { id: "home", name: "Жильё", icon: "🏠" },
  { id: "clothes", name: "Одежда", icon: "👗" },
  { id: "health", name: "Здоровье", icon: "💊" },
  { id: "fun", name: "Развлечения", icon: "🎮" },
  { id: "subs", name: "Подписки", icon: "📱" },
  { id: "other", name: "Другое", icon: "📦" }
];

const INCOME_CATEGORIES = [
  { id: "salary", name: "Зарплата", icon: "💼" },
  { id: "freelance", name: "Фриланс", icon: "💻" },
  { id: "gift", name: "Подарок", icon: "🎁" }
];

// =======================
// Форматирование
// =======================

function formatMoney(n) {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(Math.round(n));
  return sign + v.toLocaleString("ru-RU") + " ₽";
}

// =======================
// Работа с LocalStorage
// =======================

function loadTransactions() {
  const data = localStorage.getItem(LS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveTransactions(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

// =======================
// Рендер
// =======================

function render() {
  const list = loadTransactions();
  const container = $("#history");

  if (!container) return;

  container.innerHTML = "";

  let total = 0;

  list.forEach(tx => {
    total += tx.amount;

    const div = document.createElement("div");
    div.className = "tx-item";

    div.innerHTML = `
      <div>${tx.icon} ${tx.name}</div>
      <div>${formatMoney(tx.amount)}</div>
    `;

    container.appendChild(div);
  });

  const totalEl = $("#total");
  if (totalEl) {
    totalEl.textContent = formatMoney(total);
  }
}

// =======================
// Добавление операции
// =======================

function addTransaction(type) {
  const amountInput = $("#amount");
  const categorySelect = $("#category");

  const amount = Number(amountInput.value);
  const categoryId = categorySelect.value;

  if (!amount || !categoryId) return;

  const categories =
    type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const category = categories.find(c => c.id === categoryId);

  const tx = {
    id: Date.now(),
    type,
    name: category.name,
    icon: category.icon,
    amount: type === "income" ? amount : -amount
  };

  const list = loadTransactions();
  list.push(tx);
  saveTransactions(list);

  amountInput.value = "";
  render();
}

// =======================
// Инициализация
// =======================

function init() {
  const incomeBtn = $("#addIncome");
  const expenseBtn = $("#addExpense");

  if (incomeBtn) {
    incomeBtn.addEventListener("click", () => addTransaction("income"));
  }

  if (expenseBtn) {
    expenseBtn.addEventListener("click", () => addTransaction("expense"));
  }

  render();
}

document.addEventListener("DOMContentLoaded", init);
