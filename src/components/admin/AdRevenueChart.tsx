
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartData = [
  { month: "January", revenue: 32000 },
  { month: "February", revenue: 38000 },
  { month: "March", revenue: 35000 },
  { month: "April", revenue: 41000 },
  { month: "May", revenue: 39000 },
  { month: "June", revenue: 45000 },
  { month: "July", revenue: 42500 },
];

const chartConfig = {
  revenue: {
    label: "Revenue (₹)",
    color: "hsl(var(--chart-3))",
  },
};

export function AdRevenueChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Ad Revenue Over Time</CardTitle>
                <CardDescription>Monthly ad revenue from AdSense</CardDescription>
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
                            tickFormatter={(value) => `₹${value / 1000}k`}
                         />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
