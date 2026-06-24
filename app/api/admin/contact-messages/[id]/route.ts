import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ticket = await prisma.contactMessage.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        message: true,
        ticketCode: true,
        status: true,
        response: true,
        responseAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!ticket) {
      return new NextResponse("Ticket not found", { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[ADMIN_CONTACT_TICKET_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
