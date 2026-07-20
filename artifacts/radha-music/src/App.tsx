import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/lib/auth-context';
import { PlayerProvider } from '@/lib/player-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { Sidebar, BottomNav } from '@/components/Sidebar';
import { BottomPlayer } from '@/components/BottomPlayer';

import Home from '@/pages/Home';
import History from '@/pages/History';
import Favorites from '@/pages/Favorites';
import Playlist from '@/pages/Playlist';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {/* Main content area */}
          <div className="flex-1 relative">
            {children}
          </div>
        </main>
        <BottomPlayer />
        <BottomNav />
      </div>
    </PlayerProvider>
  );
}

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/history" component={History} />
        <Route path="/favorites" component={Favorites} />
        <Route path="/playlist" component={Playlist} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
