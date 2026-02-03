// FocusGuard — Background Service Worker
// Handles blocking rules, focus sessions, statistics tracking,
// exercise challenges, browsing history, and cross-device sync.

const PRESET_CATEGORIES = {
  social: {
    name: "Social Media",
    icon: "social",
    domains: [
      "facebook.com", "www.facebook.com",
      "twitter.com", "www.twitter.com", "x.com", "www.x.com",
      "instagram.com", "www.instagram.com",
      "tiktok.com", "www.tiktok.com",
      "snapchat.com", "www.snapchat.com",
      "reddit.com", "www.reddit.com",
      "linkedin.com", "www.linkedin.com",
      "threads.net", "www.threads.net",
      "mastodon.social"
    ]
  },
  video: {
    name: "Video & Streaming",
    icon: "video",
    domains: [
      "youtube.com", "www.youtube.com",
      "netflix.com", "www.netflix.com",
      "twitch.tv", "www.twitch.tv",
      "hulu.com", "www.hulu.com",
      "disneyplus.com", "www.disneyplus.com",
      "dailymotion.com", "www.dailymotion.com"
    ]
  },
  news: {
    name: "News & Media",
    icon: "news",
    domains: [
      "news.ycombinator.com",
      "cnn.com", "www.cnn.com",
      "bbc.com", "www.bbc.com",
      "foxnews.com", "www.foxnews.com",
      "nytimes.com", "www.nytimes.com",
      "theguardian.com", "www.theguardian.com",
      "buzzfeed.com", "www.buzzfeed.com"
    ]
  },
  gaming: {
    name: "Gaming",
    icon: "gaming",
    domains: [
      "store.steampowered.com", "steampowered.com",
      "epicgames.com", "www.epicgames.com",
      "roblox.com", "www.roblox.com",
      "minecraft.net", "www.minecraft.net",
      "itch.io"
    ]
  },
  shopping: {
    name: "Shopping",
    icon: "shopping",
    domains: [
      "amazon.com", "www.amazon.com",
      "ebay.com", "www.ebay.com",
      "etsy.com", "www.etsy.com",
      "aliexpress.com", "www.aliexpress.com",
      "wish.com", "www.wish.com"
    ]
  }
};

// Exercise challenges — each requires completing 2 reps
const EXERCISE_CHALLENGES = [
  { name: "Push-ups", quantity: 2, emoji: "\u{1F4AA}", instruction: "Get down and do 2 push-ups. Full range of motion!" },
  { name: "Squats", quantity: 2, emoji: "\u{1F9CE}", instruction: "Stand up and do 2 squats. Go deep!" },
  { name: "Jumping Jacks", quantity: 2, emoji: "\u2B50", instruction: "Do 2 jumping jacks. Arms all the way up!" },
  { name: "Burpees", quantity: 2, emoji: "\u{1F525}", instruction: "Do 2 burpees. Down, push-up, jump!" },
  { name: "Lunges", quantity: 2, emoji: "\u{1F3CB}", instruction: "Do 2 lunges — one each leg. Keep your back straight!" },
  { name: "High Knees", quantity: 2, emoji: "\u{1F3C3}", instruction: "Do 2 high knees — one per leg. Drive those knees up!" },
  { name: "Calf Raises", quantity: 2, emoji: "\u{1F9B6}", instruction: "Do 2 calf raises. Rise up on your toes and hold!" },
  { name: "Mountain Climbers", quantity: 2, emoji: "\u26F0\uFE0F", instruction: "Do 2 mountain climbers — one per side. Get in plank and drive!" },
  { name: "Sit-ups", quantity: 2, emoji: "\u{1F4A5}", instruction: "Do 2 sit-ups. Hands behind your head, all the way up!" },
  { name: "Tricep Dips", quantity: 2, emoji: "\u{1F4AA}", instruction: "Do 2 tricep dips off your chair. Elbows back, dip down!" }
];

// Default state
const DEFAULT_STATE = {
  enabled: true,
  blockedDomains: [],
  enabledCategories: [],
  focusSession: null, // { endTime: timestamp, duration: minutes }
  stats: {
    totalBlocked: 0,
    blockedToday: 0,
    lastResetDate: new Date().toDateString(),
    sessionsCompleted: 0,
    totalFocusMinutes: 0,
    exercisesCompleted: 0,
    totalExerciseReps: 0
  },
  schedule: {
    enabled: false,
    days: [1, 2, 3, 4, 5], // Mon-Fri
    startHour: 9,
    endHour: 17
  },
  exerciseChallengeEnabled: true,
  browsingHistory: [] // { domain, timestamp, wasBlocked }
};

// ── State Management (uses chrome.storage.sync for cross-device sync) ──

