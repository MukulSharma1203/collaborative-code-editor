import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  // Use authEndpoint for Clerk authentication (remove publicApiKey)
  authEndpoint: "/api/liveblocks-auth",
  
  // Handle large messages by using HTTP fallback
  largeMessageStrategy: "http",
  
  // Optional: Add error handling
  errorListener: (error) => {
    console.warn("Liveblocks error:", error);
  },
  
  // Resolve user info from Clerk
  resolveUsers: async ({ userIds }) => {
    // Fetch user info from Clerk API
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to resolve users');
    }
    
    return response.json();
  },

  // Resolve mentions (optional, for future use)
  resolveMentionSuggestions: async ({ text, roomId }) => {
    // This can be implemented later for @mentions
    return [];
  },
});

export const {
  RoomProvider,
  useRoom,
  useSelf,
  useOthers,
  useMyPresence,
  useUpdateMyPresence,
  useBroadcastEvent,
  useEventListener,
} = createRoomContext(client);
