import { AdminLayout } from "@/components/layout";
import { useGetBingoCard, useUpdateBingoBox, getGetBingoCardQueryKey, BingoBoxUpdateCategory, BingoBox } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, Save } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AdminCardEdit({ id }: { id: string }) {
  const cardId = parseInt(id);
  const { data: card, isLoading } = useGetBingoCard(cardId, {
    query: { queryKey: getGetBingoCardQueryKey(cardId), enabled: !!cardId }
  });

  if (isLoading) return <AdminLayout><div className="flex justify-center p-20"><Spinner /></div></AdminLayout>;
  if (!card) return <AdminLayout>Card not found</AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/participants/${card.userId}`} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold">Edit Card</h1>
            <p className="text-muted-foreground">For {card.participantName} - {card.title}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {card.boxes?.sort((a,b) => a.boxNumber - b.boxNumber).map(box => (
            <BoxEditor key={box.id} box={box} cardId={cardId} />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function BoxEditor({ box, cardId }: { box: BingoBox, cardId: number }) {
  const [text, setText] = useState(box.challengeText);
  const [cat, setCat] = useState(box.category);
  const [isRevealed, setIsRevealed] = useState(box.isRevealed);
  const [isCompleted, setIsCompleted] = useState(box.isCompleted);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setText(box.challengeText);
    setCat(box.category);
    setIsRevealed(box.isRevealed);
    setIsCompleted(box.isCompleted);
  }, [box]);

  const updateMutation = useUpdateBingoBox({
    mutation: {
      onSuccess: () => {
        toast({ title: "Box updated" });
        queryClient.invalidateQueries({ queryKey: getGetBingoCardQueryKey(cardId) });
      }
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: box.id,
      data: {
        challengeText: text,
        category: cat as BingoBoxUpdateCategory,
        isRevealed,
        isCompleted
      }
    });
  };

  const isDirty = text !== box.challengeText || cat !== box.category || isRevealed !== box.isRevealed || isCompleted !== box.isCompleted;

  return (
    <Card className={`relative ${isDirty ? 'border-primary' : ''}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-sm">Box {box.boxNumber}</span>
          {isDirty && <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="h-7"><Save className="w-3 h-3 mr-1" /> Save</Button>}
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Category</Label>
          <Select onValueChange={(val) => setCat(val as any)} value={cat}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(BingoBoxUpdateCategory).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Challenge</Label>
          <Textarea value={text} onChange={e => setText(e.target.value)} className="h-20 resize-none text-sm" />
        </div>

        <div className="pt-2 space-y-3 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Revealed</Label>
            <Switch checked={isRevealed} onCheckedChange={setIsRevealed} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Completed</Label>
            <Switch checked={isCompleted} onCheckedChange={setIsCompleted} disabled={!isRevealed && !isCompleted} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
