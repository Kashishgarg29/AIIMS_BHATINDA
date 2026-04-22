import { StatsCards } from "./StatsCards";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { AnalyticsTables } from "./AnalyticsTables";

interface AnalyticsDashboardProps {
  data: {
    summary: any;
    trends: any[];
    distribution: any[];
    eventPerformance: any[];
    doctorPerformance: any[];
    statusBreakdown: any[];
  };
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Advanced Analytics</h1>
        <p className="text-slate-500">Real-time health camp performance and clinical insights</p>
      </div>

      <StatsCards summary={data.summary} />

      <AnalyticsCharts
        trends={data.trends}
        distribution={data.distribution}
      />

      <AnalyticsTables
        eventPerformance={data.eventPerformance}
        doctorPerformance={data.doctorPerformance}
        statusBreakdown={data.statusBreakdown}
      />
    </div>
  );
}
