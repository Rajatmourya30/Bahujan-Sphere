
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getDonationsData, type DonationData } from '@/lib/admin-analytics';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  donations: {
    label: "Donations (₹)",
    color: "hsl(var(--chart-2))",
  },
};

export function DonationsTrendChart() {
    const [chartData, setChartData] = useState<DonationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const data = await getDonationsData();
                setChartData(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching donations data:', err);
                setError('Failed to load donations data');
                // Fallback to empty data on error
                setChartData([
                    { month: "January", donations: 0 },
                    { month: "February", donations: 0 },
                    { month: "March", donations: 0 },
                    { month: "April", donations: 0 },
                    { month: "May", donations: 0 },
                    { month: "June", donations: 0 },
                    { month: "July", donations: 0 },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Donations Over Time</CardTitle>
                    <CardDescription>Donation amounts per month</CardDescription>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Donations Over Time</CardTitle>
                <CardDescription>
                    {error ? 'Failed to load data' : 'Donation amounts per month (live data)'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                         <YAxis 
                            tickFormatter={(value) => value > 1000 ? `₹${(value / 1000).toFixed(1)}k` : `₹${value}`}
                         />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="donations" fill="var(--color-donations)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
