import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ success: true, zones: [], stations: [] }); }
export async function POST() { return NextResponse.json({ success: true, fee: 500, estimatedDays: "3-5 days" }); }
