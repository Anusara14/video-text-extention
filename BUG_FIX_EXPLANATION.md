# Bug Fix Explanation: Tesseract.js in Chrome Extension Offscreen Document

## 🐛 Original Problems

### 1. **TypeError: worker.load is not a function**
**Root Cause:** In Tesseract.js v5.x, the API changed significantly. `createWorker()` now returns a **Promise** that resolves to the worker object, not the worker object directly.

**Old (Incorrect) Code:**
```javascript
worker = Tesseract.createWorker({ ... });
await worker.load();  // ❌ worker is a Promise, not an object!
```

**Fixed Code:**
```javascript
worker = await Tesseract.createWorker('eng', 1, { ... });  // ✅ Await the Promise!
```

### 2. **NetworkError: Failed to execute 'importScripts'**
**Root Cause:** While you were using local files (good!), the `web_accessible_resources` configuration was too restrictive. It only allowed YouTube pages to access the files, but the **offscreen document itself** also needs access to these resources.

**Old Configuration:**
```json
"web_accessible_resources": [{
  "resources": ["lib/worker.min.js", ...],
  "matches": ["*://*.youtube.com/*"]  // ❌ Too restrictive!
}]
```

**Fixed Configuration:**
```json
"web_accessible_resources": [{
  "resources": ["lib/worker.min.js", ...],
  "matches": ["<all_urls>"]  // ✅ Allows offscreen document access
}]
```

### 3. **Incorrect Tesseract.js v5.x API Usage**
The new API in v5.x simplified initialization by combining steps.

**Old API (v4.x style):**
```javascript
worker = Tesseract.createWorker({ workerPath, corePath });
await worker.load();
await worker.loadLanguage('eng');
await worker.initialize('eng');
```

**New API (v5.x - Simplified):**
```javascript
worker = await Tesseract.createWorker('eng', 1, {
  workerPath,
  corePath,
  langPath
});
// That's it! Load, loadLanguage, and initialize are done automatically.
```

### 4. **Message Forwarding Bug**
The background script was forwarding messages incorrectly to the popup.

**Old Code:**
```javascript
chrome.runtime.sendMessage(request.payload)  // ❌ Wrong structure!
```

**Fixed Code:**
```javascript
const forwardMessage = { ocr_progress: request.payload };  // ✅ Correct structure!
chrome.runtime.sendMessage(forwardMessage)
```

---

## 🔧 Complete Solution (Local Setup)

### **Why Local Setup is Better:**
1. ✅ **No CSP conflicts** with external CDN URLs
2. ✅ **Works offline**
3. ✅ **Faster loading** (no network requests)
4. ✅ **More reliable** (no dependency on external servers)
5. ✅ **Passes Chrome Web Store review** more easily

### **Files Modified:**

#### 1. `manifest.json`
**Changes Made:**
- Added `offscreen.html` to `web_accessible_resources`
- Changed `matches` from `["*://*.youtube.com/*"]` to `["<all_urls>"]`
- Kept `script-src 'self' 'wasm-unsafe-eval'` for WASM support

**Why:**
- Offscreen documents need access to worker files via `chrome.runtime.getURL()`
- `'wasm-unsafe-eval'` is required for WebAssembly (Tesseract's core engine)

#### 2. `offscreen.js`
**Critical Fix:**
```javascript
// OLD (BROKEN):
worker = Tesseract.createWorker({ workerPath, corePath });
await worker.load();

// NEW (WORKING):
worker = await Tesseract.createWorker('eng', 1, {
  workerPath: workerPath,
  corePath: corePath,
  langPath: langPath,
  logger: m => sendMessage('ocr_progress', m)
});
```

**Why:**
- `createWorker()` in v5.x is async and returns a Promise
- The first parameter is the language ('eng')
- The second parameter is the OEM mode (1 = LSTM neural network)
- All initialization is done in one call

#### 3. `background.js`
**Fix:** Properly structured message forwarding to match what `popup.js` expects.

---

## 🆚 Alternative: CDN Setup (Less Recommended)

If you wanted to use a CDN instead of local files, you'd need to:

### **manifest.json Changes:**
```json
"content_security_policy": {
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob: https://cdn.jsdelivr.net; object-src 'self';"
}
```

### **offscreen.html Changes:**
```html
<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js"></script>
```

### **offscreen.js Changes:**
```javascript
// Use default CDN paths (no workerPath/corePath needed)
worker = await Tesseract.createWorker('eng');
```

**Why This is NOT Recommended:**
- ❌ Chrome Web Store often rejects extensions with external script dependencies
- ❌ Requires internet connection
- ❌ Slower initial load
- ❌ CSP configuration is more complex and error-prone
- ❌ CDN could go down or change

---

## 📋 Testing Checklist

After applying these fixes:

1. ✅ Reload the extension in `chrome://extensions/`
2. ✅ Open the extension and check the console (right-click extension icon → Inspect popup)
3. ✅ Check the background service worker console (Extensions page → "Inspect views: service worker")
4. ✅ Go to a YouTube video and test frame capture
5. ✅ Verify you see progress messages like "recognizing text"
6. ✅ Confirm text is copied to clipboard successfully

### **Expected Console Output:**
```
Creating offscreen document...
Worker paths: { workerPath: "chrome-extension://...", ... }
Tesseract progress: { status: "loading tesseract core", ... }
Tesseract Worker Initialized (Offscreen).
```

---

## 🎓 Key Takeaways

1. **Always check the library version** - API changes between major versions
2. **Async/await matters** - Modern APIs often return Promises
3. **CSP is critical** - Understand what your extension pages need access to
4. **Local bundling > CDN** - For Chrome extensions, always bundle dependencies locally
5. **Use offscreen documents** - Perfect for heavy computations like OCR in Manifest V3

---

## 📚 Additional Resources

- [Tesseract.js v5.x Documentation](https://github.com/naptha/tesseract.js)
- [Chrome Extensions Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Offscreen Documents API](https://developer.chrome.com/docs/extensions/reference/offscreen/)
- [Content Security Policy for Extensions](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#content-security-policy)
