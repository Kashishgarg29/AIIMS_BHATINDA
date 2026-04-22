"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface TrendsData {
  name: string;
  camps: number;
  students: number;
  completed: number;
  pending: number;
}

interface DistributionData {
  name: string;
  value: number;
}

interface AnalyticsChartsProps {
  trends: TrendsData[];
  distribution: DistributionData[];
}

export function AnalyticsCharts({ trends, distribution }: AnalyticsChartsProps) {
  const COLORS = ["#10b981", "#f43f5e", "#f59e0b"]; // Emerald, Rose, Amber

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-8">
      {/* Monthly Trends - Line Chart */}
      <Card className="lg:col-span-4 border border-emerald-100 shadow-sm h-[450px] rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Monthly Performance Trends</CardTitle>
          <CardDescription>Visualizing camp frequency and student screening progress</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="students"
                name="Students Screened"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="Completed Checkups"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="camps"
                name="Camps Conducted"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Health Distribution - Donut Chart */}
      <Card className="lg:col-span-3 border border-emerald-100 shadow-sm h-[450px] rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Health Status Distribution</CardTitle>
          <CardDescription>Breakdown of clinical outcomes across all screened students</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
