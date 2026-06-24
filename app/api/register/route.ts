import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { addLoyaltyPoints } from "@/lib/loyalty";

const generateReferralCode = () => {
    return `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

export async function POST(req: Request) {
    try {
        const { name, email, phone, password, referralCode } = await req.json();

        // Normalize email
        const normalizedEmail = email?.toLowerCase().trim() ?? "";

        if (!normalizedEmail || !password || !name) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        let referrer = null;
        let referredById: string | undefined;
        if (referralCode) {
            referrer = await prisma.user.findFirst({
                where: { 
                    referralCode: {
                        equals: referralCode.trim(),
                        mode: 'insensitive'
                    }
                },
            });
            if (referrer) {
                referredById = referrer.id;
            }
        }

        let generatedReferralCode = generateReferralCode();
        const existingReferral = await prisma.user.findUnique({
            where: { referralCode: generatedReferralCode },
        });
        if (existingReferral) {
            generatedReferralCode = `${generatedReferralCode}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        }

        const user = await prisma.user.create({
            data: {
                name,
                email: normalizedEmail,
                phone,
                passwordHash,
                referralCode: generatedReferralCode,
                referredById,
            },
        });

        if (referrer) {
            try {
                await addLoyaltyPoints(referrer.id, 100, "referral", undefined, `Referred ${normalizedEmail}`);
            } catch (e) {
                console.error("Failed to award referral points:", e);
                // Fallback to direct increment if helper fails for any reason
                await prisma.user.update({
                    where: { id: referrer.id },
                    data: { loyaltyPoints: { increment: 100 } },
                });
            }
        }

        // Generate Welcome Coupon
        try {
            const { createWelcomeCoupon } = await import("@/lib/coupons");
            const { sendMarketingEmail } = await import("@/lib/email");

            const welcomeCoupon = await createWelcomeCoupon(user.id, 10, 30);
            await sendMarketingEmail(
                user.email,
                "Welcome to NairobiMart! Here is 10% off your first order",
                `<h1>Welcome to NairobiMart, ${user.name}!</h1><p>We are thrilled to have you.</p><p>Use coupon code <strong>${welcomeCoupon.code}</strong> to get 10% off your first purchase.</p><p>This code expires in 30 days.</p>`
            );
        } catch (couponError) {
            console.error("Failed to generate welcome coupon:", couponError);
            // Non-fatal, allow registration to succeed
        }

        console.log("Registration Successful for:", { id: user.id, email: user.email, name: user.name });

        return NextResponse.json(
            { message: "User created successfully", user: { id: user.id, email: user.email } },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
