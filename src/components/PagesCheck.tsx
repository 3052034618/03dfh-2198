import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  ScanFace,
  Crosshair,
  FileText,
  ArrowRightLeft,
} from "lucide-react";
import { useComicStore } from "@/store/comicStore";
import { checkPages, cn } from "@/utils";
import type { PageCheckIssue } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

function SeverityIcon({ severity }: { severity: PageCheckIssue["severity"] }) {
  if (severity === "error")
    return <AlertCircle size={15} className="text-red-500 shrink-0" />;
  if (severity === "warn")
    return <AlertTriangle size={15} className="text-accent-orange shrink-0" />;
  return <Info size={15} className="text-accent-green shrink-0" />;
}

function TypeIcon({ type }: { type: PageCheckIssue["type"] }) {
  if (type === "gap") return <FileText size={13} />;
  if (type === "order") return <ArrowRightLeft size={13} />;
  if (type === "break") return <Crosshair size={13} />;
  return null;
}

export default function PagesCheck() {
  const work = useComicStore((s) => s.currentWork);
  const selectPage = useComicStore((s) => s.selectPage);

  const issues = useMemo(() => {
    if (!work) return [];
    return checkPages(
      work.estimatedPages || 0,
      work.pages.length,
      work.pages.map((p) => ({ fileName: p.fileName, index: p.index })),
    );
  }, [work]);

  const scrollToPage = (pageIdx: number) => {
    scrollToPages([pageIdx]);
  };

  const scrollToPages = (pageIndices: number[]) => {
    if (!work || pageIndices.length === 0) return;
    const sorted = [...pageIndices].sort((a, b) => a - b);
    const midIdx = sorted[Math.floor(sorted.length / 2)];
    const midPage = work.pages[midIdx];
    if (!midPage) return;
    selectPage(midPage.id);

    requestAnimationFrame(() => {
      const els: Element[] = [];
      sorted.forEach((idx) => {
        const page = work.pages[idx];
        if (page) {
          const el = document.querySelector(`[data-page-id="${page.id}"]`);
          if (el) {
            els.push(el);
            el.classList.add(
              "ring-2",
              "ring-accent-orange",
              "ring-offset-2",
              "ring-offset-paper-50",
            );
            setTimeout(() => {
              el.classList.remove(
                "ring-2",
                "ring-accent-orange",
                "ring-offset-2",
                "ring-offset-paper-50",
              );
            }, 2500);
          }
        }
      });

      const midEl = els[Math.floor(els.length / 2)];
      if (midEl) {
        midEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    });
  };

  if (!work) {
    return (
      <div className="paper-card p-4 grain-overlay">
        <div className="flex items-center gap-2 text-ink-400 text-sm">
          <ScanFace size={16} />
          上传分镜后这里会自动检查页数和页序
        </div>
      </div>
    );
  }

  const hasError = issues.some((i) => i.severity === "error");
  const hasWarn = issues.some((i) => i.severity === "warn");
  const allOk = issues.length === 1 && issues[0].type === "ok";

  const headerIcon = hasError ? (
    <AlertCircle size={18} className="text-red-500" />
  ) : hasWarn ? (
    <AlertTriangle size={18} className="text-accent-orange" />
  ) : (
    <CheckCircle2 size={18} className="text-accent-green" />
  );

  const headerTitle = hasError
    ? "发现需要注意的问题"
    : hasWarn
      ? "有一些建议可以看看"
      : "页数 & 页序检查通过";

  const headerClass = hasError
    ? "bg-red-50/80 border-red-200"
    : hasWarn
      ? "bg-accent-orangeSoft/60 border-accent-orange/20"
      : "bg-accent-greenSoft/60 border-accent-green/20";

  return (
    <div className="paper-card overflow-hidden grain-overlay">
      <div className={cn("p-4 border-b", headerClass)}>
        <div className="flex items-center gap-2.5">
          {headerIcon}
          <div className="flex-1">
            <div className="font-serif font-semibold text-ink-900 text-sm leading-tight">
              {headerTitle}
            </div>
            <div className="text-[11px] text-ink-500 mt-0.5 leading-tight">
              实际 {work.pages.length} 页 / 预计 {work.estimatedPages || "-"} 页
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-ink-400">
            <ScanFace size={12} />
            自动检查
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {issues.map((issue, idx) => (
            <motion.div
              key={issue.type + "_" + idx}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ delay: idx * 0.04 }}
              className={cn(
                "flex items-start gap-2.5 p-3 rounded-xl border",
                issue.severity === "error"
                  ? "bg-red-50/60 border-red-200"
                  : issue.severity === "warn"
                    ? "bg-accent-orangeSoft/40 border-accent-orange/15"
                    : "bg-accent-greenSoft/40 border-accent-green/15",
              )}
            >
              <div className="pt-0.5">
                <SeverityIcon severity={issue.severity} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "text-sm font-medium leading-snug flex items-center gap-1.5",
                    issue.severity === "error"
                      ? "text-red-700"
                      : issue.severity === "warn"
                        ? "text-ink-800"
                        : "text-accent-green",
                  )}
                >
                  <TypeIcon type={issue.type} />
                  {issue.message}
                </div>
                {issue.detail && (
                  <div className="text-[11px] text-ink-500 mt-1 leading-relaxed">
                    {issue.detail}
                  </div>
                )}

                {issue.relatedPageIndices && issue.relatedPageIndices.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-ink-400">相关页：</span>
                    {issue.relatedPageIndices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => scrollToPages(issue.relatedPageIndices!)}
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-accent-orangeSoft border border-accent-orange/30 text-[10px] font-medium text-accent-orange hover:bg-accent-orange hover:text-white transition-colors shadow-sm"
                      >
                        <Crosshair size={9} />
                        全部定位 ({issue.relatedPageIndices.length} 页)
                      </button>
                    )}
                    {issue.relatedPageIndices.map((pi) => (
                      <button
                        key={pi}
                        type="button"
                        onClick={() => scrollToPage(pi)}
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white border border-paper-300 text-[10px] font-medium text-ink-600 hover:border-accent-orange hover:text-accent-orange transition-colors shadow-sm"
                      >
                        第 {pi + 1} 页
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 标签分布快速统计 */}
        {work.pages.length > 0 && (
          <div className="pt-2 mt-2 border-t border-paper-200 grid grid-cols-4 gap-2">
            {(["setup", "climax", "transition", "fight"] as const).map((t) => {
              const count = work.pages.filter((p) => p.tag === t).length;
              const meta = {
                setup: { label: "铺垫", color: "text-tag-setup" },
                climax: { label: "爆点", color: "text-tag-climax" },
                transition: { label: "转场", color: "text-tag-transition" },
                fight: { label: "打斗", color: "text-tag-fight" },
              }[t];
              return (
                <div
                  key={t}
                  className="rounded-lg bg-paper-100 border border-paper-200 p-2 text-center"
                >
                  <div className={`font-serif font-bold text-lg ${meta.color}`}>
                    {count}
                  </div>
                  <div className="text-[10px] text-ink-400 mt-0.5">{meta.label}</div>
                </div>
              );
            })}
          </div>
        )}

        {allOk && work.pages.length > 0 && (
          <div className="text-center text-[11px] text-ink-400 pt-1 leading-relaxed">
            ✅ 一切看起来都挺顺的，可以去模拟阅读页感受下实际节奏
          </div>
        )}
      </div>
    </div>
  );
}
