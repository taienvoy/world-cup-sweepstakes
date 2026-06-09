// Layered atmospheric background shared across pages: the FIFA bg image, a deep
// pitch gradient, drifting color auroras, and a subtle film grain.

import { asset } from "../lib/asset";

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
        style={{ backgroundImage: `url(${asset("textures/bg.jpg")})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,var(--color-pitch-800)_0%,var(--color-pitch-900)_55%,var(--color-pitch-950)_100%)]" />

      {/* drifting auroras */}
      <div
        className="absolute -left-40 top-[-10%] h-[55vmax] w-[55vmax] rounded-full opacity-40 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-violet) 60%, transparent), transparent 70%)",
          animation: "spin-slow 48s linear infinite",
        }}
      />
      <div
        className="absolute right-[-15%] top-[20%] h-[48vmax] w-[48vmax] rounded-full opacity-30 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-cyan) 55%, transparent), transparent 70%)",
          animation: "spin-slow 60s linear infinite reverse",
        }}
      />
      <div
        className="absolute bottom-[-20%] left-[30%] h-[50vmax] w-[50vmax] rounded-full opacity-25 blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-magenta) 50%, transparent), transparent 70%)",
          animation: "spin-slow 72s linear infinite",
        }}
      />

      {/* vignette + grain */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_50%,transparent_55%,var(--color-pitch-950)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
