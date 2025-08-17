
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

const chartData = [
  { category: "Apparel", clicks: 45, fill: "var(--color-apparel)" },
  { category: "Books", clicks: 30, fill: "var(--color-books)" },
  { category: "Art", clicks: 15, fill: "var(--color-art)" },
  { category: "Other", clicks: 10, fill: "var(--color-other)" },
];

const chartConfig = {
  clicks: {
    label: "Clicks",
  },
  apparel: {
    label: "Apparel",
    color: "hsl(var(--chart-1))",
  },
  books: {
    label: "Books",
    color: "hsl(var(--chart-2))",
  },
  art: {
    label: "Art",
    color: "hsl(var(--chart-3))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-4))",
  },
};

export function StoreCategoryChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Store Engagement by Category</CardTitle>
                <CardDescription>Distribution of clicks by store category</CardDescription>
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
                            dataKey="clicks"
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
