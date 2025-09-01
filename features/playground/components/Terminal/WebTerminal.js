"use client";

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { createShell, runCommand } from '../../../../lib/webcontainer';

// Import xterm CSS
import '@xterm/xterm/css/xterm.css';

export function WebTerminal({ onOutput, className = '', onReady }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const shellProcessRef = useRef(null);
  const fitAddonRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Update the ref when onReady changes
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // Expose executeCommand function to parent - only call once when ready
  useEffect(() => {
    if (isReady && onReadyRef.current) {
      onReadyRef.current({
        executeCommand: (command) => executeCommand(command),
        clearTerminal: () => clearTerminal()
      });
    }
  }, [isReady]); // Only depend on isReady

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Initialize xterm.js terminal
    const terminal = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      },
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    
    try {
      terminal.open(terminalRef.current);
      
      // Wait for DOM to be ready before fitting
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (fitError) {
          console.warn('Terminal fit failed:', fitError);
        }
      }, 100);

      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Initialize WebContainer shell after a brief delay
      setTimeout(() => {
        initializeShell();
      }, 200);

    } catch (error) {
      console.error('Error opening terminal:', error);
      // Still set references for cleanup
      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;
    }

    // Handle window resize
    const handleResize = () => {
      try {
        if (fitAddonRef.current && xtermRef.current) {
          fitAddonRef.current.fit();
        }
      } catch (error) {
        console.warn('Resize fit failed:', error);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (shellProcessRef.current) {
        try {
          shellProcessRef.current.kill();
        } catch (error) {
          console.warn('Error killing shell process:', error);
        }
      }
      if (xtermRef.current) {
        try {
          xtermRef.current.dispose();
        } catch (error) {
          console.warn('Error disposing terminal:', error);
        }
      }
    };
  }, []);

  const initializeShell = async () => {
    try {
      setIsConnecting(true);
      const terminal = xtermRef.current;
      
      if (!terminal) {
        console.error('Terminal not ready');
        setIsConnecting(false);
        return;
      }

      terminal.clear();
      terminal.writeln('\x1b[36m🚀 Initializing WebContainer...\x1b[0m');
      terminal.writeln('\x1b[33mPlease wait while we set up your environment...\x1b[0m');
      
      // Create shell process
      const shellProcess = await createShell();
      shellProcessRef.current = shellProcess;

      // Handle shell output with better streaming
      const reader = shellProcess.output.getReader();
      
      const readOutput = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Write output to terminal
            terminal.write(value);
            onOutput?.(value);
          }
        } catch (error) {
          console.error('Error reading shell output:', error);
        }
      };
      
      // Start reading output
      readOutput();

      // Handle user input
      terminal.onData((data) => {
        if (shellProcess && shellProcess.input) {
          const writer = shellProcess.input.getWriter();
          writer.write(data).then(() => writer.releaseLock()).catch(console.error);
        }
      });

      // Give the shell a moment to initialize, then show welcome message
      setTimeout(() => {
        terminal.writeln('\n\x1b[32m✅ WebContainer ready!\x1b[0m');
        terminal.writeln('\x1b[36mYou can now run commands:\x1b[0m');
        terminal.writeln('\x1b[90m  • ls - list files\x1b[0m');
        terminal.writeln('\x1b[90m  • node index.js - run JavaScript files\x1b[0m');
        terminal.writeln('\x1b[90m  • npm install <package> - install packages\x1b[0m');
        terminal.writeln('\x1b[90m  • npm start - start your application\x1b[0m');
        terminal.writeln('');
        terminal.write('\x1b[32m$ \x1b[0m'); // Show prompt
        
        setIsReady(true);
        setIsConnecting(false);
      }, 1500);

    } catch (error) {
      console.error('Failed to initialize shell:', error);
      if (xtermRef.current) {
        xtermRef.current.writeln('\x1b[31m❌ Failed to initialize WebContainer\x1b[0m');
        xtermRef.current.writeln('\x1b[31mError: ' + error.message + '\x1b[0m');
        xtermRef.current.writeln('\x1b[33mPlease refresh the page and try again.\x1b[0m');
      }
      setIsConnecting(false);
    }
  };

  const executeCommand = async (command) => {
    try {
      const terminal = xtermRef.current;
      if (!terminal) return;

      terminal.writeln(`$ ${command}`);
      
      // Parse command and arguments
      const parts = command.trim().split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);

      // Run command in WebContainer
      const process = await runCommand(cmd, args);
      
      // Stream output to terminal
      process.output.pipeTo(new WritableStream({
        write(data) {
          terminal.write(data);
          onOutput?.(data);
        }
      }));

      // Wait for process to complete
      const exitCode = await process.exit;
      terminal.writeln(`\nProcess exited with code: ${exitCode}`);
      
    } catch (error) {
      console.error('Command execution failed:', error);
      if (xtermRef.current) {
        xtermRef.current.writeln(`Error: ${error.message}`);
      }
    }
  };

  const clearTerminal = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  };

  const focus = () => {
    if (xtermRef.current) {
      xtermRef.current.focus();
    }
  };

  return (
    <div className={`w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-300 ml-2">
            WebContainer Terminal
            {isConnecting && (
              <span className="ml-2 text-blue-400">Connecting...</span>
            )}
            {isReady && (
              <span className="ml-2 text-green-400">Ready</span>
            )}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearTerminal}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
          >
            Clear
          </button>
          <button
            onClick={focus}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            Focus
          </button>
        </div>
      </div>

      {/* Terminal Container */}
      <div 
        ref={terminalRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}

export default WebTerminal;
