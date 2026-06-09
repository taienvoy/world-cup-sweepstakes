import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // "/" for local dev & custom domains; the deploy workflow sets VITE_BASE to
  // "/<repo>/" so assets resolve under the GitHub Pages subpath.
  base: process.env.VITE_BASE || "/",
  plugins: [react(), tailwindcss()],
  server: { host: true },
});
