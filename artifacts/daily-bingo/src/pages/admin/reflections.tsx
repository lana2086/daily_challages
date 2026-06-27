import { AdminLayout } from "@/components/layout";
import { useListReflections, getListReflectionsQueryKey } from "@/api";
import { Spinner } from "@/components/ui/spinner";
import { BookOpen } from "lucide-react";

export default function AdminReflections() {
  const { data: reflections, isLoading } = useListReflections({
    query: { queryKey: getListReflectionsQueryKey() },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reflections</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Read what participants are experiencing on their journey.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : reflections && reflections.length > 0 ? (
          <div className="space-y-4">
            {reflections.map((ref) => (
              <div
                key={ref.id}
                className="bg-white rounded-2xl border border-border/40 card-premium overflow-hidden"
              >
                {/* Header strip */}
                <div className="px-5 py-3.5 bg-secondary/40 border-b border-border/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {ref.participantName?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{ref.participantName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {new Date(ref.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Challenge */}
                  {ref.whatIChose && (
                    <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">
                        Challenge
                      </p>
                      <p className="text-sm italic text-foreground/80 leading-relaxed">{ref.whatIChose}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        What they did
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">{ref.whatIDid}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Impact
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">{ref.impact}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border/30 border-dashed py-16 text-center card-premium">
            <BookOpen className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No reflections yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-xs mx-auto">
              Reflections will appear here once participants complete their daily challenges.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
