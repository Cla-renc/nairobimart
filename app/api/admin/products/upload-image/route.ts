import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadImage } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { file } = body;

        if (!file || typeof file !== "string") {
            return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
        }

        const uploadResult = await uploadImage(file, "products");

        if (!uploadResult.success) {
            return NextResponse.json({ success: false, message: "Image upload failed" }, { status: 500 });
        }

        return NextResponse.json({ success: true, url: uploadResult.url, publicId: uploadResult.publicId });
    } catch (error) {
        console.error("Product image upload error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
