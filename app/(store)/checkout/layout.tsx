import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/checkout");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { phone: true }
    });

    if (!user?.phone) {
        redirect("/account/complete-profile");
    }

    return <>{children}</>;
}
