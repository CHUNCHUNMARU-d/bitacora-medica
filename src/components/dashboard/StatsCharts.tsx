import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Stats } from "@/hooks/useStats";

export function StatsCharts({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Cirugías por mes
          </CardTitle>
          <CardDescription className="text-xs">Últimos 12 meses</CardDescription>
        </CardHeader>
        <div className="h-52 w-full px-2 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.porMes}>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="0"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="ym"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                  boxShadow: "none",
                }}
                cursor={{ stroke: "var(--border)" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--chart-1)"
                strokeWidth={1.5}
                dot={{ r: 2.5, fill: "var(--chart-1)", strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Procedimientos más frecuentes
          </CardTitle>
          <CardDescription className="text-xs">Top 5</CardDescription>
        </CardHeader>
        <div className="h-52 w-full px-2 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.topProcedimientos}
              layout="vertical"
              margin={{ left: 8 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="0"
                strokeOpacity={0.5}
                horizontal={false}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="procedimiento"
                width={116}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                  boxShadow: "none",
                }}
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              />
              <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
