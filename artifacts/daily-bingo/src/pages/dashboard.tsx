import { ParticipantLayout } from "@/components/layout";
import Passport from "@/components/passport.tsx";
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
import { Flame, CalendarDays, Sparkles } from "lucide-react";

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
    },
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
  const todayChallenge = todayBox?.isRevealed
    ? todayBox.challengeText
    : undefined;
  const completedCount = sortedBoxes.filter((b) => b.isCompleted).length;
  const dayNumber = todayIndex + 1;
  const pct = Math.round((completedCount / 9) * 100);

  return (
    <ParticipantLayout>
      <div className="max-w-xl mx-auto pb-24 space-y-5">
        {/* ── Hero card with blended nature image ───────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="pt-5 sm:pt-6"
        >
          <div
            className="relative overflow-hidden rounded-3xl card-warm"
            style={{ minHeight: 220 }}
          >
            {/* Nature photo — sepia-warmed, right-anchored */}

            {/* Warm gradient: solid left → fade to transparent right */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, #F5ECE0 0%, #F5ECE0 42%, rgba(245,236,224,0.88) 58%, rgba(245,236,224,0.45) 75%, rgba(245,236,224,0.1) 100%)",
              }}
            />

            {/* Bottom fade so text sits comfortably */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(245,236,224,0.7) 0%, transparent 60%)",
              }}
            />

            {/* Content */}
            <div className="relative z-10 px-6 py-6 sm:px-8 sm:py-7 flex flex-col gap-4">
              {/* Greeting */}
              <div>
                <p className="text-xs font-semibold text-primary/70 uppercase tracking-widest mb-0.5">
                  {getGreeting()}
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground hero-text-shadow leading-tight">
                  {firstName} 🌿
                </h1>
                <p className="text-sm text-foreground/65 mt-1.5 leading-relaxed max-w-[260px]">
                  Take a deep breath. Let's grow together today.
                </p>
              </div>

              {/* Today's challenge */}
              {hasCard && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-3.5 border border-white/60 shadow-sm max-w-[280px]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">
                    Today's Challenge
                  </p>
                  {todayChallenge ? (
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      {todayChallenge}
                    </p>
                  ) : todayBox ? (
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
                      <p className="text-sm font-medium text-foreground/75">
                        Tap Day {dayNumber} to reveal
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/60">
                      No card assigned yet
                    </p>
                  )}
                </div>
              )}

              {/* Day + progress */}
              {hasCard && (
                <div className="flex items-center gap-3 max-w-[280px]">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <CalendarDays className="w-3.5 h-3.5 text-primary/60" />
                    <span className="text-xs font-bold text-foreground/75">
                      Day {dayNumber} of 9
                    </span>
                  </div>
                  <div className="flex-1 h-1.5 bg-primary/15 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        duration: 0.9,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-primary/60 shrink-0">
                    {pct}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ── Loading ────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex justify-center py-14">
            <Spinner className="w-6 h-6 text-primary" />
          </div>
        )}

        {/* ── No card ───────────────────────────────────────────────── */}
        {!isLoading && !hasCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl bg-card border border-border/40 card-warm p-12 text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
              <Flame className="w-6 h-6 text-primary/60" />
            </div>
            <h3 className="font-serif font-semibold text-foreground">
              No card yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Your leader will assign your bingo card soon. Check back soon!
            </p>
          </motion.div>
        )}

        {/* ── Bingo Board ───────────────────────────────────────────── */}
        {!isLoading && hasCard && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="bg-card rounded-3xl border border-border/50 card-warm p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-bold text-lg text-foreground">
                My Bingo Board
              </h2>
              <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                {completedCount} / 9 done
              </span>
            </div>
            <BingoCardGrid card={cardWithBoxes} dailyMode={true} />
            <p className="text-center text-[11px] text-muted-foreground mt-4 pt-3.5 border-t border-border/30">
              🔒 A new challenge unlocks each day — keep going!
            </p>
          </motion.section>
        )}

        {/* ── Reflection ────────────────────────────────────────────── */}
        {!isLoading && hasCard && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18 }}
          >
            <ReflectionForm challengeText={todayChallenge} />
          </motion.section>
        )}
        {/* ── Journey Passport ───────────────────── */}
        {!isLoading && hasCard && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
          >
            <Passport />
          </motion.section>
        )}
      </div>
    </ParticipantLayout>
  );
}
