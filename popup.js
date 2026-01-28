// FocusGuard — Popup Controller

document.addEventListener("DOMContentLoaded", init);

let currentState = null;
let categories = null;
let focusInterval = null;

async function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg);
}

async function init() {
  const res = await sendMsg({ type: "GET_STATE" });
  currentState = res.state;
  categories = res.categories;

  renderMasterToggle();
  renderBlockedList();
  renderCategories();
  renderStats();
  renderSchedule();
  checkFocusSession();
  setupTabs();
  setupListeners();
}

// ── Tabs ──

function setupTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
    });
  });
}

// ── Master Toggle ──

function renderMasterToggle() {
  const toggle = document.getElementById("masterToggle");
  toggle.checked = currentState.enabled;
}

function setupListeners() {
  // Master toggle
  document.getElementById("masterToggle").addEventListener("change", async (e) => {
    await sendMsg({ type: "SET_ENABLED", enabled: e.target.checked });
    currentState.enabled = e.target.checked;
  });

  // Add domain
  document.getElementById("addDomainBtn").addEventListener("click", addDomain);
  document.getElementById("domainInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addDomain();
  });

  // Focus buttons
  document.querySelectorAll(".focus-time-btn").forEach(btn => {
    btn.addEventListener("click", () => startFocus(parseInt(btn.dataset.minutes)));
  });

  document.getElementById("startCustomFocus").addEventListener("click", () => {
    const mins = parseInt(document.getElementById("customMinutes").value);
    if (mins > 0) startFocus(mins);
  });

  document.getElementById("cancelFocusBtn").addEventListener("click", cancelFocus);

  // Schedule
  document.getElementById("scheduleToggle").addEventListener("change", (e) => {
    const opts = document.getElementById("scheduleOptions");
    opts.classList.toggle("hidden", !e.target.checked);
    sendMsg({ type: "UPDATE_SCHEDULE", schedule: { enabled: e.target.checked } });
  });

  document.getElementById("schedStartHour").addEventListener("change", (e) => {
    sendMsg({ type: "UPDATE_SCHEDULE", schedule: { startHour: parseInt(e.target.value) } });
  });

  document.getElementById("schedEndHour").addEventListener("change", (e) => {
    sendMsg({ type: "UPDATE_SCHEDULE", schedule: { endHour: parseInt(e.target.value) } });
  });

  // Settings
  document.getElementById("settingsBtn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
}

// ── Add / Remove Domain ──

async function addDomain() {
  const input = document.getElementById("domainInput");
  const domain = input.value.trim();
  if (!domain) return;

  await sendMsg({ type: "ADD_DOMAIN", domain });
  input.value = "";

  const res = await sendMsg({ type: "GET_STATE" });
  currentState = res.state;
  renderBlockedList();
}

async function removeDomain(domain) {
  await sendMsg({ type: "REMOVE_DOMAIN", domain });
  const res = await sendMsg({ type: "GET_STATE" });
  currentState = res.state;
  renderBlockedList();
}

// ── Render Blocked List ──

function renderBlockedList() {
  const container = document.getElementById("blockedList");
  if (currentState.blockedDomains.length === 0) {
    container.innerHTML = '<div class="empty-state">No sites blocked yet.</div>';
    return;
  }

  container.innerHTML = currentState.blockedDomains.map(domain => `
    <div class="blocked-item">
      <span class="blocked-item-domain">${escapeHtml(domain)}</span>
      <button class="blocked-item-remove" data-domain="${escapeHtml(domain)}" title="Remove">&times;</button>
    </div>
  `).join("");

  container.querySelectorAll(".blocked-item-remove").forEach(btn => {
    btn.addEventListener("click", () => removeDomain(btn.dataset.domain));
  });

  document.getElementById("blockedCount").textContent = currentState.stats.blockedToday;
}

// ── Render Categories ──

const CATEGORY_ICONS = {
  social: "\u{1F464}",
  video: "\u{1F3AC}",
  news: "\u{1F4F0}",
  gaming: "\u{1F3AE}",
  shopping: "\u{1F6D2}"
};

