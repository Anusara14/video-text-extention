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
    // Get paths to locally bundled files using chrome.runtime.getURL()
    const corePath = chrome.runtime.getURL('lib/tesseract-core.wasm.js');
    const langPath = chrome.runtime.getURL('lib/');
    const workerPath = chrome.runtime.getURL('lib/worker.min.js');

    console.log('Paths:', { corePath, langPath, workerPath });
    
    // Fetch the worker script and convert to data URL
    // This is the ONLY way that works in Chrome extensions
    const workerResponse = await fetch(workerPath);
    const workerBlob = await workerResponse.blob();
    const workerCode = await workerBlob.text();
    const workerDataURL = `data:text/javascript;base64,${btoa(workerCode)}`;
    
    console.log('Created worker data URL (length:', workerCode.length, 'bytes)');
    
    // Use the data URL for the worker
    worker = await Tesseract.createWorker('eng', 1, {
      workerPath: workerDataURL,
      corePath: corePath,
      langPath: langPath,
      logger: m => {
        console.log('Tesseract progress:', m);
        sendMessage('ocr_progress', m);
      }
    });
    
    console.log('Tesseract Worker Initialized (Offscreen).');
    sendMessage('ocr_progress', { status: 'Ready to capture' });
  } catch (e) {
    console.error('Error initializing Tesseract worker', e);
    sendMessage('ocr_error', 'Failed to load OCR model: ' + e.message);
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
        sendMessage('ocr_error', 'OCR failed: ' + e.message);
      }
    })();
  }
});

// 3. Start initializing the worker as soon as this script runs
initializeWorker();

