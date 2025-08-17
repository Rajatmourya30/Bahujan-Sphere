
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

const chartData = [
  { language: "English", engagement: 50, fill: "var(--color-english)" },
  { language: "Hindi", engagement: 30, fill: "var(--color-hindi)" },
  { language: "Marathi", engagement: 15, fill: "var(--color-marathi)" },
  { language: "Other", engagement: 5, fill: "var(--color-other)" },
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
  other: {
    label: "Other",
    color: "hsl(var(--chart-4))",
  },
};

export function KnowledgeHubEngagementChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Engagement by Language</CardTitle>
                <CardDescription>Distribution of views by user language</CardDescription>
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

    