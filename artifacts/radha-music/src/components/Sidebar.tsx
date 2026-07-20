import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Home, History, Heart, ListMusic, LogOut, Disc3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const links = [
    { href: "/", label: "Player", icon: Home },
    { href: "/history", label: "History", icon: History },
    { href: "/favorites", label: "Favorites", icon: Heart },
    { href: "/playlist", label: "Playlist", icon: ListMusic },
  ];

  return (
    <aside className="w-64 h-[100dvh] flex flex-col bg-card/40 backdrop-blur-xl border-r border-border shrink-0 fixed md:relative z-40 hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <Disc3 className="text-primary w-8 h-8 animate-spin-slow glow-text" />
        <h2 className="text-xl font-bold tracking-wider text-white glow-text">RADHA</h2>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-primary/20 text-primary glow-box font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              data-testid={`link-nav-${link.label.toLowerCase()}`}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "group-hover:text-foreground transition-colors")} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-background/50 rounded-xl p-4 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
                {user?.firstName?.[0] || 'U'}
              </span>
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-foreground truncate">{user?.firstName || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">#{user?.telegramId}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-lg transition-colors shrink-0"
            title="Logout"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// Mobile Bottom Nav
export function BottomNav() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Play", icon: Home },
    { href: "/history", label: "History", icon: History },
    { href: "/favorites", label: "Favs", icon: Heart },
    { href: "/playlist", label: "List", icon: ListMusic },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-t border-border z-40 flex items-center justify-around px-2 pb-safe">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location === link.href;
        return (
          <Link 
            key={link.href} 
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
            data-testid={`link-bottom-nav-${link.label.toLowerCase()}`}
          >
            <Icon className={cn("w-5 h-5", isActive && "glow-text")} />
            <span className="text-[10px] font-medium">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
