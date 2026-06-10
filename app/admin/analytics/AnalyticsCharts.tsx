"use client";

import { useEffect, useState } from "react";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar
} from "recharts";
import { Loader2 } from "lucide-react";

export default function AnalyticsCharts() {
    const [data, setData] = useState<{
        revenueData: { date: string; revenue: number }[];
        topProducts: { name: string; sales: number }[];
        abandonmentRate: number;
        conversionRate: number;
        lowStockProducts: { id: string; name: string; stock: number; slug: string }[];
    } | null>(null);

    useEffect(() => {
        fetch("/api/admin/analytics")
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setData({
                        revenueData: res.revenueData,
                        topProducts: res.topProducts,
                        abandonmentRate: res.abandonmentRate,
                        conversionRate: res.conversionRate,
                        lowStockProducts: res.lowStockProducts || []
                    });
                }
            })
            .catch(console.error);
    }, []);

    if (!data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            {/* Inject Abandonment Rate into a floating card or pass it up? 
                For simplicity, we'll just display the two charts here. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-primary">Revenue Forecast (Past 7 Days)</h3>
                            <p className="text-sm text-muted-foreground">Daily total revenue across all orders.</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `KES ${val}`} dx={-10} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Revenue']}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-primary">Top Selling Products</h3>
                            <p className="text-sm text-muted-foreground">Most purchased items by quantity.</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topProducts} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} width={120} />
                            <Tooltip 
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm mt-6 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-red-600">Cart Abandonment Rate</h3>
                    <p className="text-sm text-red-600/80">Percentage of carts that were not checked out.</p>
                </div>
                <div className="text-3xl font-black text-red-600">
                    {data.abandonmentRate}%
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Real Conversion Rate */}
                <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-green-700">Conversion Rate (30 Days)</h3>
                        <p className="text-sm text-green-600/80">Registered users who placed an order.</p>
                    </div>
                    <div className="text-3xl font-black text-green-700">
                        {data.conversionRate}%
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm">
                    <h3 className="font-bold text-orange-700 mb-3">⚠️ Low Stock Alert</h3>
                    {data.lowStockProducts.length === 0 ? (
                        <p className="text-sm text-green-700 font-medium">✅ All products are well-stocked!</p>
                    ) : (
                        <ul className="space-y-2">
                            {data.lowStockProducts.map(p => (
                                <li key={p.id} className="flex justify-between items-center text-sm">
                                    <a href={`/admin/products/${p.id}`} className="font-medium text-primary hover:underline truncate max-w-[200px]">{p.name}</a>
                                    <span className={`font-black px-2 py-0.5 rounded-full text-xs ${
                                        p.stock === 0 ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                                    }`}>{p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} left`}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}
