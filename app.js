let overviewPeriod = localStorage.getItem("mf_overview_period") || "30";
// варианты: "today", "7", "30", "all"
alert("app.js загружен");
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
});
const LS_KEY = "my_finance_transactions_v1";

const CATEGORIES = [
 { id: "products", name: "Продукты", icon: "🛒" },
 { id: "fuel", name: "Бензин", icon: "⛽" },
 { id: "insurance", name: "Страховка", icon: "🛡️" },
 { id: "transport", name: "Транспорт", icon: "🚗" },
 { id: "home", name: "Жильё", icon: "🏠" },
 { id: "clothes", name: "Одежда", icon: "👗" },
 { id: "health", name: "Здоровье", icon: "💊" },
 { id: "fun", name: "Развлечения", icon: "🎮" },
 { id: "subs", name: "Подписки", icon: "📱" },
 { id: "other", name: "Другое", icon: "📦" },
];
const INCOME_CATEGORIES = [
 { id: "salary", name: "Зарплата", icon: "💼" },
 { id: "freelance", name: "Фриланс", icon: "🧑‍💻" },
 { id: "gifts", name: "Подарки", icon: "🎁" },
 { id: "investments", name: "Инвестиции", icon: "💰" },
 { id: "other_income", name: "Другое", icon: "📦" }
];
   // ===== Settings =====
const SETTINGS_KEY = "mf_settings";

const defaultSettings = {
 theme: "dark",      // "dark" | "light"
 currency: "RUB"     // "RUB" | "EUR" | "USD"
};

function loadSettings() {
 try {
   const raw = localStorage.getItem(SETTINGS_KEY);
   if (!raw) return { ...defaultSettings };
   const parsed = JSON.parse(raw);
   return { ...defaultSettings, ...parsed };
 } catch (e) {
   return { ...defaultSettings };
 }
}

