import {
  BingoCardWithBoxes,
  BingoBox,
  useRevealBingoBox,
  useCompleteBingoBox,
  getGetBingoCardQueryKey,
  getListBingoCardsQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, Sparkles, CalendarClock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const CATEGORY_COLORS: Record<string, string> = {
  Spirit: "bg-purple-100 text-purple-800 border-purple-200",
  Mind: "bg-blue-100 text-blue-800 border-blue-200",
  Body: "bg-green-100 text-green-800 border-green-200",
  Health: "bg-orange-100 text-orange-800 border-orange-200",
  People: "bg-pink-100 text-pink-800 border-pink-200",
};

type DailyStatus = "active" | "past" | "future";

/**
 * Returns which box index (0-based) is unlocked today.
 * Day 0 = the day the card was created → box 0 (boxNumber 1).
 * Capped at 8 so it never goes past the 9th box.
 */
function getTodayBoxIndex(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  // Compare calendar dates in local time
  const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((todayDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diffDays, 0), 8);
}

interface BingoCardGridProps {
  card: BingoCardWithBoxes;
  /** When true, enforces one-box-per-day unlock logic */
  dailyMode?: boolean;
  readOnly?: boolean;
}

export function BingoCardGrid({ card, dailyMode = false, readOnly = false }: BingoCardGridProps) {
  const sortedBoxes = [...(card.boxes || [])].sort((a, b) => a.boxNumber - b.boxNumber);
  const todayIndex = dailyMode ? getTodayBoxIndex(card.createdAt) : 8;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {dailyMode && (
        <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
          <CalendarClock className="w-4 h-4" />
          <span>
            Box {todayIndex + 1} of 9 — today's challenge
          </span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
        {sortedBoxes.map((box, idx) => {
          let dailyStatus: DailyStatus = "active";
          if (dailyMode) {
            if (idx < todayIndex) dailyStatus = "past";
            else if (idx > todayIndex) dailyStatus = "future";
            else dailyStatus = "active";
          }
          return (
            <BingoBoxCell
              key={box.id}
              box={box}
              cardId={card.id}
              readOnly={readOnly}
              index={idx}
              dailyStatus={dailyStatus}
            />
          );
        })}
      </div>
    </div>
  );
}

function BingoBoxCell({
  box,
  cardId,
  readOnly,
  index,
  dailyStatus,
}: {
  box: BingoBox;
  cardId: number;
  readOnly: boolean;
  index: number;
  dailyStatus: DailyStatus;
}) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetBingoCardQueryKey(cardId) });
    queryClient.invalidateQueries({ queryKey: getListBingoCardsQueryKey() });
  };

  const revealMutation = useRevealBingoBox({ mutation: { onSuccess: invalidate } });
  const completeMutation = useCompleteBingoBox({ mutation: { onSuccess: invalidate } });

  const isLoading = revealMutation.isPending || completeMutation.isPending;
  const canInteract = !readOnly && dailyStatus === "active";

  // ── FUTURE: locked, not yet available ──────────────────────────────────────
  if (dailyStatus === "future") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, delay: index * 0.04 }}
        className="aspect-square"
      >
        <Card className="w-full h-full min-h-[100px] sm:min-h-[130px] bg-muted/30 border border-border/40 flex flex-col items-center justify-center p-3 text-center select-none">
          <Lock className="w-5 h-5 text-muted-foreground/40 mb-1.5" />
          <span className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-wider">
            Day {index + 1}
          </span>
        </Card>
      </motion.div>
    );
  }

  // ── PAST OR ACTIVE — COMPLETED ─────────────────────────────────────────────
  if (box.isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.04 }}
        className="aspect-square"
      >
        <Card className="w-full h-full min-h-[100px] sm:min-h-[130px] bg-primary/8 border-primary/25 flex flex-col items-center justify-center p-3 text-center overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:14px_14px] opacity-30" />
          <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9 text-primary mb-2 opacity-80 relative z-10" />
          <span className="text-[10px] sm:text-xs font-medium text-primary line-clamp-3 relative z-10 leading-relaxed">
            {box.challengeText}
          </span>
        </Card>
      </motion.div>
    );
  }

  // ── PAST — NOT COMPLETED (missed) ──────────────────────────────────────────
  if (dailyStatus === "past" && !box.isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, delay: index * 0.04 }}
        className="aspect-square"
      >
        <Card className="w-full h-full min-h-[100px] sm:min-h-[130px] bg-muted/20 border-border/50 flex flex-col items-center justify-center p-3 text-center opacity-60">
          <Lock className="w-4 h-4 text-muted-foreground mb-1.5" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Day {index + 1}
          </span>
          <span className="text-[9px] text-muted-foreground/60 mt-1">Passed</span>
        </Card>
      </motion.div>
    );
  }

  // ── ACTIVE — REVEALED ─────────────────────────────────────────────────────
  if (box.isRevealed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="aspect-square"
      >
        <Card className="w-full h-full min-h-[100px] sm:min-h-[130px] bg-card border-primary/30 flex flex-col p-3 sm:p-4 shadow-md ring-1 ring-primary/20">
          <div className="flex-1 flex flex-col justify-center text-center">
            <span className="text-[11px] sm:text-sm font-medium mb-2 line-clamp-4 leading-relaxed">
              {box.challengeText}
            </span>
          </div>
          <div className="mt-auto flex flex-col items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[9px] sm:text-[10px] uppercase tracking-wider ${CATEGORY_COLORS[box.category] || ""}`}
            >
              {box.category}
            </Badge>
            {canInteract && (
              <Button
                variant="default"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={() => completeMutation.mutate({ id: box.id })}
                disabled={isLoading}
              >
                Mark Done
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }

  // ── ACTIVE — HIDDEN (default for today's unrevealed box) ──────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="aspect-square"
    >
      <Card
        className={`w-full h-full min-h-[100px] sm:min-h-[130px] flex flex-col items-center justify-center p-3 text-center border-2 border-dashed transition-all
          ${canInteract
            ? "border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10 hover:border-primary/60 hover:shadow-md"
            : "border-border/50 bg-muted/20"
          }`}
        onClick={canInteract ? () => revealMutation.mutate({ id: box.id }) : undefined}
      >
        {canInteract ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-background shadow-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-primary">Open Challenge</span>
            <span className="text-[10px] text-muted-foreground">Tap to reveal</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Lock className="w-5 h-5 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">Hidden</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
