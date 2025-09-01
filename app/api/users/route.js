import { clerkClient } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds)) {
      return Response.json([]);
    }

    // Fetch user information from Clerk
    const users = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await clerkClient.users.getUser(userId);
          return {
            id: user.id,
            name: user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || "Anonymous",
            avatar: user.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName || 'User'}`,
          };
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          return {
            id: userId,
            name: "Unknown User",
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Unknown`,
          };
        }
      })
    );

    return Response.json(users);
  } catch (error) {
    console.error("Users API error:", error);
    return Response.json([], { status: 500 });
  }
}
