
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartData = [
  { month: "January", users: 186 },
  { month: "February", users: 305 },
  { month: "March", users: 237 },
  { month: "April", users: 173 },
  { month: "May", users: 209 },
  { month: "June", users: 214 },
  { month: "July", users: 250 },
];

const chartConfig = {
  users: {
    label: "Users",
    color: "hsl(var(--primary))",
  },
};

export function UserGrowthChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New users per month (sample data)</CardDescription>
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