function saveSettings(settings) {
 localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applyTheme(theme) {
 // Светлая тема у тебя уже через body.theme-light — сохраняем это
 document.body.classList.toggle("theme-light", theme === "light");
}

function getCurrencySymbol(code) {
 if (code === "RUB") return "₽";
 if (code === "EUR") return "€";
 if (code === "USD") return "$";
 return code;
}

// Глобально доступно для форматирования сумм
let settings = loadSettings();

function initSettingsUI() {
 const themeSelect = document.getElementById("settingTheme");
 const currencySelect = document.getElementById("settingCurrency");

 // Если ты ещё не добавил HTML — просто выходим, ничего не ломаем
 if (!themeSelect || !currencySelect) return;

 // Проставляем текущие значения
 themeSelect.value = settings.theme;
 currencySelect.value = settings.currency;

 // Слушатели
 themeSelect.addEventListener("change", () => {
   settings.theme = themeSelect.value;
   applyTheme(settings.theme);
   saveSettings(settings);
   // если у тебя есть тосты — можно показать тут
 });

 currencySelect.addEventListener("change", () => {
   settings.currency = currencySelect.value;
   saveSettings(settings);

   // Важно: после смены валюты нужно перерисовать суммы на экране
   // Подставь свои функции рендера:
   if (typeof renderOverview === "function") renderOverview();
   if (typeof renderHistory === "function") renderHistory();
   if (typeof renderAnalysis === "function") renderAnalysis();
 });
}

// Применяем настройки при старте
applyTheme(settings.theme);                                                  
 function rub(n){
 const sign = n < 0 ? "-" : "";
 const v = Math.abs(Math.round(n));

 const symbol = getCurrencySymbol(settings.currency);

 return sign + v.toLocaleString("ru-RU") + " " + symbol;
}

function nowISO(){
 const d = new Date();
 const pad = (x) => String(x).padStart(2,"0");
 return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function monthKey(d){
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

function loadTx(){
 try{
   const raw = localStorage.getItem(LS_KEY);
   const arr = raw ? JSON.parse(raw) : [];
   return Array.isArray(arr) ? arr : [];
 }catch{ return []; }
}

function saveTx(arr){
 localStorage.setItem(LS_KEY, JSON.stringify(arr));
}
// === Budgets ===
const BUDGETS_KEY = "mf_budgets";

function loadBudgets() {
 try {
   const raw = localStorage.getItem(BUDGETS_KEY);
   const obj = raw ? JSON.parse(raw) : {};
   return typeof obj === "object" && obj !== null ? obj : {};
 } catch {
   return {};
 }
}

function saveBudgets(obj) {
 localStorage.setItem(BUDGETS_KEY, JSON.stringify(obj));
}

let tx = loadTx(); // {id, type: 'expense'|'income', amount, categoryId, note, createdAt}
let budgets = loadBudgets();
function getCategoryExpensesThisMonth(categoryId) {
 const now = new Date();
 const month = now.getMonth();
 const year = now.getFullYear();

 return tx
   .filter(t =>
     t.type === "expense" &&
     t.categoryId === categoryId &&
     new Date(t.createdAt).getMonth() === month &&
new Date(t.createdAt).getFullYear() === year
   )
   .reduce((sum, t) => sum + t.amount, 0);
}
let selectedType = "expense";
let selectedCategoryId = "products";
let activePage = "overview";
let analysisMonth = new Date();

function setPage(page){
 activePage = page;
 $$(".page").forEach(p => p.classList.toggle("active", p.dataset.page === page));
 $$(".navItem").forEach(b => b.classList.toggle("active", b.dataset.go === page));

 const titles = {overview:"Обзор", analysis:"Анализ", history:"История", profile:"Профиль"};
 $("#pageTitle").textContent = titles[page] || "Мои финансы";

 if(page === "history") renderHistory();
 if(page === "analysis") renderAnalysis();
 if(page === "overview") renderOverview();
}

function openModal(){
 $("#modal").classList.add("open");
 $("#amountInput").value = "";
 $("#noteInput").value = "";
 $("#amountInput").focus();
}
function closeModal(){
 $("#modal").classList.remove("open");
}

function renderCats(){
 const root = $("#cats");
 root.innerHTML = "";

 const list = selectedType === "income"
   ? INCOME_CATEGORIES
   : CATEGORIES;

 list.forEach(c => {
   const btn = document.createElement("button");
   btn.className = "cat" + (c.id === selectedCategoryId ? " active" : "");
   btn.type = "button";
   btn.innerHTML = `<span>${c.icon}</span>${c.name}`;

   btn.addEventListener("click", () => {
     selectedCategoryId = c.id;
     renderCats();
   });

   root.appendChild(btn);
 });
}

function monthRange(d){
 const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
 const end = new Date(d.getFullYear(), d.getMonth()+1, 1, 0, 0, 0);
 return {start, end};
}

function calc(){
 let balance = 0;
 tx.forEach(t => {
   balance += (t.type === "income" ? t.amount : -t.amount);
 });

 const {start, end} = monthRange(new Date());
 let monthIncome = 0;
 let monthExpense = 0;
 tx.forEach(t => {
   const dt = new Date(t.createdAt);
   if(dt >= start && dt < end){
     if(t.type === "income") monthIncome += t.amount;
     else monthExpense += t.amount;
   }
 });

 return {balance, monthIncome, monthExpense};
}

function renderOverview(){
 let filtered = [...tx];

const now = new Date();
now.setHours(0,0,0,0);

if (overviewPeriod === "today") {
  filtered = filtered.filter(t => {
    const d = new Date(t.createdAt);
    d.setHours(0,0,0,0);
    return d.getTime() === now.getTime();
  });

} else if (overviewPeriod === "7") {
  const past = new Date(now);
  past.setDate(past.getDate() - 7);
  filtered = filtered.filter(t => new Date(t.createdAt) >= past);

} else if (overviewPeriod === "30") {
  const past = new Date(now);
  past.setDate(past.getDate() - 30);
  filtered = filtered.filter(t => new Date(t.createdAt) >= past);

} else if (overviewPeriod === "all") {
  filtered = [...tx];
}
 // считаем правильно по типу операции
let income = 0;
let expense = 0;

filtered.forEach(t => {
 const amount = Number(t.amount) || 0;
 const type = t.type; // income / expense

 if (type === "income") income += amount;
 else if (type === "expense") expense += amount;
 else {
   // запасной вариант если вдруг где-то знак
   if (amount >= 0) income += amount;
   else expense += Math.abs(amount);
 }
});

const balance = income - expense;
const monthIncome = income;
const monthExpense = expense;

 $("#balance").textContent = rub(balance);
 $("#monthIncome").textContent = "+" + rub(monthIncome).replace("-", "");
 $("#monthExpense").textContent = "-" + rub(monthExpense).replace("-", "");

 const recent = [...filtered]
 .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
 .slice(0, 5);

 const list = $("#recentList");
 list.innerHTML = "";

 if(recent.length === 0){
   $("#recentEmpty").style.display = "block";
 } else {
   $("#recentEmpty").style.display = "none";
   recent.forEach(t => list.appendChild(renderItem(t)));
 }
}
// Делаем функцию доступной из HTML (onclick)
window.setOverviewPeriod = function (period) {
  overviewPeriod = period;
  localStorage.setItem("mf_overview_period", overviewPeriod);

  const buttons = Array.from(document.querySelectorAll(".period-buttons button"));
  const map = { today: 0, "7": 1, "30": 2, all: 3 };
  const idx = map[period];

  buttons.forEach((b, i) => {
    b.classList.toggle("active", i === idx);
  });

  renderOverview();
};
function renderItem(t){
 const list = t.type === "income" ? INCOME_CATEGORIES : CATEGORIES;
const cat = list.find(c => c.id === t.categoryId) || { name: "Без категории", icon: "❓" };
 const dt = new Date(t.createdAt);

 const el = document.createElement("div");
 el.className = "item";

 const amtClass = t.type === "income" ? "plus" : "minus";
 const sign = t.type === "income" ? "+" : "-";

 el.innerHTML = `
   <div class="item-left">
     <div class="item-ico">${cat.icon}</div>
     <div>
       <div class="item-title">${cat.name}</div>
       <div class="item-sub">${dt.toLocaleDateString("ru-RU", { day:"2-digit", month:"short" })}${t.note ? " • " + escapeHtml(t.note) : ""}</div>
     </div>
   </div>
   <div class="item-amt ${amtClass}">${sign} ${rub(t.amount).replace("-", "")}</div>
 `;

 el.addEventListener("click", () => {
   const ok = confirm("Удалить эту запись?");
   if(!ok) return;
   tx = tx.filter(x => x.id !== t.id);
   saveTx(tx);
   renderOverview();
   renderHistory();
   renderAnalysis();
 });

 return el;
}

function escapeHtml(s){
 return String(s).replace(/[&<>"']/g, (c) => ({
   "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
 }[c]));
}

function renderHistory(){
 const q = ($("#searchInput").value || "").toLowerCase().trim();
 const list = $("#historyList");
 list.innerHTML = "";

 const items = [...tx].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))
   .filter(t => {
     if(!q) return true;
     const cat = CATEGORIES.find(c => c.id === t.categoryId);
     return (cat?.name || "").toLowerCase().includes(q) || (t.note || "").toLowerCase().includes(q);
   });

 if(items.length === 0){
   $("#historyEmpty").style.display = "block";
 } else {
   $("#historyEmpty").style.display = "none";
   items.forEach(t => list.appendChild(renderItem(t)));
 }
}

