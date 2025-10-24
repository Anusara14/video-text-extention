# Quick Test Instructions

## 🧪 Testing Your Fixed Extension

### Step 1: Reload Extension
1. Go to `chrome://extensions/`
2. Find "Fast Video OCR"
3. Click the **Reload** button (circular arrow icon)
4. Ensure no errors appear

### Step 2: Check Background Service Worker
1. On the extensions page, find your extension
2. Click **"Inspect views: service worker"**
3. Look for console output:
   ```
   Creating offscreen document...
   ```
4. Leave this console open to monitor messages

### Step 3: Check Offscreen Document
1. In the service worker console, you should see logs indicating the offscreen document is loading Tesseract
2. Look for:
   ```
   Worker paths: { workerPath: "chrome-extension://...", ... }
   Tesseract progress: { status: "loading tesseract core", ... }
   Tesseract Worker Initialized (Offscreen).
   ```

### Step 4: Test on YouTube
1. Open a YouTube video with visible text (recommended test videos):
   - Coding tutorials with code on screen
   - Videos with subtitles enabled
   - Educational videos with text overlays
   
2. Pause on a frame with **clear, large text**

3. Click your extension icon

4. In the popup, click **"Capture Frame"**

5. Watch for progress messages:
   - "Capturing frame..."
   - "Loading OCR model..."
   - "recognizing text (XX%)"
   - "Copied to clipboard!"

6. Paste (Ctrl+V) to verify the extracted text

### Step 5: Check for Common Issues

#### ✅ Success Indicators:
- No red errors in any console
- Progress messages appear in popup
- Text is extracted and copied
- Console shows: "Tesseract Worker Initialized (Offscreen)."

#### ❌ Potential Issues & Solutions:

**Issue:** "Worker not ready. Try again."
- **Solution:** Wait 5-10 seconds after loading extension, then retry
- **Why:** Tesseract takes time to initialize (downloads ~2MB model)

**Issue:** "No video found on page."
- **Solution:** Make sure you're on a YouTube page with an active video
- **Why:** Extension only works on YouTube (see manifest host_permissions)

**Issue:** Console shows "Failed to load resource: net::ERR_FILE_NOT_FOUND"
- **Solution:** Verify all files in `lib/` folder exist:
  - `tesseract.min.js`
  - `worker.min.js`
  - `tesseract-core.wasm.js`
  - `eng.traineddata.gz`
- **Why:** Missing Tesseract library files

**Issue:** CSP errors in console
- **Solution:** Make sure manifest.json has exact CSP from the fix:
  ```json
  "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  ```

**Issue:** Text extraction is inaccurate
- **Why:** This is normal! OCR accuracy depends on:
  - Text size (larger is better)
  - Contrast (black text on white background is best)
  - Font clarity (sans-serif fonts work best)
- **Solution:** Try different frames with clearer text

---

## 🔍 Debug Checklist

If something isn't working, check these in order:

- [ ] All library files exist in `lib/` folder
- [ ] Extension is reloaded after making changes
- [ ] Service worker console shows no errors
- [ ] Offscreen document initialized successfully
- [ ] You're testing on a YouTube video page
- [ ] Video is paused on a frame with visible text
- [ ] manifest.json matches the fixed version exactly
- [ ] offscreen.js matches the fixed version exactly

---

## 📊 Performance Notes

**First Load (Cold Start):**
- Initialization: ~3-5 seconds
- Downloads ~2 MB of data (language model)
- This is normal and expected

**Subsequent Captures (Warm Worker):**
- OCR Processing: ~1-3 seconds
- Depends on image size and text complexity
- Pre-processing helps improve speed

**Memory Usage:**
- Offscreen document: ~30-50 MB
- This is kept alive for faster subsequent captures
- Extension unloads when Chrome is closed

---

## 🎯 Recommended Test Case

**Perfect Test Video:**
1. Go to any YouTube coding tutorial
2. Find a moment with code on screen
3. Make sure the code is:
   - Large enough (at least 14pt font equivalent)
   - High contrast (dark text on light background or vice versa)
   - Clear/in-focus
4. Pause the video
5. Run the extension
6. Verify extracted code matches what you see

**Example search:** "Python tutorial" or "JavaScript tutorial"

---

## ✅ Success Criteria

Your extension is working correctly if:

1. ✅ No console errors in service worker or offscreen document
2. ✅ Status messages appear in popup during processing
3. ✅ Text is extracted (even if not 100% accurate)
4. ✅ Text is automatically copied to clipboard
5. ✅ Can perform multiple captures without reloading

---

## 🆘 Still Having Issues?

Check the detailed explanations in:
- `BUG_FIX_EXPLANATION.md` - Complete technical breakdown
- `CDN_ALTERNATIVE.md` - Alternative approach (not recommended)

Common advanced debugging:
```javascript
// Add to offscreen.js for detailed logging
console.log('Tesseract version:', Tesseract.version);
console.log('Worker state:', worker);
```

Good luck! 🚀
