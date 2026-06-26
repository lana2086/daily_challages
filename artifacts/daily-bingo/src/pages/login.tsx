import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Redirect } from "wouter";
import { Flame } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const { user, login, isLoggingIn } = useAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  if (user) return <Redirect to="/" />;

  const onSubmit = (values: z.infer<typeof loginSchema>) => login(values);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Soft background orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[480px] h-[480px] bg-primary/8 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[360px] h-[360px] bg-primary/6 rounded-full blur-[60px] pointer-events-none" />

      <div className="w-full max-w-sm bg-white rounded-3xl border border-border/40 card-premium overflow-hidden relative z-10">
        {/* Top accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-violet-400 to-indigo-400" />

        <div className="px-8 py-10">
          {/* Logo */}
          <div className="text-center mb-8 space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-md shadow-primary/25 mx-auto">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Daily Bingo</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to continue your journey
              </p>
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground">Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        className="h-11 rounded-xl border-border/60 bg-background text-sm focus-visible:ring-primary/30 focus-visible:border-primary/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-11 rounded-xl border-border/60 bg-background text-sm focus-visible:ring-primary/30 focus-visible:border-primary/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 rounded-xl text-sm font-semibold shadow-sm shadow-primary/25 mt-2"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
