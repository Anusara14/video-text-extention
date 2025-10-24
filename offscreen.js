let worker = null; // We will store our "warm" worker here

// Helper function to send messages back to the background script
function sendMessage(type, payload) {
  chrome.runtime.sendMessage({ type, payload });
}

// 1. The main initialization function
async function initializeWorker() {
  sendMessage('ocr_progress', { status: 'Loading OCR model...' });
  
  // Note: Tesseract.js is already loaded via the <script> tag
  
  try {
    // Get paths. These are relative to this HTML file.
    const workerPath = chrome.runtime.getURL('lib/worker.min.js');
    const corePath = chrome.runtime.getURL('lib/tesseract-core.wasm.js');
    const langPath = chrome.runtime.getURL('lib/');
    
    // Create the Tesseract worker
    worker = Tesseract.createWorker({
      workerPath,
      corePath,
      langPath,
      logger: m => sendMessage('ocr_progress', m), // Send progress
    });
    
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    console.log('Tesseract Worker Initialized (Offscreen).');
    sendMessage('ocr_progress', { status: 'Ready to capture' });
  } catch (e) {
    console.error('Error initializing Tesseract worker', e);
    sendMessage('ocr_error', 'Failed to load OCR model.');
  }
}

// 2. Listen for messages from the background script
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'start_ocr') {
    if (!worker) {
      sendMessage('ocr_error', 'Worker not ready. Try again.');
      return;
    }
    
    // Start the recognition process
    (async () => {
      try {
        const { data: { text } } = await worker.recognize(request.payload);
        // Send the final text back
        sendMessage('ocr_result', { text });
      } catch (e) {
        console.error('Error during recognition', e);
        sendMessage('ocr_error', 'OCR failed.');
      }
    })();
  }
});

// 3. Start initializing the worker as soon as this script runs
initializeWorker();
