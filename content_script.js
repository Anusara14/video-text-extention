(function() {
  // Prevent multiple executions in the same frame
  if (window.__videoOcrExecuted) {
    console.log('Script already executed in this frame, skipping...');
    return;
  }
  window.__videoOcrExecuted = true;
  
  try {
    // Try to find video element - check multiple locations
    let video = document.querySelector('video');
    
    // If not found, check in iframes (for Vimeo and other embedded players)
    if (!video) {
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          video = iframeDoc.querySelector('video');
          if (video) {
            console.log('Found video in iframe');
            break;
          }
        } catch (e) {
          // Cross-origin iframe, skip it
          console.log('Skipping cross-origin iframe');
        }
      }
    }
    
    // Check shadow DOM (some video players use this)
    if (!video) {
      const shadowHosts = document.querySelectorAll('*');
      for (const host of shadowHosts) {
        if (host.shadowRoot) {
          video = host.shadowRoot.querySelector('video');
          if (video) {
            console.log('Found video in shadow DOM');
            break;
          }
        }
      }
    }
    
    if (!video) {
      chrome.runtime.sendMessage({ ocr_error: "No video found on page. Make sure the video is playing or paused." });
      return;
    }
    
    // Check if video has valid dimensions
    if (!video.videoWidth || !video.videoHeight) {
      chrome.runtime.sendMessage({ ocr_error: "Video not ready. Please play the video first, then pause and try again." });
      return;
    }

    console.log('Found video:', video.videoWidth, 'x', video.videoHeight);

    // 1. Create an off-screen canvas
    const canvas = document.createElement('canvas');
    
    // *** OPTIMIZATION: Scale down large images to prevent API timeout ***
    const maxWidth = 1920;
    const maxHeight = 1080;
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    // Scale down if image is too large
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
      console.log(`Scaling image from ${video.videoWidth}x${video.videoHeight} to ${width}x${height}`);
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // 2. Draw the current video frame onto the canvas
    ctx.drawImage(video, 0, 0, width, height);

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

    // 5. Put the processed image data back on the canvas
    ctx.putImageData(imageData, 0, 0);
    
    // 6. Convert canvas to data URL
    // Use JPEG with 85% quality for smaller file size (faster upload)
    const dataURL = canvas.toDataURL('image/jpeg', 0.85);
    
    console.log('Captured frame, data URL length:', dataURL.length);
    console.log('Image dimensions:', width, 'x', height);
    
    // 7. Send the data URL to the background script
    chrome.runtime.sendMessage({ image: dataURL }, (response) => {
      console.log('Frame capture sent successfully');
    });
    
    // Mark as successfully captured to prevent other frames from sending
    window.__videoOcrCaptured = true;

  } catch (e) {
    console.error('Error capturing frame:', e);
    // Only send error if no other frame has captured successfully
    if (!window.__videoOcrCaptured) {
      chrome.runtime.sendMessage({ ocr_error: "Failed to capture frame: " + e.message });
    }
  }
})();
