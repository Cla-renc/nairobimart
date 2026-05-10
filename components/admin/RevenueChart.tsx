"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ChartData {
    name: string;
    revenue: number;
}

interface RevenueChartProps {
    data: ChartData[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
    return (
        <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Daily revenue performance for the current week.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <div className="w-full h-full min-w-0 min-h-0">
                    <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `KSh ${val / 1000}k`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            cursor={{ stroke: '#f59e0b', strokeWidth: 2 }}
                            formatter={(value: string | number | readonly (string | number)[] | undefined) => [`KES ${Number(value ?? 0).toLocaleString()}`, "Revenue"]}
                        />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
