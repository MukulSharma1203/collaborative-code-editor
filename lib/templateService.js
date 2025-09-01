import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';

// Load template files from starters folder via API
export const loadTemplateFromStarters = async (templateName) => {
  try {
    console.log(`Loading template files for ${templateName}`);
    
    const response = await fetch(`/api/templates/${templateName}`);
    
    if (!response.ok) {
      console.warn(`Failed to load template ${templateName}: ${response.statusText}`);
      return getDefaultFilesForTemplate(templateName);
    }
    
    const data = await response.json();
    console.log(`Successfully loaded ${data.fileCount} files from ${data.templateName} template`);
    
    return data.files || {};
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    return getDefaultFilesForTemplate(templateName);
  }
};

// Get default files based on template type
const getDefaultFilesForTemplate = (templateName) => {
  const baseFiles = {
    'README.md': `# ${templateName || 'New Project'}\n\nA ${templateName || 'web'} project created with Co-Code Editor.\n\nStart building your amazing project!`,
    'index.html': `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${templateName || 'New Project'}</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="container">\n        <h1>Welcome to ${templateName || 'Your Project'}!</h1>\n        <p>Start editing to build your project.</p>\n        <button onclick="sayHello()">Click me!</button>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>`,
    'style.css': `/* ${templateName || 'Project'} Styles */\n\n* {\n    margin: 0;\n    padding: 0;\n    box-sizing: border-box;\n}\n\nbody {\n    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n    line-height: 1.6;\n    color: #333;\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    min-height: 100vh;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n}\n\n.container {\n    background: white;\n    padding: 2rem;\n    border-radius: 10px;\n    box-shadow: 0 10px 30px rgba(0,0,0,0.3);\n    text-align: center;\n    max-width: 500px;\n}\n\nh1 {\n    color: #4a5568;\n    margin-bottom: 1rem;\n    font-size: 2rem;\n}\n\np {\n    margin-bottom: 1.5rem;\n    color: #718096;\n}\n\nbutton {\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    color: white;\n    border: none;\n    padding: 12px 24px;\n    border-radius: 6px;\n    cursor: pointer;\n    font-size: 1rem;\n    transition: transform 0.2s;\n}\n\nbutton:hover {\n    transform: translateY(-2px);\n}`,
    'script.js': `// ${templateName || 'Project'} JavaScript\n\nfunction sayHello() {\n    alert('Hello from ${templateName || 'your project'}!');\n    console.log('Button clicked!');\n}\n\n// Add some interactivity\ndocument.addEventListener('DOMContentLoaded', function() {\n    console.log('${templateName || 'Project'} loaded successfully!');\n    \n    // Add a simple animation\n    const container = document.querySelector('.container');\n    if (container) {\n        container.style.opacity = '0';\n        container.style.transform = 'translateY(20px)';\n        \n        setTimeout(() => {\n            container.style.transition = 'all 0.5s ease';\n            container.style.opacity = '1';\n            container.style.transform = 'translateY(0)';\n        }, 100);\n    }\n});`
  };

  // Add template-specific files based on template type
  switch (templateName?.toLowerCase()) {
    case 'react':
      return {
        ...baseFiles,
        'package.json': `{\n  "name": "react-project",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.0.0",\n    "react-dom": "^18.0.0"\n  }\n}`,
        'App.jsx': `import React from 'react';\n\nfunction App() {\n  return (\n    <div className="App">\n      <h1>Hello React!</h1>\n      <p>Start building your React app here.</p>\n    </div>\n  );\n}\n\nexport default App;`
      };
    case 'node':
    case 'nodejs':
      return {
        ...baseFiles,
        'package.json': `{\n  "name": "node-project",\n  "version": "1.0.0",\n  "main": "server.js",\n  "scripts": {\n    "start": "node server.js"\n  }\n}`,
        'server.js': `const http = require('http');\nconst fs = require('fs');\nconst path = require('path');\n\nconst server = http.createServer((req, res) => {\n  console.log('Request for: ' + req.url);\n  \n  if (req.url === '/' || req.url === '/index.html') {\n    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {\n      if (err) {\n        res.writeHead(404);\n        res.end('File not found');\n      } else {\n        res.writeHead(200, { 'Content-Type': 'text/html' });\n        res.end(data);\n      }\n    });\n  } else {\n    res.writeHead(404);\n    res.end('Not found');\n  }\n});\n\nconst PORT = 3000;\nserver.listen(PORT, () => {\n  console.log(\`Server running on port \${PORT}\`);\n});`
      };
    default:
      return baseFiles;
  }
};

// Get project with files from database or initialize from starters
export const getProjectWithFiles = async (projectId) => {
  try {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    
    if (projectDoc.exists()) {
      const projectData = { id: projectDoc.id, ...projectDoc.data() };
      
      // If project doesn't have files yet, load from starters folder
      if (!projectData.files || Object.keys(projectData.files).length === 0) {
        console.log(`Loading template files for ${projectData.template}`);
        const templateFiles = await loadTemplateFromStarters(projectData.template);
        
        if (Object.keys(templateFiles).length > 0) {
          projectData.files = templateFiles;
          
          // Update the project in Firestore with loaded files
          await updateDoc(doc(db, 'projects', projectId), {
            files: templateFiles,
            updatedAt: new Date()
          });
        } else {
          // Fallback to empty files if template not found  
          console.log('Using fallback default files');
          projectData.files = getDefaultFilesForTemplate(projectData.template || 'web');
          
          // Update the project with default files
          await updateDoc(doc(db, 'projects', projectId), {
            files: projectData.files,
            updatedAt: new Date()
          });
        }
      }
      
      return projectData;
    } else {
      throw new Error('Project not found');
    }
  } catch (error) {
    console.error('Error getting project with files:', error);
    throw error;
  }
};

// Save updated template data back to Firebase
export const saveTemplateData = async (projectId, templateData) => {
  try {
    // Convert template structure back to flat files object
    const files = {};
    
    const extractFiles = (folder, basePath = '') => {
      folder.items.forEach(item => {
        if ('filename' in item) {
          // It's a file
          const fileName = `${item.filename}.${item.fileExtension}`;
          const fullPath = basePath ? `${basePath}/${fileName}` : fileName;
          files[fullPath] = item.content || '';
        } else if ('folderName' in item) {
          // It's a folder, recurse
          const folderPath = basePath ? `${basePath}/${item.folderName}` : item.folderName;
          extractFiles(item, folderPath);
        }
      });
    };
    
    if (templateData && templateData.items) {
      extractFiles(templateData);
    }
    
    // Update the project in Firestore
    await updateDoc(doc(db, 'projects', projectId), {
      files: files,
      updatedAt: new Date()
    });
    
    console.log('Template data saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving template data:', error);
    throw error;
  }
};