function renderAnalysis(){
 const title = $("#monthTitle");
 title.textContent = analysisMonth.toLocaleDateString("ru-RU", { month:"long", year:"numeric" });

 const {start, end} = monthRange(analysisMonth);
 const monthTx = tx.filter(t => {
   const dt = new Date(t.createdAt);
   return dt >= start && dt < end && t.type === "expense";
 });

 const sum = monthTx.reduce((a,t)=>a+t.amount,0);
 $("#periodExpense").textContent = rub(sum);

 if(monthTx.length === 0){
   $("#analysisEmpty").style.display = "block";
   $("#categoryBreakdown").innerHTML = "";
   return;
 }
 $("#analysisEmpty").style.display = "none";

 const byCat = new Map();
 monthTx.forEach(t => byCat.set(t.categoryId, (byCat.get(t.categoryId)||0) + t.amount));

 const rows = [...byCat.entries()]
   .map(([categoryId, amount]) => {
     const cat = CATEGORIES.find(c=>c.id===categoryId) || {name:"Другое", icon:"📦"};
     return {cat, amount};
   })
   .sort((a,b)=> b.amount - a.amount);

 const root = $("#categoryBreakdown");
 root.innerHTML = "";

 rows.forEach(r => {
   const spent = r.amount;
const limit = budgets[r.cat.id] || 0;
const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
   const line = document.createElement("div");
   line.className = "item";
  line.innerHTML = `
 <div class="item-left">
   <div class="item-ico">${r.cat.icon}</div>
   <div>
     <div class="item-title">${r.cat.name}</div>
     <div class="item-sub">Доля: ${Math.round((r.amount / sum) * 100)}%</div>

     ${limit > 0 ? `
       <div class="item-sub">
         ${rub(spent)} из ${rub(limit)} (${Math.round(percent)}%)
       </div>
       <div class="progress">
         <div class="progress-fill"
              style="width:${percent}%; background:${percent >= 100 ? '#ef4444' : '#3b82f6'}">
         </div>
       </div>
     ` : ''}
   </div>
 </div>

 <div class="item-amt minus">- ${rub(spent)}</div>
`;

   root.appendChild(line);
 line.addEventListener("click", () => {
 const value = prompt("Введите бюджет для категории:", limit || "");
 if (value === null) return;

 const num = Number(value);
 if (!isNaN(num) && num >= 0) {
   budgets[r.cat.id] = num;
   saveBudgets(budgets);
   renderAnalysis();
 } else {
   alert("Введите число, например 5000");
 }
});
 });
}

