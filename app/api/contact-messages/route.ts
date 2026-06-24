import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { sendContactTicketCreatedEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ success: false, message: "All fields are required." }, { status: 400 });
    }

    const ticketCode = `NM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const session = await auth();
    const userEmail = session?.user?.email;
    const user = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null;

    await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        ticketCode,
        userId: user?.id,
      },
    });

    await sendContactTicketCreatedEmail(email, name, ticketCode, subject);

    return NextResponse.json({ success: true, ticketCode });
  } catch (error) {
    console.error("[CONTACT_MESSAGES_POST]", error);
    return NextResponse.json({ success: false, message: "Unable to create support ticket." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ticketCode = url.searchParams.get("ticketCode")?.trim();

    if (!ticketCode) {
      return NextResponse.json({ success: false, message: "Ticket code is required." }, { status: 400 });
    }

    const ticket = await prisma.contactMessage.findUnique({
      where: { ticketCode },
      select: {
        ticketCode: true,
        status: true,
        response: true,
        subject: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, message: "Ticket not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("[CONTACT_MESSAGES_GET]", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve ticket." }, { status: 500 });
  }
}
