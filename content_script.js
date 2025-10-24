(function() {
  try {
    const video = document.querySelector('video');
    if (!video) {
      chrome.runtime.sendMessage({ ocr_error: "No video found on page." });
      return;
    }

    // 1. Create an off-screen canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // 2. Draw the current video frame onto the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 3. Get the raw image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 4. *** OPTIMIZATION: PRE-PROCESS THE IMAGE ***
    // This is the secret sauce. We convert to grayscale and apply a
    // high-contrast threshold to make the text pure black/white.
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Grayscale = (R + G + B) / 3
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      
      // Threshold: if brighter than 128, make it pure white (255)
      // otherwise, make it pure black (0)
      const color = avg > 128 ? 255 : 0;
      
      data[i] = color;     // Red
      data[i + 1] = color; // Green
      data[i + 2] = color; // Blue
      // Alpha channel (data[i + 3]) remains unchanged (255)
    }

    // 5. Send the *processed* image data to the background script
    // We send the 'imageData' object directly, which is faster than
    // creating a Base64/PNG string.
    chrome.runtime.sendMessage({ image: imageData });

  } catch (e) {
    console.error('Error capturing frame:', e);
    chrome.runtime.sendMessage({ ocr_error: "Failed to capture frame." });
  }
})();
