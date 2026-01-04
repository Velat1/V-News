const $ = (s) => document.querySelector(s);

const listEl = $("#list");
const detailEl = $("#detail");
const searchEl = $("#search");
const categoryEl = $("#category");
const sortEl = $("#sort");

const dTitle = $("#d-title");
const dDate = $("#d-date");
const dCategory = $("#d-category");
const dTeaser = $("#d-teaser");
const dContent = $("#d-content");
const backBtn = $("#back");

let allNews = [];
let filtered = [];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "2-digit" });
}

function renderCategories(items) {
  const cats = Array.from(new Set(items.map(n => n.category))).sort((a,b)=>a.localeCompare(b));
  categoryEl.innerHTML = `<option value="all">Alle Kategorien</option>` +
    cats.map(c => `<option value="${c}">${c}</option>`).join("");
}

function applyFilters() {
  const q = searchEl.value.trim().toLowerCase();
  const cat = categoryEl.value;
  const sort = sortEl.value;

  filtered = allNews.filter(n => {
    const hay = `${n.title} ${n.teaser} ${n.category} ${(n.content || []).join(" ")}`.toLowerCase();
    const matchesQ = !q || hay.includes(q);
    const matchesCat = cat === "all" || n.category === cat;
    return matchesQ && matchesCat;
  });

  filtered.sort((a,b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return sort === "newest" ? (db - da) : (da - db);
  });

  renderList();
}

function renderList() {
  detailEl.classList.add("hidden");
  listEl.classList.remove("hidden");

  if (!filtered.length) {
    listEl.innerHTML = `<p class="teaser">Keine Treffer.</p>`;
    return;
  }

  listEl.innerHTML = filtered.map(n => `
    <div class="card" data-id="${n.id}">
      <h3>${n.title}</h3>
      <div class="meta">${formatDate(n.date)} <span class="tag">${n.category}</span></div>
      <p class="teaser">${n.teaser}</p>
    </div>
  `).join("");

  listEl.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openDetail(card.dataset.id));
  });
}

function openDetail(id) {
  const n = allNews.find(x => x.id === id);
  if (!n) return;

  listEl.classList.add("hidden");
  detailEl.classList.remove("hidden");

  dTitle.textContent = n.title;
  dDate.textContent = formatDate(n.date);
  dCategory.textContent = n.category;
  dTeaser.textContent = n.teaser;

  dContent.innerHTML = (n.content || []).map(p => `<p>${escapeHtml(p)}</p>`).join("");

  history.pushState({ id }, "", `#${id}`);
}

function escapeHtml(str) {
  return str.replaceAll("&","&amp;")
            .replaceAll("<","&lt;")
            .replaceAll(">","&gt;")
            .replaceAll('"',"&quot;")
            .replaceAll("'","&#039;");
}

backBtn.addEventListener("click", () => {
  history.pushState({}, "", "#");
  renderList();
});

window.addEventListener("popstate", () => {
  const id = location.hash.replace("#", "");
  if (id) openDetail(id);
  else renderList();
});

searchEl.addEventListener("input", applyFilters);
categoryEl.addEventListener("change", applyFilters);
sortEl.addEventListener("change", applyFilters);

(async function init() {
  $("#year").textContent = new Date().getFullYear();

  const res = await fetch("news.json");
  allNews = await res.json();

  renderCategories(allNews);
  applyFilters();

  const id = location.hash.replace("#", "");
  if (id) openDetail(id);
})();
