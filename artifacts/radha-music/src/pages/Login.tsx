import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Disc3, Lock } from "lucide-react";

export default function Login() {
  const [telegramId, setTelegramId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId.trim()) return;
    setLoading(true);
    setError("");
    const ok = await login(telegramId.trim());
    if (!ok) setError("Access denied. Sirf owner hi app khol sakta hai.");
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-sm p-8 backdrop-blur-md bg-card/40 border border-border/50 rounded-2xl glow-box">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary glow-box relative">
            <Disc3 size={32} className="animate-spin" style={{ animationDuration: '4s' }} />
            <Lock size={12} className="absolute bottom-2 right-2 text-primary" />
          </div>
          <h1 className="text-3xl tracking-tight text-white glow-text mb-1" style={{ fontFamily: 'Audiowide, cursive' }}>
            NOBITA MUSIC
          </h1>
          <p className="text-muted-foreground text-sm text-center">Owner login required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="tid" className="text-sm font-medium text-foreground">
              Telegram ID
            </label>
            <input
              id="tid"
              type="text"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="Apna Telegram ID daalo"
              className="w-full px-3 py-2 rounded-lg bg-background/50 border border-primary/30 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !telegramId.trim()}
            className="w-full py-2 rounded-lg bg-primary text-white font-medium text-sm mt-2 disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
