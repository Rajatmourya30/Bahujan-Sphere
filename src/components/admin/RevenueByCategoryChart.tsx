
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

const chartData = [
  { category: "Calendar", revenue: 60, fill: "var(--color-calendar)" },
  { category: "Knowledge Hub", revenue: 25, fill: "var(--color-knowledge)" },
  { category: "Store", revenue: 15, fill: "var(--color-store)" },
];

const chartConfig = {
  revenue: {
    label: "Revenue (%)",
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
};

export function RevenueByCategoryChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Breakdown of ad revenue by app feature</CardDescription>
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
                            dataKey="revenue"
                            nameKey="category"
                            innerRadius={60}
                        />
                        <ChartLegend content={<ChartLegendContent nameKey="category" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
