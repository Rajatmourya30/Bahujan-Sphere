
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

const chartData = [
  { language: "English", engagement: 45, fill: "var(--color-english)" },
  { language: "Hindi", engagement: 25, fill: "var(--color-hindi)" },
  { language: "Marathi", engagement: 20, fill: "var(--color-marathi)" },
  { language: "Tamil", engagement: 10, fill: "var(--color-tamil)" },
];

const chartConfig = {
  engagement: {
    label: "Engagement",
  },
  english: {
    label: "English",
    color: "hsl(var(--chart-1))",
  },
  hindi: {
    label: "Hindi",
    color: "hsl(var(--chart-2))",
  },
  marathi: {
    label: "Marathi",
    color: "hsl(var(--chart-3))",
  },
  tamil: {
    label: "Tamil",
    color: "hsl(var(--chart-4))",
  },
};

export function EventEngagementByLanguageChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Event Engagement by Language</CardTitle>
                <CardDescription>Distribution of event views and interactions by language</CardDescription>
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
                            dataKey="engagement"
                            nameKey="language"
                            innerRadius={60}
                        />
                        <ChartLegend content={<ChartLegendContent nameKey="language" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
