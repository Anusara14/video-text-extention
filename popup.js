// DOM Elements
const captureBtn = document.getElementById('captureBtn');
const captureBtnText = document.getElementById('captureBtnText');
const clearBtn = document.getElementById('clearBtn');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');
const previewSection = document.getElementById('previewSection');
const emptyState = document.getElementById('emptyState');
const textEditor = document.getElementById('textEditor');
const charCount = document.getElementById('charCount');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

// State
let currentText = '';
let isProcessing = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSavedText();
  updateUI();
});

// Capture Button Click
captureBtn.addEventListener('click', () => {
  if (isProcessing) return;
  
  isProcessing = true;
  updateStatus('processing', 'Capturing frame...');
  captureBtn.disabled = true;
  captureBtnText.textContent = 'Processing...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      showError('No active tab found');
      return;
    }
    
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['content_script.js']
    }).catch(err => {
      showError('Failed to capture. Make sure you\'re on a YouTube page.');
      console.error(err);
    });
  });
});

// Clear Button Click
clearBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the text?')) {
    currentText = '';
    textEditor.value = '';
    updateUI();
    saveText('');
    updateStatus('default', 'Text cleared. Ready to capture.');
  }
});

// Text Editor Input
textEditor.addEventListener('input', () => {
  currentText = textEditor.value;
  updateCharCount();
  saveText(currentText);
  
  // Enable/disable buttons based on content
  const hasText = currentText.trim().length > 0;
  copyBtn.disabled = !hasText;
  downloadBtn.disabled = !hasText;
  clearBtn.disabled = !hasText;
});

// Copy Button Click
copyBtn.addEventListener('click', async () => {
  if (!currentText.trim()) return;
  
  try {
    await navigator.clipboard.writeText(currentText);
    updateStatus('success', '✓ Copied to clipboard!');
    
    // Reset status after 3 seconds
    setTimeout(() => {
      if (!isProcessing) {
        updateStatus('default', 'Ready to capture');
      }
    }, 3000);
  } catch (err) {
    console.error('Failed to copy:', err);
    updateStatus('error', 'Failed to copy to clipboard');
  }
});

// Download Button Click
downloadBtn.addEventListener('click', () => {
  if (!currentText.trim()) return;
  
  const blob = new Blob([currentText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `video-text-${timestamp}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  updateStatus('success', '✓ Text downloaded!');
  setTimeout(() => {
    if (!isProcessing) {
      updateStatus('default', 'Ready to capture');
    }
  }, 3000);
});

// Listen for OCR results from background script
chrome.runtime.onMessage.addListener((request) => {
  if (request.ocr_progress) {
    let status = request.ocr_progress.status;
    if (request.ocr_progress.progress) {
      const progress = (request.ocr_progress.progress * 100).toFixed(0);
      status = `${status} ${progress}%`;
    }
    updateStatus('processing', status);
  }

  if (request.ocr_result) {
    const text = request.ocr_result.text;
    
    if (text && text.trim()) {
      currentText = text;
      textEditor.value = text;
      textEditor.disabled = false;
      updateUI();
      saveText(text);
      updateStatus('success', `✓ Extracted ${text.length} characters`);
      
      // Auto-copy to clipboard
      navigator.clipboard.writeText(text).catch(err => {
        console.error('Auto-copy failed:', err);
      });
    } else {
      updateStatus('error', 'No text found in frame');
    }
    
    isProcessing = false;
    captureBtn.disabled = false;
    captureBtnText.textContent = 'Capture Frame';
  }

  if (request.ocr_error) {
    showError(request.ocr_error);
  }
});

// Helper Functions
function updateStatus(type, message) {
  statusBar.className = `status-bar ${type}`;
  
  // Update icon
  const iconHTML = {
    'default': `<svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
    </svg>`,
    'success': `<svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
    </svg>`,
    'error': `<svg class="status-icon" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
    </svg>`,
    'processing': `<div class="spinner"></div>`
  };
  
  statusBar.innerHTML = (iconHTML[type] || iconHTML.default) + `<span id="statusText">${message}</span>`;
}

function showError(message) {
  updateStatus('error', message);
  isProcessing = false;
  captureBtn.disabled = false;
  captureBtnText.textContent = 'Capture Frame';
  
  setTimeout(() => {
    updateStatus('default', 'Ready to capture');
  }, 4000);
}

function updateUI() {
  const hasText = currentText.trim().length > 0;
  
  if (hasText) {
    emptyState.style.display = 'none';
    previewSection.style.display = 'flex';
    previewSection.classList.add('fade-in');
  } else {
    emptyState.style.display = 'flex';
    previewSection.style.display = 'none';
  }
  
  updateCharCount();
  copyBtn.disabled = !hasText;
  downloadBtn.disabled = !hasText;
  clearBtn.disabled = !hasText;
}

function updateCharCount() {
  const count = currentText.length;
  charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
}

function saveText(text) {
  chrome.storage.local.set({ lastExtractedText: text });
}

function loadSavedText() {
  chrome.storage.local.get(['lastExtractedText'], (result) => {
    if (result.lastExtractedText) {
      currentText = result.lastExtractedText;
      textEditor.value = currentText;
      textEditor.disabled = false;
      updateUI();
    }
  });
}

