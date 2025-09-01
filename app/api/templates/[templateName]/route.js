import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Recursively read all files from a directory
const readDirectoryRecursive = (dirPath, basePath = '') => {
  const files = {};
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .git directories
        if (item === 'node_modules' || item === '.git' || item === '.next' || item === 'dist' || item === 'build') {
          continue;
        }
        
        // Recursively read subdirectory
        const subFiles = readDirectoryRecursive(itemPath, basePath ? `${basePath}/${item}` : item);
        Object.assign(files, subFiles);
      } else {
        try {
          // Read file content
          const fileContent = fs.readFileSync(itemPath, 'utf-8');
          const relativePath = basePath ? `${basePath}/${item}` : item;
          files[relativePath] = fileContent;
        } catch (error) {
          // Skip binary files or files that can't be read as text
          console.warn(`Skipping file ${itemPath}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Error reading directory:', dirPath, error);
  }
  
  return files;
};

export async function GET(request, { params }) {
  try {
    const { templateName } = await params;
    
    console.log(`API: Loading template files for ${templateName}`);
    
    // Map template names to starter folder names
    const templateMap = {
      'nextjs': 'nextjs',
      'next': 'nextjs',
      'react': 'react',
      'express': 'express-simple',
      'vue': 'vue',
      'angular': 'angular',
      'node': 'node',
      'nodejs': 'node'
    };
    
    const starterFolder = templateMap[templateName?.toLowerCase()] || 'nextjs';
    const starterPath = path.join(process.cwd(), 'starters', starterFolder);
    
    console.log(`API: Reading from starter path: ${starterPath}`);
    
    // Check if starter folder exists
    if (!fs.existsSync(starterPath)) {
      console.warn(`API: Starter folder not found: ${starterPath}`);
      return NextResponse.json({ 
        error: 'Template not found',
        files: {}
      }, { status: 404 });
    }
    
    // Read all files from the starter template
    const files = readDirectoryRecursive(starterPath);
    console.log(`API: Loaded ${Object.keys(files).length} files from ${starterFolder} template`);
    
    return NextResponse.json({ 
      files,
      templateName: starterFolder,
      fileCount: Object.keys(files).length
    });
    
  } catch (error) {
    console.error('API Error loading template:', error);
    return NextResponse.json({ 
      error: 'Failed to load template',
      files: {}
    }, { status: 500 });
  }
}
