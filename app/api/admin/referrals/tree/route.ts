import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // We want to find the "Network Tree" starting from users who have referred others.
    // Instead of querying all users, we can find users who are the "root" of a referral tree 
    // (they have people they referred, but they weren't referred by anyone themselves).
    // Or we can just get everyone and build the tree.
    // Let's use aggregateRaw with $graphLookup

    const treeData = await prisma.user.aggregateRaw({
      pipeline: [
        // Match users who have referred at least one person to act as root nodes, 
        // or just start from everyone who has a referral code
        {
          $match: {
            referredById: null // Top level referrers
          }
        },
        {
          $graphLookup: {
            from: "User", // The collection name in MongoDB is usually 'User'
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "referredById",
            as: "referralNetwork",
            maxDepth: 3, // Trace up to 3 levels deep
            depthField: "level"
          }
        },
        // Only return users who actually have a network
        {
          $match: {
            "referralNetwork.0": { $exists: true }
          }
        },
        {
          $project: {
            _id: { $toString: "$_id" },
            name: 1,
            email: 1,
            totalSpent: 1,
            referralCode: 1,
            createdAt: 1,
            networkSize: { $size: "$referralNetwork" },
            referralNetwork: {
              $map: {
                input: "$referralNetwork",
                as: "networkUser",
                in: {
                  _id: { $toString: "$$networkUser._id" },
                  name: "$$networkUser.name",
                  email: "$$networkUser.email",
                  level: "$$networkUser.level",
                  totalSpent: "$$networkUser.totalSpent",
                  createdAt: "$$networkUser.createdAt",
                  referredById: { $toString: "$$networkUser.referredById" }
                }
              }
            }
          }
        },
        {
          $sort: { networkSize: -1 } // Sort by largest network first
        }
      ]
    });

    return NextResponse.json({ success: true, data: treeData });
  } catch (error) {
    console.error("Referral Tree Error:", error);
    return NextResponse.json({ success: false, error: "Failed to build referral tree" }, { status: 500 });
  }
}
