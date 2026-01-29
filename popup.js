// Reverse Image Prompt — Popup Controller

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Load provider name
  const settings = await chrome.storage.sync.get({ provider: 'openai', apiKey: '' });
  const providerNames = {
    openai: 'OpenAI',
    google: 'Google Gemini',
    anthropic: 'Anthropic Claude'
  };
  const providerEl = document.getElementById('providerName');
  if (settings.apiKey) {
    providerEl.textContent = providerNames[settings.provider] || settings.provider;
  } else {
    providerEl.textContent = 'Not configured';
  }

  // Load current state
  chrome.runtime.sendMessage({ action: 'getState' }, (state) => {
    if (!state || (!state.currentImage && !state.isLoading && !state.error)) {
      showEmpty();
      return;
    }

    if (state.isLoading) {
      showLoading();
    } else if (state.error) {
      showError(state.error);
    } else if (state.promptResult) {
      showResult(state.currentImage, state.promptResult);
    } else {
      showEmpty();
    }
  });

  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Copy button
  document.getElementById('copyBtn').addEventListener('click', () => {
    const text = document.getElementById('resultBox').textContent;
    navigator.clipboard.writeText(text).then(() => {
      const msg = document.getElementById('copiedMsg');
      msg.classList.add('show');
      setTimeout(() => msg.classList.remove('show'), 2000);
    });
  });

  // Retry button
  document.getElementById('retryBtn').addEventListener('click', async () => {
    const state = await new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getState' }, resolve);
    });
    if (state && state.currentImage) {
      showLoading();
      chrome.runtime.sendMessage({
        action: 'retryProcess',
        imageUrl: state.currentImage
      });
    }
  });
}

function showEmpty() {
  hideAll();
  document.getElementById('emptyState').classList.remove('hidden');
}

function showLoading() {
  hideAll();
  document.getElementById('loadingState').classList.remove('hidden');
}

function showError(message) {
  hideAll();
  document.getElementById('errorMsg').textContent = message;
  document.getElementById('errorState').classList.remove('hidden');
}

function showResult(imageUrl, prompt) {
  hideAll();
  document.getElementById('resultImage').src = imageUrl;
  document.getElementById('resultBox').textContent = prompt;
  document.getElementById('resultState').classList.remove('hidden');
}

function hideAll() {
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('resultState').classList.add('hidden');
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
}
