"use client";

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '@clerk/nextjs';
import { useRoom } from '../../../../lib/liveblocks.config';

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export function CollaborativeEditor({
  content, 
  onContentChange, 
  fileExtension = 'js',
  fileName = 'untitled',
  readOnly = false 
}) {
  const room = useRoom();
  const { user } = useUser();
  const editorRef = useRef(null);
    const bindingRef = useRef(null);
    const providerRef = useRef(null);
    const yDocRef = useRef(null);
    const observerRef = useRef(null);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [collaborationReady, setCollaborationReady] = useState(false);

    // Ensure we're on the client side
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Get language for syntax highlighting
    const getEditorLanguage = (fileExtension) => {
        const extensionMap = {
            'js': 'javascript',
            'jsx': 'javascriptreact',
            'ts': 'typescript',
            'tsx': 'typescriptreact',
            'py': 'python',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'md': 'markdown',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'sql': 'sql',
            'php': 'php',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'h': 'c',
            'hpp': 'cpp',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'rb': 'ruby',
            'swift': 'swift',
            'kt': 'kotlin',
            'scala': 'scala',
            'sh': 'shell',
            'bash': 'shell',
            'zsh': 'shell',
            'fish': 'shell',
            'ps1': 'powershell',
            'dockerfile': 'dockerfile',
            'txt': 'plaintext'
        };

        return extensionMap[fileExtension?.toLowerCase()] || 'plaintext';
    };

    const language = getEditorLanguage(fileExtension);

    // Create a unique document key per file to avoid content mixing
    const documentKey = `file-${fileName}`;

    useEffect(() => {
        if (!isClient || !room || !editorRef.current || !isEditorReady) return;

        // Cleanup previous bindings
        try {
            if (observerRef.current) {
                const { yText, updateListener } = observerRef.current;
                yText.unobserve(updateListener);
                observerRef.current = null;
            }
            if (bindingRef.current) {
                // Clean up cursor visualization if it exists
                if (bindingRef.current.cursorCleanup) {
                    bindingRef.current.cursorCleanup();
                }
                bindingRef.current.destroy();
                bindingRef.current = null;
            }
            if (providerRef.current) {
                providerRef.current.destroy();
                providerRef.current = null;
            }
            if (yDocRef.current) {
                yDocRef.current.destroy();
                yDocRef.current = null;
            }
        } catch (error) {
            console.warn('Previous cleanup warning:', error.message);
        }

        // Setup collaboration
        const setupCollaboration = async () => {
            try {
                // Ensure editor is ready and has a model
                if (!editorRef.current || !editorRef.current.getModel()) {
                    console.warn('Editor not ready for collaboration setup');
                    return;
                }

                const [
                    { Doc },
                    { MonacoBinding },
                    { LiveblocksYjsProvider }
                ] = await Promise.all([
                    import('yjs'),
                    import('y-monaco'),
                    import('@liveblocks/yjs')
                ]);

                // Create Yjs document and text object with unique key per file
                const yDoc = new Doc();
                const yText = yDoc.getText(documentKey);
                yDocRef.current = yDoc;

                // Create Liveblocks provider for real-time sync
                const provider = new LiveblocksYjsProvider(room, yDoc);
                providerRef.current = provider;

                // Debug awareness state
                provider.awareness.on('change', (changes) => {
                    console.log('Awareness state changed:', {
                        added: Array.from(changes.added),
                        updated: Array.from(changes.updated),
                        removed: Array.from(changes.removed)
                    });

                    // Log all awareness states
                    const states = provider.awareness.getStates();
                    console.log('Current awareness states:', states);
                });

                // Wait for provider to sync before setting up collaboration
                provider.on('synced', () => {
                    console.log('Provider synced, current Yjs content length:', yText.length);

                    // Only set initial content if document is completely empty
                    if (content && yText.length === 0) {
                        console.log('Setting initial content after sync:', content.substring(0, 50) + '...');
                        yText.insert(0, content);
                    }

                    setCollaborationReady(true);

                    // Set user awareness information (Liveblocks pattern)
                    if (user) {
                        provider.awareness.setLocalStateField('user', {
                            name: user.fullName || user.firstName || 'Anonymous',
                            color: getUserColor(user.id),
                            id: user.id
                        });
                        console.log('Set user awareness:', {
                            name: user.fullName || user.firstName,
                            color: getUserColor(user.id)
                        });
                    }
                });

                // Create Monaco binding for collaborative editing
                const editorModel = editorRef.current.getModel();
                console.log('Editor model details:', {
                    uri: editorModel.uri.toString(),
                    language: editorModel.getLanguageId(),
                    lineCount: editorModel.getLineCount(),
                    value: editorModel.getValue().substring(0, 50) + '...'
                });

                // Sync Monaco model with Yjs content only if they differ
                const yTextContent = yText.toString();
                const modelContent = editorModel.getValue();

                console.log('Content comparison:', {
                    modelLength: modelContent.length,
                    yTextLength: yTextContent.length,
                    modelContent: modelContent.substring(0, 50) + '...',
                    yTextContent: yTextContent.substring(0, 50) + '...'
                });

                // Only sync if contents are actually different to prevent duplication
                if (modelContent !== yTextContent) {
                    console.log('Syncing model content with Yjs to prevent duplication');
                    editorModel.setValue(yTextContent);
                }

                // Ensure model is properly positioned before binding
                editorRef.current.setPosition({ lineNumber: 1, column: 1 });

                // Small delay to ensure model is fully ready
                setTimeout(() => {
                    // Ensure the editor model is in sync before binding
                    const currentModelContent = editorModel.getValue();
                    const currentYjsContent = yText.toString();

                    if (currentModelContent !== currentYjsContent) {
                        console.log('Final sync before binding:', {
                            modelContent: currentModelContent.substring(0, 30),
                            yjsContent: currentYjsContent.substring(0, 30)
                        });
                        editorModel.setValue(currentYjsContent);
                    }

                    // Create Monaco binding with awareness (following Liveblocks pattern)
                    const binding = new MonacoBinding(
                        yText,
                        editorModel,
                        new Set([editorRef.current]),
                        provider.awareness
                    );
                    bindingRef.current = binding;

                    console.log('Monaco-Yjs binding created with awareness support');

                    // Add custom cursor tracking with stable rendering to prevent flickering
                    const setupCursorTracking = () => {
                        // Track cursor position changes
                        const handleCursorChange = () => {
                            try {
                                const position = editorRef.current?.getPosition();
                                const selection = editorRef.current?.getSelection();
                                
                                if (position && provider.awareness && user) {
                                    // Only update awareness with cursor position, don't show own cursor
                                    provider.awareness.setLocalState({
                                        user: {
                                            name: user.fullName || user.firstName || 'Anonymous',
                                            color: getUserColor(user.id),
                                            id: user.id
                                        },
                                        cursor: {
                                            line: position.lineNumber,
                                            column: position.column,
                                            timestamp: Date.now()
                                        },
                                        selection: selection && !selection.isEmpty() ? {
                                            startLine: selection.startLineNumber,
                                            startColumn: selection.startColumn,
                                            endLine: selection.endLineNumber,
                                            endColumn: selection.endColumn
                                        } : null
                                    });
                                }
                            } catch (error) {
                                console.warn('Cursor update error:', error);
                            }
                        };

                        // Listen for cursor changes with error handling
                        let cursorDisposable, selectionDisposable;
                        try {
                            cursorDisposable = editorRef.current?.onDidChangeCursorPosition(handleCursorChange);
                            selectionDisposable = editorRef.current?.onDidChangeCursorSelection(handleCursorChange);
                        } catch (error) {
                            console.warn('Failed to set up cursor listeners:', error);
                        }

                        // Track other users' cursors with stable rendering
                        let decorations = [];
                        let lastRenderState = new Map(); // Track last rendered state to prevent unnecessary updates
                        
                        const renderOtherCursors = () => {
                            try {
                                if (!provider.awareness || !editorRef.current) return;
                                
                                const states = provider.awareness.getStates();
                                const currentState = new Map();
                                
                                // Build current state map
                                states.forEach((state, clientId) => {
                                    if (clientId !== provider.awareness.clientID && state.user && state.cursor) {
                                        currentState.set(clientId, {
                                            user: state.user,
                                            cursor: state.cursor,
                                            selection: state.selection
                                        });
                                    }
                                });
                                
                                // Check if state actually changed to prevent unnecessary re-renders
                                let stateChanged = currentState.size !== lastRenderState.size;
                                if (!stateChanged) {
                                    for (let [clientId, state] of currentState) {
                                        const lastState = lastRenderState.get(clientId);
                                        if (!lastState || 
                                            lastState.cursor.line !== state.cursor.line ||
                                            lastState.cursor.column !== state.cursor.column ||
                                            lastState.user.name !== state.user.name ||
                                            JSON.stringify(lastState.selection) !== JSON.stringify(state.selection)) {
                                            stateChanged = true;
                                            break;
                                        }
                                    }
                                }
                                
                                // Only update if state actually changed
                                if (!stateChanged) return;
                                
                                console.log('Cursor state changed, re-rendering...');
                                
                                const newDecorations = [];
                                
                                currentState.forEach((state, clientId) => {
                                    if (state.cursor.line && state.cursor.column) {
                                        // Create cursor decoration for OTHER users only
                                        newDecorations.push({
                                            range: new monaco.Range(
                                                state.cursor.line,
                                                state.cursor.column,
                                                state.cursor.line,
                                                state.cursor.column
                                            ),
                                            options: {
                                                className: `remote-cursor cursor-${clientId}`,
                                                after: {
                                                    content: `│ ${state.user.name}`,
                                                    inlineClassName: `cursor-indicator cursor-${clientId}`
                                                }
                                            }
                                        });

                                        // Add selection decoration if exists
                                        if (state.selection) {
                                            newDecorations.push({
                                                range: new monaco.Range(
                                                    state.selection.startLine,
                                                    state.selection.startColumn,
                                                    state.selection.endLine,
                                                    state.selection.endColumn
                                                ),
                                                options: {
                                                    className: `remote-selection selection-${clientId}`,
                                                    backgroundColor: state.user.color + '30'
                                                }
                                            });
                                        }

                                        // Create/update CSS for this user's color (only once)
                                        const styleId = `cursor-styles-${clientId}`;
                                        if (!document.getElementById(styleId)) {
                                            const style = document.createElement('style');
                                            style.id = styleId;
                                            style.textContent = `
                                                .cursor-indicator.cursor-${clientId} {
                                                    color: white;
                                                    background: ${state.user.color};
                                                    padding: 1px 6px;
                                                    border-radius: 3px;
                                                    font-size: 11px;
                                                    font-weight: bold;
                                                    margin-left: 2px;
                                                    white-space: nowrap;
                                                    position: relative;
                                                    z-index: 1000;
                                                }
                                                .remote-selection.selection-${clientId} {
                                                    background-color: ${state.user.color}40 !important;
                                                }
                                            `;
                                            document.head.appendChild(style);
                                        }
                                    }
                                });

                                // Clean up styles for users who left
                                lastRenderState.forEach((state, clientId) => {
                                    if (!currentState.has(clientId)) {
                                        const style = document.getElementById(`cursor-styles-${clientId}`);
                                        if (style) {
                                            style.remove();
                                        }
                                    }
                                });

                                // Update decorations safely
                                if (editorRef.current && editorRef.current.getModel()) {
                                    decorations = editorRef.current.deltaDecorations(decorations, newDecorations);
                                }
                                
                                // Update last render state
                                lastRenderState = new Map(currentState);
                                
                                console.log(`Rendered cursors for ${currentState.size} other users`);
                            } catch (error) {
                                console.warn('Cursor rendering error:', error);
                            }
                        };

                        // Debounce awareness changes to reduce flickering
                        let renderTimeout;
                        const debouncedRender = () => {
                            clearTimeout(renderTimeout);
                            renderTimeout = setTimeout(renderOtherCursors, 50); // 50ms debounce
                        };

                        // Listen for awareness changes
                        try {
                            provider.awareness.on('change', debouncedRender);
                        } catch (error) {
                            console.warn('Failed to set up awareness listener:', error);
                        }

                        // Initial cursor position update
                        setTimeout(handleCursorChange, 100);

                        // Store cleanup function
                        binding.cursorCleanup = () => {
                            try {
                                clearTimeout(renderTimeout);
                                cursorDisposable?.dispose();
                                selectionDisposable?.dispose();
                                provider.awareness?.off('change', debouncedRender);
                                if (editorRef.current && decorations.length > 0) {
                                    editorRef.current.deltaDecorations(decorations, []);
                                }
                                // Clean up all cursor styles
                                lastRenderState.forEach((state, clientId) => {
                                    const style = document.getElementById(`cursor-styles-${clientId}`);
                                    if (style) {
                                        style.remove();
                                    }
                                });
                            } catch (error) {
                                console.warn('Cursor cleanup error:', error);
                            }
                        };
                    };

                    setupCursorTracking();

                    // Add periodic synchronization validator
                    const syncValidator = setInterval(() => {
                        if (editorRef.current && yText) {
                            const monacoContent = editorRef.current.getModel().getValue();
                            const yjsContent = yText.toString();

                            if (monacoContent !== yjsContent) {
                                console.warn('Content sync drift detected, auto-correcting:', {
                                    monacoLength: monacoContent.length,
                                    yjsLength: yjsContent.length,
                                    timestamp: new Date().toISOString()
                                });

                                // Force sync from Yjs (authoritative source)
                                editorRef.current.getModel().setValue(yjsContent);
                            }
                        }
                    }, 5000); // Check every 5 seconds

                    // Store validator for cleanup
                    bindingRef.current.syncValidator = syncValidator;

                    // Enhanced cursor and content tracking
                    editorRef.current.onDidChangeCursorPosition((e) => {
                        const position = e.position;
                        console.log('Cursor moved to:', position);

                        // Update awareness with precise cursor position
                        provider.awareness.setLocalStateField('cursor', {
                            line: position.lineNumber,
                            column: position.column,
                            timestamp: Date.now()
                        });
                    });

                    // Track content changes with better precision
                    editorRef.current.onDidChangeModelContent((e) => {
                        e.changes.forEach((change, index) => {
                            console.log(`Precise Change ${index}:`, {
                                startLine: change.range.startLineNumber,
                                startColumn: change.range.startColumn,
                                endLine: change.range.endLineNumber,
                                endColumn: change.range.endColumn,
                                text: change.text,
                                rangeLength: change.rangeLength,
                                operation: change.rangeLength > 0 ? (change.text ? 'replace' : 'delete') : 'insert'
                            });
                        });
                    });
                }, 100);

                // Listen for changes and update parent component
                const updateListener = () => {
                    const newContent = yText.toString();
                    console.log('Yjs content updated:', newContent.substring(0, 50) + '...');
                    if (onContentChange) {
                        onContentChange(newContent);
                    }
                };

                yText.observe(updateListener);
                observerRef.current = { yText, updateListener };

                console.log('Collaboration setup completed for:', documentKey);

                console.log('Collaboration setup complete for:', fileName);

            } catch (error) {
                console.error('Error setting up collaboration:', error);
                // Fallback to non-collaborative mode
                if (content && editorRef.current.getValue() !== content) {
                    editorRef.current.setValue(content);
                }
            }
        };

        setupCollaboration();

        // Cleanup function
        return () => {
            try {
                // Remove our custom observer first
                if (observerRef.current) {
                    const { yText, updateListener } = observerRef.current;
                    yText.unobserve(updateListener);
                    observerRef.current = null;
                }

                // Clean up sync validator
                if (bindingRef.current?.syncValidator) {
                    clearInterval(bindingRef.current.syncValidator);
                }

                // Clean up in the correct order
                if (bindingRef.current) {
                    bindingRef.current.destroy();
                    bindingRef.current = null;
                }
                if (providerRef.current) {
                    providerRef.current.destroy();
                    providerRef.current = null;
                }
                if (yDocRef.current) {
                    yDocRef.current.destroy();
                    yDocRef.current = null;
                }
                setCollaborationReady(false);
            } catch (error) {
                // Silently handle cleanup errors to prevent console spam
                console.warn('Cleanup warning:', error.message);
            }
        };
    }, [isClient, room, isEditorReady, fileName]); // Key dependencies for collaboration

    // Generate a consistent color for this user based on their ID
  const getUserColor = (userId) => {
    if (!userId) return '#888888';
    // Create a hash from the user ID to get consistent color
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Update user awareness when fileName changes (simplified Liveblocks pattern)
  useEffect(() => {
    if (!room || !user || !fileName) return;
    
    const provider = room.getProvider?.();
    if (provider?.awareness) {
      provider.awareness.setLocalStateField('user', {
        name: user.fullName || user.firstName || 'Anonymous',
        color: getUserColor(user.id),
        id: user.id
      });
      
      console.log('Updated user awareness for file:', fileName);
    }
  }, [fileName, room, user]);
    useEffect(() => {
        if (!collaborationReady || !yDocRef.current || !bindingRef.current) return;

        const yText = yDocRef.current.getText(documentKey);
        const currentContent = yText.toString();

        // Only update if content is different, not empty, and document is empty
        if (content && currentContent !== content && yText.length === 0) {
            yDocRef.current.transact(() => {
                yText.insert(0, content);
            });
        }
    }, [content, documentKey, collaborationReady]);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // Configure TypeScript compiler options for better JSX/TSX support
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
            allowJs: true,
            typeRoots: ['node_modules/@types'],
            skipLibCheck: true,
            strict: false,
            noImplicitAny: false,
            strictNullChecks: false,
            allowSyntheticDefaultImports: true,
            forceConsistentCasingInFileNames: false,
        });

        // Configure JavaScript compiler options for JSX support
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
            allowJs: true,
            checkJs: false,
            allowSyntheticDefaultImports: true,
        });

        // Enable IntelliSense and suggestions
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
            noSuggestionDiagnostics: false, // Enable suggestions
        });

        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false, // Enable semantic validation for better IntelliSense
            noSyntaxValidation: false,
            noSuggestionDiagnostics: false, // Enable suggestions
        });

        // Add React types for better IntelliSense
        const reactTypes = `
      declare module 'react' {
        export interface Component<P = {}, S = {}> {}
        export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
        export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
        export function useRef<T>(initialValue: T): { current: T };
        export const Fragment: any;
        export default any;
      }
      
      declare global {
        namespace JSX {
          interface Element extends React.ReactElement<any, any> {}
          interface IntrinsicElements {
            [elemName: string]: any;
          }
        }
      }
    `;

        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            reactTypes,
            'file:///node_modules/@types/react/index.d.ts'
        );

        monaco.languages.typescript.javascriptDefaults.addExtraLib(
            reactTypes,
            'file:///node_modules/@types/react/index.d.ts'
        );

        // Configure Monaco theme
        monaco.editor.defineTheme('modern-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955' },
                { token: 'keyword', foreground: '569CD6' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'number', foreground: 'B5CEA8' },
                { token: 'type', foreground: '4EC9B0' },
                { token: 'class', foreground: '4EC9B0' },
                { token: 'function', foreground: 'DCDCAA' },
                { token: 'variable', foreground: '9CDCFE' },
            ],
            colors: {
                'editor.background': '#0f172a',
                'editor.foreground': '#e2e8f0',
                'editorLineNumber.foreground': '#64748b',
                'editor.selectionBackground': '#374151',
                'editor.lineHighlightBackground': '#1e293b',
                'editorCursor.foreground': '#a78bfa',
                'editor.findMatchBackground': '#fbbf24',
                'editor.findMatchHighlightBackground': '#92400e',
                'scrollbarSlider.background': '#374151',
                'scrollbarSlider.hoverBackground': '#4b5563',
                'editorWidget.background': '#1e293b',
                'editorWidget.border': '#374151',
                'editorSuggestWidget.background': '#1e293b',
                'editorSuggestWidget.border': '#374151',
                'list.hoverBackground': '#374151',
                'list.activeSelectionBackground': '#4338ca',
                'list.inactiveSelectionBackground': '#374151'
            }
        });

        monaco.editor.setTheme('modern-dark');
        setIsEditorReady(true);

        // Focus the editor
        editor.focus();
    };

    const handleEditorChange = (value) => {
        // Only use this for fallback when collaboration is not ready
        if (!collaborationReady && onContentChange) {
            onContentChange(value || '');
        }
    };

    if (!isClient) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-950 rounded-lg border border-gray-700">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                    <p className="text-gray-400 text-sm">Loading editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-950 rounded-lg overflow-hidden border border-gray-700">
            <Editor
                height="100%"
                language={language}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="modern-dark"
                options={{
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    minimap: { enabled: true },
                    automaticLayout: true,
                    bracketPairColorization: { enabled: true },
                    suggest: {
                        enableRealTimeInsertion: true,
                        showInlineDetails: true,
                    },
                    quickSuggestions: {
                        other: true,
                        comments: true,
                        strings: true
                    },
                    parameterHints: { enabled: true },
                    autoIndent: 'full',
                    formatOnPaste: true,
                    formatOnType: true,
                    readOnly,
                    // Collaboration-specific settings for better positioning
                    occurrencesHighlight: false,
                    selectionHighlight: false,
                    cursorBlinking: 'blink',
                    cursorSmoothCaretAnimation: false,
                    multiCursorModifier: 'alt',
                    selectOnLineNumbers: true,
                    wordWrap: 'on',
                    // Disable features that might cause positioning issues
                    codeLens: false,
                    folding: false,
                    glyphMargin: false,
                    lightbulb: { enabled: false }
                }}
                loading={
                    <div className="flex items-center justify-center h-full bg-slate-950">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                            <p className="text-gray-400 text-sm">Loading editor...</p>
                        </div>
                    </div>
                }
            />
        </div>
    );
}
