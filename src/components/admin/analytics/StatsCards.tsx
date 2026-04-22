import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle2, AlertCircle, UserCheck, Activity } from "lucide-react";

interface StatsCardsProps {
  summary: {
    totalCamps: number;
    totalStudents: number;
    completedCheckups: number;
    pendingCheckups: number;
    referredStudents: number;
    normalStudents: number;
  };
}

export function StatsCards({ summary }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Health Camps",
      value: summary.totalCamps,
      icon: Calendar,
      description: "Successfully conducted",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Students Screened",
      value: summary.totalStudents,
      icon: Users,
      description: "Cumulative reach",
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "Completed Checkups",
      value: summary.completedCheckups,
      icon: CheckCircle2,
      description: "Finished assessments",
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Pending Checkups",
      value: summary.pendingCheckups,
      icon: Activity,
      description: "Still in progress",
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Referred Students",
      value: summary.referredStudents,
      icon: AlertCircle,
      description: "Critical cases identified",
      color: "text-rose-600",
      bg: "bg-rose-50"
    },
    {
      title: "Normal Students",
      value: summary.normalStudents,
      icon: UserCheck,
      description: "Healthy assessments",
      color: "text-teal-600",
      bg: "bg-teal-50"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, i) => (
        <Card key={i} className="hover:shadow-lg transition-all duration-300 border-t-4 border-t-emerald-500 border-x-emerald-100/50 border-b-emerald-100/50 bg-white/50 rounded-2xl shadow-sm group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {stat.title}
            </CardTitle>
            <div className={`p-2.5 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-300 shadow-sm border border-emerald-50`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">{stat.value.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${stat.color.replace('text-', 'bg-')}`} />
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                {stat.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
