"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getWebContainer } from '../../../lib/webcontainer';

const PreviewPanel = ({ activePort = 3001, className = "" }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [webcontainerInstance, setWebcontainerInstance] = useState(null);
  const iframeRef = useRef(null);

  // Initialize WebContainer connection
  useEffect(() => {
    const initWebContainer = async () => {
      try {
        const webcontainer = await getWebContainer();
        setWebcontainerInstance(webcontainer);
      } catch (error) {
        console.error('Failed to get WebContainer:', error);
        setError('Failed to connect to WebContainer');
      }
    };

    initWebContainer();
  }, []);

  // Update URL when port changes
  useEffect(() => {
    const setupPreviewUrl = async () => {
      if (!webcontainerInstance || !activePort) {
        setUrl('');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Wait for the server to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // WebContainer creates its own URL space, we need to use the webcontainer instance URL
        // Try to get the WebContainer URL if available
        let previewUrl;
        
        if (typeof webcontainerInstance.url === 'function') {
          // If WebContainer provides url method
          previewUrl = await webcontainerInstance.url(activePort);
        } else {
          // For StackBlitz WebContainer, use the origin URL
          const currentOrigin = window.location.origin;
          
          // WebContainer typically exposes ports on the same origin but different subdomain
          // or on the webcontainer's internal URL system
          previewUrl = `${currentOrigin.replace('localhost:3001', `localhost:${activePort}`)}`;
          
          // Alternative: Try to detect WebContainer's URL pattern
          if (currentOrigin.includes('stackblitz') || currentOrigin.includes('webcontainer')) {
            // StackBlitz WebContainer URL pattern
            previewUrl = `https://${activePort}-${window.location.hostname}`;
          }
        }
        
        console.log(`🌐 Attempting preview URL: ${previewUrl}`);
        
        // Test if the server is actually running by making a fetch request
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(previewUrl, { 
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          console.log(`🌐 Preview URL ready: ${previewUrl}`);
          setUrl(previewUrl);
        } catch (fetchError) {
          console.warn(`Server not responding on port ${activePort}:`, fetchError.message);
          
          // If the WebContainer URL doesn't work, show a helpful message
          if (activePort === 3001) {
            setError(`WebContainer server on port ${activePort} not accessible. This might be a limitation of the WebContainer environment. Try running a different server or use port 3000.`);
          } else {
            setError(`No server running on port ${activePort}. Make sure to start your server with 'npm start' in the terminal.`);
          }
        }

      } catch (error) {
        console.error('Failed to setup preview URL:', error);
        setError(`Failed to connect to WebContainer on port ${activePort}. WebContainer apps run in an isolated environment.`);
      } finally {
        setIsLoading(false);
      }
    };

    setupPreviewUrl();
  }, [webcontainerInstance, activePort]);

  const refreshPreview = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  const openInNewTab = useCallback(() => {
    if (url) {
      window.open(url, '_blank');
    }
  }, [url]);

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Preview Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-300">Preview</span>
          {activePort && (
            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
              Port {activePort}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {url && (
            <div className="flex items-center space-x-2 mr-4">
              <input
                type="text"
                value={url}
                readOnly
                className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border border-gray-600 w-64"
              />
            </div>
          )}
          
          <button
            onClick={refreshPreview}
            disabled={!url}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs rounded transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={openInNewTab}
            disabled={!url}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs rounded transition-colors"
          >
            Open in New Tab
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading preview...</p>
              <p className="text-gray-500 text-sm mt-1">Waiting for server on port {activePort}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center max-w-md">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-red-600 text-lg font-semibold mb-2">Preview Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="text-sm text-gray-500 mb-4">
                <p>Make sure your server is running:</p>
                <code className="bg-gray-200 px-2 py-1 rounded">npm start</code>
              </div>
              <button 
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  // Retry after a short delay
                  setTimeout(async () => {
                    if (webcontainerInstance && activePort) {
                      try {
                        const previewUrl = `http://localhost:${activePort}`;
                        
                        // Test if the server is responding
                        const response = await fetch(previewUrl, { 
                          method: 'HEAD',
                          mode: 'no-cors'
                        });
                        
                        setUrl(previewUrl);
                        setError(null);
                      } catch (fetchError) {
                        setError(`No server running on port ${activePort}`);
                      } finally {
                        setIsLoading(false);
                      }
                    } else {
                      setIsLoading(false);
                    }
                  }, 1000);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : !activePort ? (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-4">🌐</div>
              <h3 className="text-gray-600 text-lg font-semibold mb-2">No Server Running</h3>
              <p className="text-gray-500 mb-4">Start your development server to see the preview</p>
              <div className="text-sm text-gray-500">
                <p>Try running in the terminal:</p>
                <code className="bg-gray-200 px-2 py-1 rounded">npm start</code>
              </div>
            </div>
          </div>
        ) : url ? (
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Waiting for preview...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
