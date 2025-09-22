// Store detected PDF/PPT URLs
let detectedFiles: { url: string; type: 'pdf' | 'ppt' }[] = [];

// Listen for web requests to detect PDF/PPT files
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    
    // Check if the URL contains PDF or PPT files directly
    if (url.includes('.pdf') || url.includes('.ppt') || url.includes('.pptx')) {
      const fileType = url.includes('.pdf') ? 'pdf' : 'ppt';
      
      // Add to detected files if not already present
      if (!detectedFiles.some(file => file.url === url)) {
        detectedFiles.push({ url, type: fileType });
        
        // Notify content script about the detected file
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'FILE_DETECTED',
              data: { url, fileType }
            });
          }
        });
      }
    }
    
    // Also check for contentFileViewer.html requests and extract the file parameter
    if (url.includes('contentFileViewer.html')) {
      try {
        const urlObj = new URL(url);
        const fileUrl = urlObj.searchParams.get('file');
        if (fileUrl && (fileUrl.includes('.pdf') || fileUrl.includes('.ppt') || fileUrl.includes('.pptx'))) {
          const fileType = fileUrl.includes('.pdf') ? 'pdf' : 'ppt';
          
          // Add to detected files if not already present
          if (!detectedFiles.some(file => file.url === fileUrl)) {
            detectedFiles.push({ url: fileUrl, type: fileType });
            
            // Notify content script about the detected file
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  type: 'FILE_DETECTED',
                  data: { url: fileUrl, fileType }
                });
              }
            });
          }
        }
      } catch (error) {
        // Error parsing contentFileViewer URL
        return;
      }
    }
  },
  { urls: ['https://d1u9l98yeftf1r.cloudfront.net/*', 'https://studentzone-ncdoe.nmims.edu/*'] },
  ['requestBody']
);

// Handle download requests from content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'DOWNLOAD_FILE') {
    const { url, filename } = request.data;
    
    chrome.downloads.download({
      url: url,
      filename: filename || 'document',
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    });
    
    return true; // Keep the message channel open for async response
  }
  
  if (request.type === 'GET_DETECTED_FILES') {
    sendResponse({ files: detectedFiles });
    return true;
  }
});

// Clear detected files when tab is updated/closed
chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    detectedFiles = [];
    // Page loading - cleared detected files
  }
});

// Also clear when navigation starts
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) { // Main frame navigation only
    detectedFiles = [];
    // Navigation started - cleared detected files
  }
});
