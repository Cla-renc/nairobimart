import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const generateReferralCode = () => {
    return `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

export async function POST(req: Request) {
    try {
        const { name, email, phone, password, referralCode } = await req.json();

        if (!email || !password || !name) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
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
                email,
                phone,
                passwordHash,
                referralCode: generatedReferralCode,
                referredById,
            },
        });

        if (referrer) {
            await prisma.user.update({
                where: { id: referrer.id },
                data: {
                    loyaltyPoints: { increment: 100 },
                },
            });
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
