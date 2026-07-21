import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    // enter → hold after 400ms
    const t1 = setTimeout(() => setPhase("hold"), 400);
    // hold → exit after 2200ms
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    // done after exit animation (300ms)
    const t3 = setTimeout(() => onDone(), 2550);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-background overflow-hidden"
      style={{
        opacity: phase === "exit" ? 0 : 1,
        transition: phase === "exit" ? "opacity 0.3s ease-in" : "none",
      }}
    >
      {/* Background glow blobs */}
      <div className="absolute top-1/3 left-1/3 w-[28rem] h-[28rem] bg-primary/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-secondary/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Disc icon */}
      <div
        className="relative mb-8"
        style={{
          transform: phase === "enter" ? "scale(0.4)" : "scale(1)",
          opacity: phase === "enter" ? 0 : 1,
          transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease",
        }}
      >
        {/* Outer ring */}
        <div className="w-28 h-28 rounded-full border-2 border-primary/30 flex items-center justify-center animate-spin-slow">
          <div className="w-20 h-20 rounded-full border-2 border-primary/50 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary glow-text" />
            </div>
          </div>
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: "1.5s" }} />
      </div>

      {/* NOBITA MUSIC title */}
      <h1
        className="text-4xl md:text-5xl tracking-widest text-white glow-text mb-3 text-center"
        style={{
          fontFamily: "Audiowide, cursive",
          transform: phase === "enter" ? "translateY(24px)" : "translateY(0)",
          opacity: phase === "enter" ? 0 : 1,
          transition: "transform 0.55s cubic-bezier(0.34,1.2,0.64,1) 0.1s, opacity 0.45s ease 0.1s",
          letterSpacing: "0.2em",
        }}
      >
        NOBITA MUSIC
      </h1>

      {/* Powered by Nobita */}
      <p
        className="text-sm text-muted-foreground tracking-[0.25em] uppercase"
        style={{
          transform: phase === "enter" ? "translateY(16px)" : "translateY(0)",
          opacity: phase === "enter" ? 0 : 0.7,
          transition: "transform 0.55s ease 0.25s, opacity 0.5s ease 0.25s",
        }}
      >
        Powered by Nobita
      </p>

      {/* Equalizer bars */}
      <div
        className="flex items-end gap-1 mt-10"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transition: "opacity 0.4s ease 0.35s",
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-primary/70"
            style={{
              height: `${8 + (i % 3) * 8}px`,
              animation: `eqBounce ${0.6 + i * 0.12}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes eqBounce {
          from { transform: scaleY(1); }
          to   { transform: scaleY(2.5); }
        }
      `}</style>
    </div>
  );
}
