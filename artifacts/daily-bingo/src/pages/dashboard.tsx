import { ParticipantLayout } from "@/components/layout";
import {
  useListBingoCards,
  useGetBingoCard,
  getListBingoCardsQueryKey,
  getGetBingoCardQueryKey,
} from "@workspace/api-client-react";
import { Spinner } from "@/components/ui/spinner";
import { BingoCardGrid } from "@/components/bingo";
import { ReflectionForm } from "@/components/reflection";
import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";

export default function Dashboard() {
  // Step 1: get the card list to find the active card's ID
  const { data: cards, isLoading: isCardsLoading } = useListBingoCards({
    query: { queryKey: getListBingoCardsQueryKey() }
  });

  const cardId = cards && cards.length > 0 ? cards[0].id : null;

  // Step 2: load the full card WITH boxes
  const { data: cardWithBoxes, isLoading: isBoxesLoading } = useGetBingoCard(cardId ?? 0, {
    query: {
      queryKey: getGetBingoCardQueryKey(cardId ?? 0),
      enabled: !!cardId,
    }
  });

  const isLoading = isCardsLoading || (!!cardId && isBoxesLoading);

  if (isLoading) {
    return (
      <ParticipantLayout>
        <div className="flex justify-center py-24">
          <Spinner className="w-8 h-8 text-primary" />
        </div>
      </ParticipantLayout>
    );
  }

  const hasCard = !!cardWithBoxes && cardWithBoxes.boxes && cardWithBoxes.boxes.length > 0;

  return (
    <ParticipantLayout>
      <div className="space-y-10 pb-24 max-w-2xl mx-auto">

        {/* Header */}
        <section className="text-center space-y-3 pt-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full">
            <Flame className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            Your Journey
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            Each day one challenge unlocks. Reveal it, live it, and reflect on how it shaped your day.
          </p>
        </section>

        {/* Bingo Board */}
        <section>
          {hasCard ? (
            <BingoCardGrid card={cardWithBoxes} dailyMode={true} />
          ) : (
            <Card className="p-12 text-center bg-muted/30 border-dashed">
              <h3 className="text-lg font-medium text-foreground mb-2">No Active Card</h3>
              <p className="text-muted-foreground text-sm">
                Your group leader hasn't assigned you a bingo card yet. Check back soon!
              </p>
            </Card>
          )}
        </section>

        {/* Reflection form — only shown if they have a card */}
        {hasCard && (
          <section>
            <ReflectionForm />
          </section>
        )}

      </div>
    </ParticipantLayout>
  );
}
