import { BingoCardWithBoxes, BingoBox, useRevealBingoBox, useCompleteBingoBox, getGetBingoCardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, Unlock, Eye, Sparkles } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

interface BingoCardGridProps {
  card: BingoCardWithBoxes;
  readOnly?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Spirit: "bg-purple-100 text-purple-800 border-purple-200",
  Mind: "bg-blue-100 text-blue-800 border-blue-200",
  Body: "bg-green-100 text-green-800 border-green-200",
  Health: "bg-orange-100 text-orange-800 border-orange-200",
  People: "bg-pink-100 text-pink-800 border-pink-200",
};

export function BingoCardGrid({ card, readOnly = false }: BingoCardGridProps) {
  // Sort boxes by boxNumber
  const sortedBoxes = [...(card.boxes || [])].sort((a, b) => a.boxNumber - b.boxNumber);

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full aspect-square max-w-2xl mx-auto">
      {sortedBoxes.map((box, idx) => (
        <BingoBoxCell key={box.id} box={box} cardId={card.id} readOnly={readOnly} index={idx} />
      ))}
    </div>
  );
}

function BingoBoxCell({ box, cardId, readOnly, index }: { box: BingoBox; cardId: number; readOnly: boolean; index: number }) {
  const queryClient = useQueryClient();
  const revealMutation = useRevealBingoBox({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetBingoCardQueryKey(cardId) })
    }
  });
  const completeMutation = useCompleteBingoBox({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetBingoCardQueryKey(cardId) })
    }
  });

  const handleReveal = () => {
    if (readOnly || box.isRevealed) return;
    revealMutation.mutate({ id: box.id });
  };

  const handleComplete = () => {
    if (readOnly || box.isCompleted || !box.isRevealed) return;
    completeMutation.mutate({ id: box.id });
  };

  const isLoading = revealMutation.isPending || completeMutation.isPending;

  if (box.isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="w-full h-full relative"
      >
        <Card className="w-full h-full bg-primary/5 border-primary/20 flex flex-col items-center justify-center p-2 sm:p-4 text-center overflow-hidden shadow-inner relative group">
          <div className="absolute inset-0 bg-primary/5 opacity-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
          <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12 text-primary mb-2 opacity-80" />
          <span className="text-xs sm:text-sm font-medium text-primary-foreground line-clamp-3 relative z-10 text-primary">
            {box.challengeText}
          </span>
        </Card>
      </motion.div>
    );
  }

  if (box.isRevealed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full h-full"
      >
        <Card className="w-full h-full bg-card border-border flex flex-col p-3 sm:p-4 shadow-sm hover:shadow-md transition-all relative">
          <div className="flex-1 flex flex-col justify-center text-center">
            <span className="text-xs sm:text-sm font-medium mb-3 line-clamp-4 leading-relaxed">
              {box.challengeText}
            </span>
          </div>
          <div className="mt-auto flex flex-col items-center gap-3">
            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${CATEGORY_COLORS[box.category] || ""}`}>
              {box.category}
            </Badge>
            {!readOnly && (
              <Button
                variant="default"
                size="sm"
                className="w-full h-8 text-xs sm:text-sm"
                onClick={handleComplete}
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

  // Hidden State
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="w-full h-full"
    >
      <Card className="w-full h-full bg-muted/50 border-dashed border-2 flex flex-col items-center justify-center p-2 sm:p-4 text-center cursor-pointer hover:bg-muted/80 transition-colors" onClick={handleReveal}>
        {readOnly ? (
          <>
            <Lock className="w-6 h-6 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hidden</span>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-foreground">Open Challenge</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
