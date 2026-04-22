import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnalyticsTablesProps {
  eventPerformance: any[];
  doctorPerformance: any[];
  statusBreakdown: any[];
}

export function AnalyticsTables({ eventPerformance, doctorPerformance, statusBreakdown }: AnalyticsTablesProps) {
  return (
    <div className="space-y-6 mt-8 pb-10">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Performance Table */}
        <Card className="border border-emerald-100 shadow-sm rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Event Performance</CardTitle>
            <CardDescription>Completion rates and student counts across recent health camps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Event Name</th>
                    <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground">Students</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Completion</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {eventPerformance.map((item, i) => (
                    <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-2 align-middle font-medium">{item.name}</td>
                      <td className="p-2 align-middle text-center">{item.totalStudents}</td>
                      <td className="p-2 align-middle text-right">
                        <Badge variant={item.completionPercentage > 80 ? "default" : item.completionPercentage > 50 ? "secondary" : "outline"} className={item.completionPercentage > 80 ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none" : ""}>
                          {item.completionPercentage}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Performance Table */}
        <Card className="border border-emerald-100 shadow-sm rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Doctor Performance</CardTitle>
            <CardDescription>Activity metrics for medical staff across assigned events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Doctor</th>
                    <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground">Handled</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Rate</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {doctorPerformance.map((item, i) => (
                    <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-2 align-middle font-medium">{item.name}</td>
                      <td className="p-2 align-middle text-center">{item.studentsHandled}</td>
                      <td className="p-2 align-middle text-right">
                        <Badge variant="outline" className="border-indigo-100 bg-indigo-50 text-indigo-700">
                          {item.completionRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Status Breakdown Details */}
      <Card className="border border-emerald-100 shadow-sm rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Student Health Breakdown</CardTitle>
          <CardDescription>Aggregated healthy, referred, and pending cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {statusBreakdown.map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-tighter mb-1">{item.category}</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-slate-800">{item.count}</div>
                  <div className="text-sm font-medium text-indigo-600">{item.percentage}%</div>
                </div>
                <div className="w-full bg-slate-200 h-1 mt-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.category.includes('Normal') ? 'bg-emerald-500' :
                      item.category.includes('Referred') ? 'bg-rose-500' :
                        item.category.includes('Observation') ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
