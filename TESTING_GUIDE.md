# Testing Guide for Video OCR Chrome Extension

## Installation Steps

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or click the three dots menu → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to `e:\Projects\video-text\` and select this folder
   - The extension should now appear in your extensions list

## Testing Steps

### Test 1: Basic Functionality
1. Go to any YouTube video with visible text (e.g., a tutorial with subtitles or text overlays)
2. Pause the video on a frame with clear, readable text
3. Click the extension icon in your toolbar
4. Click the "Capture Frame" button
5. Wait for the OCR processing (you should see progress updates)
6. The extracted text should be copied to your clipboard automatically
7. Paste (Ctrl+V) the text somewhere to verify it worked

### Test 2: Error Handling
1. Open a non-YouTube page
2. Try to capture a frame
3. Should show an error message

### Recommended Test Videos
- Tutorial videos with code or text on screen
- Videos with clear subtitles
- Videos with text overlays or captions

## Expected Behavior

✅ **Should work:**
- YouTube videos with clear text
- Text in subtitles, code snippets, or overlays
- Shows progress during OCR processing
- Copies text to clipboard automatically

❌ **Won't work well:**
- Blurry or low-resolution text
- Handwritten text
- Very small text
- Non-YouTube videos (extension is restricted to YouTube)

## Troubleshooting

**"Worker not ready" error:**
- Reload the extension and wait a few seconds for initialization

**No text extracted:**
- Make sure there's visible text in the current frame
- Try pausing on a clearer frame
- Check that the text is large and high-contrast

**Extension doesn't appear:**
- Check that all files are present (manifest.json, lib folder, etc.)
- Check Chrome's console for errors (right-click extension → Inspect popup)
