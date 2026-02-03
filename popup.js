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
  renderExerciseToggle();
  renderHideTab();
  loadHistoryStats();
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

      // Refresh hide tab when switching to it
      if (tab.dataset.tab === "hide") {
        renderHideTab();
      }
      if (tab.dataset.tab === "stats") {
        loadHistoryStats();
      }
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

  // Exercise toggle
  document.getElementById("exerciseToggle").addEventListener("change", async (e) => {
    await sendMsg({ type: "SET_EXERCISE_ENABLED", enabled: e.target.checked });
    currentState.exerciseChallengeEnabled = e.target.checked;
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

// ── Hide Tab (Element Hider) ──

const PLATFORM_NAMES = {
  "instagram.com": "Instagram",
  "facebook.com": "Facebook",
  "youtube.com": "YouTube",
  "twitter.com": "Twitter / X",
  "x.com": "Twitter / X",
  "linkedin.com": "LinkedIn"
};

const PLATFORM_ICONS = {
  "instagram.com": "\u{1F4F7}",
  "facebook.com": "\u{1F465}",
  "youtube.com": "\u{1F3AC}",
  "twitter.com": "\u{1F426}",
  "x.com": "\u{1F426}",
  "linkedin.com": "\u{1F4BC}"
};

// All platform section definitions (mirrors content script)
const ALL_PLATFORM_SECTIONS = {
  "instagram.com": {
    stories: "Stories Tray",
    reels: "Reels",
    explore: "Explore Page",
    suggestions: "Suggested Posts / Users",
    sidebar: "Right Sidebar"
  },
  "facebook.com": {
    stories: "Stories",
    reels: "Reels / Short Videos",
    rightSidebar: "Right Sidebar (Contacts, Ads)",
    sponsored: "Sponsored Posts",
    notifications: "Notification Badges",
    marketplace: "Marketplace"
  },
  "youtube.com": {
    shorts: "Shorts",
    recommendations: "Recommended / Sidebar Videos",
    comments: "Comments Section",
    trending: "Trending",
    homeFeed: "Home Feed (forces search-only use)",
    endScreen: "End Screen / Autoplay Cards"
  },
  "twitter.com": {
    trending: "Trending / What's Happening",
    whoToFollow: "Who to Follow",
    rightSidebar: "Right Sidebar (Search, Trends)",
    notifications: "Notification Badges",
    explore: "Explore Tab"
  },
  "x.com": {
    trending: "Trending / What's Happening",
    whoToFollow: "Who to Follow",
    rightSidebar: "Right Sidebar (Search, Trends)",
    notifications: "Notification Badges",
    explore: "Explore Tab"
  },
  "linkedin.com": {
    feed: "News Feed",
    rightSidebar: "Right Sidebar (Ads, News)",
    notifications: "Notification Badges",
    messaging: "Messaging Overlay",
    promoted: "Promoted / Sponsored Posts",
    myNetwork: "My Network Suggestions"
  }
};

async function renderHideTab() {
  const hiddenRes = await sendMsg({ type: "GET_HIDDEN_ELEMENTS" });
  const hiddenSettings = hiddenRes.settings || {};

  // Try to detect current tab platform
  let currentPlatform = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const hostname = new URL(tab.url).hostname.replace(/^www\./, "");
      for (const platform of Object.keys(ALL_PLATFORM_SECTIONS)) {
        if (hostname.includes(platform)) {
          currentPlatform = platform;
          break;
        }
      }
    }
  } catch (e) {
    // Can't access tab
  }

  // Render current site sections
  const titleEl = document.getElementById("hidePlatformTitle");
  const listEl = document.getElementById("hideSectionsList");

  if (currentPlatform && ALL_PLATFORM_SECTIONS[currentPlatform]) {
    const platformName = PLATFORM_NAMES[currentPlatform] || currentPlatform;
    const icon = PLATFORM_ICONS[currentPlatform] || "";
    titleEl.textContent = `${icon} ${platformName} — Elements`;

    const sections = ALL_PLATFORM_SECTIONS[currentPlatform];
    const platformHidden = hiddenSettings[currentPlatform] || {};

    listEl.innerHTML = Object.entries(sections).map(([key, label]) => {
      const isHidden = platformHidden[key] === true;
      return `
        <div class="hide-section-item ${isHidden ? "active" : ""}" data-platform="${currentPlatform}" data-section="${key}">
          <span class="hide-section-label">${escapeHtml(label)}</span>
          <div class="hide-section-toggle">
            <label class="aqua-toggle small-toggle">
              <input type="checkbox" ${isHidden ? "checked" : ""} data-platform="${currentPlatform}" data-section="${key}">
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
            </label>
          </div>
        </div>
      `;
    }).join("");

    listEl.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", async (e) => {
        const platform = e.target.dataset.platform;
        const section = e.target.dataset.section;
        const current = hiddenSettings[platform] || {};
        current[section] = e.target.checked;
        await sendMsg({ type: "UPDATE_HIDDEN_ELEMENTS", platform, sections: current });
        hiddenSettings[platform] = current;

        // Notify content script to refresh
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) chrome.tabs.sendMessage(tab.id, { type: "REFRESH_HIDING" });
        } catch (e) { /* ignore */ }
      });
    });
  } else {
    titleEl.textContent = "Current Site";
    listEl.innerHTML = '<div class="empty-state">Visit Instagram, Facebook, YouTube, Twitter/X, or LinkedIn to configure element hiding.</div>';
  }

  // Render all platforms quick config
  const quickList = document.getElementById("platformQuickList");
  quickList.innerHTML = Object.entries(ALL_PLATFORM_SECTIONS).map(([platform, sections]) => {
    const platformName = PLATFORM_NAMES[platform] || platform;
    const icon = PLATFORM_ICONS[platform] || "";
    const platformHidden = hiddenSettings[platform] || {};
    const hiddenCount = Object.values(platformHidden).filter(v => v).length;
    const totalCount = Object.keys(sections).length;
    return `
      <div class="platform-quick-item" data-platform="${platform}">
        <span class="platform-quick-icon">${icon}</span>
        <span class="platform-quick-name">${escapeHtml(platformName)}</span>
        <span class="platform-quick-count">${hiddenCount}/${totalCount} hidden</span>
      </div>
    `;
  }).join("");
}

// ── Exercise Toggle ──

function renderExerciseToggle() {
  const toggle = document.getElementById("exerciseToggle");
  toggle.checked = currentState.exerciseChallengeEnabled !== false;
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

  // Exercise stats
  document.getElementById("statExercises").textContent = s.exercisesCompleted || 0;
  document.getElementById("statReps").textContent = s.totalExerciseReps || 0;
}

// ── Browsing History Stats ──

async function loadHistoryStats() {
  const container = document.getElementById("historyStats");
  try {
    const res = await sendMsg({ type: "GET_HISTORY_STATS" });
    const visits = res.domainVisits || {};
    const entries = Object.entries(visits).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-state">No blocked site visits found in history.</div>';
      return;
    }

    container.innerHTML = entries.slice(0, 10).map(([domain, count]) => `
      <div class="history-stat-item">
        <span class="history-domain">${escapeHtml(domain)}</span>
        <span class="history-count">${count} visits</span>
      </div>
    `).join("");
  } catch (e) {
    container.innerHTML = '<div class="empty-state">Unable to load history stats.</div>';
  }
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
