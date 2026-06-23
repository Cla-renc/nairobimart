import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max out Next.js function duration if not on edge

export async function GET(request: Request) {
  // This route sends Server-Sent Events (SSE) based on MongoDB Change Streams
  
  if (!process.env.DATABASE_URL) {
    return new Response("Missing DATABASE_URL", { status: 500 });
  }

  try {
    // 1. Establish native connection
    const client = new MongoClient(process.env.DATABASE_URL);
    await client.connect();

    // 2. Select Database and Collection
    // Assuming DB name is parsed automatically from connection string, or fallback to 'test'
    const db = client.db();
    const ordersCollection = db.collection("Order");

    // 3. Create Change Stream
    // We only care about update and insert operations
    const changeStream = ordersCollection.watch([
      {
        $match: {
          $or: [
            { operationType: "update" },
            { operationType: "insert" }
          ]
        }
      }
    ]);

    // 4. Setup SSE Readable Stream
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection event
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

        // Listen for changes
        changeStream.on("change", (change) => {
          // Format payload
          const payload = {
            type: "change",
            operation: change.operationType,
            documentKey: change.documentKey,
            updateDescription: change.operationType === "update" ? (change as any).updateDescription : null,
            fullDocument: change.operationType === "insert" ? (change as any).fullDocument : null
          };

          // Send to client
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`));
        });

        // Handle cleanup when client disconnects
        request.signal.addEventListener("abort", () => {
          changeStream.close();
          client.close();
          controller.close();
          console.log("Client disconnected from Change Stream SSE");
        });
      },
      cancel() {
        changeStream.close();
        client.close();
      }
    });

    // 5. Return the stream with SSE headers
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Change Stream SSE Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
