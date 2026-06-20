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
const SHARE_SHORT_PREFIX = "comic-checklist:share:";

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

export type ShareMode = "long" | "short";

export interface ShortShareRecord {
  id: string;
  createdAt: number;
  expireAt: number;
  pkg: SharePackage;
}

export const SHORT_SHARE_TTL = 1000 * 60 * 60 * 24 * 14; // 14 天

export function saveShortShare(pkg: SharePackage): string {
  const id = uid("");
  const rec: ShortShareRecord = {
    id,
    createdAt: Date.now(),
    expireAt: Date.now() + SHORT_SHARE_TTL,
    pkg,
  };
  try {
    localStorage.setItem(SHARE_SHORT_PREFIX + id, JSON.stringify(rec));
  } catch {
    /* 容量不足时清理过期记录再尝试 */
    cleanupExpiredShortShares();
    try {
      localStorage.setItem(SHARE_SHORT_PREFIX + id, JSON.stringify(rec));
    } catch {
      throw new Error("本地存储空间不足，无法创建短链接");
    }
  }
  return id;
}

export function loadShortShare(id: string): SharePackage | null {
  try {
    const raw = localStorage.getItem(SHARE_SHORT_PREFIX + id);
    if (!raw) return null;
    const rec = JSON.parse(raw) as ShortShareRecord;
    if (Date.now() > rec.expireAt) {
      localStorage.removeItem(SHARE_SHORT_PREFIX + id);
      return null;
    }
    return rec.pkg;
  } catch {
    return null;
  }
}

export function cleanupExpiredShortShares(): number {
  let removed = 0;
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(SHARE_SHORT_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const rec = JSON.parse(raw) as ShortShareRecord;
        if (now > rec.expireAt) {
          localStorage.removeItem(key);
          removed++;
          i--;
        }
      }
    } catch {
      localStorage.removeItem(key);
      removed++;
      i--;
    }
  }
  return removed;
}

export function generateShortLink(id: string): string {
  const base = window.location.href.split("#")[0].replace(/\/$/, "");
  return `${base}#/s/${id}`;
}

export function generateLongLink(pkg: SharePackage): string {
  return generateShareLink(pkg);
}

