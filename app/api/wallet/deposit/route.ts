import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { amount, phone: _phone } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ success: false, message: "Invalid amount" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Simulate M-Pesa STK Push delay and success
        // In a real app, you would call Daraja API here and handle the callback in a separate webhook route
        
        // Let's directly credit the wallet for this simulation
        const transaction = await prisma.walletTransaction.create({
            data: {
                userId: user.id,
                amount: parseFloat(amount),
                type: "DEPOSIT",
                status: "COMPLETED",
                reference: `MPESA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            }
        });

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                walletBalance: {
                    increment: parseFloat(amount)
                }
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: "Deposit successful", 
            balance: updatedUser.walletBalance,
            transaction 
        });

    } catch (error) {
        console.error("Wallet deposit error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
