// FocusGuard — Content Script: Distraction Element Hider
// Identifies and hides attention-grabbing sections on social media platforms.

(function () {
  "use strict";

  // Platform-specific selectors for distracting elements
  const PLATFORM_SELECTORS = {
    "instagram.com": {
      stories: {
        label: "Stories Tray",
        selectors: [
          'div[role="menu"]',
          'section main > div > div:first-child canvas',
          'div[style*="stories"]',
          // Stories tray at the top of the feed
          'header + div > div > div > ul',
          'div[role="presentation"] ul'
        ]
      },
      reels: {
        label: "Reels",
        selectors: [
          'a[href="/reels/"]',
          'a[href*="/reels/"]',
          'div[class*="reels"]'
        ]
      },
      explore: {
        label: "Explore Page",
        selectors: [
          'a[href="/explore/"]',
          'a[href*="/explore/"]'
        ]
      },
      suggestions: {
        label: "Suggested Posts / Users",
        selectors: [
          'div[class*="Suggested"]',
          'article + div a[href*="/explore/"]',
          // "Suggested for you" sections
          'div:-webkit-any([class*="suggest"], [class*="Suggest"])'
        ]
      },
      sidebar: {
        label: "Right Sidebar",
        selectors: [
          'main > div > div > div:last-child:not(:first-child)'
        ]
      }
    },
    "facebook.com": {
      stories: {
        label: "Stories",
        selectors: [
          'div[aria-label="Stories"]',
          'div[data-pagelet="Stories"]',
          'div[class*="story"]'
        ]
      },
      reels: {
        label: "Reels / Short Videos",
        selectors: [
          'div[aria-label="Reels"]',
          'div[data-pagelet*="Reels"]',
          'a[href*="/reel/"]',
          'a[href*="/reels/"]'
        ]
      },
      rightSidebar: {
        label: "Right Sidebar (Contacts, Ads)",
        selectors: [
          'div[data-pagelet="RightRail"]',
          'div[role="complementary"]'
        ]
      },
      sponsored: {
        label: "Sponsored Posts",
        selectors: [
          'div[aria-label*="Sponsored"]',
          'span:has(> a[href*="ads"])'
        ]
      },
      notifications: {
        label: "Notification Badges",
        selectors: [
          'span[aria-label*="notification"]',
          'div[aria-label="Notifications"]'
        ]
      },
      marketplace: {
        label: "Marketplace",
        selectors: [
          'a[href*="/marketplace"]'
        ]
      }
    },
    "youtube.com": {
      shorts: {
        label: "Shorts",
        selectors: [
          'a[title="Shorts"]',
          'a[href="/shorts"]',
          'ytd-reel-shelf-renderer',
          'ytd-rich-shelf-renderer[is-shorts]',
          'a[href*="/shorts/"]'
        ]
      },
      recommendations: {
        label: "Recommended / Sidebar Videos",
        selectors: [
          'ytd-watch-next-secondary-results-renderer',
          '#related',
          '#secondary'
        ]
      },
      comments: {
        label: "Comments Section",
        selectors: [
          'ytd-comments#comments',
          '#comments'
        ]
      },
      trending: {
        label: "Trending",
        selectors: [
          'a[title="Trending"]',
          'a[href="/feed/trending"]'
        ]
      },
      homeFeed: {
        label: "Home Feed (forces search-only use)",
        selectors: [
          'ytd-rich-grid-renderer',
          'ytd-browse[page-subtype="home"] #contents'
        ]
      },
      endScreen: {
        label: "End Screen / Autoplay Cards",
        selectors: [
          '.ytp-ce-element',
          '.ytp-endscreen-content',
          'ytd-compact-autoplay-renderer'
        ]
      }
    },
    "twitter.com": {
      trending: {
        label: "Trending / What's Happening",
        selectors: [
          'div[aria-label="Timeline: Trending now"]',
          'section[aria-labelledby*="accessible-list"]',
          'div[data-testid="trend"]'
        ]
      },
      whoToFollow: {
        label: "Who to Follow",
        selectors: [
          'aside[aria-label="Who to follow"]',
          'div[data-testid="UserCell"]'
        ]
      },
      rightSidebar: {
        label: "Right Sidebar (Search, Trends)",
        selectors: [
          'div[data-testid="sidebarColumn"]'
        ]
      },
      notifications: {
        label: "Notification Badges",
        selectors: [
          'a[href="/notifications"] span[aria-label]'
        ]
      },
      explore: {
        label: "Explore Tab",
        selectors: [
          'a[href="/explore"]',
          'a[aria-label="Search and explore"]'
        ]
      }
    },
    "x.com": {
      trending: {
        label: "Trending / What's Happening",
        selectors: [
          'div[aria-label="Timeline: Trending now"]',
          'section[aria-labelledby*="accessible-list"]',
          'div[data-testid="trend"]'
        ]
      },
      whoToFollow: {
        label: "Who to Follow",
        selectors: [
          'aside[aria-label="Who to follow"]',
          'div[data-testid="UserCell"]'
        ]
      },
      rightSidebar: {
        label: "Right Sidebar (Search, Trends)",
        selectors: [
          'div[data-testid="sidebarColumn"]'
        ]
      },
      notifications: {
        label: "Notification Badges",
        selectors: [
          'a[href="/notifications"] span[aria-label]'
        ]
      },
      explore: {
        label: "Explore Tab",
        selectors: [
          'a[href="/explore"]',
          'a[aria-label="Search and explore"]'
        ]
      }
    },
    "linkedin.com": {
      feed: {
        label: "News Feed",
        selectors: [
          'div.feed-shared-update-v2',
          'main div[data-finite-scroll-hotkey-context="FEED"]'
        ]
      },
      rightSidebar: {
        label: "Right Sidebar (Ads, News)",
        selectors: [
          'aside.scaffold-layout__aside',
          'div[data-ad-banner]',
          'section.ad-banner-container'
        ]
      },
      notifications: {
        label: "Notification Badges",
        selectors: [
          'span.notification-badge__count',
          'span[class*="notification-badge"]'
        ]
      },
      messaging: {
        label: "Messaging Overlay",
        selectors: [
          'aside#msg-overlay',
          'div.msg-overlay-list-bubble'
        ]
      },
      promoted: {
        label: "Promoted / Sponsored Posts",
        selectors: [
          'span:has(> span.feed-shared-actor__sub-description)',
          'div[data-ad-banner]'
        ]
      },
      myNetwork: {
        label: "My Network Suggestions",
        selectors: [
          'section.mn-discovery-body',
          'div[data-view-name="pymk-card"]'
        ]
      }
    }
  };

  // Detect current platform
  function detectPlatform() {
    const hostname = window.location.hostname.replace(/^www\./, "");
    for (const platform of Object.keys(PLATFORM_SELECTORS)) {
      if (hostname.includes(platform)) return platform;
    }
    return null;
  }

  const platform = detectPlatform();
  if (!platform) return;

  const platformConfig = PLATFORM_SELECTORS[platform];
  const STORAGE_KEY = "focusGuardHiddenElements";

  // Load hidden element settings from sync storage
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(STORAGE_KEY, (result) => {
        resolve(result[STORAGE_KEY] || {});
      });
    });
  }

  // Apply hiding rules
  function applyHiding(settings) {
    const platformSettings = settings[platform] || {};

    for (const [sectionKey, sectionConfig] of Object.entries(platformConfig)) {
      const shouldHide = platformSettings[sectionKey] === true;

      for (const selector of sectionConfig.selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            if (shouldHide) {
              el.classList.add("fg-hidden-element");
            } else {
              el.classList.remove("fg-hidden-element");
            }
          });
        } catch (e) {
          // Selector might be invalid on some platforms
        }
      }
    }
  }

  // Listen for settings changes from popup or other tabs
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEY]) {
      applyHiding(changes[STORAGE_KEY].newValue || {});
    }
  });

  // Listen for messages from popup to get platform info
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_PLATFORM_SECTIONS") {
      const sections = {};
      for (const [key, config] of Object.entries(platformConfig)) {
        sections[key] = config.label;
      }
      sendResponse({ platform, sections });
      return;
    }
    if (msg.type === "REFRESH_HIDING") {
      loadSettings().then(applyHiding);
      sendResponse({ ok: true });
      return;
    }
  });

  // Initial application
  async function initialize() {
    const settings = await loadSettings();
    applyHiding(settings);

    // Re-apply on DOM changes (for SPAs that dynamically load content)
    const observer = new MutationObserver(() => {
      applyHiding(settings);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Periodically refresh settings in case they change from another device
    setInterval(async () => {
      const freshSettings = await loadSettings();
      applyHiding(freshSettings);
    }, 30000);
  }

  initialize();
})();
