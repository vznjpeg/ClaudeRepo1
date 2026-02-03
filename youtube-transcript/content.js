/**
 * YouTube Transcript Extractor - Content Script
 * Injects a sidebar panel on YouTube video pages that displays
 * timestamped transcripts and provides AI summarization.
 */

(function () {
  'use strict';

  let sidebarOpen = false;
  let sidebarEl = null;
  let currentVideoId = null;
  let transcriptData = [];

  // ── Listen for toggle from background / extension icon click ──
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'toggleSidebar') {
      if (sidebarOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    }
  });

  // ── Watch for SPA navigation (YouTube is a SPA) ──
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (location.href.includes('youtube.com/watch')) {
        const newId = getVideoId();
        if (newId !== currentVideoId) {
          currentVideoId = newId;
          if (sidebarOpen) {
            loadTranscript();
          }
        }
      } else if (sidebarOpen) {
        closeSidebar();
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ── Helpers ──

  function getVideoId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('v');
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function seekTo(seconds) {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = seconds;
      video.play();
    }
  }

  // ── Transcript Fetching ──

  async function fetchTranscript(videoId) {
    // Strategy: fetch the YouTube watch page HTML and parse the captions track URL
    // from the ytInitialPlayerResponse embedded JSON.
    try {
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        credentials: 'include',
      });
      const html = await response.text();

      // Extract the player response JSON
      const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
      if (!match) throw new Error('Could not find player response');

      const playerResponse = JSON.parse(match[1]);
      const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (!captions || captions.length === 0) {
        throw new Error('No captions available for this video');
      }

      // Prefer English, fall back to first available track
      let track = captions.find((t) => t.languageCode === 'en') ||
                  captions.find((t) => t.languageCode.startsWith('en')) ||
                  captions[0];

      // Fetch the actual transcript XML
      const captionUrl = track.baseUrl + '&fmt=json3';
      const captionResp = await fetch(captionUrl);
      const captionJson = await captionResp.json();

      const events = captionJson.events || [];
      const segments = [];

      for (const event of events) {
        if (event.segs) {
          const text = event.segs.map((s) => s.utf8 || '').join('').trim();
          if (text) {
            segments.push({
              time: (event.tStartMs || 0) / 1000,
              duration: (event.dDurationMs || 0) / 1000,
              text: text,
            });
          }
        }
      }

      return { segments, language: track.name?.simpleText || track.languageCode };
    } catch (err) {
      // Fallback: try fetching transcript from the timedtext API directly
      try {
        return await fetchTranscriptFallback(videoId);
      } catch {
        throw err;
      }
    }
  }

  async function fetchTranscriptFallback(videoId) {
    const resp = await fetch(
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`
    );
    if (!resp.ok) throw new Error('Fallback transcript fetch failed');
    const data = await resp.json();
    const events = data.events || [];
    const segments = [];

    for (const event of events) {
      if (event.segs) {
        const text = event.segs.map((s) => s.utf8 || '').join('').trim();
        if (text) {
          segments.push({
            time: (event.tStartMs || 0) / 1000,
            duration: (event.dDurationMs || 0) / 1000,
            text: text,
          });
        }
      }
    }

    return { segments, language: 'en' };
  }

  // ── Sidebar UI ──

  function createSidebar() {
    if (sidebarEl) return sidebarEl;

    sidebarEl = document.createElement('div');
    sidebarEl.id = 'yt-transcript-sidebar';

    sidebarEl.innerHTML = `
      <div class="yt-ts-header">
        <div class="yt-ts-title-row">
          <span class="yt-ts-logo">&#9776;</span>
          <h2>Transcript</h2>
          <button class="yt-ts-close" title="Close">&times;</button>
        </div>
        <div class="yt-ts-controls">
          <div class="yt-ts-search-wrap">
            <input type="text" class="yt-ts-search" placeholder="Search transcript..." />
          </div>
          <button class="yt-ts-summarize-btn">&#10024; Summarize</button>
        </div>
      </div>
      <div class="yt-ts-body">
        <div class="yt-ts-status">Click to load transcript...</div>
        <div class="yt-ts-entries"></div>
      </div>
      <div class="yt-ts-summary-panel" style="display:none;">
        <div class="yt-ts-summary-header">
          <h3>AI Summary</h3>
          <button class="yt-ts-summary-close">&times;</button>
        </div>
        <div class="yt-ts-summary-content"></div>
        <div class="yt-ts-api-notice">
          <label>API Key:
            <input type="password" class="yt-ts-api-key" placeholder="Enter OpenAI API key" />
          </label>
          <button class="yt-ts-api-save">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(sidebarEl);

    // Event listeners
    sidebarEl.querySelector('.yt-ts-close').addEventListener('click', closeSidebar);
    sidebarEl.querySelector('.yt-ts-search').addEventListener('input', handleSearch);
    sidebarEl.querySelector('.yt-ts-summarize-btn').addEventListener('click', handleSummarize);
    sidebarEl.querySelector('.yt-ts-summary-close').addEventListener('click', () => {
      sidebarEl.querySelector('.yt-ts-summary-panel').style.display = 'none';
    });
    sidebarEl.querySelector('.yt-ts-api-save').addEventListener('click', saveApiKey);

    // Load saved API key
    chrome.storage.local.get(['openai_api_key'], (result) => {
      if (result.openai_api_key) {
        sidebarEl.querySelector('.yt-ts-api-key').value = result.openai_api_key;
      }
    });

    return sidebarEl;
  }

  function openSidebar() {
    createSidebar();
    sidebarEl.classList.add('yt-ts-open');
    sidebarOpen = true;
    currentVideoId = getVideoId();
    loadTranscript();
  }

  function closeSidebar() {
    if (sidebarEl) {
      sidebarEl.classList.remove('yt-ts-open');
    }
    sidebarOpen = false;
  }

  async function loadTranscript() {
    const status = sidebarEl.querySelector('.yt-ts-status');
    const entries = sidebarEl.querySelector('.yt-ts-entries');
    status.style.display = 'block';
    status.textContent = 'Loading transcript...';
    status.className = 'yt-ts-status yt-ts-loading';
    entries.innerHTML = '';
    transcriptData = [];

    try {
      const videoId = getVideoId();
      if (!videoId) throw new Error('No video ID found');

      const result = await fetchTranscript(videoId);
      transcriptData = result.segments;

      if (transcriptData.length === 0) {
        throw new Error('Transcript is empty');
      }

      status.style.display = 'none';
      renderTranscript(transcriptData);
    } catch (err) {
      status.className = 'yt-ts-status yt-ts-error';
      status.textContent = `Could not load transcript: ${err.message}`;
    }
  }

  function renderTranscript(segments) {
    const entries = sidebarEl.querySelector('.yt-ts-entries');
    entries.innerHTML = '';

    for (const seg of segments) {
      const entry = document.createElement('div');
      entry.className = 'yt-ts-entry';
      entry.dataset.time = seg.time;

      const timestamp = document.createElement('span');
      timestamp.className = 'yt-ts-timestamp';
      timestamp.textContent = formatTime(seg.time);
      timestamp.addEventListener('click', () => seekTo(seg.time));

      const text = document.createElement('span');
      text.className = 'yt-ts-text';
      text.textContent = seg.text;

      entry.appendChild(timestamp);
      entry.appendChild(text);
      entries.appendChild(entry);
    }

    // Highlight current segment based on video playback
    trackPlayback();
  }

  function trackPlayback() {
    const video = document.querySelector('video');
    if (!video) return;

    const onTimeUpdate = () => {
      if (!sidebarOpen || !sidebarEl) return;
      const current = video.currentTime;
      const allEntries = sidebarEl.querySelectorAll('.yt-ts-entry');
      let activeEntry = null;

      allEntries.forEach((entry) => {
        entry.classList.remove('yt-ts-active');
        const t = parseFloat(entry.dataset.time);
        if (t <= current) {
          activeEntry = entry;
        }
      });

      if (activeEntry) {
        activeEntry.classList.add('yt-ts-active');
        // Auto-scroll to keep active entry visible
        const body = sidebarEl.querySelector('.yt-ts-body');
        const entryTop = activeEntry.offsetTop - body.offsetTop;
        const scrollTop = body.scrollTop;
        const bodyHeight = body.clientHeight;
        if (entryTop < scrollTop || entryTop > scrollTop + bodyHeight - 60) {
          body.scrollTo({ top: entryTop - bodyHeight / 3, behavior: 'smooth' });
        }
      }
    };

    video.removeEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('timeupdate', onTimeUpdate);
  }

  // ── Search ──

  function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const allEntries = sidebarEl.querySelectorAll('.yt-ts-entry');

    allEntries.forEach((entry) => {
      const text = entry.querySelector('.yt-ts-text').textContent.toLowerCase();
      entry.style.display = text.includes(query) || query === '' ? '' : 'none';
    });
  }

  // ── Summarize ──

  async function handleSummarize() {
    if (transcriptData.length === 0) {
      alert('No transcript loaded to summarize.');
      return;
    }

    const summaryPanel = sidebarEl.querySelector('.yt-ts-summary-panel');
    const summaryContent = sidebarEl.querySelector('.yt-ts-summary-content');
    summaryPanel.style.display = 'flex';
    summaryContent.innerHTML = '<div class="yt-ts-loading-spinner"></div><p>Generating summary...</p>';

    const apiKeyInput = sidebarEl.querySelector('.yt-ts-api-key');
    let apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      // Try to load from storage
      const stored = await new Promise((resolve) =>
        chrome.storage.local.get(['openai_api_key'], resolve)
      );
      apiKey = stored.openai_api_key || '';
    }

    if (!apiKey) {
      summaryContent.innerHTML =
        '<p class="yt-ts-error-text">Please enter your OpenAI API key below to enable summarization.</p>';
      return;
    }

    // Build full transcript text
    const fullText = transcriptData
      .map((s) => `[${formatTime(s.time)}] ${s.text}`)
      .join('\n');

    // Truncate if very long (API token limits)
    const truncated = fullText.length > 30000 ? fullText.slice(0, 30000) + '\n...(truncated)' : fullText;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant that summarizes YouTube video transcripts. Provide a clear, well-structured summary with key points. Use markdown formatting. Include section headers if the video covers multiple topics. Keep it concise but informative.',
            },
            {
              role: 'user',
              content: `Please summarize this YouTube video transcript:\n\n${truncated}`,
            },
          ],
          max_tokens: 1500,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API request failed (${response.status})`);
      }

      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content || 'No summary generated.';

      // Render markdown-ish summary (basic conversion)
      summaryContent.innerHTML = renderMarkdown(summary);
    } catch (err) {
      summaryContent.innerHTML = `<p class="yt-ts-error-text">Error: ${err.message}</p>`;
    }
  }

  function renderMarkdown(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  function saveApiKey() {
    const key = sidebarEl.querySelector('.yt-ts-api-key').value.trim();
    chrome.storage.local.set({ openai_api_key: key }, () => {
      const btn = sidebarEl.querySelector('.yt-ts-api-save');
      btn.textContent = 'Saved!';
      setTimeout(() => (btn.textContent = 'Save'), 1500);
    });
  }

  // ── Auto-inject button next to YouTube's subscribe area ──

  function injectToggleButton() {
    if (document.getElementById('yt-ts-toggle-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'yt-ts-toggle-btn';
    btn.textContent = 'Transcript';
    btn.title = 'Open Transcript Sidebar';
    btn.addEventListener('click', () => {
      if (sidebarOpen) closeSidebar();
      else openSidebar();
    });

    // Try to place next to the subscribe button area
    const target =
      document.querySelector('#owner') ||
      document.querySelector('#above-the-fold #top-row') ||
      document.querySelector('#info-contents');

    if (target) {
      target.appendChild(btn);
    } else {
      // Retry after a delay for SPA load
      setTimeout(injectToggleButton, 2000);
    }
  }

  // Initial injection
  if (window.location.href.includes('youtube.com/watch')) {
    // Wait for page to be ready
    if (document.readyState === 'complete') {
      setTimeout(injectToggleButton, 1500);
    } else {
      window.addEventListener('load', () => setTimeout(injectToggleButton, 1500));
    }
  }

  // Re-inject on navigation
  const navObserver = new MutationObserver(() => {
    if (location.href.includes('youtube.com/watch') && !document.getElementById('yt-ts-toggle-btn')) {
      setTimeout(injectToggleButton, 1500);
    }
  });
  navObserver.observe(document.body, { childList: true, subtree: true });
})();
