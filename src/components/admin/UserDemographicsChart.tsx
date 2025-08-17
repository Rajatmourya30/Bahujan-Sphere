
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

const chartData = [
  { country: "India", users: 4, fill: "var(--color-india)" },
  { country: "USA", users: 1, fill: "var(--color-usa)" },
  { country: "UK", users: 1, fill: "var(--color-uk)" },
  { country: "Canada", users: 1, fill: "var(--color-canada)" },
];

const chartConfig = {
  users: {
    label: "Users",
  },
  india: {
    label: "India",
    color: "hsl(var(--chart-1))",
  },
  usa: {
    label: "USA",
    color: "hsl(var(--chart-2))",
  },
  uk: {
    label: "UK",
    color: "hsl(var(--chart-3))",
  },
  canada: {
    label: "Canada",
    color: "hsl(var(--chart-4))",
  },
};

export function UserDemographicsChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Users by Country</CardTitle>
                <CardDescription>Distribution of users across countries (sample data)</CardDescription>
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
                            nameKey="country"
                            innerRadius={60}
                        />
                        <ChartLegend content={<ChartLegendContent nameKey="country" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
export default UserDemographicsChart;
