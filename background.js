// Reverse Image Prompt — Background Service Worker

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'reverse-image-prompt',
    title: 'Reverse Image Prompt',
    contexts: ['image']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'reverse-image-prompt') return;

  const imageUrl = info.srcUrl;
  if (!imageUrl) return;

  // Store the image URL and set loading state
  await chrome.storage.local.set({
    currentImage: imageUrl,
    promptResult: null,
    isLoading: true,
    error: null
  });

  // Send message to content script to show the panel
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'showPanel',
      imageUrl: imageUrl
    });
  } catch {
    // Content script may not be injected yet, inject it
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    // Retry after injection
    setTimeout(async () => {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showPanel',
        imageUrl: imageUrl
      });
    }, 200);
  }

  // Process the image
  processImage(imageUrl, tab.id);
});

// Convert image URL to base64
async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Process image with configured AI provider
async function processImage(imageUrl, tabId) {
  try {
    const settings = await chrome.storage.sync.get({
      provider: 'openai',
      apiKey: '',
      model: ''
    });

    if (!settings.apiKey) {
      const error = 'No API key configured. Right-click the extension icon → Options to add your API key.';
      await chrome.storage.local.set({ isLoading: false, error });
      chrome.tabs.sendMessage(tabId, { action: 'error', message: error });
      return;
    }

    // Fetch image as base64
    const base64Data = await fetchImageAsBase64(imageUrl);

    let result;
    if (settings.provider === 'openai') {
      result = await callOpenAI(settings.apiKey, settings.model || 'gpt-4o', base64Data);
    } else if (settings.provider === 'google') {
      result = await callGemini(settings.apiKey, settings.model || 'gemini-2.0-flash', base64Data);
    } else if (settings.provider === 'anthropic') {
      result = await callAnthropic(settings.apiKey, settings.model || 'claude-sonnet-4-20250514', base64Data);
    }

    await chrome.storage.local.set({
      promptResult: result,
      isLoading: false,
      error: null
    });

    chrome.tabs.sendMessage(tabId, {
      action: 'result',
      prompt: result
    });

  } catch (err) {
    const error = `Error: ${err.message}`;
    await chrome.storage.local.set({ isLoading: false, error });
    chrome.tabs.sendMessage(tabId, { action: 'error', message: error });
  }
}

// System prompt for all providers
const SYSTEM_PROMPT = `You are an expert at reverse-engineering AI image generation prompts. Given an image, analyze it carefully and produce a detailed text prompt that could be used to recreate this image with an AI image generator like Midjourney, DALL-E, or Stable Diffusion.

Your output should be ONLY the prompt text — no explanations, no preamble, no labels. Just the prompt itself.

Consider these aspects:
- Subject matter and composition
- Art style (photorealistic, digital art, oil painting, watercolor, anime, etc.)
- Lighting and color palette
- Camera angle and perspective
- Mood and atmosphere
- Level of detail and textures
- Any text or typography visible
- Background and environment
- Notable artistic techniques or effects`;

// OpenAI API call
async function callOpenAI(apiKey, model, base64Data) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Reverse-engineer a detailed AI image generation prompt for this image.'
            },
            {
              type: 'image_url',
              image_url: { url: base64Data }
            }
          ]
        }
      ],
      max_tokens: 1000
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content.trim();
}

// Google Gemini API call
async function callGemini(apiKey, model, base64Data) {
  const match = base64Data.match(/^data:(.*?);base64,(.*)$/);
  if (!match) throw new Error('Failed to process image data');
  const mimeType = match[1];
  const rawBase64 = match[2];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
          {
            parts: [
              { text: 'Reverse-engineer a detailed AI image generation prompt for this image.' },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: rawBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 1000
        }
      })
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text.trim();
}

// Anthropic API call
async function callAnthropic(apiKey, model, base64Data) {
  const match = base64Data.match(/^data:(.*?);base64,(.*)$/);
  if (!match) throw new Error('Failed to process image data');
  const mediaType = match[1];
  const rawBase64 = match[2];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: rawBase64
              }
            },
            {
              type: 'text',
              text: 'Reverse-engineer a detailed AI image generation prompt for this image.'
            }
          ]
        }
      ]
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text.trim();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getState') {
    chrome.storage.local.get(['currentImage', 'promptResult', 'isLoading', 'error'], (data) => {
      sendResponse(data);
    });
    return true;
  }

  if (message.action === 'retryProcess') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        processImage(message.imageUrl, tabs[0].id);
      }
    });
    sendResponse({ ok: true });
    return true;
  }
});
