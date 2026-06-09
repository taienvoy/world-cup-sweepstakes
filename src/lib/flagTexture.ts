import * as THREE from "three";
import { flagUrl } from "../data/teams";

const cache = new Map<string, THREE.Texture>();

/** Rasterize a flag SVG onto a rounded canvas and return a cached THREE texture. */
export function loadFlagTexture(code: string): Promise<THREE.Texture> {
  const existing = cache.get(code);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = 256;
      const h = 192;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      const r = 26;
      // rounded rect clip
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.arcTo(w, 0, w, h, r);
      ctx.arcTo(w, h, 0, h, r);
      ctx.arcTo(0, h, 0, 0, r);
      ctx.arcTo(0, 0, w, 0, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0, w, h);
      // subtle inner border
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 6;
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      cache.set(code, tex);
      resolve(tex);
    };
    img.onerror = () => {
      // fallback: solid panel so the globe never breaks
      const canvas = document.createElement("canvas");
      canvas.width = 4;
      canvas.height = 3;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#1b2440";
      ctx.fillRect(0, 0, 4, 3);
      const tex = new THREE.CanvasTexture(canvas);
      cache.set(code, tex);
      resolve(tex);
    };
    img.src = flagUrl(code);
  });
}

export function preloadFlags(codes: string[]): Promise<THREE.Texture[]> {
  return Promise.all(codes.map(loadFlagTexture));
}
