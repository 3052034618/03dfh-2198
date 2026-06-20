import { useMemo } from "react";
import {
  Tag,
  FileQuestion,
  ZoomIn,
  PanelRightClose,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useComicStore } from "@/store/comicStore";
import { TAG_META, type PageTag } from "@/types";
import { cn } from "@/utils";

const TAGS = Object.keys(TAG_META) as PageTag[];

export default function SidePanel() {
  const work = useComicStore((s) => s.currentWork);
  const selectedId = useComicStore((s) => s.selectedPageId);
  const setTag = useComicStore((s) => s.setPageTag);
  const setConcerns = useComicStore((s) => s.setPageConcerns);
  const selectPage = useComicStore((s) => s.selectPage);

  const page = useMemo(() => {
    if (!work || !selectedId) return null;
    return work.pages.find((p) => p.id === selectedId) ?? null;
  }, [work, selectedId]);

  return (
    <aside className="paper-card h-full flex flex-col grain-overlay">
      <div className="p-4 border-b border-paper-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-greenSoft flex items-center justify-center text-accent-green">
            <Tag size={16} />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-ink-900 text-sm leading-tight">
              自评面板
            </h3>
            <p className="text-[11px] text-ink-400 leading-tight mt-0.5">
              {page ? `第 ${page.index + 1} 页` : "请选择一页"}
            </p>
          </div>
        </div>
        {page && (
          <button
            type="button"
            onClick={() => selectPage(null)}
            className="btn-ghost !p-1.5"
            title="取消选择"
          >
            <PanelRightClose size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!page ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-paper-200 flex items-center justify-center text-ink-300 mb-3">
                <ZoomIn size={26} />
              </div>
              <div className="font-serif text-ink-500 font-medium">
                从左侧点击一页分镜
              </div>
              <div className="text-xs text-ink-400 mt-1.5 leading-relaxed max-w-[220px]">
                可以为每页打上用途标签，并记下你担心的问题
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 space-y-5"
            >
              <div className="rounded-xl overflow-hidden bg-paper-200 border border-paper-300 shadow-paper">
                <img
                  src={page.imageDataUrl}
                  alt={`第 ${page.index + 1} 页预览`}
                  className="w-full h-auto max-h-[280px] object-contain"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Tag size={14} className="text-ink-400" />
                  <span className="text-sm font-medium text-ink-700">
                    这一页的用途
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TAGS.map((t) => {
                    const meta = TAG_META[t];
                    const active = page.tag === t;
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setTag(page.id, active ? null : t)}
                        className={cn(
                          "tag-chip-selectable",
                          active
                            ? `${meta.color} text-white border-transparent shadow-paper`
                            : `bg-paper-100 text-ink-600 border-paper-300 hover:bg-paper-200`,
                        )}
                      >
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
                {page.tag && (
                  <div className="mt-3 text-xs text-ink-400 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-orange/70" />
                    已标记为「{TAG_META[page.tag].label}」，模拟阅读时会高亮提示
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <FileQuestion size={14} className="text-ink-400" />
                  <span className="text-sm font-medium text-ink-700">
                    我担心的问题
                  </span>
                </div>
                <textarea
                  value={page.concerns}
                  onChange={(e) => setConcerns(page.id, e.target.value)}
                  rows={4}
                  placeholder="例如：节奏会不会太慢？分镜语言清楚吗？会不会有画面跳脱的地方？"
                  className={cn(
                    "input-field resize-none text-sm leading-relaxed",
                    "bg-paper-100 placeholder:text-ink-300/80",
                  )}
                />
                {page.concerns && (
                  <div className="mt-2 flex items-start gap-1.5 text-[11px] text-ink-400">
                    <AlertCircle size={12} className="mt-0.5 shrink-0 text-accent-orange/80" />
                    审稿包导出时会把这些问题附在对应页，方便编辑或朋友给你针对性反馈
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
