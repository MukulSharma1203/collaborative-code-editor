import { currentUser } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

export async function POST(request) {
  try {
    // Get the current user from Clerk
    const user = await currentUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get room from request body
    const { room } = await request.json();

    // Prepare user info for Liveblocks
    const userInfo = {
      name: user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || "Anonymous",
      avatar: user.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName || 'User'}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`, // Random color
    };

    // Create a session for the current user
    const session = liveblocks.prepareSession(user.id, {
      userInfo,
    });

    // Give the user access to the room
    if (room) {
      session.allow(room, session.FULL_ACCESS);
    }

    // Authorize the user and return the result
    const { status, body } = await session.authorize();
    return new Response(body, { status });

  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
