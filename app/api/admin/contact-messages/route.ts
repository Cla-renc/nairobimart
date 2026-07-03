export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { sendContactTicketResponseEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        ticketCode: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[ADMIN_CONTACT_MESSAGES_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : undefined;
    const response = typeof body.response === "string" ? body.response.trim() : undefined;
    const status = typeof body.status === "string" ? body.status : undefined;

    if (!id || !response || !status) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        response,
        status: status as "pending" | "responded" | "closed",
        responseAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ADMIN_CONTACT_MESSAGES_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
