"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getWebContainer } from '../../../../lib/webcontainer';
import WebTerminalNew from './WebTerminalNew';

const TerminalPanelSimple = ({ className = "", onServerStart }) => {
  const [webcontainerInstance, setWebcontainerInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enhanced project files with flat structure (WebContainer limitation)
  const projectFiles = {
    'package.json': {
      file: {
        contents: `{
  "name": "playground-project",
  "version": "1.0.0",
  "description": "WebContainer Playground Project",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "keywords": ["playground", "webcontainer"],
  "author": "Playground User",
  "license": "ISC"
}`
      }
    },
    'server.js': {
      file: {
        contents: `import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Basic routes
app.get('/', (req, res) => {
  res.send(\`
    <html>
      <head>
        <title>🚀 Playground Server</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white;
            min-height: 100vh;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 15px; 
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          }
          .status { color: #4ade80; font-weight: bold; font-size: 1.2em; }
          .info { 
            background: rgba(255,255,255,0.1); 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #4ade80;
          }
          .highlight { color: #fbbf24; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 WebContainer Development Server</h1>
          <p class="status">✅ Server is running successfully!</p>
          <div class="info">
            <strong>📊 Server Information:</strong><br>
            <span class="highlight">Port:</span> \${PORT}<br>
            <span class="highlight">Environment:</span> Development<br>
            <span class="highlight">Started:</span> \${new Date().toLocaleString()}<br>
            <span class="highlight">Node.js:</span> Ready for development
          </div>
          <p>🎯 Your playground environment is ready for coding!</p>
          <p>💡 Try editing files and running commands in the terminal.</p>
        </div>
      </body>
    </html>
  \`);
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    port: PORT,
    timestamp: new Date().toISOString(),
    message: 'Server is healthy',
    environment: 'development'
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    server: 'WebContainer Express Server',
    version: '1.0.0',
    endpoints: [
      { path: '/', method: 'GET', description: 'Home page' },
      { path: '/api/status', method: 'GET', description: 'Server status' },
      { path: '/api/info', method: 'GET', description: 'API information' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(\`\\n🚀 Server started successfully!\`);
  console.log(\`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\`);
  console.log(\`📍 Local:    \\x1b[32mhttp://localhost:\${PORT}\\x1b[0m\`);
  console.log(\`🌐 Network:  \\x1b[32mhttp://0.0.0.0:\${PORT}\\x1b[0m\`);
  console.log(\`⏰ Started:  \\x1b[33m\${new Date().toLocaleString()}\\x1b[0m\`);
  console.log(\`🔧 Mode:     \\x1b[36mDevelopment\\x1b[0m\`);
  console.log(\`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\`);
  console.log(\`\\n✨ Ready for development!\\n\`);
  console.log(\`💡 Try these endpoints:\`);
  console.log(\`   GET  /           - Home page\`);
  console.log(\`   GET  /api/status - Server status\`);
  console.log(\`   GET  /api/info   - API information\\n\`);
});`
      }
    },
    'README.md': {
      file: {
        contents: `# 🚀 WebContainer Playground Project

Welcome to your WebContainer development environment!

## 📋 Available Commands

\`\`\`bash
# Package Management
npm install     # Install dependencies
npm start       # Start the development server
npm run dev     # Start the development server (alias)

# File Operations
ls              # List files and directories
pwd             # Show current directory
cat <file>      # Show file contents

# Development
node <file>     # Run Node.js file directly
help            # Show all available commands
clear           # Clear terminal screen
\`\`\`

## 🏗️ Project Structure

- \`server.js\` - Express server with multiple endpoints
- \`package.json\` - Project configuration and dependencies
- \`README.md\` - This documentation file

## 🌐 API Endpoints

Once the server is running, you can access:

- \`GET /\` - Beautiful home page with server info
- \`GET /api/status\` - JSON status endpoint
- \`GET /api/info\` - API information

## 🚀 Quick Start

1. Run \`npm install\` to install dependencies
2. Run \`npm start\` to start the server
3. Click the Preview button to see your application
4. Edit files and see changes in real-time

## 💡 Tips

- Use \`help\` command to see all available terminal commands
- The server shows detailed startup information
- All output is color-coded for better readability
- The preview will update automatically when you restart the server

Happy coding! 🎯`
      }
    },
    'index.html': {
      file: {
        contents: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Playground Static Page</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            max-width: 800px; 
            text-align: center; 
            padding: 40px;
        }
        .card { 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 20px; 
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        .subtitle { font-size: 1.2em; opacity: 0.9; margin-bottom: 30px; }
        .features { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-top: 30px; 
        }
        .feature { 
            background: rgba(255,255,255,0.05); 
            padding: 20px; 
            border-radius: 10px; 
            border-left: 4px solid #4ade80;
        }
        .emoji { font-size: 2em; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>🎯 WebContainer Playground</h1>
            <p class="subtitle">Your development environment is ready!</p>
            <p>This is a static HTML file you can edit and modify.</p>
            
            <div class="features">
                <div class="feature">
                    <div class="emoji">🚀</div>
                    <h3>Fast Development</h3>
                    <p>Instant preview and hot reloading</p>
                </div>
                <div class="feature">
                    <div class="emoji">🔧</div>
                    <h3>Full Terminal</h3>
                    <p>Complete Node.js environment</p>
                </div>
                <div class="feature">
                    <div class="emoji">📁</div>
                    <h3>File Management</h3>
                    <p>Create and edit files instantly</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`
      }
    }
  };

  // Simple initialization
  const initWebContainer = useCallback(async () => {
    try {
      console.log('Starting WebContainer...');
      const webcontainer = await getWebContainer();
      await webcontainer.mount(projectFiles);
      
      setWebcontainerInstance(webcontainer);
      setIsLoading(false);
      console.log('WebContainer ready!');
      
    } catch (error) {
      console.error('WebContainer failed:', error);
      setError('Failed to initialize');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initWebContainer();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-white">Loading WebContainer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={initWebContainer}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <span className="text-white text-sm">WebContainer Terminal</span>
      </div>
      
      <div className="flex-1">
        <WebTerminalNew
          webcontainerInstance={webcontainerInstance}
          onReady={() => console.log('Terminal ready')}
          onProcessStart={onServerStart}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default TerminalPanelSimple;
