import {
  BingoCardWithBoxes,
  BingoBox,
  useRevealBingoBox,
  useCompleteBingoBox,
  getGetBingoCardQueryKey,
  getListBingoCardsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, Sparkles, Star, BookOpen, Activity, Heart, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

type DailyStatus = "active" | "past" | "future";

/* ── Category config ───────────────────────────────────────────────────────── */
const CAT_CONFIG = {
  Spirit: {
    icon: Star,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-600",
    borderColor: "border-purple-200",
  },
  Mind: {
    icon: BookOpen,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-600",
    borderColor: "border-blue-200",
  },
  Body: {
    icon: Activity,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    badgeBg: "bg-green-50",
    badgeText: "text-green-600",
    borderColor: "border-green-200",
  },
  Health: {
    icon: Heart,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-600",
    borderColor: "border-orange-200",
  },
  People: {
    icon: Users,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    badgeBg: "bg-pink-50",
    badgeText: "text-pink-600",
    borderColor: "border-pink-200",
  },
} as const;

type CatKey = keyof typeof CAT_CONFIG;

function getCat(category: string) {
  return CAT_CONFIG[category as CatKey] ?? CAT_CONFIG.Spirit;
}

export function getTodayBoxIndex(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((todayDate.getTime() - createdDate.getTime()) / 86400000);
  return Math.min(Math.max(diff, 0), 8);
}

interface BingoCardGridProps {
  card: BingoCardWithBoxes;
  dailyMode?: boolean;
  readOnly?: boolean;
}

export function BingoCardGrid({ card, dailyMode = false, readOnly = false }: BingoCardGridProps) {
  const sortedBoxes = [...(card.boxes || [])].sort((a, b) => a.boxNumber - b.boxNumber);
  const todayIndex = dailyMode ? getTodayBoxIndex(card.createdAt) : 8;
  const completedCount = sortedBoxes.filter(b => b.isCompleted).length;
  const pct = Math.round((completedCount / 9) * 100);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {dailyMode && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground/70">Your progress</span>
            <span className="font-semibold text-primary">{completedCount}/9 challenges</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* 3×3 grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {sortedBoxes.map((box, idx) => {
          let status: DailyStatus = "active";
          if (dailyMode) {
            if (idx < todayIndex) status = "past";
            else if (idx > todayIndex) status = "future";
          }
          return (
            <BingoTile
              key={box.id}
              box={box}
              cardId={card.id}
              readOnly={readOnly}
              index={idx}
              dailyStatus={status}
            />
          );
        })}
      </div>
    </div>
  );
}

function BingoTile({
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
  const cat = getCat(box.category);
  const CatIcon = cat.icon;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetBingoCardQueryKey(cardId) });
    queryClient.invalidateQueries({ queryKey: getListBingoCardsQueryKey() });
  };

  const revealMutation = useRevealBingoBox({ mutation: { onSuccess: invalidate } });
  const completeMutation = useCompleteBingoBox({ mutation: { onSuccess: invalidate } });
  const isLoading = revealMutation.isPending || completeMutation.isPending;
  const canInteract = !readOnly && dailyStatus === "active";

  /* ── FUTURE: locked ──────────────────────────────────────────────────────── */
  if (dailyStatus === "future") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: index * 0.025 }}
        className="aspect-square"
      >
        <div className="w-full h-full min-h-[96px] sm:min-h-[110px] bg-white rounded-2xl border border-border/40 flex flex-col items-center justify-center gap-2 p-3 select-none opacity-50">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <CatIcon className="w-4 h-4 text-muted-foreground/40" />
          </div>
          <Lock className="w-3 h-3 text-muted-foreground/40" />
        </div>
      </motion.div>
    );
  }

  /* ── COMPLETED ───────────────────────────────────────────────────────────── */
  if (box.isCompleted) {
    return (
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22, delay: index * 0.025 }}
        className="aspect-square"
      >
        <div className="w-full h-full min-h-[96px] sm:min-h-[110px] bg-white rounded-2xl border border-border/40 card-premium flex flex-col items-center justify-between p-3 overflow-hidden">
          <div className={`w-8 h-8 rounded-full ${cat.iconBg} flex items-center justify-center flex-shrink-0`}>
            <CatIcon className={`w-4 h-4 ${cat.iconColor}`} />
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-foreground text-center leading-snug line-clamp-3 flex-1 flex items-center px-0.5">
            {box.challengeText}
          </p>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[9px] font-semibold text-green-600 uppercase tracking-wide">Done</span>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── PAST NOT COMPLETED ──────────────────────────────────────────────────── */
  if (dailyStatus === "past") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: index * 0.025 }}
        className="aspect-square"
      >
        <div className="w-full h-full min-h-[96px] sm:min-h-[110px] bg-white rounded-2xl border border-border/30 flex flex-col items-center justify-center gap-2 p-3 opacity-40 select-none">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <CatIcon className="w-4 h-4 text-muted-foreground/60" />
          </div>
          <Lock className="w-3 h-3 text-muted-foreground/50" />
        </div>
      </motion.div>
    );
  }

  /* ── ACTIVE + REVEALED ───────────────────────────────────────────────────── */
  if (box.isRevealed) {
    return (
      <motion.div
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="aspect-square"
      >
        <div className="w-full h-full min-h-[96px] sm:min-h-[110px] bg-white rounded-2xl border-2 border-primary/40 tile-glow flex flex-col items-center justify-between p-3 overflow-hidden">
          <div className="flex items-center justify-between w-full">
            <div className={`w-7 h-7 rounded-full ${cat.iconBg} flex items-center justify-center`}>
              <CatIcon className={`w-3.5 h-3.5 ${cat.iconColor}`} />
            </div>
            <span className={`text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${cat.badgeBg} ${cat.badgeText}`}>
              {box.category}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-foreground text-center leading-snug line-clamp-3 flex-1 flex items-center pt-1.5 px-0.5">
            {box.challengeText}
          </p>
          {canInteract && (
            <Button
              size="sm"
              className="w-full h-7 text-[10px] rounded-xl mt-1.5 font-semibold"
              onClick={() => completeMutation.mutate({ id: box.id })}
              disabled={isLoading}
            >
              {isLoading ? "…" : "Mark Done ✓"}
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  /* ── ACTIVE + HIDDEN (today's unrevealed challenge) ──────────────────────── */
  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="aspect-square"
    >
      <div
        onClick={canInteract ? () => revealMutation.mutate({ id: box.id }) : undefined}
        className={`w-full h-full min-h-[96px] sm:min-h-[110px] rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center gap-2.5 p-3 transition-all duration-200 select-none
          ${canInteract ? "cursor-pointer hover:bg-primary/10 hover:border-primary/70 hover:shadow-md active:scale-95" : ""}
        `}
      >
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-[10px] sm:text-[11px] font-bold text-primary leading-tight">
            Today's Challenge
          </p>
          {canInteract && (
            <p className="text-[9px] text-primary/60 mt-0.5">Tap to reveal</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
