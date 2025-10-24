const ocrButton = document.getElementById('ocrButton');
const statusDiv = document.getElementById('status');

ocrButton.addEventListener('click', () => {
  statusDiv.textContent = 'Capturing frame...';
  ocrButton.disabled = true;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['content_script.js']
    });
  });
});

// Listen for messages forwarded from the background script
chrome.runtime.onMessage.addListener((request) => {
  if (request.ocr_progress) {
    let statusText = request.ocr_progress.status;
    if (request.ocr_progress.progress) {
      const progress = (request.ocr_progress.progress * 100).toFixed(0);
      statusText = `${statusText} (${progress}%)`;
    }
    statusDiv.textContent = statusText;
  }

  if (request.ocr_result) {
    const text = request.ocr_result.text;
    
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
    statusDiv.textContent = request.ocr_error;
    ocrButton.disabled = false;
  }
});

