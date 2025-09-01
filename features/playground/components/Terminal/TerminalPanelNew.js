"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getWebContainer } from '../../../../lib/webcontainer';
import WebTerminalNew from './WebTerminalNew';

const TerminalPanelNew = ({ className = "", onServerStart }) => {
  const [webcontainerInstance, setWebcontainerInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePort, setActivePort] = useState(null);
  const terminalRef = useRef(null);

  // Project files to initialize
  const projectFiles = {
    'package.json': {
      file: {
        contents: JSON.stringify({
          name: "webcontainer-playground",
          type: "module",
          dependencies: {
            express: "latest"
          },
          scripts: {
            start: "node server.js",
            dev: "node server.js"
          }
        }, null, 2)
      }
    },
    'server.js': {
      file: {
        contents: `import express from 'express';

const app = express();
const PORT = 3001;

app.use(express.static('.'));

app.get('/', (req, res) => {
  res.send(\`
    <html>
      <head><title>WebContainer Server</title></head>
      <body>
        <h1>🚀 Server is running!</h1>
        <p>Your WebContainer is ready and working.</p>
        <p>Port: \${PORT}</p>
        <script>
          console.log('Server is running on port', \${PORT});
        </script>
      </body>
    </html>
  \`);
});

app.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}\`);
});
`
      }
    },
    'index.html': {
      file: {
        contents: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebContainer Playground</title>
</head>
<body>
    <h1>Welcome to WebContainer!</h1>
    <p>This is a simple HTML file running in your WebContainer environment.</p>
    <script>
        console.log('WebContainer is running!');
    </script>
</body>
</html>`
      }
    }
  };

  // Initialize WebContainer
  const initializeWebContainer = useCallback(async () => {
    try {
      console.log('🚀 Starting WebContainer initialization...');
      setIsLoading(true);
      setError(null);

      const webcontainer = await getWebContainer();
      
      if (!webcontainer) {
        throw new Error('Failed to get WebContainer instance');
      }

      console.log('📁 Writing project files...');
      await webcontainer.mount(projectFiles);

      console.log('✅ WebContainer initialized successfully');
      setWebcontainerInstance(webcontainer);
      setIsLoading(false);

      // Simple background dependency install without blocking
      webcontainer.spawn('npm', ['install']).then(process => {
        console.log('📦 Installing dependencies in background...');
        process.exit.then(() => {
          console.log('✅ Dependencies installed');
        }).catch(() => {
          console.log('⚠️ Dependencies install completed with warnings');
        });
      }).catch(() => {
        console.log('⚠️ Could not start dependency installation');
      });

    } catch (error) {
      console.error('❌ Failed to initialize WebContainer:', error);
      setError(error.message);
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeWebContainer();
    
    // Fallback timeout - if WebContainer takes too long, show error
    const fallbackTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ WebContainer initialization timeout');
        setError('WebContainer is taking longer than expected. Please refresh the page.');
        setIsLoading(false);
      }
    }, 15000); // 15 second timeout
    
    return () => clearTimeout(fallbackTimeout);
  }, [initializeWebContainer]);

  const handleTerminalReady = useCallback((terminal) => {
    terminalRef.current = terminal;
    console.log('🔗 Terminal ready and connected');
  }, []);

  const handleProcessStart = useCallback((port) => {
    console.log(`🌐 Server started on port ${port}`);
    setActivePort(port);
    onServerStart?.(port); // Notify parent component
  }, [onServerStart]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-900 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Initializing WebContainer...</p>
          <p className="text-gray-500 text-sm mt-2">Setting up your development environment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-900 ${className}`}>
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-red-400 text-lg font-semibold mb-2">WebContainer Error</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={initializeWebContainer}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-300">WebContainer Terminal</span>
          {activePort && (
            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
              Port {activePort} Active
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-gray-700 text-white text-xs rounded">
            Quick Commands Disabled
          </span>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-hidden">
        {webcontainerInstance ? (
          <WebTerminalNew
            webcontainerInstance={webcontainerInstance}
            onReady={handleTerminalReady}
            onProcessStart={handleProcessStart}
            className="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Terminal not available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalPanelNew;
