// FocusGuard — Background Service Worker
// Handles blocking rules, focus sessions, and statistics tracking.

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
    totalFocusMinutes: 0
  },
  schedule: {
    enabled: false,
    days: [1, 2, 3, 4, 5], // Mon-Fri
    startHour: 9,
    endHour: 17
  }
};

// ── State Management ──

async function getState() {
  const result = await chrome.storage.local.get("focusGuardState");
  return result.focusGuardState || { ...DEFAULT_STATE };
}

async function setState(state) {
  await chrome.storage.local.set({ focusGuardState: state });
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
  chrome.alarms.create("focusSessionTick", { periodInMinutes: 1 / 60 }); // every second-ish for UI
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

async function recordBlock() {
  const state = await getState();
  const today = new Date().toDateString();
  if (state.stats.lastResetDate !== today) {
    state.stats.blockedToday = 0;
    state.stats.lastResetDate = today;
  }
  state.stats.totalBlocked++;
  state.stats.blockedToday++;
  await setState(state);
}

// ── Alarm Listener ──

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "focusSessionEnd") {
    await endFocusSession();
    // Optionally notify
    // chrome.notifications would need permission
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
      return { state, categories: PRESET_CATEGORIES };
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
      await recordBlock();
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

    default:
      return { error: "Unknown message type" };
  }
}

// ── On Install ──

chrome.runtime.onInstalled.addListener(async () => {
  const state = await getState();
  await setState({ ...DEFAULT_STATE, ...state });
  await updateBlockingRules(state);
});

// ── Track blocked navigations for stats ──

chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener?.((info) => {
  recordBlock();
});
