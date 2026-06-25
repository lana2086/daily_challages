import { AdminLayout } from "@/components/layout";
import { useListParticipants, useCreateBingoCard, getListParticipantsQueryKey, getListBingoCardsQueryKey, BingoBoxInputCategory } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

const newCardSchema = z.object({
  userId: z.coerce.number().min(1, "Participant is required"),
  title: z.string().min(1, "Title is required"),
  boxes: z.array(z.object({
    boxNumber: z.number(),
    category: z.nativeEnum(BingoBoxInputCategory),
    challengeText: z.string().min(1, "Challenge text is required")
  })).length(9)
});

export default function AdminCardNew() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialUserId = params.get("userId");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: participants, isLoading } = useListParticipants({
    query: { queryKey: getListParticipantsQueryKey() }
  });

  const createMutation = useCreateBingoCard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBingoCardsQueryKey() });
        toast({ title: "Card created" });
        setLocation("/admin/participants");
      }
    }
  });

  const defaultBoxes = Array.from({ length: 9 }).map((_, i) => ({
    boxNumber: i + 1,
    category: BingoBoxInputCategory.Spirit,
    challengeText: ""
  }));

  const form = useForm<z.infer<typeof newCardSchema>>({
    resolver: zodResolver(newCardSchema),
    defaultValues: {
      userId: initialUserId ? parseInt(initialUserId) : 0,
      title: "Monthly Spiritual Challenge",
      boxes: defaultBoxes
    }
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "boxes"
  });

  const onSubmit = (values: z.infer<typeof newCardSchema>) => {
    createMutation.mutate({ data: values });
  };

  if (isLoading) return <AdminLayout><div className="flex justify-center py-20"><Spinner /></div></AdminLayout>;

  const activeParticipants = participants?.filter(p => p.role === "participant") || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/participants" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold">New Bingo Card</h1>
            <p className="text-muted-foreground">Assign 9 challenges to a participant.</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="userId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participant</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value ? field.value.toString() : ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a participant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeParticipants.map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name} (@{p.username})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Title</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-xl font-serif font-semibold mb-4">Challenges</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="bg-muted/10">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm">Box {index + 1}</span>
                      </div>
                      <FormField control={form.control} name={`boxes.${index}.category`} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(BingoBoxInputCategory).map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`boxes.${index}.challengeText`} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Challenge</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="h-20 resize-none text-sm" placeholder="e.g. Meditate for 10 mins" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Card"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
