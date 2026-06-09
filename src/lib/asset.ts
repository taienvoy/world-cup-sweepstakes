// Resolve a public-dir asset against Vite's base path so it works both at the domain
// root (dev / custom domain) and under a GitHub Pages subpath (you.github.io/repo/).
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
export const asset = (path: string) => `${base}/${path.replace(/^\//, "")}`;