export function buildStandaloneHtml(pkg: SharePackage, feedback?: string[]): string {
  const pages = pkg.pg
    .map((p, i) => {
      const tagLabel = p.t ? `(${TAG_LABEL[p.t] || ""})` : "";
      const concerns = p.c
        ? `<div class="concern"><span class="tag tag-concern">作者担心</span><p>${escapeHtml(p.c)}</p></div>`
        : "";
      const fb = feedback?.[i]
        ? `<div class="feedback"><span class="tag tag-feedback">编辑反馈</span><p>${escapeHtml(feedback[i])}</p></div>`
        : "";
      const tagChip = p.t
        ? `<span class="chip chip-${p.t}">${TAG_EMOJI[p.t] || ""} ${TAG_LABEL[p.t] || ""}</span>`
        : "";
      return `
<section class="page-card" data-idx="${i}">
  <div class="page-head">
    <div class="page-no">第 ${i + 1} 页</div>
    ${tagChip}
  </div>
  <div class="page-img-wrap">
    <img src="${p.i}" alt="第 ${i + 1} 页 ${tagLabel}" />
  </div>
  ${concerns}
  ${fb}
</section>`;
    })
    .join("");

  const platformLabel =
    { wechat: "微信公众号", kuaikan: "快看漫画", bilibili: "哔哩哔哩漫画", dongman: "腾讯动漫", other: "其他平台" }[pkg.p] || pkg.p;
  const directionLabel =
    { vertical: "从上到下（条漫）", rtl: "从右到左（页漫）" }[pkg.d] || pkg.d;

  const total = pkg.pg.length;
  const tagStat: Record<string, number> = {};
  pkg.pg.forEach((p) => {
    if (p.t) tagStat[p.t] = (tagStat[p.t] || 0) + 1;
  });
  const statHtml = Object.entries(tagStat)
    .map(([k, v]) => `<span class="mini-chip chip-${k}">${TAG_EMOJI[k] || ""} ${TAG_LABEL[k] || k} ${v}</span>`)
    .join("");

  const feedbackSumHtml = feedback?.some((t) => t?.trim())
    ? `
<div class="summary">
  <h3>💬 反馈汇总</h3>
  <ol>
    ${feedback
      .map((t, i) =>
        t?.trim()
          ? `<li><span class="sum-no">第 ${i + 1} 页</span><p>${escapeHtml(t)}</p></li>`
          : "",
      )
      .filter(Boolean)
      .join("")}
  </ol>
</div>`
    : "";

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(pkg.t || "分镜审稿包")} · 分镜自查</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;background:#FAF8F5;color:#2C2A27;-webkit-font-smoothing:antialiased;
    background-image:radial-gradient(circle at 10% 0%,rgba(232,116,74,.04) 0,transparent 40%),radial-gradient(circle at 90% 100%,rgba(74,107,92,.04) 0,transparent 45%);}
  .wrap{max-width:760px;margin:0 auto;padding:32px 16px 80px}
  .hero{background:#fff;border-radius:16px;padding:24px;margin-bottom:24px;box-shadow:0 1px 3px rgba(44,42,39,.04),0 4px 12px rgba(44,42,39,.06);border:1px solid #EBE5DB}
  .hero h1{margin:0 0 6px;font-family:"Noto Serif SC","Source Han Serif SC",Georgia,serif;font-size:22px;letter-spacing:.5px}
  .hero .meta{font-size:13px;color:#8A857D;display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:10px}
  .hero .meta span b{color:#2C2A27;font-weight:500}
  .stat{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
  .mini-chip{padding:3px 10px;border-radius:999px;font-size:12px;color:#fff}
  .chip-setup{background:#9AA8B5}.chip-climax{background:#E8744A}.chip-transition{background:#8B7B9D}
  .chip-fight{background:#C25454}.chip-daily{background:#6B9E7E}.chip-suspense{background:#5C6FA8}
  .chip-comedy{background:#D4A24E}.chip-emotion{background:#B57A9B}
  .page-card{background:#fff;border-radius:16px;padding:18px;margin-bottom:20px;box-shadow:0 1px 3px rgba(44,42,39,.04),0 4px 12px rgba(44,42,39,.06);border:1px solid #EBE5DB;page-break-inside:avoid}
  .page-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .page-no{font-family:"Noto Serif SC",serif;font-weight:600;color:#2C2A27}
  .chip{padding:3px 10px;border-radius:999px;font-size:12px;color:#fff}
  .page-img-wrap{border-radius:12px;overflow:hidden;background:#000;aspect-ratio:9/16;max-height:640px;display:flex;align-items:center;justify-content:center}
  .page-img-wrap img{max-width:100%;max-height:100%;object-fit:contain}
  .concern,.feedback{margin-top:12px;padding:12px 14px;border-radius:10px;font-size:13px;line-height:1.7}
  .concern{background:#FBE8DE;border:1px solid #F2CCB6;color:#6d3a22}
  .feedback{background:#E2EDE7;border:1px solid #C5DBD0;color:#2e473d}
  .concern p,.feedback p{margin:4px 0 0;white-space:pre-wrap}
  .tag{display:inline-block;padding:1px 8px;border-radius:6px;font-size:11px;font-weight:500}
  .tag-concern{background:#fff;color:#E8744A}
  .tag-feedback{background:#fff;color:#4A6B5C}
  .summary{background:linear-gradient(135deg,#fff 0%,#FDFBF8 100%);border-radius:16px;padding:20px 24px;border:1px solid #EBE5DB;box-shadow:0 1px 3px rgba(44,42,39,.04),0 4px 12px rgba(44,42,39,.06)}
  .summary h3{margin:0 0 12px;font-family:"Noto Serif SC",serif;color:#2C2A27}
  .summary ol{margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:10px}
  .summary li{padding:10px 14px;border-radius:10px;background:#FAF8F5;border:1px solid #EBE5DB}
  .sum-no{display:inline-block;margin-right:8px;font-weight:600;color:#E8744A;font-family:"Noto Serif SC",serif;font-size:13px}
  .summary p{margin:4px 0 0;font-size:13px;color:#5D5952;white-space:pre-wrap;line-height:1.7}
  .footer{text-align:center;margin-top:40px;font-size:12px;color:#B8B3AB;padding:16px}
  @media print{body{background:#fff}.wrap{padding:0}.page-card{box-shadow:none;border-color:#ddd;break-inside:avoid}}
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <h1>📖 ${escapeHtml(pkg.t || "未命名作品")}</h1>
    <div class="meta">
      <span>目标平台：<b>${platformLabel}</b></span>
      <span>阅读方向：<b>${directionLabel}</b></span>
      <span>页数：<b>${total} 页</b></span>
    </div>
    ${statHtml ? `<div class="stat">${statHtml}</div>` : ""}
  </div>
  ${pages}
  ${feedbackSumHtml}
  <div class="footer">由「分镜自查」导出 · ${new Date().toLocaleString("zh-CN")}</div>
</div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const TAG_EMOJI: Record<string, string> = {
  setup: "🌱", climax: "💥", transition: "↪️", fight: "⚔️",
  daily: "🏠", suspense: "👁️", comedy: "😄", emotion: "💗",
};
const TAG_LABEL: Record<string, string> = {
  setup: "铺垫", climax: "爆点", transition: "转场", fight: "打斗",
  daily: "日常", suspense: "悬疑", comedy: "搞笑", emotion: "情感",
};

export function exportStandaloneHtml(
  pkg: SharePackage,
  title = "分镜审稿包",
  feedback?: string[],
) {
  const html = buildStandaloneHtml(pkg, feedback);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title || "分镜审稿包"}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportFeedbackText(
  pkg: SharePackage,
  feedback: string[],
  title = "分镜审稿反馈",
): string {
  const platformLabel =
    { wechat: "微信公众号", kuaikan: "快看漫画", bilibili: "哔哩哔哩漫画", dongman: "腾讯动漫", other: "其他平台" }[pkg.p] || pkg.p;
  const directionLabel =
    { vertical: "从上到下（条漫）", rtl: "从右到左（页漫）" }[pkg.d] || pkg.d;
  const lines: string[] = [];
  lines.push("=".repeat(48));
  lines.push(`📖 ${pkg.t || "未命名作品"} - 审稿反馈汇总`);
  lines.push("=".repeat(48));
  lines.push(`生成时间：${new Date().toLocaleString("zh-CN")}`);
  lines.push(`目标平台：${platformLabel}`);
  lines.push(`阅读方向：${directionLabel}`);
  lines.push(`总页数：${pkg.pg.length}`);
  lines.push("");
  pkg.pg.forEach((p, i) => {
    const tagStr = p.t ? ` [${TAG_EMOJI[p.t]} ${TAG_LABEL[p.t]}]` : "";
    lines.push(`── 第 ${i + 1} 页${tagStr} ──`);
    if (p.c) {
      lines.push(`💭 作者担心：${p.c}`);
    }
    if (feedback[i]?.trim()) {
      lines.push(`💬 编辑反馈：${feedback[i].trim()}`);
    }
    if (!p.c && !feedback[i]?.trim()) {
      lines.push(`   (无备注)`);
    }
    lines.push("");
  });
  const hasAny = feedback.some((t) => t?.trim());
  if (hasAny) {
    lines.push("=".repeat(48));
    lines.push("📋 反馈要点索引（仅含有反馈的页）");
    lines.push("=".repeat(48));
    pkg.pg.forEach((p, i) => {
      if (feedback[i]?.trim()) {
        const tagStr = p.t ? ` [${TAG_LABEL[p.t]}]` : "";
        lines.push(`第 ${String(i + 1).padStart(2, " ")} 页${tagStr}：${feedback[i].trim().split("\n")[0].slice(0, 40)}${feedback[i].trim().length > 40 ? "…" : ""}`);
      }
    });
  }
  const text = lines.join("\n");
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title || "分镜审稿反馈"}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return text;
}

/* ---------------- 页数与断点检查 ---------------- */
export interface PageCheckIssue {
  type: "missing" | "excess" | "break" | "gap" | "ok";
  severity: "info" | "warn" | "error";
  message: string;
  detail?: string;
}

export function checkPages(
  estimated: number,
  actual: number,
  pages: Array<{ fileName: string; index: number }>,
): PageCheckIssue[] {
  const issues: PageCheckIssue[] = [];
  const diff = actual - estimated;

  if (diff === 0) {
    issues.push({
      type: "ok",
      severity: "info",
      message: `页数正好：${actual} / ${estimated} 页 ✅`,
    });
  } else if (diff < 0) {
    issues.push({
      type: "missing",
      severity: "warn",
      message: `缺页：还差 ${Math.abs(diff)} 页`,
      detail: `目前 ${actual} 页，预计 ${estimated} 页`,
    });
  } else {
    issues.push({
      type: "excess",
      severity: "warn",
      message: `超页：多了 ${diff} 页`,
      detail: `目前 ${actual} 页，预计 ${estimated} 页`,
    });
  }

  /* 检查 index 连续性 */
  const sorted = [...pages].sort((a, b) => a.index - b.index);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].index !== sorted[i - 1].index + 1) {
      issues.push({
        type: "break",
        severity: "error",
        message: `页序断点：第 ${sorted[i - 1].index + 1} 位后跳到了 ${sorted[i].index + 1} 位`,
        detail: `可能是排序数据出了点问题，建议重新拖动调整`,
      });
      break;
    }
  }

  /* 检查文件名中的数字序列是否有缺号（启发式） */
  const fileNums = pages
    .map((p) => {
      const m = p.fileName.match(/(\d{1,4})/g);
      if (!m) return null;
      return Number(m[m.length - 1]);
    })
    .filter((n): n is number => n != null && !isNaN(n) && n > 0)
    .sort((a, b) => a - b);

  if (fileNums.length >= 3) {
    const expectedMin = fileNums[0];
    const expectedMax = fileNums[fileNums.length - 1];
    const expectedCount = expectedMax - expectedMin + 1;
    if (expectedCount > fileNums.length && expectedCount - fileNums.length <= 10) {
      const missing: number[] = [];
      for (let n = expectedMin; n <= expectedMax; n++) {
        if (!fileNums.includes(n)) missing.push(n);
      }
      if (missing.length) {
        issues.push({
          type: "gap",
          severity: "warn",
          message: `文件名可能缺号：缺少 ${missing.slice(0, 5).join("、")}${missing.length > 5 ? " 等" : ""}`,
          detail: `按文件名编号分析，预计从 ${expectedMin} 到 ${expectedMax}，可能漏传了 ${missing.length} 张`,
        });
      }
    }
  }
  return issues;
}
