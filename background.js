const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

// A helper to create the offscreen document
async function createOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });
  if (existingContexts.length > 0) {
    console.log('Offscreen document already exists.');
    return;
  }

  console.log('Creating offscreen document...');
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ['WORKER'],
    justification: 'To run Tesseract.js OCR worker',
  });
}

// 1. Create the offscreen document on extension startup
chrome.runtime.onStartup.addListener(createOffscreenDocument);
chrome.runtime.onInstalled.addListener(createOffscreenDocument);

// 2. Listen for messages from content_script.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.image) {
    // Got the image from the content script.
    // First, make sure the offscreen document is active.
    createOffscreenDocument().then(() => {
      // Now, forward the image data to the offscreen document
      chrome.runtime.sendMessage({
        type: 'start_ocr',
        payload: request.image
      });
    });
    return true; // Keep the message channel open
  }
  
  // 3. Listen for messages from offscreen.js and forward them to popup.js
  if (request.type) {
    if (request.type === 'ocr_progress' || request.type === 'ocr_result' || request.type === 'ocr_error') {
      // Forward these messages to the popup
      chrome.runtime.sendMessage(request.payload)
        .catch(e => console.log('Popup not open, skipping message.'));
    }
  }
});

