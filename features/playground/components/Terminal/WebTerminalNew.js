"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

const WebTerminalNew = ({ 
  onReady,
  webcontainerInstance,
  className = "",
  onProcessStart 
}) => {
  const terminalRef = useRef(null);
  const terminalInstance = useRef(null);
  const fitAddon = useRef(null);
  const shellProcess = useRef(null);
  const currentProcess = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Start with false
  
  // Command line state
  const currentLine = useRef("");
  const cursorPosition = useRef(0);
  const commandHistory = useRef([]);
  const historyIndex = useRef(-1);

  const terminalTheme = {
    background: "#0F0F23",
    foreground: "#E5E7EB",
    cursor: "#E5E7EB",
    cursorAccent: "#0F0F23",
    selection: "#374151",
    black: "#1F2937",
    red: "#EF4444",
    green: "#10B981",
    yellow: "#F59E0B",
    blue: "#3B82F6",
    magenta: "#8B5CF6",
    cyan: "#06B6D4",
    white: "#F3F4F6",
    brightBlack: "#4B5563",
    brightRed: "#F87171",
    brightGreen: "#34D399",
    brightYellow: "#FBBF24",
    brightBlue: "#60A5FA",
    brightMagenta: "#A78BFA",
    brightCyan: "#22D3EE",
    brightWhite: "#FFFFFF",
  };

  const writePrompt = useCallback(() => {
    if (terminalInstance.current && !isRunning) {
      terminalInstance.current.write("\r\n$ ");
      currentLine.current = "";
      cursorPosition.current = 0;
    }
  }, [isRunning]);

  const executeCommand = useCallback(async (command) => {
    if (!webcontainerInstance || !terminalInstance.current) return;

    const trimmedCommand = command.trim();
    
    if (!trimmedCommand) {
      writePrompt();
      return;
    }

    // Add to history
    if (commandHistory.current[commandHistory.current.length - 1] !== trimmedCommand) {
      commandHistory.current.push(trimmedCommand);
    }
    historyIndex.current = -1;

    try {
      setIsRunning(true);

      // Handle built-in commands
      if (trimmedCommand === "clear") {
        terminalInstance.current.clear();
        terminalInstance.current.writeln("🚀 WebContainer Terminal");
        terminalInstance.current.writeln("Type commands to interact with your Node.js environment");
        terminalInstance.current.writeln("");
        writePrompt();
        setIsRunning(false);
        return;
      }

      if (trimmedCommand === "help") {
        terminalInstance.current.writeln("");
        terminalInstance.current.writeln("Available commands:");
        terminalInstance.current.writeln("  ls, dir          - List files and directories");
        terminalInstance.current.writeln("  pwd              - Show current directory");
        terminalInstance.current.writeln("  cat <file>       - Show file contents");
        terminalInstance.current.writeln("  npm install      - Install dependencies");
        terminalInstance.current.writeln("  npm start        - Start development server");
        terminalInstance.current.writeln("  npm run dev      - Start development server");
        terminalInstance.current.writeln("  node <file>      - Run Node.js file");
        terminalInstance.current.writeln("  clear            - Clear terminal");
        terminalInstance.current.writeln("  help             - Show this help");
        terminalInstance.current.writeln("");
        writePrompt();
        setIsRunning(false);
        return;
      }

      if (trimmedCommand === "history") {
        terminalInstance.current.writeln("");
        commandHistory.current.forEach((cmd, index) => {
          terminalInstance.current.writeln(`  ${index + 1}  ${cmd}`);
        });
        terminalInstance.current.writeln("");
        writePrompt();
        setIsRunning(false);
        return;
      }

      // Parse command
      const parts = trimmedCommand.split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);

      // Show command execution
      terminalInstance.current.writeln("");

      // Notify about server commands and show startup message
      if (cmd === 'npm' && (args.includes('start') || args.includes('dev'))) {
        terminalInstance.current.writeln(`> ${trimmedCommand}`);
        terminalInstance.current.writeln("");
        onProcessStart?.(3001); // Default port for dev servers
      }

      // Execute in WebContainer
      const process = await webcontainerInstance.spawn(cmd, args, {
        terminal: {
          cols: terminalInstance.current.cols,
          rows: terminalInstance.current.rows,
        },
      });

      currentProcess.current = process;

      // Handle process output with better formatting
      process.output.pipeTo(new WritableStream({
        write(data) {
          if (terminalInstance.current) {
            // Convert data to string and handle it properly
            const output = typeof data === 'string' ? data : new TextDecoder().decode(data);
            
            // Check for common server startup patterns
            if (output.includes('Server running') || output.includes('localhost:') || output.includes('Local:')) {
              // Highlight server info
              terminalInstance.current.write('\x1b[32m' + output + '\x1b[0m'); // Green
            } else if (output.includes('Error') || output.includes('error')) {
              // Highlight errors
              terminalInstance.current.write('\x1b[31m' + output + '\x1b[0m'); // Red
            } else if (output.includes('Warning') || output.includes('warning')) {
              // Highlight warnings
              terminalInstance.current.write('\x1b[33m' + output + '\x1b[0m'); // Yellow
            } else {
              terminalInstance.current.write(output);
            }
          }
        },
      }));

      // Wait for process to complete
      const exitCode = await process.exit;
      currentProcess.current = null;
      setIsRunning(false);

      // Show exit status
      if (exitCode !== 0) {
        terminalInstance.current.writeln(`\r\n\x1b[31mProcess exited with code ${exitCode}\x1b[0m`);
      }

      // Show new prompt
      writePrompt();

    } catch (error) {
      if (terminalInstance.current) {
        terminalInstance.current.writeln(`\r\n\x1b[31mCommand not found: ${trimmedCommand}\x1b[0m`);
        terminalInstance.current.writeln(`\x1b[33mType 'help' for available commands\x1b[0m`);
      }
      currentProcess.current = null;
      setIsRunning(false);
      writePrompt();
    }
  }, [webcontainerInstance, writePrompt, onProcessStart]);

  const initializeTerminal = useCallback(async () => {
    if (!terminalRef.current || terminalInstance.current || !webcontainerInstance || typeof window === 'undefined') return;

    try {
      console.log("🚀 Initializing terminal...");

      // Dynamic import of xterm modules to avoid SSR issues
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      const { WebLinksAddon } = await import('@xterm/addon-web-links');
      
      // Import CSS dynamically
      await import('@xterm/xterm/css/xterm.css');

      const terminal = new Terminal({
        cursorBlink: true,
        fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        letterSpacing: 0,
        theme: terminalTheme,
        allowTransparency: false,
        convertEol: true,
        scrollback: 1000,
        tabStopWidth: 4,
      });

      // Add addons
      const fitAddonInstance = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      terminal.loadAddon(fitAddonInstance);
      terminal.loadAddon(webLinksAddon);

      terminal.open(terminalRef.current);
      
      // CRITICAL: Make terminal focusable immediately
      terminalRef.current.setAttribute('tabindex', '0');
      
      // Focus the terminal immediately
      terminal.focus();
      
      // Add delay before fitting
      setTimeout(() => {
        try {
          fitAddonInstance.fit();
          terminal.focus(); // Focus again after fit
          
          // Force focus with DOM manipulation
          const terminalElement = terminalRef.current.querySelector('.xterm-screen');
          if (terminalElement) {
            terminalElement.focus();
            console.log('✅ Terminal screen element focused');
          }
          
        } catch (fitError) {
          console.warn("Fit addon error:", fitError);
        }
      }, 100);

      terminalInstance.current = terminal;
      fitAddon.current = fitAddonInstance;

      // Handle input with inline handler
      terminal.onData((data) => {
        console.log('🎯 TERMINAL INPUT DEBUG:', {
          data: data,
          length: data.length,
          charCode: data.charCodeAt(0),
          isRunning: isRunning,
          terminalExists: !!terminalInstance.current,
          currentLine: currentLine.current
        });
        
        if (!terminalInstance.current) {
          console.error('❌ Terminal instance is null!');
          return;
        }

        // Don't block input during running processes - let it through
        if (isRunning && currentProcess.current && currentProcess.current.input) {
          console.log('📤 Forwarding input to running process');
          try {
            const writer = currentProcess.current.input.getWriter();
            writer.write(data).then(() => writer.releaseLock()).catch(console.error);
          } catch (e) {
            console.error('Process input error:', e);
          }
          return;
        }

        // Handle special characters
        switch (data) {
          case '\r': // Enter
          case '\n': // Also handle newline
            console.log('⏎ ENTER pressed, executing command:', currentLine.current);
            terminal.writeln('');
            if (currentLine.current.trim()) {
              executeCommand(currentLine.current);
            } else {
              writePrompt();
            }
            currentLine.current = '';
            cursorPosition.current = 0;
            break;
            
          case '\u007F': // Backspace
          case '\b': // Also handle regular backspace
            if (cursorPosition.current > 0) {
              currentLine.current = 
                currentLine.current.slice(0, cursorPosition.current - 1) + 
                currentLine.current.slice(cursorPosition.current);
              cursorPosition.current--;
              terminal.write('\b \b');
              console.log('⌫ BACKSPACE, new line:', currentLine.current);
            }
            break;
            
          case '\u0003': // Ctrl+C
            console.log('🚫 CTRL+C pressed');
            if (currentProcess.current) {
              try {
                currentProcess.current.kill();
                currentProcess.current = null;
                setIsRunning(false);
              } catch (e) {
                console.error('Kill process error:', e);
              }
            }
            terminal.writeln("^C");
            currentLine.current = '';
            cursorPosition.current = 0;
            writePrompt();
            break;
            
          case '\u001b[A': // Up arrow
            console.log('↑ UP ARROW - command history');
            if (commandHistory.current.length > 0) {
              if (historyIndex.current === -1) {
                historyIndex.current = commandHistory.current.length - 1;
              } else if (historyIndex.current > 0) {
                historyIndex.current--;
              }
              
              const historyCommand = commandHistory.current[historyIndex.current];
              terminal.write('\r$ ' + ' '.repeat(currentLine.current.length) + '\r$ ');
              terminal.write(historyCommand);
              currentLine.current = historyCommand;
              cursorPosition.current = historyCommand.length;
            }
            break;
            
          case '\u001b[B': // Down arrow
            console.log('↓ DOWN ARROW - command history');
            if (historyIndex.current !== -1) {
              if (historyIndex.current < commandHistory.current.length - 1) {
                historyIndex.current++;
                const historyCommand = commandHistory.current[historyIndex.current];
                terminal.write('\r$ ' + ' '.repeat(currentLine.current.length) + '\r$ ');
                terminal.write(historyCommand);
                currentLine.current = historyCommand;
                cursorPosition.current = historyCommand.length;
              } else {
                historyIndex.current = -1;
                terminal.write('\r$ ' + ' '.repeat(currentLine.current.length) + '\r$ ');
                currentLine.current = "";
                cursorPosition.current = 0;
              }
            }
            break;
            
          default:
            // Regular character input - CRITICAL FIX
            if (data.length === 1 && (data >= ' ' || data === '\t')) {
              currentLine.current = 
                currentLine.current.slice(0, cursorPosition.current) + 
                data + 
                currentLine.current.slice(cursorPosition.current);
              cursorPosition.current++;
              terminal.write(data);
              console.log('✏️ TYPED:', data, '| Line now:', currentLine.current);
            } else {
              console.log('🚫 IGNORED character with code:', data.charCodeAt(0), 'length:', data.length);
            }
            break;
        }
      });

      // Welcome message with helpful info
      terminal.writeln("🚀 WebContainer Terminal - Node.js Environment");
      terminal.writeln("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      terminal.writeln("💡 Quick Start:");
      terminal.writeln("   npm install    - Install dependencies");
      terminal.writeln("   npm start      - Start development server");
      terminal.writeln("   ls             - List files");
      terminal.writeln("   help           - Show all commands");
      terminal.writeln("");

      // Start initial shell
      writePrompt();

      // Focus the terminal multiple times to ensure it works
      setTimeout(() => {
        terminal.focus();
        console.log('✅ Terminal focused after timeout');
        
        // Test if the terminal is receiving input by simulating a key press
        setTimeout(() => {
          if (terminalRef.current) {
            terminalRef.current.click();
            terminal.focus();
            console.log('✅ Terminal clicked and focused again');
          }
        }, 100);
      }, 200);

      setIsInitialized(true);
      onReady?.(terminal);

      console.log("✅ Terminal initialized successfully");

    } catch (error) {
      console.error("❌ Failed to initialize terminal:", error);
    }
  }, [webcontainerInstance, writePrompt, onReady]);

  // Initialize terminal when webcontainer is ready - no timeout issues
  useEffect(() => {
    if (webcontainerInstance && !isInitialized && typeof window !== 'undefined') {
      initializeTerminal();
    }
  }, [webcontainerInstance, initializeTerminal, isInitialized]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Execute command API
  const executeCommandAPI = useCallback((cmd) => {
    if (terminalInstance.current && !isRunning) {
      currentLine.current = cmd;
      executeCommand(cmd);
    }
  }, [executeCommand, isRunning]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (currentProcess.current) {
        currentProcess.current.kill();
      }
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
      }
    };
  }, []);

  return (
    <div className={`h-full w-full ${className}`}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full bg-[#0F0F23] rounded-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Initializing Terminal...</p>
          </div>
        </div>
      ) : (
        <div 
          ref={terminalRef} 
          className="h-full w-full bg-[#0F0F23] rounded-md cursor-text"
          style={{ 
            fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
          }}
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Terminal CLICKED - forcing focus');
            
            if (terminalInstance.current) {
              terminalInstance.current.focus();
              
              // Also focus the container
              terminalRef.current.focus();
              
              // Find and focus the xterm textarea
              const textarea = terminalRef.current.querySelector('.xterm-helper-textarea');
              if (textarea) {
                textarea.focus();
                console.log('✅ xterm textarea focused');
              }
              
              // Find and focus the screen
              const screen = terminalRef.current.querySelector('.xterm-screen');
              if (screen) {
                screen.focus();
                console.log('✅ xterm screen focused');
              }
              
              console.log('✅ All terminal focus attempts completed');
            } else {
              console.error('❌ Terminal instance not available for focus');
            }
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            // Ensure focus on mouse down as well
            setTimeout(() => {
              if (terminalInstance.current) {
                terminalInstance.current.focus();
                terminalRef.current.focus();
                console.log('✅ Terminal focused after mouse down');
              }
            }, 0);
          }}
        />
      )}
    </div>
  );
};

export default WebTerminalNew;
