# CDN Setup Alternative (Reference Only)

## ⚠️ WARNING: Not Recommended for Production

This approach uses Tesseract.js from a CDN. While it works, **local bundling is strongly recommended** for Chrome extensions.

---

## If You Must Use a CDN...

### 1. **manifest.json** (CDN Version)

```json
{
  "manifest_version": 3,
  "name": "Fast Video OCR",
  "version": "1.0",
  "description": "Uses Tesseract.js to OCR text from a YouTube video frame.",
  "permissions": [
    "scripting",
    "clipboardWrite",
    "offscreen"
  ],
  "host_permissions": [
    "*://*.youtube.com/*"
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; worker-src 'self' blob: https://cdn.jsdelivr.net https://unpkg.com; child-src 'self' blob:; object-src 'self';"
  }
}
```

**Key Changes:**
- Added `https://cdn.jsdelivr.net` and `https://unpkg.com` to `script-src`
- Added `worker-src` directive for Web Workers from CDN
- Added `child-src` for blob URLs (Tesseract creates blob: workers internally)

---

### 2. **offscreen.html** (CDN Version)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <!-- Load Tesseract.js from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js"></script>
  <script src="offscreen.js"></script>
</body>
</html>
```

---

### 3. **offscreen.js** (CDN Version)

```javascript
let worker = null;

function sendMessage(type, payload) {
  chrome.runtime.sendMessage({ type, payload });
}

async function initializeWorker() {
  sendMessage('ocr_progress', { status: 'Loading OCR model from CDN...' });
  
  try {
    // No custom paths needed - Tesseract will use CDN defaults
    worker = await Tesseract.createWorker('eng', 1, {
      logger: m => {
        console.log('Tesseract progress:', m);
        sendMessage('ocr_progress', m);
      }
    });
    
    console.log('Tesseract Worker Initialized (CDN).');
    sendMessage('ocr_progress', { status: 'Ready to capture' });
  } catch (e) {
    console.error('Error initializing Tesseract worker', e);
    sendMessage('ocr_error', 'Failed to load OCR model: ' + e.message);
  }
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'start_ocr') {
    if (!worker) {
      sendMessage('ocr_error', 'Worker not ready. Try again.');
      return;
    }
    
    (async () => {
      try {
        const { data: { text } } = await worker.recognize(request.payload);
        sendMessage('ocr_result', { text });
      } catch (e) {
        console.error('Error during recognition', e);
        sendMessage('ocr_error', 'OCR failed: ' + e.message);
      }
    })();
  }
});

initializeWorker();
```

**Simplifications:**
- No `workerPath`, `corePath`, or `langPath` needed
- Tesseract automatically downloads files from its default CDN
- Simpler code but requires internet connection

---

## 🚫 Why You Shouldn't Use This Approach

1. **Chrome Web Store Rejection Risk**
   - Many reviewers flag external script dependencies as security risks
   - Policy violations can delay or prevent publication

2. **Network Dependency**
   - Extension won't work offline
   - Slower first load (downloads ~2-3 MB of data)
   - Vulnerable to CDN outages

3. **CSP Complexity**
   - More directives = more attack surface
   - Harder to maintain and debug
   - `worker-src` and `child-src` requirements add complexity

4. **Security Concerns**
   - Trusting external CDN
   - Man-in-the-middle attack vectors
   - CDN could be compromised

5. **Version Control**
   - CDN might update without your knowledge
   - Breaking changes could occur unexpectedly

---

## ✅ Recommendation

**Always use the local bundling approach** as implemented in the main fix. Download the files once and include them in your extension package:

```
lib/
  ├── tesseract.min.js
  ├── worker.min.js
  ├── tesseract-core.wasm.js
  └── eng.traineddata.gz
```

This ensures:
- ✅ Reliable operation
- ✅ Offline capability
- ✅ Chrome Web Store approval
- ✅ Better performance
- ✅ Full control over dependencies

---

## 📦 Where to Download Local Files

If you don't already have them:

1. Visit: https://github.com/naptha/tesseract.js/releases
2. Download the latest release
3. Extract these files to your `lib/` folder:
   - `tesseract.min.js`
   - `worker.min.js`
   - `tesseract-core.wasm.js`
4. Download language data from:
   - https://github.com/naptha/tessdata/tree/gh-pages/4.0.0
   - Get `eng.traineddata.gz`

---

**Remember:** This CDN approach is documented only for reference. Use the local bundling solution in production!
