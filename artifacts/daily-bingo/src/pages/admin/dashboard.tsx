import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Grid, CheckCircle, BookOpen } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function AdminDashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64"><Spinner /></div>
      </AdminLayout>
    );
  }

  if (!summary) return null;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor engagement and challenge progress across all participants.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalParticipants || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
              <Grid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalCards || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Challenges Done</CardTitle>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalBoxesCompleted || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                out of {summary.totalBoxesRevealed || 0} revealed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reflections</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalReflections || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-serif font-semibold mb-4">Recent Reflections</h2>
          <div className="space-y-4">
            {summary.recentReflections && summary.recentReflections.length > 0 ? (
              summary.recentReflections.map(ref => (
                <Card key={ref.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-primary">{ref.participantName}</span>
                      <span className="text-xs text-muted-foreground">{new Date(ref.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm italic text-muted-foreground mb-2">"{ref.whatIChose}"</p>
                    <p className="text-sm">{ref.impact}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">No recent reflections.</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
