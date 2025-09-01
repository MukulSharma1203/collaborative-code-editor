"use client";

import React, { useState } from 'react';
import { 
  ChevronRight, 
  File, 
  Folder, 
  Plus, 
  FilePlus, 
  FolderPlus, 
  MoreHorizontal, 
  Trash2, 
  Edit3 
} from 'lucide-react';

/**
 * Main File Explorer Component
 */
export function FileExplorer({
  data,
  onFileSelect,
  selectedFile,
  title = "File Explorer",
  onAddFile,
  onAddFolder,
  onDeleteFile,
  onDeleteFolder,
  onRenameFile,
  onRenameFolder,
}) {
  const isRootFolder = data && typeof data === "object" && "folderName" in data;
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);

  const handleAddRootFile = () => {
    setIsNewFileDialogOpen(true);
  };

  const handleAddRootFolder = () => {
    setIsNewFolderDialogOpen(true);
  };

  const handleCreateFile = (filename, extension) => {
    if (onAddFile && isRootFolder) {
      const newFile = {
        filename,
        fileExtension: extension,
        content: "",
      };
      onAddFile(newFile, "");
    }
    setIsNewFileDialogOpen(false);
  };

  const handleCreateFolder = (folderName) => {
    if (onAddFolder && isRootFolder) {
      const newFolder = {
        folderName,
        items: [],
      };
      onAddFolder(newFolder, "");
    }
    setIsNewFolderDialogOpen(false);
  };

  return (
    <div className="w-64 bg-slate-950 border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-medium bg-gradient-to-r from-purple-200 to-teal-200/70 bg-clip-text text-transparent">{title}</h2>
        <div className="relative">
          <button
            onClick={() => document.getElementById('add-menu').classList.toggle('hidden')}
            className="p-1 rounded hover:bg-gray-800 text-gray-300 hover:text-purple-200 transition-colors"
            title="Add file or folder"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div
            id="add-menu"
            className="hidden absolute right-0 top-8 bg-slate-900 border border-gray-600 rounded-md shadow-xl z-10 min-w-32"
          >
            <button
              onClick={() => {
                handleAddRootFile();
                document.getElementById('add-menu').classList.add('hidden');
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 flex items-center text-gray-200 hover:text-purple-200"
            >
              <FilePlus className="h-4 w-4 mr-2" />
              New File
            </button>
            <button
              onClick={() => {
                handleAddRootFolder();
                document.getElementById('add-menu').classList.add('hidden');
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 flex items-center text-gray-200 hover:text-purple-200"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </button>
          </div>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-2">
        {isRootFolder && data.items && data.items.length > 0 ? (
          data.items.map((child, index) => (
            <FileNode
              key={child.filename ? `${child.filename}.${child.fileExtension}` : `folder-${child.folderName || index}`}
              item={child}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              level={0}
              path=""
              onAddFile={onAddFile}
              onAddFolder={onAddFolder}
              onDeleteFile={onDeleteFile}
              onDeleteFolder={onDeleteFolder}
              onRenameFile={onRenameFile}
              onRenameFolder={onRenameFolder}
            />
          ))
        ) : isRootFolder && (!data.items || data.items.length === 0) ? (
          <div className="text-gray-500 text-sm p-4 text-center">
            No files in this project. Click the + button to add files.
          </div>
        ) : !isRootFolder && data ? (
          <FileNode
            item={data}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
            level={0}
            path=""
            onAddFile={onAddFile}
            onAddFolder={onAddFolder}
            onDeleteFile={onDeleteFile}
            onDeleteFolder={onDeleteFolder}
            onRenameFile={onRenameFile}
            onRenameFolder={onRenameFolder}
          />
        ) : (
          <div className="text-gray-500 text-sm p-4 text-center">
            Loading files...
          </div>
        )}
      </div>

      {/* Dialogs */}
      {isNewFileDialogOpen && (
        <NewFileDialog
          onClose={() => setIsNewFileDialogOpen(false)}
          onCreateFile={handleCreateFile}
        />
      )}

      {isNewFolderDialogOpen && (
        <NewFolderDialog
          onClose={() => setIsNewFolderDialogOpen(false)}
          onCreateFolder={handleCreateFolder}
        />
      )}
    </div>
  );
}

/**
 * Individual File/Folder Node Component
 */
function FileNode({
  item,
  onFileSelect,
  selectedFile,
  level,
  path = "",
  onAddFile,
  onAddFolder,
  onDeleteFile,
  onDeleteFolder,
  onRenameFile,
  onRenameFolder,
}) {
  const isValidItem = item && typeof item === "object";
  const isFolder = isValidItem && "folderName" in item;
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(level < 2);

  if (!isValidItem) return null;

  const paddingLeft = `${level * 16 + 8}px`;

  if (!isFolder) {
    // File Node
    const file = item;
    const fileName = `${file.filename}.${file.fileExtension}`;
    const isSelected = selectedFile && 
      selectedFile.filename === file.filename && 
      selectedFile.fileExtension === file.fileExtension;

    const handleRename = () => setIsRenameDialogOpen(true);
    const handleDelete = () => setIsDeleteDialogOpen(true);
    const confirmDelete = () => {
      onDeleteFile?.(file, path);
      setIsDeleteDialogOpen(false);
    };

    const handleRenameSubmit = (newFilename, newExtension) => {
      onRenameFile?.(file, newFilename, newExtension, path);
      setIsRenameDialogOpen(false);
    };

    return (
      <div className="group">
        <div
          className={`flex items-center justify-between py-1 px-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
            isSelected ? 'bg-gradient-to-r from-purple-500/20 to-teal-500/20 border border-purple-500/30' : ''
          }`}
          style={{ paddingLeft }}
          onClick={() => onFileSelect?.(file)}
        >
          <div className="flex items-center min-w-0 flex-1">
            <File className="h-4 w-4 mr-2 shrink-0 text-gray-400" />
            <span className="text-sm truncate text-gray-200">{fileName}</span>
          </div>
          
          <div className="relative opacity-0 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const menu = document.getElementById(`file-menu-${file.filename}-${file.fileExtension}`);
                menu.classList.toggle('hidden');
              }}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-purple-200"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
            <div
              id={`file-menu-${file.filename}-${file.fileExtension}`}
              className="hidden absolute right-0 top-6 bg-slate-900 border border-gray-600 rounded-md shadow-xl z-10 min-w-24"
            >
              <button
                onClick={() => {
                  handleRename();
                  document.getElementById(`file-menu-${file.filename}-${file.fileExtension}`).classList.add('hidden');
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 flex items-center text-gray-200 hover:text-purple-200"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Rename
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  document.getElementById(`file-menu-${file.filename}-${file.fileExtension}`).classList.add('hidden');
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 flex items-center text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* File Dialogs */}
        {isRenameDialogOpen && (
          <RenameFileDialog
            onClose={() => setIsRenameDialogOpen(false)}
            onRename={handleRenameSubmit}
            currentFilename={file.filename}
            currentExtension={file.fileExtension}
          />
        )}

        {isDeleteDialogOpen && (
          <DeleteDialog
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={confirmDelete}
            title="Delete File"
            description={`Are you sure you want to delete "${fileName}"? This action cannot be undone.`}
          />
        )}
      </div>
    );
  } else {
    // Folder Node
    const folder = item;
    const folderName = folder.folderName;
    const currentPath = path ? `${path}/${folderName}` : folderName;

    const handleAddFile = () => setIsNewFileDialogOpen(true);
    const handleAddFolder = () => setIsNewFolderDialogOpen(true);
    const handleRename = () => setIsRenameDialogOpen(true);
    const handleDelete = () => setIsDeleteDialogOpen(true);

    const confirmDelete = () => {
      onDeleteFolder?.(folder, path);
      setIsDeleteDialogOpen(false);
    };

    const handleCreateFile = (filename, extension) => {
      if (onAddFile) {
        const newFile = {
          filename,
          fileExtension: extension,
          content: "",
        };
        onAddFile(newFile, currentPath);
      }
      setIsNewFileDialogOpen(false);
    };

    const handleCreateFolder = (newFolderName) => {
      if (onAddFolder) {
        const newFolder = {
          folderName: newFolderName,
          items: [],
        };
        onAddFolder(newFolder, currentPath);
      }
      setIsNewFolderDialogOpen(false);
    };

    const handleRenameSubmit = (newFolderName) => {
      onRenameFolder?.(folder, newFolderName, path);
      setIsRenameDialogOpen(false);
    };

    return (
      <div>
        <div className="group">
          <div
            className="flex items-center justify-between py-1 px-2 rounded cursor-pointer hover:bg-gray-800 transition-colors"
            style={{ paddingLeft }}
          >
            <div
              className="flex items-center min-w-0 flex-1"
              onClick={() => setIsOpen(!isOpen)}
            >
              <ChevronRight
                className={`h-4 w-4 mr-1 transition-transform text-gray-400 ${isOpen ? 'rotate-90' : ''}`}
              />
              <Folder className="h-4 w-4 mr-2 shrink-0 text-purple-400" />
              <span className="text-sm truncate text-gray-200">{folderName}</span>
            </div>

            <div className="relative opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const menu = document.getElementById(`folder-menu-${folderName}`);
                  menu.classList.toggle('hidden');
                }}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-purple-200"
              >
                <MoreHorizontal className="h-3 w-3" />
              </button>
              <div
                id={`folder-menu-${folderName}`}
                className="hidden absolute right-0 top-6 bg-slate-900 border border-gray-600 rounded-md shadow-xl z-10 min-w-32"
              >
                <button
                  onClick={() => {
                    handleAddFile();
                    document.getElementById(`folder-menu-${folderName}`).classList.add('hidden');
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 flex items-center text-gray-200 hover:text-purple-200"
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  New File
                </button>
                <button
                  onClick={() => {
                    handleAddFolder();
                    document.getElementById(`folder-menu-${folderName}`).classList.add('hidden');
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 flex items-center text-gray-200 hover:text-purple-200"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </button>
                <hr className="my-1 border-gray-700" />
                <button
                  onClick={() => {
                    handleRename();
                    document.getElementById(`folder-menu-${folderName}`).classList.add('hidden');
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 flex items-center text-gray-200 hover:text-purple-200"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    handleDelete();
                    document.getElementById(`folder-menu-${folderName}`).classList.add('hidden');
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 flex items-center text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Folder Contents */}
        {isOpen && (
          <div>
            {folder.items.map((childItem, index) => (
              <FileNode
                key={childItem.filename ? `${childItem.filename}.${childItem.fileExtension}` : `folder-${childItem.folderName || index}`}
                item={childItem}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                level={level + 1}
                path={currentPath}
                onAddFile={onAddFile}
                onAddFolder={onAddFolder}
                onDeleteFile={onDeleteFile}
                onDeleteFolder={onDeleteFolder}
                onRenameFile={onRenameFile}
                onRenameFolder={onRenameFolder}
              />
            ))}
          </div>
        )}

        {/* Folder Dialogs */}
        {isNewFileDialogOpen && (
          <NewFileDialog
            onClose={() => setIsNewFileDialogOpen(false)}
            onCreateFile={handleCreateFile}
          />
        )}

        {isNewFolderDialogOpen && (
          <NewFolderDialog
            onClose={() => setIsNewFolderDialogOpen(false)}
            onCreateFolder={handleCreateFolder}
          />
        )}

        {isRenameDialogOpen && (
          <RenameFolderDialog
            onClose={() => setIsRenameDialogOpen(false)}
            onRename={handleRenameSubmit}
            currentFolderName={folderName}
          />
        )}

        {isDeleteDialogOpen && (
          <DeleteDialog
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={confirmDelete}
            title="Delete Folder"
            description={`Are you sure you want to delete "${folderName}" and all its contents? This action cannot be undone.`}
          />
        )}
      </div>
    );
  }
}

/**
 * Dialog Components
 */
function NewFileDialog({ onClose, onCreateFile }) {
  const [filename, setFilename] = useState("");
  const [extension, setExtension] = useState("js");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (filename.trim()) {
      onCreateFile(filename.trim(), extension.trim() || "js");
      setFilename("");
      setExtension("js");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-gray-600 rounded-lg p-6 w-96 shadow-2xl">
        <h3 className="text-lg font-medium mb-4 bg-gradient-to-r from-purple-200 to-teal-200/70 bg-clip-text text-transparent">Create New File</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Filename</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200"
                placeholder="Enter filename"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Extension</label>
              <input
                type="text"
                value={extension}
                onChange={(e) => setExtension(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200"
                placeholder="js"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-md transition-all duration-200"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewFolderDialog({ onClose, onCreateFolder }) {
  const [folderName, setFolderName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreateFolder(folderName.trim());
      setFolderName("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-gray-600 rounded-lg p-6 w-96 shadow-2xl">
        <h3 className="text-lg font-medium mb-4 bg-gradient-to-r from-purple-200 to-teal-200/70 bg-clip-text text-transparent">Create New Folder</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200"
              placeholder="Enter folder name"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-md transition-all duration-200"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RenameFileDialog({ onClose, onRename, currentFilename, currentExtension }) {
  const [filename, setFilename] = useState(currentFilename);
  const [extension, setExtension] = useState(currentExtension);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (filename.trim()) {
      onRename(filename.trim(), extension.trim() || "js");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-gray-600 rounded-lg p-6 w-96 shadow-2xl">
        <h3 className="text-lg font-medium mb-4 bg-gradient-to-r from-purple-200 to-teal-200/70 bg-clip-text text-transparent">Rename File</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Filename</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Extension</label>
              <input
                type="text"
                value={extension}
                onChange={(e) => setExtension(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-md transition-all duration-200"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RenameFolderDialog({ onClose, onRename, currentFolderName }) {
  const [folderName, setFolderName] = useState(currentFolderName);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      onRename(folderName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-gray-600 rounded-lg p-6 w-96 shadow-2xl">
        <h3 className="text-lg font-medium mb-4 bg-gradient-to-r from-purple-200 to-teal-200/70 bg-clip-text text-transparent">Rename Folder</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-md transition-all duration-200"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteDialog({ onClose, onConfirm, title, description }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-gray-600 rounded-lg p-6 w-96 shadow-2xl">
        <h3 className="text-lg font-medium mb-2 bg-gradient-to-r from-red-200 to-orange-200/70 bg-clip-text text-transparent">{title}</h3>
        <p className="text-gray-300 mb-6">{description}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-md transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
