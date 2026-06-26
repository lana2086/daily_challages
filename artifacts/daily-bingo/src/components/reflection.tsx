import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateReflection,
  getListReflectionsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, CheckCircle2, PenLine } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const reflectionSchema = z.object({
  whatIChose: z.string().min(1),
  whatIDid: z.string().min(10, "Please share a bit more about what you did."),
  impact: z.string().min(10, "Please describe how it affected you."),
});

interface ReflectionFormProps {
  challengeText?: string;
}

export function ReflectionForm({ challengeText }: ReflectionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof reflectionSchema>>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      whatIChose: challengeText ?? "",
      whatIDid: "",
      impact: "",
    },
  });

  const createMutation = useCreateReflection({
    mutation: {
      onSuccess: () => {
        toast({
          title: "✅ Great job!",
          description: "Your reflection has been saved. See you tomorrow for your next challenge.",
        });
        form.reset({ whatIChose: challengeText ?? "", whatIDid: "", impact: "" });
        setSubmitted(true);
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListReflectionsQueryKey() });
      },
      onError: () => {
        toast({
          title: "Couldn't save",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      },
    },
  });

  const onSubmit = (values: z.infer<typeof reflectionSchema>) => {
    createMutation.mutate({ data: values });
  };

  return (
    <div className="bg-white rounded-3xl border border-border/40 card-premium overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-base text-foreground">Daily Reflection</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Capture your thoughts from today</p>
        </div>
      </div>

      <div className="px-5 pb-6 space-y-4">
        <AnimatePresence mode="wait">
          {submitted ? (
            /* ── Success state ─────────────────────────────────────── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8 space-y-3"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mx-auto">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Reflection saved!</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                  Thank you for taking a moment to reflect. See you tomorrow.
                </p>
              </div>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-primary hover:underline underline-offset-2 font-medium"
              >
                Add another reflection
              </button>
            </motion.div>
          ) : (
            /* ── Form ─────────────────────────────────────────────── */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Today's challenge display */}
              {challengeText && (
                <div className="rounded-2xl bg-primary/5 border border-primary/15 px-4 py-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <PenLine className="w-3.5 h-3.5 text-primary/70" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                      Today's Challenge
                    </p>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {challengeText}
                  </p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="whatIDid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">
                          What did you actually do today?
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the specific action you took — even if it was small or imperfect…"
                            className="resize-none h-[90px] text-sm rounded-xl border-border/60 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="impact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">
                          How did it impact you?
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="How did it make you feel? What shifted for you — even a little?"
                            className="resize-none h-[90px] text-sm rounded-xl border-border/60 bg-background focus-visible:ring-primary/30 focus-visible:border-primary/40"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full sm:w-auto px-8 rounded-xl font-semibold"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Saving…" : "Save Reflection"}
                  </Button>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
