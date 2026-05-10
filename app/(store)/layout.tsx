import { auth } from "@/auth";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";

export default async function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar user={session?.user} />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