async function getState() {
  const result = await chrome.storage.sync.get("focusGuardState");
  return result.focusGuardState || { ...DEFAULT_STATE };
}

async function setState(state) {
  await chrome.storage.sync.set({ focusGuardState: state });
}

// Browsing history is stored locally (too large for sync quota)
async function getBrowsingHistory() {
  const result = await chrome.storage.local.get("focusGuardHistory");
  return result.focusGuardHistory || [];
}

async function addBrowsingHistoryEntry(entry) {
  const history = await getBrowsingHistory();
  history.unshift(entry); // newest first
  // Keep only last 500 entries to stay within storage limits
  if (history.length > 500) history.length = 500;
  await chrome.storage.local.set({ focusGuardHistory: history });
}

// ── Blocking Rules ──

function getAllBlockedDomains(state) {
  let domains = [...state.blockedDomains];
  for (const catKey of state.enabledCategories) {
    if (PRESET_CATEGORIES[catKey]) {
      domains = domains.concat(PRESET_CATEGORIES[catKey].domains);
    }
  }
  return [...new Set(domains)];
}

async function updateBlockingRules(state) {
  // Remove all existing dynamic rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existingRules.map(r => r.id);

  if (!state.enabled) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeIds,
      addRules: []
    });
    return;
  }

  // Check schedule
  if (state.schedule.enabled && !isWithinSchedule(state.schedule)) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeIds,
      addRules: []
    });
    return;
  }

  const domains = getAllBlockedDomains(state);
  const blockedPageUrl = chrome.runtime.getURL("pages/blocked.html");

  const addRules = domains.map((domain, idx) => ({
    id: idx + 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        url: blockedPageUrl + "?domain=" + encodeURIComponent(domain)
      }
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ["main_frame"]
    }
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: addRules
  });
}

function isWithinSchedule(schedule) {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const hour = now.getHours();
  return schedule.days.includes(day) &&
    hour >= schedule.startHour &&
    hour < schedule.endHour;
}

// ── Focus Session ──

async function startFocusSession(minutes) {
  const state = await getState();
  const endTime = Date.now() + minutes * 60 * 1000;
  state.focusSession = { endTime, duration: minutes };
  state.enabled = true;
  await setState(state);
  await updateBlockingRules(state);

  chrome.alarms.create("focusSessionEnd", { when: endTime });
  chrome.alarms.create("focusSessionTick", { periodInMinutes: 1 / 60 });
}

async function endFocusSession() {
  const state = await getState();
  if (state.focusSession) {
    state.stats.sessionsCompleted++;
    state.stats.totalFocusMinutes += state.focusSession.duration;
    state.focusSession = null;
    await setState(state);
  }
  chrome.alarms.clear("focusSessionEnd");
  chrome.alarms.clear("focusSessionTick");
}

async function cancelFocusSession() {
  const state = await getState();
  state.focusSession = null;
  await setState(state);
  chrome.alarms.clear("focusSessionEnd");
  chrome.alarms.clear("focusSessionTick");
}

// ── Stats ──

async function recordBlock(domain) {
  const state = await getState();
  const today = new Date().toDateString();
  if (state.stats.lastResetDate !== today) {
    state.stats.blockedToday = 0;
    state.stats.lastResetDate = today;
  }
  state.stats.totalBlocked++;
  state.stats.blockedToday++;
  await setState(state);

  // Record in browsing history
  await addBrowsingHistoryEntry({
    domain: domain || "unknown",
    timestamp: Date.now(),
    wasBlocked: true
  });
}

async function recordExerciseCompleted() {
  const state = await getState();
  state.stats.exercisesCompleted++;
  state.stats.totalExerciseReps += 2;
  await setState(state);
}

// ── Exercise Challenge ──

function getRandomExercise() {
  return EXERCISE_CHALLENGES[Math.floor(Math.random() * EXERCISE_CHALLENGES.length)];
}

// ── Browsing History Tracking ──

function trackNavigation(tabId, url) {
  if (!url || url.startsWith("chrome") || url.startsWith("about")) return;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    addBrowsingHistoryEntry({
      domain: hostname,
      timestamp: Date.now(),
      wasBlocked: false
    });
  } catch (e) {
    // Invalid URL
  }
}

// Track tab navigations for browsing history
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    trackNavigation(tabId, tab.url);
  }
});

// ── Alarm Listener ──

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "focusSessionEnd") {
    await endFocusSession();
  }
});

// ── Message Listener ──

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg).then(sendResponse);
  return true; // async
});

