import { ParticipantLayout } from "@/components/layout";
import { useGetDashboardSummary, useListBingoCards, getGetDashboardSummaryQueryKey, getListBingoCardsQueryKey } from "@workspace/api-client-react";
import { Spinner } from "@/components/ui/spinner";
import { BingoCardGrid } from "@/components/bingo";
import { ReflectionForm } from "@/components/reflection";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Trophy } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: cards, isLoading: isCardsLoading } = useListBingoCards({
    query: { queryKey: getListBingoCardsQueryKey() }
  });

  if (isSummaryLoading || isCardsLoading) {
    return <ParticipantLayout><div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-primary"/></div></ParticipantLayout>;
  }

  const card = cards && cards.length > 0 ? cards[0] : null; // active card
  const progressPercent = summary?.myBoxesTotal ? Math.round(((summary.myBoxesCompleted || 0) / summary.myBoxesTotal) * 100) : 0;

  return (
    <ParticipantLayout>
      <div className="space-y-10 pb-20">
        <section className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Your Journey</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Choose a challenge to reveal. Complete it with intention, and reflect on the impact it had on your day.
          </p>
        </section>

        {summary && summary.myBoxesTotal! > 0 && (
          <Card className="bg-card shadow-sm border-primary/20 overflow-hidden">
            <div className="bg-primary/5 px-6 py-4 flex flex-col md:flex-row items-center gap-4 justify-between border-b border-primary/10">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Progress</span>
              </div>
              <div className="flex-1 w-full flex items-center gap-4">
                <Progress value={progressPercent} className="h-2 flex-1 bg-primary/20" />
                <span className="text-sm font-bold text-primary">{progressPercent}%</span>
              </div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {summary.myBoxesCompleted} of {summary.myBoxesTotal} done
              </div>
            </div>
          </Card>
        )}

        <section>
          {card ? (
             <div className="mb-12">
               <BingoCardGrid card={card as any} />
             </div>
          ) : (
            <Card className="p-12 text-center bg-muted/30 border-dashed">
              <h3 className="text-lg font-medium text-foreground mb-2">No Active Card</h3>
              <p className="text-muted-foreground">Your group leader hasn't assigned you a bingo card yet. Check back later!</p>
            </Card>
          )}
        </section>

        {card && (
          <section>
             <ReflectionForm />
          </section>
        )}

      </div>
    </ParticipantLayout>
  );
}
