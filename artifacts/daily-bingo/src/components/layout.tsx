import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Users, Grid, BookOpen, Flame } from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user || user.role !== "admin") return null;

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/participants", label: "Participants", icon: Users },
    { href: "/admin/reflections", label: "Reflections", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 flex items-center gap-2 text-primary">
          <Flame className="h-6 w-6" />
          <span className="font-serif text-xl font-bold tracking-tight">Daily Bingo</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${location === item.href ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2 text-sm text-muted-foreground truncate">
            {user.name}
          </div>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}

export function ParticipantLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  if (!user || user.role !== "participant") return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Flame className="h-6 w-6" />
            <span className="font-serif text-xl font-bold tracking-tight">Daily Bingo</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium hidden sm:inline-block text-muted-foreground">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2 hidden sm:inline-block" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
