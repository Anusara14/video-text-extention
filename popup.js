const ocrButton = document.getElementById('ocrButton');
const statusDiv = document.getElementById('status');

// Listen for the button click
ocrButton.addEventListener('click', () => {
  statusDiv.textContent = 'Capturing frame...';
  ocrButton.disabled = true;

  // Get the active tab (must be YouTube)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Inject and run the content script
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['content_script.js']
    });
  });
});

// Listen for messages from other scripts (background.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.ocr_progress) {
    // Show real-time progress from Tesseract.js
    let statusText = request.ocr_progress.status;
    if (request.ocr_progress.progress) {
      const progress = (request.ocr_progress.progress * 100).toFixed(0);
      statusText = `${statusText} (${progress}%)`;
    }
    statusDiv.textContent = statusText;
  }

  if (request.ocr_result) {
    // Got the final text!
    const text = request.ocr_result.text;
    
    // Copy text to clipboard
    navigator.clipboard.writeText(text)
      .then(() => {
        statusDiv.textContent = 'Copied to clipboard!';
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        statusDiv.textContent = 'Error copying text.';
      });
    
    ocrButton.disabled = false;
  }

  if (request.ocr_error) {
    // Handle any errors
    statusDiv.textContent = request.ocr_error;
    ocrButton.disabled = false;
  }
});
