import { JSX, useEffect, useState } from 'react';

interface DetectedFile {
  url: string;
  type: 'pdf' | 'ppt';
}

export default function Content(): JSX.Element {
  const [detectedFiles, setDetectedFiles] = useState<DetectedFile[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Clear detected files when page loads (navigation)
    setDetectedFiles([]);
    
    // Listen for messages from background script about detected files
    const handleMessage = (message: { type: string; data?: { url: string; fileType: string } }) => {
      if (message.type === 'FILE_DETECTED') {
        const { url, fileType } = message.data;
        setDetectedFiles(prev => {
          if (!prev.some(file => file.url === url)) {
            return [...prev, { url, type: fileType }];
          }
          return prev;
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    // Check for already detected files on load
    chrome.runtime.sendMessage({ type: 'GET_DETECTED_FILES' }, (response) => {
      if (response?.files) {
        setDetectedFiles(response.files);
      }
    });

    // Check for iframes and extract actual PDF/PPT URLs
    const checkIframes = () => {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        const src = iframe.src;
        if (src && src.includes('contentFileViewer.html')) {
          // Extract the actual file URL from the viewer URL
          try {
            const url = new URL(src);
            const fileUrl = url.searchParams.get('file');
            // Found contentFileViewer iframe
            // Extracted file URL
            if (fileUrl && (fileUrl.includes('.pdf') || fileUrl.includes('.ppt') || fileUrl.includes('.pptx'))) {
              const fileType = fileUrl.includes('.pdf') ? 'pdf' : 'ppt';
              // Adding detected file
              setDetectedFiles(prev => {
                if (!prev.some(file => file.url === fileUrl)) {
                  return [...prev, { url: fileUrl, type: fileType }];
                }
                return prev;
              });
            }
          } catch (error) {
            // Error parsing iframe URL
          }
        } else if (src && (src.includes('.pdf') || src.includes('.ppt') || src.includes('.pptx'))) {
          // Direct PDF/PPT URLs
          const fileType = src.includes('.pdf') ? 'pdf' : 'ppt';
          setDetectedFiles(prev => {
            if (!prev.some(file => file.url === src)) {
              return [...prev, { url: src, type: fileType }];
            }
            return prev;
          });
        }
      });
    };

    // Check immediately and set up observer for dynamic content
    checkIframes();
    
    // Also check for any embedded PDF viewers or direct PDF links
    const checkForPDFLinks = () => {
      // Look for direct PDF links
      const pdfLinks = document.querySelectorAll('a[href*=".pdf"], a[href*=".ppt"], a[href*=".pptx"]');
      pdfLinks.forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        if (href && (href.includes('.pdf') || href.includes('.ppt') || href.includes('.pptx'))) {
          const fileType = href.includes('.pdf') ? 'pdf' : 'ppt';
          setDetectedFiles(prev => {
            if (!prev.some(file => file.url === href)) {
              return [...prev, { url: href, type: fileType }];
            }
            return prev;
          });
        }
      });
      
      // Look for embed tags with PDF sources
      const embeds = document.querySelectorAll('embed[src*=".pdf"], embed[src*=".ppt"], embed[src*=".pptx"]');
      embeds.forEach((embed) => {
        const src = (embed as HTMLEmbedElement).src;
        if (src && (src.includes('.pdf') || src.includes('.ppt') || src.includes('.pptx'))) {
          const fileType = src.includes('.pdf') ? 'pdf' : 'ppt';
          setDetectedFiles(prev => {
            if (!prev.some(file => file.url === src)) {
              return [...prev, { url: src, type: fileType }];
            }
            return prev;
          });
        }
      });
    };
    
    checkForPDFLinks();
    
    const observer = new MutationObserver(() => {
      checkIframes();
      checkForPDFLinks();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Listen for page navigation events
    const handleNavigation = () => {
      setDetectedFiles([]);
      // Page navigation detected - cleared detected files
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleNavigation);
    
    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      setTimeout(handleNavigation, 100); // Small delay to ensure DOM is updated
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      setTimeout(handleNavigation, 100);
    };

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      observer.disconnect();
      window.removeEventListener('popstate', handleNavigation);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const handleDownload = async () => {
    if (detectedFiles.length === 0 || isDownloading) return;

    setIsDownloading(true);

    try {
      // Download the first detected file (or you could show a list to choose from)
      const fileToDownload = detectedFiles[0];
      const filename = extractFilename(fileToDownload.url) || `document.${fileToDownload.type}`;

      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_FILE',
        data: {
          url: fileToDownload.url,
          filename: filename
        }
      }, (response) => {
        setIsDownloading(false);
        if (response?.success) {
          // Show success feedback (optional)
          // Download started successfully
        } else {
          // Download failed
        }
      });
    } catch (error) {
      setIsDownloading(false);
      // Download error
    }
  };

  const extractFilename = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      return filename || '';
    } catch {
      return '';
    }
  };

  // Only show the download button if files are detected
  if (detectedFiles.length === 0) {
    return <div style={{ display: 'none' }} />;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 10000,
        backgroundColor: '#fff',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        maxWidth: '300px'
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          backgroundColor: '#3b82f6',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
        </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
          {detectedFiles[0].type.toUpperCase()} Detected
        </div>
        <div style={{ color: '#6b7280', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {extractFilename(detectedFiles[0].url) || 'Document available'}
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        style={{
          backgroundColor: isDownloading ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: isDownloading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          if (!isDownloading) {
            (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDownloading) {
            (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6';
          }
        }}
      >
        {isDownloading ? 'Downloading...' : 'Download'}
      </button>
    </div>
  );
}
