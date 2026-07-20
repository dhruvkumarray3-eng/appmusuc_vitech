import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Disc3 } from "lucide-react";

export default function Login() {
  const [telegramId, setTelegramId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId.trim()) return;
    
    setIsSubmitting(true);
    try {
      await login(telegramId, firstName || undefined);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow delay-1000"></div>
      
      <div className="z-10 w-full max-w-md p-8 backdrop-blur-md bg-card/40 border border-border/50 rounded-2xl glow-box">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary glow-box">
            <Disc3 size={32} className="animate-spin-slow" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white glow-text mb-2">NOBITA MUSIC</h1>
          <p className="text-muted-foreground text-center">Your personalized DJ booth.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="telegramId" className="text-sm font-medium text-foreground">Telegram ID</label>
            <Input
              id="telegramId"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="e.g. 123456789"
              className="bg-background/50 border-primary/30 focus:border-primary focus:ring-primary/50"
              required
              data-testid="input-telegram-id"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name (Optional)</label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. DJ Spark"
              className="bg-background/50 border-primary/30 focus:border-primary focus:ring-primary/50"
              data-testid="input-first-name"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full mt-6" 
            disabled={isSubmitting || !telegramId.trim()}
            data-testid="button-login"
          >
            {isSubmitting ? "Connecting..." : "Enter the Booth"}
          </Button>
        </form>
      </div>
    </div>
  );
}
