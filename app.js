// app.js

alert("app.js подключился ✅");

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

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

function rub(n){
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(Math.round(n));
  return sign + v.toLocaleString("ru-RU") + " ₽";
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

let tx = loadTx(); // {id, type: 'expense'|'income', amount, categoryId, note, createdAt}
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
  CATEGORIES.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "cat" + (c.id === selectedCategoryId ? " active" : "");
    btn.type = "button";
    btn.innerHTML = `<span>${c.icon}</span><span>${c.name}</span>`;
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
  const {balance, monthIncome, monthExpense} = calc();

  $("#balance").textContent = rub(balance);
  $("#monthIncome").textContent = "+" + rub(monthIncome).replace("-", "");
  $("#monthExpense").textContent = "-" + rub(monthExpense).replace("-", "");

  const recent = [...tx]
    .sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0,5);

  const list = $("#recentList");
  list.innerHTML = "";

  if(recent.length === 0){
    $("#recentEmpty").style.display = "block";
  } else {
    $("#recentEmpty").style.display = "none";
    recent.forEach(t => list.appendChild(renderItem(t)));
  }
}

function renderItem(t){
  const cat = CATEGORIES.find(c => c.id === t.categoryId) || CATEGORIES[CATEGORIES.length-1];
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
    const line = document.createElement("div");
    line.className = "item";
    line.innerHTML = `
      <div class="item-left">
        <div class="item-ico">${r.cat.icon}</div>
        <div>
          <div class="item-title">${r.cat.name}</div>
          <div class="item-sub">Доля: ${Math.round((r.amount/sum)*100)}%</div>
        </div>
      </div>
      <div class="item-amt minus">- ${rub(r.amount).replace("-", "")}</div>
    `;
    root.appendChild(line);
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
  $$(".seg").forEach(b => b.addEventListener("click", ()=>{
    $$(".seg").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    selectedType = b.dataset.type;
  }));

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
  setPage("overview");
}

init();
document.getElementById('openSettings')?.addEventListener('click', () => {
  alert('Настройки скоро будут 🙂');
});
