// Helper function to send messages back to the background script
function sendMessage(type, payload) {
  chrome.runtime.sendMessage({ type, payload });
}

let worker = null;

// 1. Initialize worker with Tesseract.js v4 API
async function initializeWorker() {
  sendMessage('ocr_progress', { status: 'Loading OCR model...' });
  
  try {
    // Get paths to locally bundled files using chrome.runtime.getURL()
    const workerPath = chrome.runtime.getURL('lib/worker.min.js');
    const corePath = chrome.runtime.getURL('lib/tesseract-core.wasm.js');
    const langPath = chrome.runtime.getURL('lib/');

    console.log('Initializing Tesseract v4 with paths:', { workerPath, corePath, langPath });
    
    // Tesseract.js v4 API - create worker
    worker = Tesseract.createWorker({
      workerPath: workerPath,
      corePath: corePath,
      langPath: langPath,
      logger: m => {
        console.log('Tesseract:', m);
        if (m.status) {
          sendMessage('ocr_progress', m);
        }
      }
    });
    
    // Initialize the worker (v4 requires these steps)
    console.log('Loading worker...');
    await worker.load();
    
    console.log('Loading language...');
    await worker.loadLanguage('eng');
    
    console.log('Initializing API...');
    await worker.initialize('eng');
    
    console.log('Tesseract Worker Initialized Successfully!');
    sendMessage('ocr_progress', { status: 'Ready to capture' });
  } catch (e) {
    console.error('Error initializing Tesseract worker:', e);
    console.error('Error details:', e.message, e.stack);
    sendMessage('ocr_error', 'Failed to initialize: ' + e.message);
  }
}

// 2. Listen for messages from the background script
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'start_ocr') {
    if (!worker) {
      console.error('Worker not initialized');
      sendMessage('ocr_error', 'Tesseract not ready. Try again.');
      return;
    }
    
    // Start the recognition process
    (async () => {
      try {
        console.log('Starting OCR recognition...');
        console.log('Image data type:', typeof request.payload);
        
        sendMessage('ocr_progress', { status: 'Recognizing text...' });
        
        // Tesseract.js v4 API - recognize returns result directly
        const result = await worker.recognize(request.payload);
        
        console.log('OCR completed successfully!');
        console.log('Text length:', result.data.text.length);
        console.log('Text preview:', result.data.text.substring(0, 100));
        
        // Send the final text back
        sendMessage('ocr_result', { text: result.data.text });
      } catch (e) {
        console.error('Error during OCR recognition:', e);
        console.error('Error details:', e.message);
        sendMessage('ocr_error', 'OCR failed: ' + e.message);
      }
    })();
  }
});

// 3. Start initializing as soon as this script runs
console.log('Offscreen document loaded, initializing Tesseract v4...');
initializeWorker();

