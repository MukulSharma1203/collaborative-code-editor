import { WebContainer } from '@webcontainer/api';

let webcontainerInstance = null;
let bootPromise = null;
let isBooted = false;

/**
 * Reset the WebContainer instance (clears files but keeps the same container)
 */
export async function resetWebContainer() {
  console.log('Resetting WebContainer state...');
  if (webcontainerInstance) {
    try {
      // Clear the file system by mounting an empty file tree
      await webcontainerInstance.mount({});
      console.log('WebContainer filesystem cleared');
    } catch (error) {
      console.error('Error clearing WebContainer filesystem:', error);
    }
  }
  // Don't reset the instance itself, just clear its state
}

/**
 * Get or create a WebContainer instance
 */
export async function getWebContainer() {
  if (webcontainerInstance && isBooted) {
    return webcontainerInstance;
  }
  
  if (bootPromise) {
    return await bootPromise;
  }
  
  // Only boot if we haven't booted before
  if (!isBooted) {
    bootPromise = WebContainer.boot().then(instance => {
      webcontainerInstance = instance;
      isBooted = true;
      bootPromise = null;
      console.log('WebContainer booted successfully!');
      return instance;
    }).catch(error => {
      bootPromise = null;
      console.error('Failed to boot WebContainer:', error);
      throw error;
    });
    
    console.log('Booting WebContainer...');
    return await bootPromise;
  }
  
  return webcontainerInstance;
}

/**
 * Initialize a basic Node.js project in the container
 */
export async function initializeProject(files = {}) {
  const webcontainer = await getWebContainer();
  
  // Default package.json if not provided
  const defaultFiles = {
    'package.json': {
      file: {
        contents: JSON.stringify({
          name: 'collaborative-project',
          version: '1.0.0',
          description: 'A collaborative coding project',
          main: 'index.js',
          scripts: {
            start: 'node index.js',
            dev: 'node --watch index.js'
          },
          dependencies: {}
        }, null, 2)
      }
    },
    'index.js': {
      file: {
        contents: `console.log('Hello from WebContainer!');
console.log('This is a collaborative coding environment.');
console.log('You can run Node.js code here!');
`
      }
    },
    'README.md': {
      file: {
        contents: `# Collaborative Project

This project is running in a WebContainer!

## Available Commands
- \`npm start\` - Run the main script
- \`npm install <package>\` - Install packages
- \`node <file>\` - Run any JavaScript file

## Features
- Full Node.js runtime
- Package installation
- File system access
- Real terminal experience
`
      }
    },
    ...files
  };

  // Mount the file system
  await webcontainer.mount(defaultFiles);
  console.log('Project initialized with files:', Object.keys(defaultFiles));
  
  return webcontainer;
}

/**
 * Install packages in the container
 */
export async function installPackages(packages = []) {
  const webcontainer = await getWebContainer();
  
  if (packages.length === 0) return;
  
  console.log('Installing packages:', packages);
  const installProcess = await webcontainer.spawn('npm', ['install', ...packages]);
  
  return new Promise((resolve, reject) => {
    installProcess.output.pipeTo(new WritableStream({
      write(data) {
        console.log('Install output:', data);
      }
    }));
    
    installProcess.exit.then((code) => {
      if (code === 0) {
        console.log('Packages installed successfully');
        resolve();
      } else {
        console.error('Package installation failed with code:', code);
        reject(new Error(`Installation failed with code ${code}`));
      }
    });
  });
}

/**
 * Run a command in the container
 */
export async function runCommand(command, args = []) {
  const webcontainer = await getWebContainer();
  
  console.log('Running command:', command, args);
  const process = await webcontainer.spawn(command, args);
  
  return process;
}

/**
 * Create a terminal shell process
 */
export async function createShell() {
  const webcontainer = await getWebContainer();
  
  // Start a shell process
  const shellProcess = await webcontainer.spawn('jsh', {
    terminal: {
      cols: 80,
      rows: 24,
    },
  });
  
  console.log('Shell process created');
  return shellProcess;
}

/**
 * Write a file to the container
 */
export async function writeFile(path, contents) {
  const webcontainer = await getWebContainer();
  await webcontainer.fs.writeFile(path, contents);
  console.log('File written:', path);
}

/**
 * Read a file from the container
 */
export async function readFile(path) {
  const webcontainer = await getWebContainer();
  try {
    const contents = await webcontainer.fs.readFile(path, 'utf-8');
    return contents;
  } catch (error) {
    console.error('Error reading file:', path, error);
    return null;
  }
}

/**
 * List files in a directory
 */
export async function listFiles(path = '.') {
  const webcontainer = await getWebContainer();
  try {
    const files = await webcontainer.fs.readdir(path, { withFileTypes: true });
    return files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      isFile: file.isFile()
    }));
  } catch (error) {
    console.error('Error listing files:', path, error);
    return [];
  }
}

/**
 * Get the server URL for a given port
 */
export async function getServerUrl(port) {
  const webcontainer = await getWebContainer();
  try {
    // WebContainer automatically maps ports and provides URLs
    return webcontainer.on('server-ready', (serverPort, url) => {
      if (serverPort === port) {
        return url;
      }
    });
  } catch (error) {
    console.error('Error getting server URL:', error);
    return `http://localhost:${port}`;
  }
}
