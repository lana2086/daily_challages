import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout";
import {
  useListParticipants,
  useListBingoCards,
  useGetBingoCard,
  useCreateBingoCard,
  useUpdateBingoBox,
  getListBingoCardsQueryKey,
  getGetBingoCardQueryKey,
  BingoBoxInputCategory,
  BingoBoxUpdateCategory,
} from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Sparkles, UserCircle2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["Spirit", "Mind", "Body", "Health", "People"] as const;
type Category = typeof CATEGORIES[number];

const CAT_CONFIG: Record<Category, { bar: string; light: string; pill: string; pillActive: string; text: string }> = {
  Spirit: {
    bar: "bg-purple-500",
    light: "bg-purple-50",
    pill: "border border-purple-200 text-purple-700 hover:bg-purple-100",
    pillActive: "bg-purple-500 text-white border-purple-500",
    text: "text-purple-700",
  },
  Mind: {
    bar: "bg-blue-500",
    light: "bg-blue-50",
    pill: "border border-blue-200 text-blue-700 hover:bg-blue-100",
    pillActive: "bg-blue-500 text-white border-blue-500",
    text: "text-blue-700",
  },
  Body: {
    bar: "bg-green-500",
    light: "bg-green-50",
    pill: "border border-green-200 text-green-700 hover:bg-green-100",
    pillActive: "bg-green-500 text-white border-green-500",
    text: "text-green-700",
  },
  Health: {
    bar: "bg-orange-500",
    light: "bg-orange-50",
    pill: "border border-orange-200 text-orange-700 hover:bg-orange-100",
    pillActive: "bg-orange-500 text-white border-orange-500",
    text: "text-orange-700",
  },
  People: {
    bar: "bg-pink-500",
    light: "bg-pink-50",
    pill: "border border-pink-200 text-pink-700 hover:bg-pink-100",
    pillActive: "bg-pink-500 text-white border-pink-500",
    text: "text-pink-700",
  },
};

interface BoxState {
  boxNumber: number;
  category: Category;
  challengeText: string;
}

const DEFAULT_BOXES: BoxState[] = Array.from({ length: 9 }, (_, i) => ({
  boxNumber: i + 1,
  category: "Spirit" as Category,
  challengeText: "",
}));

