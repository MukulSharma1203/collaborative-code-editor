"use client";

import React from 'react';

/**
 * UserIndicator component to show user presence in file explorer
 */
export function UserIndicator({ users, maxVisible = 3 }) {
  if (!users || users.length === 0) {
    return null;
  }

  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <div className="flex items-center ml-2 space-x-1">
      {visibleUsers.map((user, index) => (
        <div
          key={`user-indicator-${user.id}-${index}`}
          className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
          style={{ 
            backgroundColor: user.color,
            zIndex: visibleUsers.length - index
          }}
          title={user.name}
        />
      ))}
      {remainingCount > 0 && (
        <div 
          key="remaining-count"
          className="w-3 h-3 rounded-full bg-gray-500 border border-white/20 flex items-center justify-center text-[8px] text-white font-bold"
          title={`+${remainingCount} more users`}
        >
          +
        </div>
      )}
    </div>
  );
}

/**
 * Enhanced UserIndicator with hover tooltip
 */
export function EnhancedUserIndicator({ users, maxVisible = 3 }) {
  console.log('EnhancedUserIndicator called with:', { users, maxVisible });
  
  if (!users || users.length === 0) {
    console.log('No users to display');
    return null;
  }

  console.log('Rendering indicators for users:', users.map(u => u.name));

  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <div className="flex items-center ml-2 space-x-1 group">
      {visibleUsers.map((user, index) => (
        <div
          key={`enhanced-user-indicator-${user.id}-${index}`}
          className="relative"
        >
          <div
            className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
            style={{ 
              backgroundColor: user.color,
              zIndex: visibleUsers.length - index
            }}
          />
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            {user.name}
          </div>
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="relative">
          <div 
            className="w-3 h-3 rounded-full bg-gray-500 border border-white/20 flex items-center justify-center text-[8px] text-white font-bold cursor-pointer hover:scale-110 transition-transform"
          >
            +
          </div>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            +{remainingCount} more: {users.slice(maxVisible).map(u => u.name).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
