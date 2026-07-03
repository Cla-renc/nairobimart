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

        // Generate and send Welcome Coupon via Email + SMS + WhatsApp
        try {
            const { createWelcomeCoupon } = await import("@/lib/coupons");
            const { sendMarketingEmail } = await import("@/lib/email");
            const { sendSMS } = await import("@/lib/sms");

            const welcomeCoupon = await createWelcomeCoupon(user.id, 10, 30);
            const couponCode = welcomeCoupon.code;
            const userName = user.name || "there";

            // 1. EMAIL
            await sendMarketingEmail(
                user.email,
                "Welcome to NairobiMart! Here is 10% off your first order 🎉",
                `<h2>Welcome to NairobiMart, ${userName}! 🎉</h2>
                <p>We are thrilled to have you as part of our family.</p>
                <p>As a special welcome gift, here is a <strong>10% discount</strong> on your very first order:</p>
                <div style="text-align:center; margin: 24px 0;">
                  <span style="background:#F4A522; color:#0D1B2A; font-size:24px; font-weight:bold; padding:12px 28px; border-radius:8px; letter-spacing:2px;">${couponCode}</span>
                </div>
                <p>Simply enter this code at checkout. This code expires in <strong>30 days</strong> and is valid for a single use.</p>
                <p><a href="${process.env.NEXT_PUBLIC_URL || 'https://nairobimart-gwna.vercel.app'}/products" style="background:#0D1B2A; color:#F4A522; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Start Shopping →</a></p>`
            );

            // 2. SMS via TalkSasa (if phone provided) - NO EMOJIS to avoid Unicode rejection
            if (user.phone) {
                const smsMsg = `Welcome to NairobiMart, ${userName}! Use code ${couponCode} for 10% OFF your first order. Valid for 30 days. Shop: ${process.env.NEXT_PUBLIC_URL || 'https://nairobimart-gwna.vercel.app'}`;
                await sendSMS(user.phone, smsMsg);
            }

            // 3. WhatsApp (if phone provided and bot server is configured)
            if (user.phone && process.env.BOT_SERVER_URL) {
                const waPhone = user.phone.replace(/\D/g, '').replace(/^0/, '254');
                const waMsg = `🎉 *Welcome to NairobiMart, ${userName}!*\n\nWe're excited to have you on board! As a special welcome gift, here's *10% OFF* your first order:\n\n🏷️ *Coupon Code:* \`${couponCode}\`\n\nJust enter this code at checkout. Expires in 30 days (single use).\n\n👉 Shop now: ${process.env.NEXT_PUBLIC_URL || 'https://nairobimart-gwna.vercel.app'}/products\n\nHappy Shopping! 🛒✨`;
                await fetch(`${process.env.BOT_SERVER_URL}/api/send-message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: waPhone, message: waMsg }),
                }).catch(e => console.error("WhatsApp welcome send failed:", e));
            }

        } catch (couponError) {
            console.error("Failed to generate/send welcome coupon:", couponError);
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
