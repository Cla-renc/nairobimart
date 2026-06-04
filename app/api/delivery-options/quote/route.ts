import { NextResponse } from "next/server";
import { getMotorspeedQuote } from "@/lib/motorspeed";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { country, county, city, weightKg } = body;

        if (!country || !county || !city) {
            return NextResponse.json({ success: false, message: "Missing required location data" }, { status: 400 });
        }

        const quote = await getMotorspeedQuote({ country, county, city, weightKg });

        if (!quote.success) {
            return NextResponse.json({ success: false, message: quote.message || "Failed to calculate rate" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            fee: quote.fee,
            estimatedDays: quote.estimatedDays
        });

    } catch (error) {
        console.error("Courier Quote API Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
