import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Disc3, Lock, Loader2, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { loading, ownerLogin } = useAuth();
  const [telegramId, setTelegramId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId.trim() || !password.trim()) return;
    setSubmitting(true);
    setError("");
    const result = await ownerLogin(telegramId.trim(), password.trim());
    if (!result.ok) {
      if (result.reason === "password") {
        setError("❌ Galat password — dobara try karo.");
      } else {
        setError("❌ Galat ID — sirf owner hi app unlock kar sakta hai.");
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 w-full max-w-sm p-8 backdrop-blur-md bg-card/40 border border-border/50 rounded-2xl glow-box">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary glow-box relative">
            {loading
              ? <Loader2 size={28} className="animate-spin" />
              : <Disc3 size={28} className="animate-spin" style={{ animationDuration: '4s' }} />
            }
            <Lock size={11} className="absolute bottom-2 right-2 text-primary" />
          </div>
          <h1 className="text-3xl tracking-tight text-white glow-text mb-1" style={{ fontFamily: 'Audiowide, cursive' }}>
            NOBITA MUSIC
          </h1>
          <p className="text-muted-foreground text-sm text-center">
            {loading ? "Status check ho raha hai..." : "App abhi band hai — owner login kare to khulegi sabke liye"}
          </p>
        </div>

        {/* Owner login form */}
        {!loading && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Telegram ID */}
            <div className="space-y-2">
              <label htmlFor="tid" className="text-sm font-medium text-foreground">
                Owner Telegram ID
              </label>
              <input
                id="tid"
                type="text"
                value={telegramId}
                onChange={(e) => { setTelegramId(e.target.value); setError(""); }}
                placeholder="Apna Telegram ID daalo"
                className="w-full px-3 py-2 rounded-lg bg-background/50 border border-primary/30 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm transition-colors"
                required
                autoComplete="off"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="pwd" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="pwd"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Password daalo"
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-background/50 border border-primary/30 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm transition-colors"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !telegramId.trim() || !password.trim()}
              className="w-full py-2 rounded-lg bg-primary text-white font-semibold text-sm mt-1 disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {submitting
                ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" />Checking...</span>
                : "🔓 App Unlock Karo"
              }
            </button>

            <p className="text-xs text-muted-foreground text-center pt-1">
              Owner login karne ke baad sare users seedha app use kar payenge
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
