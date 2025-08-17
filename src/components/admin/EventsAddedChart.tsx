
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartData = [
  { month: "January", events: 5 },
  { month: "February", events: 8 },
  { month: "March", events: 12 },
  { month: "April", events: 7 },
  { month: "May", events: 15 },
  { month: "June", events: 10 },
  { month: "July", events: 18 },
];

const chartConfig = {
  events: {
    label: "Events",
    color: "hsl(var(--chart-1))",
  },
};

export function EventsAddedChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Events Added Per Month</CardTitle>
                <CardDescription>Number of new events added to the calendar</CardDescription>
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
                        <Bar dataKey="events" fill="var(--color-events)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
