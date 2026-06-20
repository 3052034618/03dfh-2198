import type { SharePackage, Work } from "@/types";

export function uid(prefix = ""): string {
  return (
    prefix +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 9)
  );
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function generateThumbnail(
  dataUrl: string,
  maxSize = 240,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, maxSize / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export function urlSafeEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function urlSafeDecode(encoded: string): string {
  let s = encoded.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  try {
    return decodeURIComponent(escape(atob(s)));
  } catch {
    return "";
  }
}

export function buildSharePackage(work: Work): SharePackage {
  return {
    t: work.title,
    p: work.platform,
    d: work.readDirection,
    pg: work.pages
      .sort((a, b) => a.index - b.index)
      .map((p) => ({
        i: p.imageDataUrl,
        t: p.tag,
        c: p.concerns,
      })),
  };
}

export function generateShareLink(pkg: SharePackage): string {
  const json = JSON.stringify(pkg);
  const encoded = urlSafeEncode(json);
  const base = window.location.href.split("#")[0].replace(/\/$/, "");
  return `${base}#/share/${encoded}`;
}

export function parseShareLink(encoded: string): SharePackage | null {
  try {
    const json = urlSafeDecode(encoded);
    if (!json) return null;
    return JSON.parse(json) as SharePackage;
  } catch {
    return null;
  }
}

export function estimateDataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.round((base64.length * 3) / 4);
}

export function cn(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

export const STORAGE_KEY = "comic-checklist:work:current";

export function saveWorkToStorage(work: Work): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(work));
  } catch (e) {
    console.warn("保存失败，可能超出 LocalStorage 容量", e);
  }
}

export function loadWorkFromStorage(): Work | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Work;
  } catch {
    return null;
  }
}
