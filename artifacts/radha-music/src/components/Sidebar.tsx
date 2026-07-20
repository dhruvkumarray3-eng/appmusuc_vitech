import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Home, History, Heart, ListMusic, Disc3, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { isOwner, telegramId } = useAuth();

  const links = [
    { href: "/", label: "Player", icon: Home },
    { href: "/history", label: "History", icon: History },
    { href: "/favorites", label: "Favorites", icon: Heart },
    { href: "/playlist", label: "Playlist", icon: ListMusic },
    ...(isOwner ? [{ href: "/panel", label: "Owner Panel", icon: Shield }] : []),
  ];

  return (
    <aside className="w-64 h-[100dvh] flex flex-col bg-card/40 backdrop-blur-xl border-r border-border shrink-0 fixed md:relative z-40 hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <Disc3 className="text-primary w-8 h-8 animate-spin-slow glow-text" />
        <h2 className="text-xl tracking-wider text-white glow-text" style={{ fontFamily: 'Audiowide, cursive' }}>NOBITA</h2>
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
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "group-hover:text-foreground transition-colors")} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info footer — click to go to profile */}
      <div className="p-4 mt-auto">
        <Link href="/profile">
          <div className="bg-background/50 rounded-xl p-4 border border-border flex items-center justify-between hover:border-primary/40 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                {isOwner
                  ? <Shield className="w-4 h-4 text-yellow-400" />
                  : <User className="w-4 h-4 text-primary" />
                }
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-foreground truncate">
                  {isOwner ? "Owner" : "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {telegramId ? `#${telegramId}` : "Guest"}
                </p>
              </div>
            </div>
            <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </Link>
      </div>
    </aside>
  );
}

// Mobile Bottom Nav
export function BottomNav() {
  const [location] = useLocation();
  const { isOwner } = useAuth();

  const links = [
    { href: "/", label: "Play", icon: Home },
    { href: "/history", label: "History", icon: History },
    { href: "/favorites", label: "Favs", icon: Heart },
    { href: "/playlist", label: "List", icon: ListMusic },
    ...(isOwner
      ? [{ href: "/panel", label: "Panel", icon: Shield }]
      : [{ href: "/profile", label: "Me", icon: User }]
    ),
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
              "flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5", isActive && "glow-text")} />
            <span className="text-[10px] font-medium">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