function init(){
 // Nav
 $$(".navItem").forEach(b => b.addEventListener("click", ()=> setPage(b.dataset.go)));
 $("#btnSeeAll").addEventListener("click", ()=> setPage("history"));

 // Add modal
 $("#openAdd").addEventListener("click", openModal);
 $("#closeAdd").addEventListener("click", closeModal);
 $("#modal").addEventListener("click", (e)=> { if(e.target.id === "modal") closeModal(); });

 // Segmented type
 $$(".seg").forEach(b => b.addEventListener("click", (e) => {
 e.preventDefault();

 $$(".seg").forEach(x => x.classList.remove("active"));
 b.classList.add("active");

 selectedType = b.dataset.type;

 // ВАЖНО: сначала определяем список
 const list = selectedType === "income"
   ? INCOME_CATEGORIES
   : CATEGORIES;

 // Ставим первую категорию как выбранную
 selectedCategoryId = list[0].id;

 // Перерисовываем кнопки
 renderCats();
}));

 const list = selectedType === "income" ? INCOME_CATEGORIES : CATEGORIES;
 selectedCategoryId = list[0].id;
 renderCats();

 // Categories
 renderCats();

 // Save transaction
 $("#saveTx").addEventListener("click", ()=>{
   const amount = Number(String($("#amountInput").value).replace(/\s/g,"").replace(",","."));
   if(!amount || amount <= 0){
     alert("Введите сумму больше 0");
     return;
   }
   const note = ($("#noteInput").value || "").trim();

   const t = {
     id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
     type: selectedType,
     amount: Math.round(amount),
     categoryId: selectedCategoryId,
     note,
     createdAt: nowISO()
   };
   tx.push(t);
   saveTx(tx);

   closeModal();
   renderOverview();
   renderHistory();
   renderAnalysis();
 });

 // Search
 $("#searchInput").addEventListener("input", renderHistory);

 // Month switch
 $("#prevMonth").addEventListener("click", ()=>{
   analysisMonth = new Date(analysisMonth.getFullYear(), analysisMonth.getMonth()-1, 1);
   renderAnalysis();
 });
 $("#nextMonth").addEventListener("click", ()=>{
   analysisMonth = new Date(analysisMonth.getFullYear(), analysisMonth.getMonth()+1, 1);
   renderAnalysis();
 });

 // Profile actions
 $("#btnClearAll").addEventListener("click", ()=>{
   const ok = confirm("Точно очистить все данные?");
   if(!ok) return;
   tx = [];
   saveTx(tx);
   renderOverview();
   renderHistory();
   renderAnalysis();
   alert("Готово: всё очищено");
 });

 $("#btnSettings").addEventListener("click", ()=>{
   alert("Настройки можно добавить следующими: валюта, тема, экспорт/импорт данных.");
 });

 // Share
 $("#btnShare").addEventListener("click", async ()=>{
   const url = location.href;
   try{
     if(navigator.share) {
       await navigator.share({ title: "Мои финансы", url });
     } else {
       await navigator.clipboard.writeText(url);
       alert("Ссылка скопирована!");
     }
   }catch{}
 });

 // First render
 // кнопка "См. все" в блоке "Недавние"
const btnSeeAll = document.getElementById("btnSeeAll");
if (btnSeeAll) {
 btnSeeAll.addEventListener("click", () => {
   setPage("history");
 });
}
   // Period buttons
document.querySelectorAll(".period-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".period-buttons button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    overviewPeriod = btn.dataset.period;
    localStorage.setItem("mf_overview_period", overviewPeriod);
    renderOverview();
  });
});
 setPage("overview");
}
document.addEventListener("DOMContentLoaded", () => {
 initSettingsUI();
 init();

});
// ==============================
// PROFILE NAME → GREETING
// ==============================
(function () {
 const nameInput = document.getElementById('profileName');
 const greetEl = document.getElementById('profileGreeting');

 if (!greetEl) return;

 const storageKey = 'mf_profile_name';

 function renderGreeting(name) {
   const n = (name || '').trim();
   greetEl.textContent = n ? `Привет, ${n} 👋` : 'Привет 👋';
 }

 // init from storage
 const saved = localStorage.getItem(storageKey) || '';
 if (nameInput) nameInput.value = saved;
 renderGreeting(saved);

 // live update + save
 if (nameInput) {
   nameInput.addEventListener('input', () => {
     const v = nameInput.value;
     localStorage.setItem(storageKey, v);
     renderGreeting(v);
   });
 }
})();
// ===== Имя пользователя =====

function getUserName() {
 const raw = localStorage.getItem("userName") || "";
 return raw.trim();
}

function setGreeting() {
 const el = document.getElementById("profileGreeting");
 if (!el) return;

 const name = getUserName();
 el.textContent = name ? `Привет, ${name} 👋` : "Привет 👋";
}

document.addEventListener("DOMContentLoaded", () => {
 const input = document.getElementById("userNameInput");

 // Подставляем имя в поле при загрузке
 if (input) {
   input.value = getUserName();

   input.addEventListener("input", () => {
     const value = input.value.trim().slice(0, 20);
     localStorage.setItem("userName", value);
     setGreeting();
   });
 }

 // Обновляем приветствие
 setGreeting();
});
