
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

const chartData = [
  { placement: "Banner", ctr: 55, fill: "var(--color-banner)" },
  { placement: "Interstitial", ctr: 35, fill: "var(--color-interstitial)" },
  { placement: "Native", ctr: 10, fill: "var(--color-native)" },
];

const chartConfig = {
  ctr: {
    label: "CTR (%)",
  },
  banner: {
    label: "Banner",
    color: "hsl(var(--chart-4))",
  },
  interstitial: {
    label: "Interstitial",
    color: "hsl(var(--chart-5))",
  },
  native: {
    label: "Native",
    color: "hsl(var(--chart-1))",
  },
};

export function TopAdPlacementsChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Ad Placements</CardTitle>
                <CardDescription>Performance of different ad formats</CardDescription>
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
                            dataKey="ctr"
                            nameKey="placement"
                            innerRadius={60}
                        />
                        <ChartLegend content={<ChartLegendContent nameKey="placement" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
