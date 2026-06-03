import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Wallet, ArrowDownToLine, ArrowUpRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DepositForm from "./DepositForm";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
    const session = await auth();
    if (!session?.user?.email) return null;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            walletTransactions: {
                orderBy: { createdAt: 'desc' },
                take: 20
            }
        }
    });

    if (!user) return null;

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="bg-muted/30 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/account" className="p-2 bg-white rounded-full hover:bg-muted transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-primary flex items-center gap-2">
                            <Wallet className="h-8 w-8 text-accent" /> NairobiMart Wallet
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage your funds and transactions.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Wallet Balance & Deposit */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-none shadow-sm overflow-hidden bg-primary text-white">
                            <CardContent className="p-6">
                                <p className="text-primary-foreground/80 text-sm font-bold uppercase tracking-wider mb-2">Available Balance</p>
                                <h2 className="text-4xl font-extrabold mb-6">KES {user.walletBalance.toLocaleString()}</h2>
                                
                                <DepositForm />
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-sm">Why use the Wallet?</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <p className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-accent" /> Instant One-Click Checkout</p>
                                <p className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-accent" /> Zero Payment Fees</p>
                                <p className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-accent" /> Instant Refunds</p>
                                <p className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-accent" /> Earn Cashback Rewards</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transaction History */}
                    <div className="md:col-span-2">
                        <Card className="border-none shadow-sm h-full">
                            <CardHeader>
                                <CardTitle>Transaction History</CardTitle>
                                <CardDescription>Your recent wallet activities.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {user.walletTransactions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="inline-block p-4 rounded-full bg-muted mb-4">
                                            <Clock className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground">No transactions found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {user.walletTransactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                                        tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                    }`}>
                                                        {tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm capitalize">{tx.type.toLowerCase()}</p>
                                                        <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold text-sm ${tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? 'text-green-600' : 'text-primary'}`}>
                                                        {tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? '+' : '-'}KES {tx.amount.toLocaleString()}
                                                    </p>
                                                    <Badge variant="outline" className="text-[10px] mt-1">{tx.status}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
