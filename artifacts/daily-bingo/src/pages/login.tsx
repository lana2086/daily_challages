import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Left: blended nature image panel (desktop only) */}
      <div className="hidden md:block w-1/2 relative overflow-hidden">
        <img
          src="/mountain-road.jpeg"
          alt="Journey"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background" />
        <div className="absolute bottom-12 left-10 right-16 z-10">
          <p className="font-serif text-2xl font-bold text-white/90 leading-snug hero-text-shadow">
            "I can do all things through Christ who strengthens me."
          </p>
          <p className="text-sm text-white/60 mt-3 font-medium">
            — Philippians 4:13
          </p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        {/* Warm background orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-primary/6 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-5%] w-72 h-72 bg-secondary/60 rounded-full blur-[60px] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="text-center mb-8 space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/30 mx-auto">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                Daily Bingo
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to continue your journey
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-card rounded-3xl border border-border/50 card-warm px-7 py-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your username"
                          className="h-11 rounded-xl border-border/60 bg-background/50 text-sm focus-visible:ring-primary/25 focus-visible:border-primary/45"
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
                      <FormLabel className="text-sm font-semibold text-foreground">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-11 rounded-xl border-border/60 bg-background/50 text-sm focus-visible:ring-primary/25 focus-visible:border-primary/45"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-sm font-semibold shadow-md shadow-primary/25 mt-1"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
