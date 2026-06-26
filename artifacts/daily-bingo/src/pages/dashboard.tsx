import { ParticipantLayout } from "@/components/layout";
import {
  useListBingoCards,
  useGetBingoCard,
  getListBingoCardsQueryKey,
  getGetBingoCardQueryKey,
} from "@workspace/api-client-react";
import { Spinner } from "@/components/ui/spinner";
import { BingoCardGrid, getTodayBoxIndex } from "@/components/bingo";
import { ReflectionForm } from "@/components/reflection";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { Star, CalendarDays } from "lucide-react";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: cards, isLoading: isCardsLoading } = useListBingoCards({
    query: { queryKey: getListBingoCardsQueryKey() },
  });

  const cardId = cards && cards.length > 0 ? cards[0].id : null;

  const { data: cardWithBoxes, isLoading: isBoxesLoading } = useGetBingoCard(
    cardId ?? 0,
    {
      query: {
        queryKey: getGetBingoCardQueryKey(cardId ?? 0),
        enabled: !!cardId,
      },
    }
  );

  const isLoading = isCardsLoading || (!!cardId && isBoxesLoading);
  const hasCard =
    !!cardWithBoxes &&
    Array.isArray(cardWithBoxes.boxes) &&
    cardWithBoxes.boxes.length > 0;

  const firstName = user?.name?.split(" ")[0] ?? "friend";

  const sortedBoxes = hasCard
    ? [...cardWithBoxes.boxes].sort((a, b) => a.boxNumber - b.boxNumber)
    : [];
  const todayIndex = hasCard ? getTodayBoxIndex(cardWithBoxes.createdAt) : 0;
  const todayBox = sortedBoxes[todayIndex] ?? null;
  const todayChallenge = todayBox?.isRevealed ? todayBox.challengeText : undefined;
  const dayNumber = todayIndex + 1;
  const completedCount = sortedBoxes.filter(b => b.isCompleted).length;

  return (
    <ParticipantLayout>
      <div className="max-w-xl mx-auto pb-24 space-y-6">

        {/* ── Hero Card ──────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="pt-5 sm:pt-7"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(247,73%,58%)] via-[hsl(250,68%,63%)] to-[hsl(255,60%,72%)] p-6 sm:p-8 text-white shadow-lg">
            {/* Decorative orbs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-8 w-24 h-24 rounded-full bg-white/8 blur-xl pointer-events-none" />
            <div className="absolute top-8 right-16 w-16 h-16 rounded-full border border-white/15 pointer-events-none" />
            <div className="absolute top-3 right-6 w-7 h-7 rounded-full border border-white/20 pointer-events-none" />

            {/* Greeting */}
            <div className="relative z-10 space-y-4">
              <div>
                <p className="text-white/70 text-sm font-medium">{getGreeting()},</p>
                <h1 className="text-2xl sm:text-3xl font-bold mt-0.5 tracking-tight">
                  {firstName}! 🌿
                </h1>
                <p className="text-white/65 text-sm mt-1.5 leading-relaxed">
                  Take a deep breath. Let's grow together today.
                </p>
              </div>

              {/* Today's challenge preview */}
              {hasCard && (
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1.5">
                    Today's Challenge
                  </p>
                  {todayChallenge ? (
                    <p className="text-sm font-semibold text-white leading-snug">
                      {todayChallenge}
                    </p>
                  ) : todayBox ? (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-300/80" />
                      <p className="text-sm font-semibold text-white/80">
                        Ready to reveal — tap Day {dayNumber} to begin
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-white/70">No card assigned yet</p>
                  )}
                </div>
              )}

              {/* Day + progress */}
              {hasCard && (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-white/60" />
                    <span className="text-xs font-semibold text-white/80">
                      Day {dayNumber} of 9
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-700"
                        style={{ width: `${(completedCount / 9) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-white/60 shrink-0">
                      {Math.round((completedCount / 9) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ── Loading ────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner className="w-6 h-6 text-primary" />
          </div>
        )}

        {/* ── No card ───────────────────────────────────────────────── */}
        {!isLoading && !hasCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl bg-white border border-border/40 card-premium p-10 text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 text-primary/60" />
            </div>
            <h3 className="font-semibold text-foreground">No Card Yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Your leader will assign your bingo card soon. Check back tomorrow!
            </p>
          </motion.div>
        )}

        {/* ── Bingo Board ───────────────────────────────────────────── */}
        {!isLoading && hasCard && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="bg-white rounded-3xl border border-border/40 card-premium p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-foreground">My Bingo Board</h2>
              <span className="text-xs text-muted-foreground font-medium">
                {completedCount} of 9 done
              </span>
            </div>
            <BingoCardGrid card={cardWithBoxes} dailyMode={true} />

            {/* Hint footer */}
            <p className="text-center text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/30">
              🔒 New challenges unlock each day
            </p>
          </motion.section>
        )}

        {/* ── Reflection ────────────────────────────────────────────── */}
        {!isLoading && hasCard && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <ReflectionForm challengeText={todayChallenge} />
          </motion.section>
        )}

      </div>
    </ParticipantLayout>
  );
}
