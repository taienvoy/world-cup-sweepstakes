import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { THEMES } from "../lib/themes";

export default function ThemePicker({
  theme,
  setTheme,
}: {
  theme: string;
  setTheme: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change theme"
        className="glass flex h-10 items-center gap-2 rounded-full px-3 transition-colors hover:bg-white/10"
      >
        <span className="flex -space-x-1">
          {active.swatches.slice(0, 2).map((c, i) => (
            <span
              key={i}
              className="h-3.5 w-3.5 rounded-full border border-white/30"
              style={{ background: c }}
            />
          ))}
        </span>
        <span className="hidden text-sm font-medium text-white/80 sm:inline">{active.name}</span>
        <span className="text-white/40">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="glass absolute right-0 z-50 mt-2 w-60 rounded-2xl p-2"
          >
            <div className="eyebrow px-2 py-1.5 text-white/40">Theme</div>
            {THEMES.map((t) => {
              const isActive = t.id === theme;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors ${
                    isActive ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <span className="flex -space-x-1.5">
                    {t.swatches.map((c, i) => (
                      <span
                        key={i}
                        className="h-5 w-5 rounded-full border-2 border-pitch-900"
                        style={{ background: c }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="block text-[11px] text-white/45">{t.blurb}</span>
                  </span>
                  {isActive && <span className="text-gold">✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
