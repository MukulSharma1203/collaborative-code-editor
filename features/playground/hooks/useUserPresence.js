"use client";

import { useState, useEffect } from 'react';
import { useRoom } from '../../../lib/liveblocks.config';

export function useUserPresence() {
  const room = useRoom();
  const [userPresence, setUserPresence] = useState(new Map());
  const [usersInFiles, setUsersInFiles] = useState(new Map()); // Map of fileName -> Set of users

  useEffect(() => {
    if (!room) {
      console.log('No room available for user presence');
      return;
    }

    console.log('Setting up user presence tracking...');

    const updatePresence = () => {
      const provider = room.getProvider?.();
      const states = provider?.awareness?.getStates();
      
      if (!states) {
        console.log('No awareness states available yet');
        return;
      }

      const presenceMap = new Map();
      const fileMap = new Map();

      // Process all user states
      states.forEach((state, clientId) => {
        if (state.user) {
          const userData = {
            id: state.user.id,
            name: state.user.name,
            color: state.user.color,
            currentFile: state.user.currentFile,
            cursor: state.cursor,
            joinedAt: state.user.joinedAt
          };
          
          presenceMap.set(clientId, userData);
          
          // Track users per file
          if (state.user.currentFile) {
            if (!fileMap.has(state.user.currentFile)) {
              fileMap.set(state.user.currentFile, new Set());
            }
            fileMap.get(state.user.currentFile).add(userData);
          }
        }
      });

      setUserPresence(presenceMap);
      setUsersInFiles(fileMap);
      
      console.log('User presence updated:', {
        totalUsers: presenceMap.size,
        filesWithUsers: fileMap.size,
        usersInFiles: Object.fromEntries(
          Array.from(fileMap.entries()).map(([file, users]) => [
            file, 
            Array.from(users).map(u => u.name)
          ])
        )
      });
    };

    // Set up awareness listener with a small delay to ensure provider is ready
    const setupAwareness = () => {
      const provider = room.getProvider?.();
      if (provider?.awareness) {
        console.log('Setting up awareness listeners');
        provider.awareness.on('change', updatePresence);
        updatePresence(); // Initial update
        
        return () => {
          provider.awareness.off('change', updatePresence);
        };
      } else {
        console.log('Provider or awareness not ready, retrying...');
        // Retry after a short delay
        setTimeout(setupAwareness, 100);
      }
    };

    // Small delay to ensure room provider is initialized
    const timeoutId = setTimeout(setupAwareness, 200);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [room]);

  const getUsersInFile = (fileName) => {
    return Array.from(usersInFiles.get(fileName) || []);
  };

  const isUserInFile = (fileName) => {
    return usersInFiles.has(fileName) && usersInFiles.get(fileName).size > 0;
  };

  const getUserCount = (fileName) => {
    return usersInFiles.get(fileName)?.size || 0;
  };

  return {
    userPresence,
    usersInFiles,
    getUsersInFile,
    isUserInFile,
    getUserCount,
    totalUsers: userPresence.size
  };
}
