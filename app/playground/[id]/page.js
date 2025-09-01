"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { FileExplorer } from "../../../features/playground/components/FileExplorer";
import { CollaborativeEditor } from "../../../features/playground/components/Editor/DynamicCollaborativeEditor";
import { UserPresence } from "../../../features/playground/components/UserPresence";
import { ShareModal } from "../../../features/playground/components/ShareModal";
import dynamic from 'next/dynamic';

// Dynamic imports to avoid SSR issues with xterm.js
const TerminalPanelNew = dynamic(
    () => import('../../../features/playground/components/Terminal/TerminalPanelSimple'),
    { ssr: false }
);
const PreviewPanel = dynamic(
    () => import('../../../features/playground/components/PreviewPanel'),
    { ssr: false }
);
import { RoomProvider } from "../../../lib/liveblocks.config";
import { getProjectWithFiles, saveTemplateData } from "../../../lib/templateService";
import { Save, Terminal, Monitor } from 'lucide-react';

export default function Playground() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isLoaded, isSignedIn } = useUser();
    const [projectData, setProjectData] = useState(null);
    const [templateData, setTemplateData] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [activeFileContent, setActiveFileContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewPort, setPreviewPort] = useState(null); // Start with no server

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/signin?redirect=' + encodeURIComponent(`/playground/${id}`));
        }
    }, [isLoaded, isSignedIn, router, id]);

    // Load project data on mount
    useEffect(() => {
        if (id && isSignedIn) {
            loadProject();
        }
    }, [id, isSignedIn]);

    const loadProject = async () => {
        try {
            setLoading(true);
            console.log("Loading project:", id);
            
            const data = await getProjectWithFiles(id);
            setProjectData(data);
            
            // Convert flat files structure to template structure
            if (data.files) {
                const convertedData = convertFilesToTemplateStructure(data.files, data.name || "Project");
                console.log("Converted template data:", convertedData);
                setTemplateData(convertedData);
            } else {
                console.log("No files in project data:", data);
            }
        } catch (err) {
            console.error("Error loading project:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Convert flat files object to template structure with nested folders
    const convertFilesToTemplateStructure = (files, projectName) => {
        if (!files || typeof files !== 'object') {
            return {
                folderName: projectName,
                items: []
            };
        }

        const root = {
            folderName: projectName,
            items: []
        };

        // Process each file path
        Object.entries(files).forEach(([filePath, content]) => {
            const pathParts = filePath.split('/');
            let currentLevel = root;

            // Navigate/create folder structure
            for (let i = 0; i < pathParts.length - 1; i++) {
                const folderName = pathParts[i];
                
                // Check if folder already exists at current level
                let folder = currentLevel.items.find(
                    item => "folderName" in item && item.folderName === folderName
                );
                
                if (!folder) {
                    // Create new folder
                    folder = {
                        folderName: folderName,
                        items: []
                    };
                    currentLevel.items.push(folder);
                }
                
                currentLevel = folder;
            }

            // Add the file to the current level
            const fileName = pathParts[pathParts.length - 1];
            const lastDotIndex = fileName.lastIndexOf('.');
            const filename = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
            const fileExtension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1) : 'txt';

            currentLevel.items.push({
                filename,
                fileExtension,
                content: content || ""
            });
        });

        return root;
    };

    // Utility functions for nested file operations
    const findFileInStructure = (items, targetFile, currentPath = "") => {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            if ("filename" in item) {
                // This is a file
                if (item.filename === targetFile.filename && 
                    item.fileExtension === targetFile.fileExtension) {
                    return { 
                        item, 
                        index: i, 
                        parentItems: items, 
                        path: currentPath 
                    };
                }
            } else if ("folderName" in item && item.items) {
                // This is a folder, search recursively
                const folderPath = currentPath ? `${currentPath}/${item.folderName}` : item.folderName;
                const result = findFileInStructure(item.items, targetFile, folderPath);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    };

    const findFolderInStructure = (items, targetFolder, currentPath = "") => {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            if ("folderName" in item) {
                if (item.folderName === targetFolder.folderName) {
                    return { 
                        item, 
                        index: i, 
                        parentItems: items, 
                        path: currentPath 
                    };
                }
                
                // Search recursively in subfolders
                if (item.items) {
                    const folderPath = currentPath ? `${currentPath}/${item.folderName}` : item.folderName;
                    const result = findFolderInStructure(item.items, targetFolder, folderPath);
                    if (result) {
                        return result;
                    }
                }
            }
        }
        return null;
    };

    // File operations
    const handleFileSelect = (file) => {
        console.log("Selected file:", file);
        setSelectedFile(file);
        setActiveFileContent(file.content || "");
    };

    const handleAddFile = async (newFile, parentPath) => {
        console.log('Adding file:', newFile, 'to path:', parentPath);
        
        // Update template data
        const updatedData = JSON.parse(JSON.stringify(templateData));
        
        if (parentPath === "") {
            updatedData.items.push(newFile);
        } else {
            // Navigate to target folder (for future nested folder support)
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
        
        // Save to Firebase
        try {
            await saveTemplateData(id, updatedData);
            console.log('File saved successfully');
        } catch (error) {
            console.error('Error saving file:', error);
        }
    };

    const handleAddFolder = async (newFolder, parentPath) => {
        console.log('Adding folder:', newFolder, 'to path:', parentPath);
        
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
        
        // Save to Firebase
        try {
            await saveTemplateData(id, updatedData);
            console.log('Folder saved successfully');
        } catch (error) {
            console.error('Error saving folder:', error);
        }
    };

    const handleDeleteFile = async (file, parentPath) => {
        console.log('🗑️ Deleting file:', file, 'from path:', parentPath);
        
        if (!file || !file.filename || !file.fileExtension) {
            console.error('Invalid file object:', file);
            return;
        }
        
        const updatedData = JSON.parse(JSON.stringify(templateData));
        
        // Find the file in the nested structure
        const fileLocation = findFileInStructure(updatedData.items, file);
        
        if (fileLocation) {
            // Remove the file from its parent items array
            fileLocation.parentItems.splice(fileLocation.index, 1);
            console.log(`✅ Found and removed file at index ${fileLocation.index} in path: ${fileLocation.path}`);
            
            setTemplateData(updatedData);
            
            // Save to Firebase
            try {
                await saveTemplateData(id, updatedData);
                console.log('✅ File deleted successfully');
            } catch (error) {
                console.error('❌ Error deleting file:', error);
            }
            
            // Clear selection if deleted file was selected
            if (selectedFile && 
                selectedFile.filename === file.filename && 
                selectedFile.fileExtension === file.fileExtension) {
                setSelectedFile(null);
                setActiveFileContent("");
                console.log('🔄 Cleared selected file');
            }
        } else {
            console.error('❌ File not found in structure:', file);
        }
    };

    const handleDeleteFolder = async (folder, parentPath) => {
        console.log('🗑️ Deleting folder:', folder, 'from path:', parentPath);
        
        if (!folder || !folder.folderName) {
            console.error('Invalid folder object:', folder);
            return;
        }
        
        const updatedData = JSON.parse(JSON.stringify(templateData));
        
        // Find the folder in the nested structure
        const folderLocation = findFolderInStructure(updatedData.items, folder);
        
        if (folderLocation) {
            // Remove the folder from its parent items array
            folderLocation.parentItems.splice(folderLocation.index, 1);
            console.log(`✅ Found and removed folder at index ${folderLocation.index} in path: ${folderLocation.path}`);
            
            setTemplateData(updatedData);
            
            // Save to Firebase
            try {
                await saveTemplateData(id, updatedData);
                console.log('✅ Folder deleted successfully');
            } catch (error) {
                console.error('❌ Error deleting folder:', error);
            }
        } else {
            console.error('❌ Folder not found in structure:', folder);
        }
    };

    const handleRenameFile = async (file, newFilename, newExtension, parentPath) => {
        console.log('✏️ Renaming file:', file, 'to:', newFilename + '.' + newExtension);
        
        if (!file || !file.filename || !file.fileExtension) {
            console.error('Invalid file object:', file);
            return;
        }
        
        if (!newFilename.trim()) {
            console.error('Empty filename provided');
            return;
        }
        
        const updatedData = JSON.parse(JSON.stringify(templateData));
        
        // Find the file in the nested structure
        const fileLocation = findFileInStructure(updatedData.items, file);
        
        if (fileLocation) {
            const oldName = `${fileLocation.item.filename}.${fileLocation.item.fileExtension}`;
            
            // Update the file properties
            fileLocation.item.filename = newFilename.trim();
            fileLocation.item.fileExtension = newExtension.trim();
            
            const newName = `${newFilename.trim()}.${newExtension.trim()}`;
            console.log(`📝 Updated file from ${oldName} to ${newName} at path: ${fileLocation.path}`);
            
            // Update selected file if it was the renamed one
            if (selectedFile && 
                selectedFile.filename === file.filename && 
                selectedFile.fileExtension === file.fileExtension) {
                setSelectedFile({
                    ...selectedFile,
                    filename: newFilename.trim(),
                    fileExtension: newExtension.trim()
                });
                console.log('🔄 Updated selected file reference');
            }
            
            setTemplateData(updatedData);
            
            // Save to Firebase
            try {
                await saveTemplateData(id, updatedData);
                console.log('✅ File renamed successfully');
            } catch (error) {
                console.error('❌ Error renaming file:', error);
            }
        } else {
            console.error('❌ File not found in structure:', file);
        }
    };

    const handleRenameFolder = async (folder, newFolderName, parentPath) => {
        console.log('✏️ Renaming folder:', folder, 'to:', newFolderName);
        
        if (!folder || !folder.folderName) {
            console.error('Invalid folder object:', folder);
            return;
        }
        
        if (!newFolderName.trim()) {
            console.error('Empty folder name provided');
            return;
        }
        
        const updatedData = JSON.parse(JSON.stringify(templateData));
        
        // Find the folder in the nested structure
        const folderLocation = findFolderInStructure(updatedData.items, folder);
        
        if (folderLocation) {
            const oldName = folderLocation.item.folderName;
            
            // Update the folder name
            folderLocation.item.folderName = newFolderName.trim();
            
            console.log(`📝 Updated folder from ${oldName} to ${newFolderName.trim()} at path: ${folderLocation.path}`);
            
            setTemplateData(updatedData);
            
            // Save to Firebase
            try {
                await saveTemplateData(id, updatedData);
                console.log('✅ Folder renamed successfully');
            } catch (error) {
                console.error('❌ Error renaming folder:', error);
            }
        } else {
            console.error('❌ Folder not found in structure:', folder);
        }
    };

    const handleFileContentChange = (newContent) => {
        setActiveFileContent(newContent);
        
        // Only update content in memory, don't save automatically
        // The user will manually save when they click the save button
        
        // If terminal is open and we have a selected file, sync with WebContainer
        if (isTerminalOpen && selectedFile) {
            const fileName = `${selectedFile.filename}.${selectedFile.fileExtension}`;
            // The TerminalPanel component will handle syncing when it receives new file content
        }
    };

    // Manual save function
    const handleSave = async () => {
        if (!templateData) return;
        
        setIsSaving(true);
        try {
            // Update the current file content in template data before saving
            let updatedData = JSON.parse(JSON.stringify(templateData));
            
            if (selectedFile) {
                const fileIndex = updatedData.items.findIndex(
                    item => "filename" in item && 
                            item.filename === selectedFile.filename && 
                            item.fileExtension === selectedFile.fileExtension
                );
                
                if (fileIndex !== -1) {
                    updatedData.items[fileIndex].content = activeFileContent;
                    setTemplateData(updatedData);
                }
            }
            
            await saveTemplateData(id, updatedData);
            setLastSaved(new Date());
            console.log('Project saved successfully');
        } catch (error) {
            console.error('Error saving project:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Share modal handlers
    const handleShare = () => {
        setIsShareModalOpen(true);
    };

    const handleCloseShareModal = () => {
        setIsShareModalOpen(false);
    };

    const handleToggleTerminal = () => {
        setIsTerminalOpen(!isTerminalOpen);
    };

    const handleTogglePreview = () => {
        setIsPreviewOpen(!isPreviewOpen);
    };

    const handleServerStart = (port) => {
        setPreviewPort(port);
        setIsPreviewOpen(true); // Auto-open preview when server starts
        console.log('Server started on port:', port);
    };

    // Auto-open terminal on mount
    useEffect(() => {
        setIsTerminalOpen(true);
    }, []);

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading playground...</p>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-300 mb-4">Authentication Required</h1>
                    <p className="text-gray-400">Please sign in to access this playground.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950">
                <div className="text-center">
                    <div className="text-red-400 mb-4">
                        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-300 mb-2">Error Loading Project</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!templateData) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-300 mb-2">No Project Data</h2>
                    <p className="text-gray-400">Unable to load project files.</p>
                </div>
            </div>
        );
    }

    return (
        <RoomProvider 
            id={`project-${id}`}
            initialPresence={{ 
                cursor: null,
                selection: null,
            }}
            initialStorage={{}}
        >
            <div className="flex h-screen bg-slate-950 overflow-hidden">
                {/* File Explorer Sidebar */}
                <FileExplorer
                    data={templateData}
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                    title={`${projectData?.name || 'Project'} Files`}
                    onAddFile={handleAddFile}
                    onAddFolder={handleAddFolder}
                    onDeleteFile={handleDeleteFile}
                    onDeleteFolder={handleDeleteFolder}
                    onRenameFile={handleRenameFile}
                    onRenameFolder={handleRenameFolder}
                />
                
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Header */}
                    <div className="bg-slate-900 border-b border-gray-700 p-4 shadow-sm flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-200 to-teal-200/70 bg-clip-text text-transparent">
                                    {projectData?.name || 'Playground'}
                                </h1>
                                <p className="text-sm text-gray-400">
                                    {selectedFile ? 
                                        `Editing: ${selectedFile.filename}.${selectedFile.fileExtension}` : 
                                        'Select a file to start editing'
                                    }
                                </p>
                            </div>
                            
                            {/* Header Actions */}
                            <div className="flex items-center space-x-4">
                                {/* Preview Toggle Button */}
                                <button
                                    onClick={handleTogglePreview}
                                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium ${
                                        isPreviewOpen 
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                    }`}
                                >
                                    <Monitor className="h-4 w-4" />
                                    <span>Preview</span>
                                </button>
                                
                                {/* Terminal Toggle Button */}
                                <button
                                    onClick={handleToggleTerminal}
                                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium ${
                                        isTerminalOpen 
                                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' 
                                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                    }`}
                                >
                                    <Terminal className="h-4 w-4" />
                                    <span>Terminal</span>
                                </button>
                                
                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-md transition-all duration-200 text-sm font-medium"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                                </button>
                                
                                {/* Last Saved Indicator */}
                                {lastSaved && (
                                    <span className="text-xs text-gray-500">
                                        Saved {lastSaved.toLocaleTimeString()}
                                    </span>
                                )}
                                
                                {/* User Presence & Share */}
                                <UserPresence onShare={handleShare} />
                            </div>
                        </div>
                    </div>
                    
                    {/* Editor, Preview and Terminal Area */}
                    <div className="flex-1 flex bg-slate-950 min-h-0 overflow-hidden">
                        {/* Main Content (Editor + Terminal) */}
                        <div className={`flex flex-col transition-all duration-300 min-w-0 ${
                            isPreviewOpen ? 'w-1/2 max-w-1/2' : 'w-full'
                        }`}>
                            {/* Editor Section */}
                            <div className={`p-4 bg-slate-950 transition-all duration-300 min-h-0 overflow-hidden ${
                                isTerminalOpen ? 'flex-1' : 'flex-1'
                            }`}>
                                {selectedFile ? (
                                    <div className="h-full w-full overflow-hidden">
                                        <CollaborativeEditor
                                            content={activeFileContent}
                                            onContentChange={handleFileContentChange}
                                            fileExtension={selectedFile.fileExtension}
                                            fileName={`${selectedFile.filename}.${selectedFile.fileExtension}`}
                                            readOnly={false}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center text-gray-500">
                                            <svg className="h-16 w-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h3 className="text-lg font-medium mb-2 text-gray-400">No file selected</h3>
                                            <p className="text-sm text-gray-600">Choose a file from the explorer to start editing</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Terminal Section */}
                            {isTerminalOpen && (
                                <div className="h-80 min-h-80 max-h-96 border-t border-gray-700 bg-slate-900 flex-shrink-0 overflow-hidden">
                                    <TerminalPanelNew 
                                        onServerStart={handleServerStart}
                                    />
                                </div>
                            )}
                        </div>
                        
                        {/* Preview Section */}
                        {isPreviewOpen && (
                            <div className="w-1/2 min-w-0 max-w-1/2 border-l border-gray-700 bg-slate-900 flex flex-col overflow-hidden">
                                <PreviewPanel 
                                    activePort={previewPort}
                                    className="flex-1 min-h-0 overflow-hidden"
                                />
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Share Modal */}
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={handleCloseShareModal}
                    projectId={id}
                    projectName={projectData?.name || 'Untitled Project'}
                />
            </div>
        </RoomProvider>
    );
}
