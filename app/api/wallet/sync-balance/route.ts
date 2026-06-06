import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * POST /api/wallet/sync-balance
 * Recalculates the user's walletBalance from their completed WalletTransaction
 * records and updates the User document.
 *
 * This is needed when the walletBalance field gets out of sync with the actual
 * transaction history (e.g. after a schema migration that reset the field to 0).
 */
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                walletTransactions: {
                    where: { status: "COMPLETED" }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Recalculate correct balance:
        // Credits: DEPOSIT + REFUND + CASHBACK
        // Debits:  PAYMENT
        const correctBalance = user.walletTransactions.reduce((acc, tx) => {
            if (tx.type === "DEPOSIT" || tx.type === "REFUND" || tx.type === "CASHBACK") {
                return acc + tx.amount;
            } else if (tx.type === "PAYMENT") {
                return acc - tx.amount;
            }
            return acc;
        }, 0);

        const safeBalance = Math.max(0, correctBalance); // never go negative

        // Update the User record with the correct balance
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { walletBalance: safeBalance }
        });

        console.log(`✅ Wallet balance synced for ${user.email}: KES ${user.walletBalance} → KES ${safeBalance}`);

        return NextResponse.json({
            success: true,
            message: "Wallet balance synced successfully",
            previousBalance: user.walletBalance,
            newBalance: updatedUser.walletBalance,
            transactionsProcessed: user.walletTransactions.length
        });

    } catch (error) {
        console.error("Wallet sync error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
