// Helper function to send messages back to the background script
function sendMessage(type, payload) {
  chrome.runtime.sendMessage({ type, payload });
}

let worker = null;

// 1. Initialize worker
async function initializeWorker() {
  sendMessage('ocr_progress', { status: 'Loading OCR model...' });
  
  try {
    // Get paths to locally bundled files using chrome.runtime.getURL()
    const corePath = chrome.runtime.getURL('lib/tesseract-core.wasm.js');
    const langPath = chrome.runtime.getURL('lib/');
    const workerPath = chrome.runtime.getURL('lib/worker.min.js');

    console.log('Initializing Tesseract with paths:', { corePath, langPath, workerPath });
    
    // Try to create worker with blob URL
    try {
      // Fetch the worker script content
      const workerResponse = await fetch(workerPath);
      const workerText = await workerResponse.text();
      
      // Create a Blob from the worker code
      const workerBlob = new Blob([workerText], { type: 'application/javascript' });
      const workerBlobURL = URL.createObjectURL(workerBlob);
      
      console.log('Worker Blob URL created:', workerBlobURL);
      
      // Create worker with blob URL (this works in offscreen documents!)
      worker = await Tesseract.createWorker('eng', 1, {
        workerPath: workerBlobURL,
        corePath: corePath,
        langPath: langPath,
        gzip: false,  // Using uncompressed .traineddata file
        logger: m => {
          console.log('Tesseract:', m);
          if (m.status) {
            sendMessage('ocr_progress', m);
          }
        }
      });
    } catch (workerError) {
      console.error('Blob worker creation failed, trying without workerPath:', workerError);
      
      // Fallback: Try without specifying workerPath (uses inline code)
      worker = await Tesseract.createWorker('eng', 1, {
        corePath: corePath,
        langPath: langPath,
        gzip: false,
        logger: m => {
          console.log('Tesseract:', m);
          if (m.status) {
            sendMessage('ocr_progress', m);
          }
        }
      });
    }
    
    console.log('Tesseract Worker Initialized Successfully!');
    sendMessage('ocr_progress', { status: 'Ready to capture' });
  } catch (e) {
    console.error('Error initializing Tesseract worker:', e);
    console.error('Error stack:', e.stack);
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
        console.log('Starting OCR recognition with image data...');
        console.log('Image data type:', typeof request.payload);
        console.log('Image data:', request.payload);
        
        const result = await worker.recognize(request.payload);
        
        console.log('OCR completed successfully!');
        console.log('Text length:', result.data.text.length);
        console.log('Text preview:', result.data.text.substring(0, 100));
        
        // Send the final text back
        sendMessage('ocr_result', { text: result.data.text });
      } catch (e) {
        console.error('Error during OCR recognition:', e);
        console.error('Error stack:', e.stack);
        sendMessage('ocr_error', 'OCR failed: ' + e.message);
      }
    })();
  }
});

// 3. Start initializing as soon as this script runs
console.log('Offscreen document loaded, initializing Tesseract...');
initializeWorker();