function renderCategories() {
  const container = document.getElementById("categoryList");
  container.innerHTML = Object.entries(categories).map(([key, cat]) => {
    const active = currentState.enabledCategories.includes(key);
    return `
      <div class="category-item ${active ? "active" : ""}" data-category="${key}">
        <div class="category-icon cat-${key}">${CATEGORY_ICONS[key] || ""}</div>
        <span class="category-name">${escapeHtml(cat.name)}</span>
        <span class="category-count">${cat.domains.length} sites</span>
        <div class="category-check">\u2713</div>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".category-item").forEach(item => {
    item.addEventListener("click", async () => {
      await sendMsg({ type: "TOGGLE_CATEGORY", category: item.dataset.category });
      const res = await sendMsg({ type: "GET_STATE" });
      currentState = res.state;
      renderCategories();
    });
  });
}

// ── Focus Session ──

async function startFocus(minutes) {
  await sendMsg({ type: "START_FOCUS", minutes });
  const res = await sendMsg({ type: "GET_STATE" });
  currentState = res.state;
  checkFocusSession();
}

async function cancelFocus() {
  await sendMsg({ type: "CANCEL_FOCUS" });
  const res = await sendMsg({ type: "GET_STATE" });
  currentState = res.state;
  clearInterval(focusInterval);
  focusInterval = null;
  checkFocusSession();
}

function checkFocusSession() {
  const idle = document.getElementById("focusIdle");
  const active = document.getElementById("focusActive");

  if (currentState.focusSession && currentState.focusSession.endTime > Date.now()) {
    idle.classList.add("hidden");
    active.classList.remove("hidden");
    startTimerDisplay();
  } else {
    idle.classList.remove("hidden");
    active.classList.add("hidden");
    if (focusInterval) {
      clearInterval(focusInterval);
      focusInterval = null;
    }
  }
}

function startTimerDisplay() {
  if (focusInterval) clearInterval(focusInterval);

  const circle = document.getElementById("timerCircle");
  const text = document.getElementById("timerText");
  const circumference = 2 * Math.PI * 52; // r=52

  function update() {
    if (!currentState.focusSession) return;
    const remaining = Math.max(0, currentState.focusSession.endTime - Date.now());
    const total = currentState.focusSession.duration * 60 * 1000;
    const fraction = remaining / total;

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    text.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference * (1 - fraction);

    if (remaining <= 0) {
      clearInterval(focusInterval);
      focusInterval = null;
      checkFocusSession();
    }
  }

  update();
  focusInterval = setInterval(update, 1000);
}

// ── Stats ──

function renderStats() {
  const s = currentState.stats;
  document.getElementById("statBlockedToday").textContent = s.blockedToday;
  document.getElementById("statTotalBlocked").textContent = s.totalBlocked;
  document.getElementById("statSessions").textContent = s.sessionsCompleted;

  const hours = Math.floor(s.totalFocusMinutes / 60);
  const mins = s.totalFocusMinutes % 60;
  document.getElementById("statFocusTime").textContent =
    hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  document.getElementById("blockedCount").textContent = s.blockedToday;
}

// ── Schedule ──

function renderSchedule() {
  const sched = currentState.schedule;
  document.getElementById("scheduleToggle").checked = sched.enabled;
  document.getElementById("scheduleOptions").classList.toggle("hidden", !sched.enabled);
  document.getElementById("schedStartHour").value = sched.startHour;
  document.getElementById("schedEndHour").value = sched.endHour;

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const container = document.getElementById("scheduleDays");
  container.innerHTML = dayNames.map((name, i) => `
    <button class="schedule-day ${sched.days.includes(i) ? "active" : ""}" data-day="${i}">${name}</button>
  `).join("");

  container.querySelectorAll(".schedule-day").forEach(btn => {
    btn.addEventListener("click", async () => {
      const day = parseInt(btn.dataset.day);
      const days = [...currentState.schedule.days];
      const idx = days.indexOf(day);
      if (idx >= 0) days.splice(idx, 1);
      else days.push(day);
      await sendMsg({ type: "UPDATE_SCHEDULE", schedule: { days } });
      currentState.schedule.days = days;
      renderSchedule();
    });
  });
}

// ── Utility ──

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
