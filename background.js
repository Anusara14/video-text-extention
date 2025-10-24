// 1. Import the Tesseract library
// We can do this because we downloaded tesseract.min.js
try {
  importScripts('lib/tesseract.min.js');
} catch (e) {
  console.error('Failed to import Tesseract.js', e);
}

let worker = null; // We will store our "warm" worker here

// Helper function to send progress back to the popup
function sendProgress(message) {
  chrome.runtime.sendMessage({ ocr_progress: message });
}

// 2. The main initialization function
async function initializeWorker() {
  sendProgress({ status: 'Loading OCR model...' });
  
  // Get paths to the files we made "web accessible" in the manifest
  const workerPath = chrome.runtime.getURL('lib/worker.min.js');
  const corePath = chrome.runtime.getURL('lib/tesseract-core.wasm.js');
  const langPath = chrome.runtime.getURL('lib/'); // Path to the *directory*
  
  try {
    // Create the Tesseract worker
    worker = Tesseract.createWorker({
      workerPath,
      corePath,
      langPath,
      logger: m => sendProgress(m), // Send progress updates to our logger
    });
    
    // Load the worker
    await worker.load();
    // Load the English language model
    await worker.loadLanguage('eng');
    // Initialize the model for English
    await worker.initialize('eng');
    
    console.log('Tesseract Worker Initialized.');
    sendProgress({ status: 'Ready to capture' });
  } catch (e) {
    console.error('Error initializing Tesseract worker', e);
    chrome.runtime.sendMessage({ ocr_error: 'Failed to load OCR model.' });
  }
}

// 3. Listen for extension install/startup to initialize the worker
chrome.runtime.onInstalled.addListener(() => {
  initializeWorker();
});
chrome.runtime.onStartup.addListener(() => {
  initializeWorker();
});

// 4. Listen for the message from content_script.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.image) {
    // We received the pre-processed image data!
    if (!worker) {
      console.error('Worker not initialized.');
      chrome.runtime.sendMessage({ ocr_error: 'Worker not ready. Try again.' });
      return;
    }

    // Start the recognition process
    (async () => {
      try {
        const { data: { text } } = await worker.recognize(request.image);
        // Send the final text back to the popup
        chrome.runtime.sendMessage({ ocr_result: { text } });
      } catch (e) {
        console.error('Error during recognition', e);
        chrome.runtime.sendMessage({ ocr_error: 'OCR failed.' });
      }
    })();

    // MUST return true to indicate we will send an asynchronous response
    return true;
  }
});
