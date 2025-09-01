"use client";

import { useState, useEffect, useCallback } from 'react';
import { Terminal, Play, Square, RotateCcw } from 'lucide-react';
import DynamicWebTerminal from './DynamicWebTerminal';
import { initializeProject, writeFile, readFile, resetWebContainer } from '../../../../lib/webcontainer';

export function TerminalPanel({ templateData, selectedFile, onTerminalToggle, onServerStart }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [terminalApi, setTerminalApi] = useState(null);
  const [serverPort, setServerPort] = useState(null);

  // Auto-initialize when panel opens
  useEffect(() => {
    // Auto-initialize the WebContainer when terminal panel is opened
    const timer = setTimeout(() => {
      if (!isInitialized && !isLoading && !initializationAttempted) {
        initializeWebContainer();
      }
    }, 1000); // Wait 1 second then auto-initialize

    return () => clearTimeout(timer);
  }, []);

  const initializeWebContainer = async () => {
    if (isLoading || initializationAttempted) return;
    
    try {
      setIsLoading(true);
      setInitializationAttempted(true);
      console.log('Initializing WebContainer project...');
      
      // Clear any existing files in WebContainer (but keep the same instance)
      await resetWebContainer();
      
      // Create a simple React demo project structure (flat files first)
      await initializeProject({
        'package.json': {
          file: {
            contents: JSON.stringify({
              name: 'react-demo',
              version: '1.0.0',
              description: 'A React demo project in WebContainer',
              main: 'index.js',
              scripts: {
                start: 'node server.js',
                dev: 'node server.js',
                build: 'echo "Build complete"'
              },
              dependencies: {}
            }, null, 2)
          }
        },
        'server.js': {
          file: {
            contents: `const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(\`<!DOCTYPE html>
<html>
<head>
  <title>React Demo</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; }
    .status { background: #e8f5e8; padding: 10px; border-radius: 4px; margin: 15px 0; color: #22c55e; font-weight: bold; }
    .demo { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 React Demo Project</h1>
    <div class="status">✅ Server running successfully on port 3001!</div>
    <div class="demo">
      <h2>Hello from WebContainer!</h2>
      <p>This is your React development environment running in the browser.</p>
      <p>Time: \${new Date().toLocaleString()}</p>
      <p><strong>Available commands:</strong></p>
      <ul>
        <li><code>npm start</code> - Start the server</li>
        <li><code>node app.js</code> - Run the app file</li>
        <li><code>ls</code> - List files</li>
      </ul>
    </div>
    <hr>
    <small>Powered by WebContainer API</small>
  </div>
</body>
</html>\`);
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(\`🌐 Server running at http://localhost:\${PORT}\`);
  console.log('Ready to serve your React app!');
});`
          }
        },
        'app.js': {
          file: {
            contents: `console.log('🚀 Hello from React App!');
console.log('This is a demo React application running in WebContainer');
console.log('Current time:', new Date().toLocaleString());

// Simple app structure
const app = {
  name: 'React Demo',
  version: '1.0.0',
  status: 'running'
};

console.log('App info:', app);
console.log('');
console.log('✅ App.js executed successfully!');
console.log('Try running: node server.js to start the web server');`
          }
        },
        'index.html': {
          file: {
            contents: `<!DOCTYPE html>
<html>
<head>
  <title>React Demo</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; }
    .status { background: #e8f5e8; padding: 10px; border-radius: 4px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 React Demo</h1>
    <div class="status">✅ Your React app is ready to go!</div>
    <p>This is the main index.html file.</p>
    <p>Click "Start Dev Server" to run the development server on port 3001.</p>
    <hr>
    <small>Static HTML file in WebContainer</small>
  </div>
</body>
</html>`
          }
        }
      });
      
      setIsInitialized(true);
      console.log('WebContainer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      setInitializationAttempted(false); // Allow retry
    } finally {
      setIsLoading(false);
    }
  };

  const syncFileToContainer = async () => {
    try {
      if (!selectedFile || !isInitialized) return;
      
      const fileName = `${selectedFile.filename}.${selectedFile.fileExtension}`;
      const content = selectedFile.content || '';
      
      await writeFile(fileName, content);
      console.log('Synced file to container:', fileName);
    } catch (error) {
      console.error('Error syncing file to container:', error);
    }
  };

  // Sync current file when it changes
  useEffect(() => {
    if (isInitialized && selectedFile) {
      syncFileToContainer();
    }
  }, [selectedFile, isInitialized]);

  const handleRunCurrentFile = async () => {
    if (!selectedFile || !isInitialized || !terminalApi) return;
    
    try {
      // Sync file first
      await syncFileToContainer();
      
      const fileName = `${selectedFile.filename}.${selectedFile.fileExtension}`;
      const extension = selectedFile.fileExtension.toLowerCase();
      
      // Determine command based on file extension
      let command = '';
      switch (extension) {
        case 'js':
        case 'mjs':
          command = `node ${fileName}`;
          break;
        case 'ts':
          command = `npx tsx ${fileName}`;
          break;
        case 'py':
          command = `python ${fileName}`;
          break;
        case 'sh':
          command = `bash ${fileName}`;
          break;
        case 'html':
          command = `cat ${fileName}`;
          break;
        default:
          command = `cat ${fileName}`;
      }
      
      // Execute command in terminal
      await terminalApi.executeCommand(command);
      
    } catch (error) {
      console.error('Error running file:', error);
    }
  };

  const handleStartServer = async () => {
    if (!isInitialized || !terminalApi) return;
    
    try {
      // Create a simple HTTP server
      const serverCode = `
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  const filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = path.join(process.cwd(), filePath);
  
  // Try to serve the file
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      if (req.url === '/' || req.url === '/index.html') {
        // Serve a default page
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(\`
<!DOCTYPE html>
<html>
<head>
    <title>WebContainer Server</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .status { color: #22c55e; font-weight: bold; }
        .info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .files { background: #1f2937; color: white; padding: 15px; border-radius: 8px; font-family: monospace; }
    </style>
</head>
<body>
    <h1>🚀 WebContainer Server</h1>
    <p class="status">✅ Server is running successfully!</p>
    <div class="info">
        <h3>Your development server is live</h3>
        <p>This page is served from your WebContainer environment.</p>
        <p>You can now:</p>
        <ul>
            <li>Create HTML, CSS, and JavaScript files</li>
            <li>Build web applications</li>
            <li>Install npm packages</li>
            <li>Run any Node.js code</li>
        </ul>
    </div>
    <div class="files">
        <h3>Quick Start:</h3>
        <p>Create an index.html file to see your own content here!</p>
    </div>
</body>
</html>
        \`);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
    } else {
      // Determine content type
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon'
      };
      const contentType = contentTypes[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(\`🌐 Server running at http://localhost:\${PORT}\`);
});
`;

      // Write the server file
      await writeFile('server.js', serverCode);
      
      // Start the server
      await terminalApi.executeCommand('node server.js');
      
      // Set the server port and notify parent
      const port = 3001;
      setServerPort(port);
      onServerStart?.(port);
      
    } catch (error) {
      console.error('Error starting server:', error);
    }
  };

  const handleTerminalReady = useCallback((api) => {
    setTerminalApi(api);
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-slate-800">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Terminal</span>
          {isLoading && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-400"></div>
              <span className="text-xs">Initializing...</span>
            </div>
          )}
          {isInitialized && (
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-green-400">Ready</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Quick Start Dev Server Button */}
          {isInitialized && terminalApi && (
            <button
              onClick={() => terminalApi.executeCommand('npm start')}
              className="flex items-center space-x-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
            >
              <Play className="h-3 w-3" />
              <span>Start Dev Server</span>
            </button>
          )}
          
          {/* Start Custom Server Button */}
          {isInitialized && terminalApi && (
            <button
              onClick={handleStartServer}
              className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
            >
              <Play className="h-3 w-3" />
              <span>Custom Server</span>
            </button>
          )}
          
          {/* Run Current File Button */}
          {selectedFile && isInitialized && terminalApi && (
            <button
              onClick={handleRunCurrentFile}
              className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
            >
              <Play className="h-3 w-3" />
              <span>Run {selectedFile.filename}.{selectedFile.fileExtension}</span>
            </button>
          )}
          
          {/* Initialize Button */}
          {!isInitialized && !isLoading && (
            <button
              onClick={initializeWebContainer}
              className="flex items-center space-x-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Initialize Container</span>
            </button>
          )}
          
          {/* Reset Button */}
          {(isInitialized || isLoading) && (
            <button
              onClick={async () => {
                setIsLoading(true);
                try {
                  await resetWebContainer();
                  setIsInitialized(false);
                  setInitializationAttempted(false);
                  console.log('WebContainer filesystem cleared - click Initialize to reload project');
                } catch (error) {
                  console.error('Error resetting WebContainer:', error);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="flex items-center space-x-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
          
          {/* Close Button */}
          <button
            onClick={onTerminalToggle}
            className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white"
          >
            <Square className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      {/* Terminal Content */}
      <div className="flex-1 relative">
        {isInitialized ? (
          <DynamicWebTerminal 
            className="h-full"
            onReady={handleTerminalReady}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm mb-2">WebContainer Terminal</p>
              <p className="text-xs opacity-75 mb-4">
                {isLoading ? 'Initializing WebContainer...' : 'Click "Initialize Container" to start'}
              </p>
              {!isInitialized && !isLoading && (
                <button
                  onClick={initializeWebContainer}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium mx-auto"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Initialize Container</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TerminalPanel;