export default function AdminBingoCards() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [boxes, setBoxes] = useState<BoxState[]>(DEFAULT_BOXES);
  const [savedBoxIds, setSavedBoxIds] = useState<Record<number, number>>({}); // boxNumber -> box.id
  const [existingCardId, setExistingCardId] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const { data: participants, isLoading: loadingParticipants } = useListParticipants();
  const { data: allCards, isLoading: loadingCards } = useListBingoCards({
    query: { queryKey: getListBingoCardsQueryKey() }
  });

  const participantCard = allCards?.find(c => c.userId === selectedUserId) ?? null;

  const { data: cardWithBoxes, isLoading: loadingBoxes } = useGetBingoCard(participantCard?.id ?? 0, {
    query: {
      queryKey: getGetBingoCardQueryKey(participantCard?.id ?? 0),
      enabled: !!participantCard?.id,
    }
  });

  useEffect(() => {
    if (cardWithBoxes?.boxes && cardWithBoxes.boxes.length > 0) {
      const sorted = [...cardWithBoxes.boxes].sort((a, b) => a.boxNumber - b.boxNumber);
      setBoxes(sorted.map(b => ({
        boxNumber: b.boxNumber,
        category: b.category as Category,
        challengeText: b.challengeText,
      })));
      const ids: Record<number, number> = {};
      sorted.forEach(b => { ids[b.boxNumber] = b.id; });
      setSavedBoxIds(ids);
      setExistingCardId(cardWithBoxes.id);
      setIsSaved(false);
    } else if (!participantCard) {
      setBoxes(DEFAULT_BOXES);
      setSavedBoxIds({});
      setExistingCardId(null);
      setIsSaved(false);
    }
  }, [cardWithBoxes, participantCard]);

  const updateBox = useCallback((boxNumber: number, updates: Partial<BoxState>) => {
    setBoxes(prev => prev.map(b => b.boxNumber === boxNumber ? { ...b, ...updates } : b));
    setIsSaved(false);
  }, []);

  const createMutation = useCreateBingoCard({
    mutation: {
      onSuccess: (newCard) => {
        queryClient.invalidateQueries({ queryKey: getListBingoCardsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBingoCardQueryKey(newCard.id) });
        toast({ title: "Bingo card created!", description: "The card has been saved for this participant." });
        setIsSaved(true);
      },
      onError: () => toast({ title: "Error", description: "Failed to create card.", variant: "destructive" }),
    }
  });

  const updateBoxMutation = useUpdateBingoBox({
    mutation: {
      onError: () => toast({ title: "Error", description: "Failed to update a box.", variant: "destructive" }),
    }
  });

  const handleSave = async () => {
    if (!selectedUserId) return;

    const allFilled = boxes.every(b => b.challengeText.trim().length > 0);
    if (!allFilled) {
      toast({ title: "Missing challenges", description: "Please fill in all 9 boxes before saving.", variant: "destructive" });
      return;
    }

    if (existingCardId) {
      const promises = boxes.map(box => {
        const boxId = savedBoxIds[box.boxNumber];
        if (!boxId) return Promise.resolve();
        return updateBoxMutation.mutateAsync({
          id: boxId,
          data: { challengeText: box.challengeText, category: box.category as BingoBoxUpdateCategory }
        });
      });
      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: getGetBingoCardQueryKey(existingCardId) });
      toast({ title: "Card updated!", description: "All changes have been saved." });
      setIsSaved(true);
    } else {
      createMutation.mutate({
        data: {
          userId: selectedUserId,
          title: "Monthly Spiritual Challenge",
          boxes: boxes.map(b => ({
            boxNumber: b.boxNumber,
            category: b.category as BingoBoxInputCategory,
            challengeText: b.challengeText,
          }))
        }
      });
    }
  };

  const activeParticipants = participants?.filter(p => p.role === "participant") ?? [];
  const selectedParticipant = activeParticipants.find(p => p.id === selectedUserId);
  const isLoading = loadingParticipants || loadingCards || (!!participantCard && loadingBoxes);
  const isMutating = createMutation.isPending || updateBoxMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-8 pb-20">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Bingo Cards</h1>
          <p className="text-muted-foreground mt-1">
            Build and edit each participant's challenge card, square by square.
          </p>
        </div>

        {/* Participant Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <UserCircle2 className="w-5 h-5 text-primary" />
            <span>Select participant</span>
          </div>
          {loadingParticipants ? (
            <Spinner className="w-5 h-5" />
          ) : (
            <Select
              onValueChange={(val) => {
                setSelectedUserId(parseInt(val));
                setBoxes(DEFAULT_BOXES);
                setSavedBoxIds({});
                setExistingCardId(null);
                setIsSaved(false);
              }}
              value={selectedUserId?.toString() ?? ""}
            >
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Choose a participant…" />
              </SelectTrigger>
              <SelectContent>
                {activeParticipants.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name} <span className="text-muted-foreground">@{p.username}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedParticipant && !isLoading && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={existingCardId ? "border-green-400 text-green-700 bg-green-50" : "border-amber-400 text-amber-700 bg-amber-50"}>
                {existingCardId ? "Card exists — editing" : "No card yet — creating new"}
              </Badge>
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && selectedUserId && (
          <div className="flex justify-center py-20">
            <Spinner className="w-8 h-8 text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!selectedUserId && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground max-w-sm">
              Select a participant above to start building or editing their bingo card.
            </p>
          </div>
        )}

        {/* Bingo Card Builder */}
        <AnimatePresence mode="wait">
          {selectedUserId && !isLoading && (
            <motion.div
              key={selectedUserId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              {/* Card frame */}
              <div className="rounded-2xl border-2 border-primary/25 shadow-xl overflow-hidden bg-card">
                {/* Card header */}
                <div className="bg-primary px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/70 text-xs uppercase tracking-widest font-medium">Daily Challenge</p>
                    <h2 className="text-primary-foreground font-serif text-xl font-bold leading-tight">
                      {selectedParticipant?.name ?? "Participant"}'s Bingo Card
                    </h2>
                  </div>
                  <div className="flex items-center gap-1 opacity-60">
                    {["B","I","N","G","O"].map(l => (
                      <span key={l} className="text-primary-foreground font-bold text-lg w-8 text-center">{l}</span>
                    ))}
                  </div>
                </div>

                {/* 3×3 Grid */}
                <div className="grid grid-cols-3 divide-x-2 divide-y-2 divide-primary/15 border-t-2 border-primary/15">
                  {boxes.map((box, idx) => (
                    <BingoBoxEditor
                      key={box.boxNumber}
                      box={box}
                      index={idx}
                      onChange={(updates) => updateBox(box.boxNumber, updates)}
                    />
                  ))}
                </div>
              </div>

              {/* Save button row */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  {boxes.filter(b => b.challengeText.trim()).length} / 9 boxes filled
                </p>
                <Button
                  size="lg"
                  onClick={handleSave}
                  disabled={isMutating || isSaved}
                  className="gap-2 px-8"
                >
                  {isMutating ? (
                    <><Spinner className="w-4 h-4" /> Saving…</>
                  ) : isSaved ? (
                    <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                  ) : (
                    <><Save className="w-4 h-4" /> {existingCardId ? "Save Changes" : "Create Card"}</>
                  )}
                </Button>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-4">
                {CATEGORIES.map(cat => (
                  <span key={cat} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${CAT_CONFIG[cat].pill}`}>
                    <span className={`w-2 h-2 rounded-full ${CAT_CONFIG[cat].bar}`} />
                    {cat}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}

function BingoBoxEditor({
  box,
  index,
  onChange,
}: {
  box: BoxState;
  index: number;
  onChange: (updates: Partial<BoxState>) => void;
}) {
  const cfg = CAT_CONFIG[box.category];
  const isEmpty = !box.challengeText.trim();

  return (
    <div className={`relative flex flex-col min-h-[210px] transition-colors duration-200 ${cfg.light}`}>
      {/* Category color bar */}
      <div className={`h-1.5 w-full ${cfg.bar}`} />

      {/* Box number badge */}
      <div className="absolute top-3 left-3">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${cfg.pillActive} ${cfg.bar} text-white text-[11px]`}>
          {index + 1}
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col p-4 pt-8 gap-3">
        {/* Challenge text */}
        <Textarea
          value={box.challengeText}
          onChange={e => onChange({ challengeText: e.target.value })}
          placeholder={`Challenge ${index + 1}…`}
          className={`flex-1 resize-none text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/50 leading-relaxed min-h-[80px] ${isEmpty ? "placeholder:italic" : "font-medium"}`}
        />

        {/* Category pills */}
        <div className="flex flex-wrap gap-1 pt-1 border-t border-black/5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => onChange({ category: cat })}
              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all duration-150 ${box.category === cat ? CAT_CONFIG[cat].pillActive + " " + CAT_CONFIG[cat].bar : CAT_CONFIG[cat].pill}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
