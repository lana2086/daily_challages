import {
  BingoCardWithBoxes,
  BingoBox,
  useRevealBingoBox,
  useCompleteBingoBox,
  getGetBingoCardQueryKey,
  getListBingoCardsQueryKey,
} from "@/api";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, Sparkles, Star, BookOpen, Activity, Heart, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

type DailyStatus = "active" | "past" | "future";

const CAT_CONFIG = {
  Spirit: {
    Icon: Star,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    badge: "bg-purple-50 text-purple-600",
    dot: "bg-purple-400",
  },
  Mind: {
    Icon: BookOpen,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badge: "bg-blue-50 text-blue-600",
    dot: "bg-blue-400",
  },
  Body: {
    Icon: Activity,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-600",
    dot: "bg-emerald-400",
  },
  Health: {
    Icon: Heart,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    badge: "bg-orange-50 text-orange-600",
    dot: "bg-orange-400",
  },
  People: {
    Icon: Users,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    badge: "bg-pink-50 text-pink-600",
    dot: "bg-pink-400",
  },
} as const;

type CatKey = keyof typeof CAT_CONFIG;
function getCat(cat: string) { return CAT_CONFIG[cat as CatKey] ?? CAT_CONFIG.Spirit; }

export function getTodayBoxIndex(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const a = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.min(Math.max(Math.floor((b.getTime() - a.getTime()) / 86400000), 0), 8);
}

interface BingoCardGridProps {
  card: BingoCardWithBoxes;
  dailyMode?: boolean;
  readOnly?: boolean;
}

export function BingoCardGrid({ card, dailyMode = false, readOnly = false }: BingoCardGridProps) {
  const sorted = [...(card.boxes || [])].sort((a, b) => a.boxNumber - b.boxNumber);
  const todayIndex = dailyMode ? getTodayBoxIndex(card.createdAt) : 8;

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
      {sorted.map((box, idx) => {
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
  );
}

function BingoTile({
  box, cardId, readOnly, index, dailyStatus,
}: {
  box: BingoBox; cardId: number; readOnly: boolean; index: number; dailyStatus: DailyStatus;
}) {
  const queryClient = useQueryClient();
  const cat = getCat(box.category);
  const { Icon } = cat;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetBingoCardQueryKey(cardId) });
    queryClient.invalidateQueries({ queryKey: getListBingoCardsQueryKey() });
  };

  const revealMutation = useRevealBingoBox({ mutation: { onSuccess: invalidate } });
  const completeMutation = useCompleteBingoBox({ mutation: { onSuccess: invalidate } });
  const isLoading = revealMutation.isPending || completeMutation.isPending;
  const canInteract = !readOnly && dailyStatus === "active";

  const tileBase = "w-full min-h-[96px] sm:min-h-[112px] rounded-2xl border transition-all duration-200";

  /* FUTURE */
  if (dailyStatus === "future") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: index * 0.025 }}
        className="aspect-square"
      >
        <div className={`${tileBase} bg-muted/30 border-border/30 flex flex-col items-center justify-center gap-1.5 p-3 select-none opacity-45`}>
          <div className={`w-8 h-8 rounded-full ${cat.iconBg} flex items-center justify-center opacity-50`}>
            <Icon className={`w-4 h-4 ${cat.iconColor}`} />
          </div>
          <Lock className="w-3 h-3 text-muted-foreground/50" />
        </div>
      </motion.div>
    );
  }

  /* COMPLETED */
  if (box.isCompleted) {
    return (
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: index * 0.025 }}
        className="aspect-square"
      >
        <div className={`${tileBase} bg-card border-border/40 card-warm flex flex-col items-center justify-between p-3`}>
          <div className={`w-8 h-8 rounded-full ${cat.iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${cat.iconColor}`} />
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-foreground text-center leading-snug line-clamp-3 flex-1 flex items-center pt-1.5 px-0.5">
            {box.challengeText}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Done</span>
          </div>
        </div>
      </motion.div>
    );
  }

  /* PAST NOT COMPLETED */
  if (dailyStatus === "past") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: index * 0.025 }}
        className="aspect-square"
      >
        <div className={`${tileBase} bg-muted/20 border-border/25 flex flex-col items-center justify-center gap-1.5 p-3 opacity-40 select-none`}>
          <div className={`w-8 h-8 rounded-full ${cat.iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${cat.iconColor}`} />
          </div>
          <Lock className="w-3 h-3 text-muted-foreground/50" />
        </div>
      </motion.div>
    );
  }

  /* ACTIVE + REVEALED */
  if (box.isRevealed) {
    return (
      <motion.div
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
        className="aspect-square"
      >
        <div className={`${tileBase} bg-card border-primary/35 tile-active-glow flex flex-col items-center justify-between p-3`}>
          <div className="flex items-center justify-between w-full">
            <div className={`w-7 h-7 rounded-full ${cat.iconBg} flex items-center justify-center`}>
              <Icon className={`w-3.5 h-3.5 ${cat.iconColor}`} />
            </div>
            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${cat.badge}`}>
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

  /* ACTIVE + HIDDEN */
  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 250, damping: 22 }}
      className="aspect-square"
    >
      <div
        onClick={canInteract ? () => revealMutation.mutate({ id: box.id }) : undefined}
        className={`${tileBase} border-dashed border-primary/45 bg-secondary/50
          flex flex-col items-center justify-center gap-2.5 p-3 select-none
          ${canInteract ? "cursor-pointer hover:bg-secondary/80 hover:border-primary/60 hover:shadow-md active:scale-95" : ""}
        `}
      >
        <div className="w-10 h-10 rounded-full bg-primary/12 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-[10px] sm:text-[11px] font-bold text-primary leading-tight">Today's Challenge</p>
          {canInteract && <p className="text-[9px] text-primary/55 mt-0.5">Tap to reveal</p>}
        </div>
      </div>
    </motion.div>
  );
}
