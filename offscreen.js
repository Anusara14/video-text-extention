// OCR.space API Key (Free: 25,000 requests/month)
// Get your free API key from: https://ocr.space/ocrapi
const OCR_API_KEY = 'K84427505588957'; // Free tier key - you can get your own at ocr.space/ocrapi

// Helper function to send messages back to the background script
function sendMessage(type, payload) {
  chrome.runtime.sendMessage({ type, payload });
}

// Initialize
console.log('=== OFFSCREEN DOCUMENT LOADED ===');
console.log('Using OCR.space API');
console.log('API Key:', OCR_API_KEY.substring(0, 8) + '...');
sendMessage('ocr_progress', { status: 'Ready to capture' });

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request) => {
  console.log('=== OFFSCREEN RECEIVED MESSAGE ===', request);
  
  if (request.type === 'start_ocr') {
    console.log('Starting OCR with OCR.space API...');
    console.log('Image data type:', typeof request.payload);
    console.log('Image data starts with:', request.payload ? request.payload.substring(0, 50) : 'NULL');
    
    sendMessage('ocr_progress', { status: 'Uploading image to OCR service...' });
    
    (async () => {
      try {
        // OCR.space API expects base64 image without the data URL prefix
        const base64Image = request.payload.includes(',') 
          ? request.payload.split(',')[1] 
          : request.payload;
        
        console.log('Base64 image length:', base64Image.length);
        
        // Create form data for OCR.space API
        const formData = new FormData();
        formData.append('base64Image', 'data:image/png;base64,' + base64Image);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2'); // Engine 2 is more accurate
        
        console.log('Sending request to OCR.space API...');
        sendMessage('ocr_progress', { status: 'Processing image...' });
        
        const response = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          headers: {
            'apikey': OCR_API_KEY
          },
          body: formData
        });
        
        console.log('Received response from OCR.space, status:', response.status);
        
        if (!response.ok) {
          throw new Error(`OCR API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('OCR.space response:', data);
        
        // Check if OCR was successful
        if (data.OCRExitCode !== 1) {
          throw new Error(data.ErrorMessage || 'OCR processing failed');
        }
        
        // Extract text from the response
        const text = data.ParsedResults && data.ParsedResults[0] 
          ? data.ParsedResults[0].ParsedText 
          : '';
        
        if (!text || text.trim().length === 0) {
          console.warn('No text detected in image');
          sendMessage('ocr_result', { text: '(No text detected in image)' });
        } else {
          console.log('OCR completed successfully!');
          console.log('Text length:', text.length);
          console.log('Text preview:', text.substring(0, 100));
          
          // Send the final text back
          sendMessage('ocr_result', { text: text });
        }
        
      } catch (e) {
        console.error('Error during OCR recognition:', e);
        console.error('Error details:', e.message);
        sendMessage('ocr_error', 'OCR failed: ' + e.message);
      }
    })();
  }
});

