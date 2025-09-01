"use client";

import React, { useState } from 'react';
import { FileExplorer } from './FileExplorer';

/**
 * Example usage of the FileExplorer component
 * This shows how to integrate it with your playground
 */
export function PlaygroundWithFileExplorer() {
  // Sample data structure that matches your path-to-json.js output
  const [templateData, setTemplateData] = useState({
    folderName: "my-project",
    items: [
      {
        filename: "index",
        fileExtension: "html",
        content: "<!DOCTYPE html>\n<html>\n<head>\n    <title>My Project</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>"
      },
      {
        filename: "style",
        fileExtension: "css",
        content: "body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}"
      },
      {
        folderName: "js",
        items: [
          {
            filename: "main",
            fileExtension: "js",
            content: "console.log('Hello from main.js!');"
          }
        ]
      }
    ]
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [activeFileContent, setActiveFileContent] = useState("");

  // File operations
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setActiveFileContent(file.content);
  };

  const handleAddFile = (newFile, parentPath) => {
    console.log('Adding file:', newFile, 'to path:', parentPath);
    
    // Clone the template data
    const updatedData = JSON.parse(JSON.stringify(templateData));
    
    // Find the target folder and add the file
    if (parentPath === "") {
      // Add to root
      updatedData.items.push(newFile);
    } else {
      // Navigate to the target folder
      const pathParts = parentPath.split("/");
      let currentFolder = updatedData;
      
      for (const part of pathParts) {
        if (part) {
          const nextFolder = currentFolder.items.find(
            item => "folderName" in item && item.folderName === part
          );
          if (nextFolder) {
            currentFolder = nextFolder;
          }
        }
      }
      
      currentFolder.items.push(newFile);
    }
    
    setTemplateData(updatedData);
  };

  const handleAddFolder = (newFolder, parentPath) => {
    console.log('Adding folder:', newFolder, 'to path:', parentPath);
    
    // Similar logic to handleAddFile
    const updatedData = JSON.parse(JSON.stringify(templateData));
    
    if (parentPath === "") {
      updatedData.items.push(newFolder);
    } else {
      const pathParts = parentPath.split("/");
      let currentFolder = updatedData;
      
      for (const part of pathParts) {
        if (part) {
          const nextFolder = currentFolder.items.find(
            item => "folderName" in item && item.folderName === part
          );
          if (nextFolder) {
            currentFolder = nextFolder;
          }
        }
      }
      
      currentFolder.items.push(newFolder);
    }
    
    setTemplateData(updatedData);
  };

  const handleDeleteFile = (file, parentPath) => {
    console.log('Deleting file:', file, 'from path:', parentPath);
    
    const updatedData = JSON.parse(JSON.stringify(templateData));
    
    if (parentPath === "") {
      updatedData.items = updatedData.items.filter(
        item => !(
          "filename" in item && 
          item.filename === file.filename && 
          item.fileExtension === file.fileExtension
        )
      );
    } else {
      const pathParts = parentPath.split("/");
      let currentFolder = updatedData;
      
      for (const part of pathParts) {
        if (part) {
          const nextFolder = currentFolder.items.find(
            item => "folderName" in item && item.folderName === part
          );
          if (nextFolder) {
            currentFolder = nextFolder;
          }
        }
      }
      
      currentFolder.items = currentFolder.items.filter(
        item => !(
          "filename" in item && 
          item.filename === file.filename && 
          item.fileExtension === file.fileExtension
        )
      );
    }
    
    setTemplateData(updatedData);
    
    // Clear selection if deleted file was selected
    if (selectedFile && 
        selectedFile.filename === file.filename && 
        selectedFile.fileExtension === file.fileExtension) {
      setSelectedFile(null);
      setActiveFileContent("");
    }
  };

  const handleDeleteFolder = (folder, parentPath) => {
    console.log('Deleting folder:', folder, 'from path:', parentPath);
    
    const updatedData = JSON.parse(JSON.stringify(templateData));
    
    if (parentPath === "") {
      updatedData.items = updatedData.items.filter(
        item => !("folderName" in item && item.folderName === folder.folderName)
      );
    } else {
      const pathParts = parentPath.split("/");
      let currentFolder = updatedData;
      
      for (const part of pathParts) {
        if (part) {
          const nextFolder = currentFolder.items.find(
            item => "folderName" in item && item.folderName === part
          );
          if (nextFolder) {
            currentFolder = nextFolder;
          }
        }
      }
      
      currentFolder.items = currentFolder.items.filter(
        item => !("folderName" in item && item.folderName === folder.folderName)
      );
    }
    
    setTemplateData(updatedData);
  };

  const handleRenameFile = (file, newFilename, newExtension, parentPath) => {
    console.log('Renaming file:', file, 'to:', newFilename + '.' + newExtension);
    
    const updatedData = JSON.parse(JSON.stringify(templateData));
    
    // Find and update the file
    const updateFileInFolder = (folder) => {
      const fileIndex = folder.items.findIndex(
        item => "filename" in item && 
                item.filename === file.filename && 
                item.fileExtension === file.fileExtension
      );
      
      if (fileIndex !== -1) {
        folder.items[fileIndex].filename = newFilename;
        folder.items[fileIndex].fileExtension = newExtension;
        return true;
      }
      
      // Search in subfolders
      for (const item of folder.items) {
        if ("folderName" in item) {
          if (updateFileInFolder(item)) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    updateFileInFolder(updatedData);
    setTemplateData(updatedData);
  };

  const handleRenameFolder = (folder, newFolderName, parentPath) => {
    console.log('Renaming folder:', folder, 'to:', newFolderName);
    
    const updatedData = JSON.parse(JSON.stringify(templateData));
    
    // Find and update the folder
    const updateFolderInFolder = (parentFolder) => {
      const folderIndex = parentFolder.items.findIndex(
        item => "folderName" in item && item.folderName === folder.folderName
      );
      
      if (folderIndex !== -1) {
        parentFolder.items[folderIndex].folderName = newFolderName;
        return true;
      }
      
      // Search in subfolders
      for (const item of parentFolder.items) {
        if ("folderName" in item) {
          if (updateFolderInFolder(item)) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    updateFolderInFolder(updatedData);
    setTemplateData(updatedData);
  };

  return (
    <div className="flex h-screen">
      {/* File Explorer Sidebar */}
      <FileExplorer
        data={templateData}
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
        title="Project Files"
        onAddFile={handleAddFile}
        onAddFolder={handleAddFolder}
        onDeleteFile={handleDeleteFile}
        onDeleteFolder={handleDeleteFolder}
        onRenameFile={handleRenameFile}
        onRenameFolder={handleRenameFolder}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-semibold">
            {selectedFile ? `${selectedFile.filename}.${selectedFile.fileExtension}` : 'No file selected'}
          </h1>
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 p-4">
          {selectedFile ? (
            <div className="h-full">
              <textarea
                value={activeFileContent}
                onChange={(e) => setActiveFileContent(e.target.value)}
                className="w-full h-full p-4 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Edit your file content here..."
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">No file selected</p>
                <p className="text-sm">Select a file from the explorer to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlaygroundWithFileExplorer;
