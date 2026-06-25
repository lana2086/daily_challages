import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateReflection, getListReflectionsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";

const reflectionSchema = z.object({
  whatIChose: z.string().min(5, "Please describe the challenge you chose."),
  whatIDid: z.string().min(10, "Please provide more detail about what you did."),
  impact: z.string().min(10, "Please describe how it impacted you."),
});

export function ReflectionForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof reflectionSchema>>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      whatIChose: "",
      whatIDid: "",
      impact: "",
    },
  });

  const createMutation = useCreateReflection({
    mutation: {
      onSuccess: () => {
        toast({ title: "Reflection saved", description: "Thank you for sharing your thoughts today." });
        form.reset();
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListReflectionsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not save your reflection. Please try again.", variant: "destructive" });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof reflectionSchema>) => {
    createMutation.mutate({ data: values });
  };

  return (
    <Card className="border-t-4 border-t-primary shadow-sm bg-card mt-8">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1 text-primary">
          <BookOpen className="w-5 h-5" />
          <CardTitle className="font-serif text-xl">Daily Reflection</CardTitle>
        </div>
        <CardDescription>
          Take a moment to write down what you did today and how it felt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="whatIChose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Which challenge did you choose?</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. I chose to reach out to an old friend..." className="resize-none h-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatIDid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What exactly did you do?</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the action you took..." className="resize-none h-24" {...field} />
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
                  <FormLabel>How did it impact you?</FormLabel>
                  <FormControl>
                    <Textarea placeholder="How did this make you feel? What did you learn?" className="resize-none h-24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save Reflection"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
