import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.role === "admin") {
    return <Redirect to="/admin" />;
  }

  return <Redirect to="/dashboard" />;
}
