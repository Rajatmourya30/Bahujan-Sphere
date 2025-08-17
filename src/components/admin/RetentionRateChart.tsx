
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartData = [
  { day: "Day 1", retention: 65.5 },
  { day: "Day 7", retention: 42.5 },
  { day: "Day 14", retention: 30.2 },
  { day: "Day 30", retention: 22.8 },
  { day: "Day 60", retention: 18.1 },
  { day: "Day 90", retention: 15.6 },
];

const chartConfig = {
  retention: {
    label: "Retention",
    color: "hsl(var(--chart-1))",
  },
};

export function RetentionRateChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>User Retention Rate</CardTitle>
                <CardDescription>Percentage of users returning over time</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            tickFormatter={(value) => `${value}%`}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                        />
                        <Line
                            dataKey="retention"
                            type="monotone"
                            stroke="var(--color-retention)"
                            strokeWidth={2}
                            dot={true}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
