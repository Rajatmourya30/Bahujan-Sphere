
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

const chartData = [
  { device: "Android", users: 68, fill: "var(--color-android)" },
  { device: "iOS", users: 22, fill: "var(--color-ios)" },
  { device: "Desktop", users: 10, fill: "var(--color-desktop)" },
];

const chartConfig = {
  users: {
    label: "Users",
  },
  android: {
    label: "Android",
    color: "hsl(var(--chart-1))",
  },
  ios: {
    label: "iOS",
    color: "hsl(var(--chart-2))",
  },
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-3))",
  },
};

export function DeviceBreakdownChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>Distribution of users by device type</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                <ChartContainer config={chartConfig} className="h-[250px] w-full max-w-[250px]">
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="users"
                            nameKey="device"
                            innerRadius={60}
                        />
                        <ChartLegend content={<ChartLegendContent nameKey="device" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
