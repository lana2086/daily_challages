import { AdminLayout } from "@/components/layout";
import { useListReflections, getListReflectionsQueryKey } from "@workspace/api-client-react";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminReflections() {
  const { data: reflections, isLoading } = useListReflections({
    query: { queryKey: getListReflectionsQueryKey() }
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Reflections</h1>
          <p className="text-muted-foreground mt-1">Read participants' thoughts and insights.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="space-y-6">
            {reflections?.map((ref) => (
              <Card key={ref.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium">{ref.participantName}</CardTitle>
                    <span className="text-sm text-muted-foreground">{new Date(ref.date).toLocaleDateString()}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">The Challenge</h4>
                    <p className="text-sm italic border-l-2 pl-3 py-1 bg-muted/30">{ref.whatIChose}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">What they did</h4>
                      <p className="text-sm">{ref.whatIDid}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Impact</h4>
                      <p className="text-sm">{ref.impact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {reflections?.length === 0 && (
              <div className="text-center py-12 bg-card border rounded-md text-muted-foreground">
                No reflections have been submitted yet.
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
