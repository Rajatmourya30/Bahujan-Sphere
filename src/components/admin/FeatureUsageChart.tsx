
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

const chartData = [
  { feature: "Calendar", usage: 55, fill: "var(--color-calendar)" },
  { feature: "Knowledge Hub", usage: 25, fill: "var(--color-knowledge)" },
  { feature: "Store", usage: 15, fill: "var(--color-store)" },
  { feature: "Donations", usage: 5, fill: "var(--color-donations)" },
];

const chartConfig = {
  usage: {
    label: "Usage",
  },
  calendar: {
    label: "Calendar",
    color: "hsl(var(--chart-1))",
  },
  knowledge: {
    label: "Knowledge Hub",
    color: "hsl(var(--chart-2))",
  },
  store: {
    label: "Store",
    color: "hsl(var(--chart-3))",
  },
  donations: {
    label: "Donations",
    color: "hsl(var(--chart-4))",
  },
};

export function FeatureUsageChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Feature Usage Split</CardTitle>
                <CardDescription>Distribution of user engagement by feature</CardDescription>
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
                            dataKey="usage"
                            nameKey="feature"
                            innerRadius={60}
                        />
                        <ChartLegend content={<ChartLegendContent nameKey="feature" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
