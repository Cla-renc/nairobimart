import PusherServer from "pusher";
import PusherClient from "pusher-js";

// Ensure these environment variables are set in your Vercel project or .env file
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
  useTLS: true,
});

// Create a singleton instance of the client so we don't open multiple WebSocket connections
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = () => {
  if (typeof window === "undefined") return null;
  
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
    });
  }
  return pusherClientInstance;
};
