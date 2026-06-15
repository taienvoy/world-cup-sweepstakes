import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Pages the screen rotates through, with how long each is shown (ms).
const ROTATION = ["/", "/leaderboard"];
const DWELL: Record<string, number> = { "/": 22000, "/leaderboard": 18000 };
const HOLD = 1800; // pause at the bottom before switching

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function Kiosk({
  active,
  seconds,
  onExit,
}: {
  active: boolean;
  seconds?: number;
  onExit: () => void;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState(0);

  const dwell = seconds ? seconds * 1000 : (DWELL[pathname] ?? 18000);

  // Esc exits the kiosk.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onExit();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onExit]);

  // On each page entry: jump to top, slowly auto-scroll to the bottom, then advance.
  useEffect(() => {
    if (!active) return;

    // If we're parked on a non-rotation page (e.g. the draw), rejoin the loop.
    if (!ROTATION.includes(pathname)) {
      navigate("/");
      return;
    }

    window.scrollTo(0, 0);
    const scrollMs = Math.max(1000, dwell - HOLD);
    let raf = 0;
    let start: number | null = null;
    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / scrollMs);
      window.scrollTo(0, maxScroll() * easeInOut(p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const switchTimer = window.setTimeout(() => {
      const i = ROTATION.indexOf(pathname);
      navigate(ROTATION[(i + 1) % ROTATION.length]);
      setCycle((c) => c + 1);
    }, dwell);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(switchTimer);
    };
  }, [active, pathname, dwell, navigate]);

  if (!active) return null;

  return (
    <>
      {/* countdown-to-switch progress bar */}
      <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-white/10">
        <div
          key={`${pathname}-${cycle}`}
          className="h-full bg-gradient-to-r from-gold via-magenta to-cyan"
          style={{ animation: `kiosk-fill ${dwell}ms linear forwards` }}
        />
      </div>

      {/* exit affordance */}
      <button
        onClick={onExit}
        title="Exit kiosk (Esc)"
        className="glass fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full px-4 py-2 text-xs text-white/70 transition-colors hover:text-white"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
        Kiosk · Stop
      </button>
    </>
  );
}
