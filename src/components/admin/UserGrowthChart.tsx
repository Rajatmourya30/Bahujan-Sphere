
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getUserGrowthData, type UserGrowthData } from '@/lib/admin-analytics';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  users: {
    label: "Users",
    color: "hsl(var(--primary))",
  },
};

export function UserGrowthChart() {
    const [chartData, setChartData] = useState<UserGrowthData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const data = await getUserGrowthData();
                setChartData(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching user growth data:', err);
                setError('Failed to load user growth data');
                // Fallback to sample data on error
                setChartData([
                    { month: "January", users: 0 },
                    { month: "February", users: 0 },
                    { month: "March", users: 0 },
                    { month: "April", users: 0 },
                    { month: "May", users: 0 },
                    { month: "June", users: 0 },
                    { month: "July", users: 0 },
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
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New users per month</CardDescription>
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
                <CardTitle>User Growth</CardTitle>
                <CardDescription>
                    {error ? 'Failed to load data' : 'New users per month (live data)'}
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
                         <YAxis />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
export default UserGrowthChart;