async function handleMessage(msg) {
  switch (msg.type) {
    case "GET_STATE": {
      const state = await getState();
      return {
        state,
        categories: PRESET_CATEGORIES,
        exercises: EXERCISE_CHALLENGES
      };
    }

    case "SET_ENABLED": {
      const state = await getState();
      state.enabled = msg.enabled;
      await setState(state);
      await updateBlockingRules(state);
      return { ok: true };
    }

    case "ADD_DOMAIN": {
      const state = await getState();
      const domain = msg.domain.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "");
      if (!state.blockedDomains.includes(domain)) {
        state.blockedDomains.push(domain);
        await setState(state);
        await updateBlockingRules(state);
      }
      return { ok: true };
    }

    case "REMOVE_DOMAIN": {
      const state = await getState();
      state.blockedDomains = state.blockedDomains.filter(d => d !== msg.domain);
      await setState(state);
      await updateBlockingRules(state);
      return { ok: true };
    }

    case "TOGGLE_CATEGORY": {
      const state = await getState();
      const idx = state.enabledCategories.indexOf(msg.category);
      if (idx >= 0) {
        state.enabledCategories.splice(idx, 1);
      } else {
        state.enabledCategories.push(msg.category);
      }
      await setState(state);
      await updateBlockingRules(state);
      return { ok: true };
    }

    case "START_FOCUS": {
      await startFocusSession(msg.minutes);
      return { ok: true };
    }

    case "CANCEL_FOCUS": {
      await cancelFocusSession();
      return { ok: true };
    }

    case "RECORD_BLOCK": {
      await recordBlock(msg.domain);
      return { ok: true };
    }

    case "RECORD_EXERCISE": {
      await recordExerciseCompleted();
      return { ok: true };
    }

    case "GET_EXERCISE": {
      return { exercise: getRandomExercise() };
    }

    case "SET_EXERCISE_ENABLED": {
      const state = await getState();
      state.exerciseChallengeEnabled = msg.enabled;
      await setState(state);
      return { ok: true };
    }

    case "UPDATE_SCHEDULE": {
      const state = await getState();
      state.schedule = { ...state.schedule, ...msg.schedule };
      await setState(state);
      await updateBlockingRules(state);
      return { ok: true };
    }

    case "RESET_STATS": {
      const state = await getState();
      state.stats = { ...DEFAULT_STATE.stats };
      await setState(state);
      return { ok: true };
    }

    case "GET_BROWSING_HISTORY": {
      const history = await getBrowsingHistory();
      return { history };
    }

    case "CLEAR_BROWSING_HISTORY": {
      await chrome.storage.local.set({ focusGuardHistory: [] });
      return { ok: true };
    }

    case "GET_HISTORY_STATS": {
      // Query Chrome's history API for blocked domain visits
      const state = await getState();
      const domains = getAllBlockedDomains(state);
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const domainVisits = {};

      for (const domain of domains.slice(0, 20)) { // Limit queries
        try {
          const results = await chrome.history.search({
            text: domain,
            startTime: oneWeekAgo,
            maxResults: 100
          });
          const count = results.filter(r => {
            try {
              return new URL(r.url).hostname.replace(/^www\./, "").includes(domain.replace(/^www\./, ""));
            } catch { return false; }
          }).length;
          if (count > 0) domainVisits[domain] = count;
        } catch (e) {
          // History API might fail
        }
      }
      return { domainVisits };
    }

    case "UPDATE_HIDDEN_ELEMENTS": {
      // Save element hiding settings to sync storage
      const current = await chrome.storage.sync.get("focusGuardHiddenElements");
      const settings = current.focusGuardHiddenElements || {};
      settings[msg.platform] = msg.sections;
      await chrome.storage.sync.set({ focusGuardHiddenElements: settings });
      return { ok: true };
    }

    case "GET_HIDDEN_ELEMENTS": {
      const result = await chrome.storage.sync.get("focusGuardHiddenElements");
      return { settings: result.focusGuardHiddenElements || {} };
    }

    default:
      return { error: "Unknown message type" };
  }
}

// ── On Install ──

chrome.runtime.onInstalled.addListener(async (details) => {
  // Migrate from local storage to sync storage on update
  if (details.reason === "update") {
    const localResult = await chrome.storage.local.get("focusGuardState");
    if (localResult.focusGuardState) {
      const syncResult = await chrome.storage.sync.get("focusGuardState");
      if (!syncResult.focusGuardState) {
        // Migrate local state to sync
        await chrome.storage.sync.set({ focusGuardState: localResult.focusGuardState });
      }
    }
  }

  const state = await getState();
  const merged = { ...DEFAULT_STATE, ...state, stats: { ...DEFAULT_STATE.stats, ...state.stats } };
  await setState(merged);
  await updateBlockingRules(merged);
});

// ── Track blocked navigations for stats ──

chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener?.((info) => {
  recordBlock();
});
