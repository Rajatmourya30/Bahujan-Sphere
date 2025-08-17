
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

const chartData = [
  { country: "India", amount: 8000, fill: "var(--color-india)" },
  { country: "USA", amount: 1500, fill: "var(--color-usa)" },
  { country: "UK", amount: 850, fill: "var(--color-uk)" },
  { country: "Canada", amount: 500, fill: "var(--color-canada)" },
];

const chartConfig = {
  amount: {
    label: "Amount (₹)",
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

export function TopDonorLocationsChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Donor Locations</CardTitle>
                <CardDescription>Distribution of donation amounts by country</CardDescription>
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
                            dataKey="amount"
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
