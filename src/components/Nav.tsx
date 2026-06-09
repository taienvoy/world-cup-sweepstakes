import { NavLink } from "react-router-dom";
import ThemePicker from "./ThemePicker";
import { useTheme } from "../hooks/useTheme";
import { asset } from "../lib/asset";

const linkBase =
  "relative px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-200 rounded-full";

const tab = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? "bg-white/90 text-pitch-950" : "text-white/70 hover:text-white"}`;

export default function Nav() {
  const [theme, setTheme] = useTheme();

  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <img src={asset("envoy-logo.png")} alt="Envoy" className="h-11 w-auto drop-shadow-lg" />
        <div className="leading-tight">
          <div className="eyebrow text-gold/80">Envoy London · WC 2026</div>
          <div className="font-display text-lg tracking-wide">THE SWEEPSTAKES</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <nav className="glass flex items-center gap-1 rounded-full p-1">
          <NavLink to="/" className={tab}>
            Dashboard
          </NavLink>
          <NavLink to="/leaderboard" className={tab}>
            Leaderboard
          </NavLink>
          <NavLink to="/draw" className={tab}>
            The Draw
          </NavLink>
        </nav>
        <ThemePicker theme={theme} setTheme={setTheme} />
      </div>
    </header>
  );
}
