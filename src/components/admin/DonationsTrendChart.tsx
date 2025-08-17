
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartData = [
  { month: "January", donations: 1860 },
  { month: "February", donations: 3050 },
  { month: "March", donations: 2370 },
  { month: "April", donations: 1730 },
  { month: "May", donations: 2090 },
  { month: "June", donations: 2140 },
  { month: "July", donations: 1950 },
];

const chartConfig = {
  donations: {
    label: "Donations (₹)",
    color: "hsl(var(--chart-2))",
  },
};

export function DonationsTrendChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Donations Over Time</CardTitle>
                <CardDescription>Donation amounts per month (sample data)</CardDescription>
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
                        <Bar dataKey="donations" fill="var(--color-donations)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
