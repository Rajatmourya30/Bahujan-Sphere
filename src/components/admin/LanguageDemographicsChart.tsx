
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

const chartData = [
  { language: "English", users: 4, fill: "var(--color-english)" },
  { language: "Hindi", users: 2, fill: "var(--color-hindi)" },
  { language: "Marathi", users: 1, fill: "var(--color-marathi)" },
  { language: "Tamil", users: 1, fill: "var(--color-tamil)" },
];

const chartConfig = {
  users: {
    label: "Users",
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

export function LanguageDemographicsChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Users by Language</CardTitle>
                <CardDescription>Primary language preference of users (sample data)</CardDescription>
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
