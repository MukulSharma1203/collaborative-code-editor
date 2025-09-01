"use client";

import { useOthers, useSelf } from '../../../lib/liveblocks.config';
import { Users, Share2 } from 'lucide-react';
import { useMemo, useRef } from 'react';

function Avatar({ name, avatar, isCurrentUser = false }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  
  return (
    <div 
      className={`
        relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
        border-2 border-white shadow-sm overflow-hidden
        ${isCurrentUser ? 'ring-2 ring-purple-500' : ''}
      `}
      title={isCurrentUser ? `${name} (You)` : name}
    >
      {avatar ? (
        <img 
          src={avatar} 
          alt={name} 
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className="w-full h-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center text-white rounded-full"
        style={{ display: avatar ? 'none' : 'flex' }}
      >
        <span>{initials}</span>
      </div>
      {isCurrentUser && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
      )}
    </div>
  );
}

export function UserPresence({ onShare }) {
  const others = useOthers();
  const self = useSelf();
  
  // Create a stable instance ID to avoid key conflicts
  const instanceId = useRef(Math.random().toString(36).substr(2, 9)).current;
  
  // Use useMemo to create stable user list and avoid unnecessary re-renders
  const allUsers = useMemo(() => {
    // Create a Map to deduplicate users by ID
    const userMap = new Map();
    
    // Add self first if exists
    if (self) {
      userMap.set(self.id, {
        id: self.id,
        name: self.info?.name || 'You',
        avatar: self.info?.avatar,
        isCurrentUser: true
      });
    }
    
    // Add others, but avoid duplicates
    others.forEach(user => {
      if (!userMap.has(user.id)) {
        userMap.set(user.id, {
          id: user.id,
          name: user.info?.name || 'Anonymous',
          avatar: user.info?.avatar,
          isCurrentUser: false
        });
      }
    });
    
    // Convert Map to array
    return Array.from(userMap.values());
  }, [self, others]);

  return (
    <div className="flex items-center space-x-3">
      {/* Share Button */}
      <button
        onClick={onShare}
        className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-md transition-all duration-200 text-sm font-medium"
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </button>

      {/* User Count */}
      <div className="flex items-center space-x-1 text-gray-400 text-sm">
        <Users className="h-4 w-4" />
        <span>{allUsers.length}</span>
      </div>

      {/* User Avatars */}
      <div className="flex -space-x-2">
        {allUsers.slice(0, 5).map((user, index) => (
          <Avatar
            key={`presence-${instanceId}-${user.id}-${index}`}
            name={user.name}
            avatar={user.avatar}
            isCurrentUser={user.isCurrentUser}
          />
        ))}
        {allUsers.length > 5 && (
          <div 
            key={`overflow-${instanceId}`}
            className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-medium text-white border-2 border-white"
          >
            +{allUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
