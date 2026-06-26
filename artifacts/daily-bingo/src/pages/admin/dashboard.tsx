import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout";
import { Spinner } from "@/components/ui/spinner";
import { Users, Grid3X3, CheckCircle2, BookOpen } from "lucide-react";

export default function AdminDashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner />
        </div>
      </AdminLayout>
    );
  }

  if (!summary) return null;

  const stats = [
    {
      label: "Participants",
      value: summary.totalParticipants ?? 0,
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      accent: "border-l-blue-400",
    },
    {
      label: "Active Cards",
      value: summary.totalCards ?? 0,
      icon: Grid3X3,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      accent: "border-l-purple-400",
    },
    {
      label: "Challenges Done",
      value: summary.totalBoxesCompleted ?? 0,
      sub: `of ${summary.totalBoxesRevealed ?? 0} revealed`,
      icon: CheckCircle2,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      accent: "border-l-green-400",
    },
    {
      label: "Reflections",
      value: summary.totalReflections ?? 0,
      icon: BookOpen,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      accent: "border-l-orange-400",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor engagement and challenge progress across all participants.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`bg-white rounded-2xl border border-border/40 border-l-4 ${s.accent} card-premium p-5 flex flex-col gap-3 transition-all duration-200 card-premium-hover`}
            >
              <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                <s.icon className={`w-4.5 h-4.5 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent reflections */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4">Recent Reflections</h2>
          <div className="space-y-3">
            {summary.recentReflections && summary.recentReflections.length > 0 ? (
              summary.recentReflections.map((ref) => (
                <div
                  key={ref.id}
                  className="bg-white rounded-2xl border border-border/40 card-premium p-5"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {ref.participantName?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{ref.participantName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ref.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {ref.whatIChose && (
                    <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2.5 py-0.5 mb-2.5">
                      {ref.whatIChose}
                    </p>
                  )}
                  <p className="text-sm text-foreground/80 leading-relaxed">{ref.impact}</p>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-border/30 border-dashed py-14 text-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/25 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No reflections yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  They'll appear once participants start writing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
