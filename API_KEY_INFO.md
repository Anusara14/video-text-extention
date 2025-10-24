# OCR.space API Key Information

## Current API Key

The extension is currently using a **free tier API key** from OCR.space:

```
API Key: K87899142388957
```

## Free Tier Limits

- ✅ **25,000 requests per month**
- ✅ **No credit card required**
- ✅ **No expiration**
- ✅ **Supports 50+ languages**

## Get Your Own API Key (Optional)

If you want your own API key:

1. Go to: https://ocr.space/ocrapi
2. Click "Register for Free API Key"
3. Fill in your email
4. Check your email for the API key
5. Replace the API key in `offscreen.js`:

```javascript
const OCR_API_KEY = 'YOUR_NEW_API_KEY_HERE';
```

## Features Enabled

- **OCR Engine 2** - More accurate (supports handwriting)
- **Auto-detect orientation** - Works with rotated text
- **Image scaling** - Optimizes for better accuracy
- **English language** - Can be changed to other languages

## Supported Languages

You can change the language in `offscreen.js` by modifying:

```javascript
formData.append('language', 'eng'); // Change 'eng' to other language codes
```

Language codes:
- `eng` - English
- `ara` - Arabic
- `chs` - Chinese Simplified
- `cht` - Chinese Traditional
- `jpn` - Japanese
- `kor` - Korean
- `spa` - Spanish
- `fre` - French
- `ger` - German
- And 40+ more!

## API Documentation

Full API docs: https://ocr.space/ocrapi

## Rate Limiting

If you exceed 25,000 requests/month:
- The API will return an error
- You can upgrade to paid plan ($7.99/month for 100,000 requests)
- Or create a new free API key with a different email

## Privacy

- Images are **NOT stored** by OCR.space
- Processed in real-time and discarded
- Secure HTTPS connection
- See privacy policy: https://ocr.space/privacypolicy

## Troubleshooting

**Error: "API key invalid"**
- Check that the API key is correct
- Make sure there are no extra spaces

**Error: "Rate limit exceeded"**
- You've used all 25,000 requests this month
- Wait until next month or get a paid plan
- Or create a new free API key

**Error: "No text detected"**
- Image might be too blurry
- Text might be too small
- Try capturing a different frame with clearer text

## Advantages Over Tesseract.js

✅ **No Web Worker issues** - Simple API calls
✅ **No CSP problems** - Just fetch requests
✅ **Better accuracy** - Professional OCR engine
✅ **Faster** - Processed on powerful servers
✅ **No setup** - Works immediately
✅ **Always updated** - No need to update libraries

## Disadvantages

❌ **Requires internet** - Won't work offline
❌ **Rate limited** - 25,000 requests/month free
❌ **External dependency** - Relies on OCR.space service

## Upgrading to Google Cloud Vision (More Accurate)

If you need even better accuracy:

1. Get Google Cloud Vision API key
2. Replace OCR.space endpoint with Google's
3. Cost: First 1,000 requests/month free, then $1.50 per 1,000

---

**The extension should work perfectly now! 🎉**
