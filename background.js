const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

// A helper to create the offscreen document
async function createOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });
  if (existingContexts.length > 0) {
    console.log('✓ Offscreen document already exists.');
    return;
  }

  console.log('Creating offscreen document...');
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ['WORKERS'],
    justification: 'To run Tesseract.js OCR worker',
  });
  console.log('✓ Offscreen document created successfully!');
}

// 1. Create the offscreen document on extension startup
chrome.runtime.onStartup.addListener(createOffscreenDocument);
chrome.runtime.onInstalled.addListener(createOffscreenDocument);

// 2. Listen for messages from content_script.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('=== BACKGROUND RECEIVED MESSAGE ===', request.type || Object.keys(request));
  
  if (request.image) {
    console.log('Got image from content script, length:', request.image.length);
    // Got the image from the content script.
    // First, make sure the offscreen document is active.
    createOffscreenDocument().then(() => {
      console.log('Forwarding image to offscreen document...');
      // Now, forward the image data to the offscreen document
      chrome.runtime.sendMessage({
        type: 'start_ocr',
        payload: request.image
      }).then(() => {
        console.log('✓ Message sent to offscreen document');
      }).catch(err => {
        console.error('✗ Failed to send message to offscreen:', err);
      });
    }).catch(err => {
      console.error('✗ Failed to create offscreen document:', err);
    });
    return true; // Keep the message channel open
  }
  
  // 3. Listen for messages from offscreen.js and forward them to popup.js
  if (request.type) {
    console.log('Forwarding message to popup:', request.type);
    if (request.type === 'ocr_progress' || request.type === 'ocr_result' || request.type === 'ocr_error') {
      // Forward these messages to the popup
      // The payload should be wrapped in the appropriate key
      const forwardMessage = {};
      if (request.type === 'ocr_progress') {
        forwardMessage.ocr_progress = request.payload;
      } else if (request.type === 'ocr_result') {
        forwardMessage.ocr_result = request.payload;
        console.log('✓ OCR completed! Text length:', request.payload.text?.length);
      } else if (request.type === 'ocr_error') {
        forwardMessage.ocr_error = request.payload;
        console.error('✗ OCR error:', request.payload);
      }
      chrome.runtime.sendMessage(forwardMessage)
        .then(() => console.log('✓ Message forwarded to popup'))
        .catch(e => console.log('Popup not open, skipping message.'));
    }
  }
});


