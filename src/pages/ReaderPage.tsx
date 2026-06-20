import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Zap,
  Timer,
  CircleHelp,
  Sparkles,
  Volume2,
  Layers,
  BarChart3,
  RotateCcw,
  Clock,
  TrendingUp,
  Bomb,
  AlertTriangle,
} from "lucide-react";
import { useComicStore } from "@/store/comicStore";
import { TAG_META, PLATFORM_META, READ_DIRECTION_META, type ComicPage, type ReadMode } from "@/types";
import { cn } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

function ModeTabs({
  mode,
  onChange,
}: {
  mode: ReadMode;
  onChange: (m: ReadMode) => void;
}) {
  const items: Array<{ key: ReadMode; label: string; icon: typeof Zap; desc: string }> = [
    { key: "flip", label: "快速翻页", icon: Zap, desc: "自由滑动，感受整体节奏" },
    { key: "pause", label: "逐格停顿", icon: Timer, desc: "自动停留，验证悬念落点" },
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-ink-900/80 backdrop-blur-sm border border-white/5">
      {items.map((it) => {
        const active = mode === it.key;
        const Icon = it.icon;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={cn(
              "relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all",
              active
                ? "bg-gradient-to-br from-accent-orange to-accent-orangeHover text-white shadow-lg shadow-accent-orange/30"
                : "text-white/60 hover:text-white hover:bg-white/5",
            )}
          >
            <div className="flex items-center gap-1.5">
              <Icon size={14} />
              <span className="text-xs font-medium">{it.label}</span>
            </div>
            <span
              className={cn(
                "text-[10px] leading-tight",
                active ? "text-white/80" : "text-white/40",
              )}
            >
              {it.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TagBadge({ page }: { page: ComicPage | null }) {
  if (!page?.tag) return null;
  const meta = TAG_META[page.tag];
  const isClimax = page.tag === "climax";
  return (
    <motion.div
      key={page.id + "_tag"}
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      className={cn(
        "absolute left-3 bottom-3 z-20 tag-chip !px-3 !py-1.5 shadow-lg",
        meta.color,
        isClimax && "animate-pulse-soft ring-2 ring-white/40",
      )}
    >
      <span>{meta.icon}</span>
      <span className="text-xs">{meta.label}</span>
    </motion.div>
  );
}

function QuestionTip({ page }: { page: ComicPage | null }) {
  const [open, setOpen] = useState(false);
  if (!page?.concerns) return null;
  return (
    <div className="absolute right-3 bottom-3 z-20">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 4, scale: 0.96, x: 10 }}
            className="absolute bottom-12 right-0 w-[230px] p-3 rounded-xl text-xs leading-relaxed shadow-paperHover bg-paper-50 text-ink-700 border border-paper-300"
            style={{ transformOrigin: "bottom right" }}
          >
            <div className="flex items-start gap-2">
              <CircleHelp size={14} className="mt-0.5 shrink-0 text-accent-orange" />
              <div className="flex-1">
                <div className="font-serif font-semibold text-ink-900 mb-1">
                  作者担心的问题
                </div>
                <p className="text-ink-600 whitespace-pre-wrap">{page.concerns}</p>
              </div>
            </div>
            <div className="absolute -bottom-1.5 right-4 w-3 h-3 rotate-45 bg-paper-50 border-r border-b border-paper-300" />
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg",
          open
            ? "bg-accent-orange text-white"
            : "bg-paper-50/95 text-accent-orange hover:bg-paper-50 backdrop-blur-sm",
        )}
      >
        <CircleHelp size={16} />
      </button>
    </div>
  );
}

function PageRenderer({
  page,
  direction,
}: {
  page: ComicPage | null;
  direction: "next" | "prev" | null;
}) {
  const variants = {
    enter: (dir: "next" | "prev" | null) => ({
      opacity: 0,
      x: dir === "prev" ? -60 : dir === "next" ? 60 : 0,
      scale: 1.02,
    }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: "next" | "prev" | null) => ({
      opacity: 0,
      x: dir === "prev" ? 60 : dir === "next" ? -60 : 0,
      scale: 0.98,
    }),
  };
  return (
    <AnimatePresence mode="wait" custom={direction}>
      {page ? (
        <motion.div
          key={page.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img
            src={page.imageDataUrl}
            alt={`第 ${page.index + 1} 页`}
            className="w-full h-full object-contain bg-black"
            draggable={false}
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white/60">
          <Layers size={32} className="mb-3 opacity-50" />
          <div className="font-serif">还没有上传分镜</div>
          <div className="text-xs opacity-60 mt-1">请返回上传整理页</div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function ReaderPage() {
  const navigate = useNavigate();
  const work = useComicStore((s) => s.currentWork);
  const readMode = useComicStore((s) => s.readMode);
  const pauseDuration = useComicStore((s) => s.pauseDuration);
  const setReadMode = useComicStore((s) => s.setReadMode);
  const setPauseDuration = useComicStore((s) => s.setPauseDuration);
  const readingLog = useComicStore((s) => s.readingLog);
  const logPageEnter = useComicStore((s) => s.logPageEnter);
  const logPageLeave = useComicStore((s) => s.logPageLeave);
  const resetReadingLog = useComicStore((s) => s.resetReadingLog);

  const pages = useMemo(
    () => [...(work?.pages ?? [])].sort((a, b) => a.index - b.index),
    [work?.pages],
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [dir, setDir] = useState<"next" | "prev" | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const timerRef = useRef<number | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const current = pages[currentIdx] ?? null;
  const total = pages.length;
  const progress = total > 0 ? ((currentIdx + 1) / total) * 100 : 0;

  useEffect(() => {
    logPageEnter(0);
    return () => logPageLeave(0);
  }, [logPageEnter, logPageLeave]);

  const goNext = () => {
    if (currentIdx < total - 1) {
      logPageLeave(currentIdx);
      setDir("next");
      setCurrentIdx((i) => i + 1);
      setTimeout(() => logPageEnter(currentIdx + 1), 50);
    } else {
      setAutoRunning(false);
      if (readingLog.length > 0) {
        setShowReview(true);
      }
    }
  };
  const goPrev = () => {
    if (currentIdx > 0) {
      logPageLeave(currentIdx);
      setDir("prev");
      setCurrentIdx((i) => i - 1);
      setTimeout(() => logPageEnter(currentIdx - 1), 50);
    }
  };

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (readMode === "pause" && autoRunning && current && currentIdx < total - 1) {
      let left = pauseDuration * 1000;
      const step = 50;
      timerRef.current = window.setInterval(() => {
        left -= step;
        if (progressRef.current) {
          const ratio = 1 - left / (pauseDuration * 1000);
          progressRef.current.style.transform = `scaleX(${Math.min(1, ratio)})`;
        }
        if (left <= 0) {
          goNext();
        }
      }, step);
    } else if (progressRef.current) {
      progressRef.current.style.transform = "scaleX(0)";
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [readMode, autoRunning, currentIdx, pauseDuration, total, current?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") goNext();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      else if (e.key === "Escape") navigate("/upload");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIdx, total, navigate]);

  if (!work) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="paper-card p-8 text-center max-w-sm">
          <Volume2 size={32} className="mx-auto mb-3 text-ink-300" />
          <div className="font-serif text-ink-700 mb-2">还没有作品内容</div>
          <p className="text-sm text-ink-400 mb-5">
            请先返回上传整理页，创建作品并上传分镜
          </p>
          <button type="button" onClick={() => navigate("/upload")} className="btn-primary">
            <ArrowLeft size={16} /> 回到上传整理
          </button>
        </div>
      </div>
    );
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  return (
    <div className="min-h-full flex flex-col">
      <header className="px-4 md:px-8 pt-5 pb-4 flex items-center justify-between max-w-[1400px] mx-auto w-full gap-3">
        <button
          type="button"
          onClick={() => navigate("/upload")}
          className="btn-ghost !text-ink-600"
        >
          <ArrowLeft size={16} />
          返回整理
        </button>
        <div className="text-center flex-1">
          <div className="font-serif text-ink-900 font-semibold leading-tight">
            {work.title || "未命名作品"}
          </div>
          <div className="text-[11px] text-ink-400 mt-0.5 flex items-center justify-center gap-2">
            <span>{PLATFORM_META[work.platform].label}</span>
            <span className="text-ink-200">·</span>
            <span>{READ_DIRECTION_META[work.readDirection].label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReview((v) => !v)}
            className={cn(
              "btn-ghost !text-xs !px-3 !py-1.5",
              showReview
                ? "!bg-accent-green !text-white !border-transparent"
                : "!text-ink-600",
            )}
            title="复盘视图"
          >
            <BarChart3 size={14} />
            复盘
          </button>
          <div className="text-sm font-mono text-ink-400 tabular-nums min-w-[60px] text-right">
            <span className="text-ink-700 font-semibold">{currentIdx + 1}</span>
            <span className="mx-1">/</span>
            <span>{total}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 pb-8 gap-5">
        <div className="w-full max-w-sm">
          <ModeTabs mode={readMode} onChange={setReadMode} />
        </div>

        <div
          className="relative"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative rounded-[42px] bg-[#101012] p-3 shadow-phone">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-black z-30" />
            <div className="w-[300px] md:w-[340px] aspect-[9/16] rounded-[30px] overflow-hidden relative bg-black">
              <PageRenderer page={current} direction={dir} />
              <TagBadge page={current} />
              <QuestionTip page={current} />

              <div
                className="absolute inset-y-0 left-0 w-1/3 cursor-ew-resize z-10"
                onClick={goPrev}
                title="上一页"
              />
              <div
                className="absolute inset-y-0 right-0 w-1/3 cursor-ew-resize z-10"
                onClick={goNext}
                title="下一页"
              />

              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-40 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  ref={progressRef}
                  className="h-full bg-accent-orange origin-left"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={goPrev}
            className="hidden md:flex absolute top-1/2 -left-14 -translate-y-1/2 w-11 h-11 rounded-full bg-paper-50 shadow-paperHover text-ink-500 items-center justify-center hover:text-ink-700 hover:scale-105 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="hidden md:flex absolute top-1/2 -right-14 -translate-y-1/2 w-11 h-11 rounded-full bg-paper-50 shadow-paperHover text-ink-500 items-center justify-center hover:text-ink-700 hover:scale-105 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="w-full max-w-md space-y-3">
          {/* 节奏地图：标签节点进度条 */}
          <div className="relative py-2">
            <div className="relative h-1.5 rounded-full bg-paper-300 overflow-visible">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent-orange to-accent-green"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />

              {pages.map((p, i) => {
                if (!p.tag) return null;
                const pct = total > 1 ? (i / (total - 1)) * 100 : 50;
                const meta = TAG_META[p.tag];
                const isClimax = p.tag === "climax";
                const isActive = i === currentIdx;
                return (
                  <motion.button
                    key={p.id + "_rhythm"}
                    type="button"
                    onClick={() => {
                      setDir(i > currentIdx ? "next" : "prev");
                      setCurrentIdx(i);
                    }}
                    whileHover={{ scale: 1.5, y: -1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`absolute -translate-x-1/2 -top-0.5 transition-all ${
                      isActive ? "z-20" : "z-10"
                    }`}
                    style={{ left: `${pct}%` }}
                    title={`第 ${i + 1} 页 · ${meta.label}`}
                  >
                    <span
                      className={cn(
                        "block rounded-full shadow-paper",
                        isClimax
                          ? "w-4 h-4 -mt-[5px] ring-2 ring-white/70 animate-pulse-soft"
                          : "w-2.5 h-2.5 ring-1 ring-white",
                        isActive ? "ring-2 ring-ink-900/60" : "",
                        meta.color.replace("bg-", "bg-"),
                      )}
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* 标签图例 */}
            {total > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                {Array.from(
                  new Set(pages.map((p) => p.tag).filter(Boolean) as string[]),
                ).map((t) => {
                  const meta = TAG_META[t as keyof typeof TAG_META];
                  const count = pages.filter((p) => p.tag === t).length;
                  return (
                    <span
                      key={t}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-white",
                        meta.color,
                      )}
                    >
                      <span>{meta.icon}</span>
                      <span>
                        {meta.label} {count}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* 爆点位置提示 */}
            <AnimatePresence>
              {current?.tag === "climax" && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-center mt-2 text-[11px] text-accent-orange font-medium font-serif"
                >
                  💥 现在处于爆点位置 · 第 {currentIdx + 1} 页
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {readMode === "pause" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="paper-card p-4 grain-overlay flex items-center flex-wrap gap-4"
            >
              <button
                type="button"
                onClick={() => setAutoRunning((v) => !v)}
                disabled={currentIdx >= total - 1}
                className={
                  autoRunning
                    ? "btn-primary !bg-ink-700 hover:!bg-ink-900"
                    : "btn-primary"
                }
              >
                {autoRunning ? (
                  <>
                    <Pause size={16} /> 暂停自动翻页
                  </>
                ) : (
                  <>
                    <Play size={16} className="fill-current" /> 开始自动翻页
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-sm flex-1 min-w-[200px]">
                <span className="text-ink-500 shrink-0">每页停留</span>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={0.5}
                  value={pauseDuration}
                  onChange={(e) => setPauseDuration(Number(e.target.value))}
                  className="flex-1 accent-accent-orange"
                />
                <span className="font-mono text-ink-700 w-14 text-right tabular-nums">
                  {pauseDuration.toFixed(1)}s
                </span>
              </div>

              <div className="text-[11px] text-ink-400 w-full">
                <Sparkles size={12} className="inline mr-1 text-accent-orange" />
                提示：爆点页会在左下角闪烁，方便观察悬念落点是否在合适位置
              </div>
            </motion.div>
          )}

          <div className="text-center text-[11px] text-ink-400">
            点击屏幕左右两侧 / 键盘方向键 / 手机滑动都可以翻页
          </div>
        </div>

        {/* 复盘视图 */}
        <AnimatePresence>
          {showReview && (
            <ReviewPanel
              pages={pages}
              readingLog={readingLog}
              onClose={() => setShowReview(false)}
              onReset={() => {
                resetReadingLog();
                setCurrentIdx(0);
                setShowReview(false);
              }}
              onJump={(idx) => {
                setShowReview(false);
                logPageLeave(currentIdx);
                setDir(idx > currentIdx ? "next" : "prev");
                setCurrentIdx(idx);
                setTimeout(() => logPageEnter(idx), 50);
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ---------------- 复盘视图组件 ---------------- */
function ReviewPanel({
  pages,
  readingLog,
  onClose,
  onReset,
  onJump,
}: {
  pages: ComicPage[];
  readingLog: { pageIdx: number; enterTime: number; leaveTime: number }[];
  onClose: () => void;
  onReset: () => void;
  onJump: (idx: number) => void;
}) {
  const total = pages.length;

  const tagStats = useMemo(() => {
    const stat: Record<string, number> = {};
    pages.forEach((p) => {
      if (p.tag) stat[p.tag] = (stat[p.tag] || 0) + 1;
    });
    return stat;
  }, [pages]);

  const climaxIndices = useMemo(
    () => pages.map((p, i) => (p.tag === "climax" ? i : -1)).filter((i) => i >= 0),
    [pages],
  );

  const pageDurations = useMemo(() => {
    return pages.map((p, idx) => {
      const log = readingLog.find((l) => l.pageIdx === idx);
      if (!log || !log.leaveTime || !log.enterTime) return { idx, duration: 0 };
      return { idx, duration: (log.leaveTime - log.enterTime) / 1000 };
    });
  }, [pages, readingLog]);

  const avgDuration = useMemo(() => {
    const valid = pageDurations.filter((d) => d.duration > 0);
    if (valid.length === 0) return 0;
    return valid.reduce((sum, d) => sum + d.duration, 0) / valid.length;
  }, [pageDurations]);

  const rhythmIssues = useMemo(() => {
    const issues: string[] = [];
    if (climaxIndices.length > 3) {
      issues.push(`爆点太密集（${climaxIndices.length} 个），可能导致读者疲劳`);
    }
    if (climaxIndices.length === 0) {
      issues.push("还没有设置爆点页，读者可能感受不到悬念落点");
    }
    if (climaxIndices.length > 0 && climaxIndices[0] > total * 0.6) {
      issues.push("第一个爆点出现太晚（超过 60% 位置），前半段节奏可能偏松");
    }
    const slowPages = pageDurations.filter((d) => d.duration > avgDuration * 1.8 && d.duration > 0);
    if (slowPages.length > 2) {
      issues.push(`有 ${slowPages.length} 页停留时间显著偏长，可能信息量过大或节奏拖沓`);
    }
    const fastPages = pageDurations.filter(
      (d) => d.duration > 0 && d.duration < avgDuration * 0.4 && d.duration > 0.3,
    );
    if (fastPages.length > 3) {
      issues.push(`有 ${fastPages.length} 页翻得特别快，可能内容不够抓眼`);
    }
    const setupPages = pages.filter((p) => p.tag === "setup").length;
    if (setupPages > total * 0.5) {
      issues.push(`铺垫页偏多（${setupPages}/${total}），前半段可能太平`);
    }
    return issues;
  }, [climaxIndices, total, pageDurations, avgDuration, pages]);

  const maxDuration = Math.max(...pageDurations.map((d) => d.duration), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl"
    >
      <div className="paper-card grain-overlay overflow-hidden">
        <div className="p-4 border-b border-paper-200 bg-gradient-to-r from-accent-greenSoft/40 to-accent-orangeSoft/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-green to-accent-orange flex items-center justify-center text-white">
                <BarChart3 size={15} />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-ink-900 text-sm leading-tight">
                  阅读复盘
                </h3>
                <p className="text-[11px] text-ink-500 mt-0.5 leading-tight">
                  共 {total} 页 · 平均停留 {avgDuration.toFixed(1)}s · {climaxIndices.length} 个爆点
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onReset}
                className="btn-ghost !py-1 !px-2 !text-[11px] border border-paper-200"
              >
                <RotateCcw size={11} /> 重新阅读
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost !p-1.5"
                title="关闭"
              >
                <ChevronRight size={16} className="-rotate-90" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* 节奏问题 */}
          {rhythmIssues.length > 0 && (
            <div className="rounded-xl bg-accent-orangeSoft/30 border border-accent-orange/20 p-3">
              <div className="text-xs font-medium text-ink-800 mb-2 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-accent-orange" />
                节奏分析提示
              </div>
              <ul className="space-y-1.5">
                {rhythmIssues.map((issue, i) => (
                  <li key={i} className="text-[11px] text-ink-600 leading-relaxed flex gap-1.5">
                    <span className="text-accent-orange shrink-0">·</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 标签分布 */}
          <div>
            <div className="text-xs font-medium text-ink-700 mb-2.5 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-accent-green" />
              标签分布
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tagStats).map(([tag, count]) => {
                const meta = TAG_META[tag as keyof typeof TAG_META];
                const pct = (count / total) * 100;
                return (
                  <div
                    key={tag}
                    className="flex-1 min-w-[80px] rounded-xl border border-paper-200 bg-paper-50 p-2.5"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span className={cn("w-3 h-3 rounded-full", meta.color)} />
                      <span className="text-[10px] text-ink-500">{meta.label}</span>
                    </div>
                    <div className="font-serif font-bold text-lg text-ink-800 tabular-nums">
                      {count}
                      <span className="text-[10px] text-ink-400 font-normal ml-1">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(tagStats).length === 0 && (
                <div className="text-[11px] text-ink-400 w-full text-center py-3">
                  还没有给页面打标签，先回上传页给关键页做标记吧
                </div>
              )}
            </div>
          </div>

          {/* 爆点位置 */}
          <div>
            <div className="text-xs font-medium text-ink-700 mb-2.5 flex items-center gap-1.5">
              <Bomb size={12} className="text-tag-climax" />
              爆点位置
            </div>
            <div className="relative h-8 rounded-full bg-paper-200 overflow-hidden">
              {pages.map((p, i) => {
                const pct = total > 1 ? (i / (total - 1)) * 100 : 50;
                const isClimax = p.tag === "climax";
                if (!isClimax) return null;
                return (
                  <button
                    key={p.id + "_r"}
                    type="button"
                    onClick={() => onJump(i)}
                    className="absolute -translate-x-1/2 top-1 group"
                    style={{ left: `${pct}%` }}
                  >
                    <span className="block w-6 h-6 rounded-full bg-tag-climax text-white flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse-soft ring-2 ring-white/60">
                      {i + 1}
                    </span>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-ink-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      第 {i + 1} 页
                    </span>
                  </button>
                );
              })}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-tag-setup/30 via-tag-climax/50 to-tag-transition/30" />
            </div>
            {climaxIndices.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-5">
                {climaxIndices.map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onJump(idx)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-tag-climax/15 text-tag-climax text-[10px] font-medium border border-tag-climax/20 hover:bg-tag-climax hover:text-white transition-colors"
                  >
                    💥 第 {idx + 1} 页 · {(idx / total) * 100 | 0}% 位置
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 每页停留时长 */}
          <div>
            <div className="text-xs font-medium text-ink-700 mb-2.5 flex items-center gap-1.5">
              <Clock size={12} className="text-accent-orange" />
              每页停留时长
            </div>
            <div className="space-y-1.5">
              {pageDurations.map(({ idx, duration }) => {
                const page = pages[idx];
                const pct = maxDuration > 0 ? Math.min(100, (duration / maxDuration) * 100) : 0;
                const isSlow = duration > avgDuration * 1.5 && duration > 0;
                const isFast = duration > 0 && duration < avgDuration * 0.6;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onJump(idx)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-paper-100 transition-colors group text-left"
                  >
                    <span className="text-[10px] font-mono text-ink-400 w-8 tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 h-5 rounded-md bg-paper-200 overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: idx * 0.02, duration: 0.4 }}
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-md",
                          isSlow
                            ? "bg-gradient-to-r from-accent-orange to-red-400"
                            : isFast
                              ? "bg-gradient-to-r from-accent-green to-emerald-400"
                              : "bg-gradient-to-r from-ink-300 to-ink-400",
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-mono w-12 text-right tabular-nums",
                        duration === 0 ? "text-ink-300" : isSlow ? "text-accent-orange" : isFast ? "text-accent-green" : "text-ink-500",
                      )}
                    >
                      {duration > 0 ? `${duration.toFixed(1)}s` : "-"}
                    </span>
                    {page?.tag && (
                      <span
                        className={cn(
                          "w-3.5 h-3.5 rounded-full shrink-0",
                          TAG_META[page.tag].color,
                        )}
                        title={TAG_META[page.tag].label}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-ink-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-orange" /> 偏慢
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-ink-400" /> 正常
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-green" /> 偏快
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-paper-200" /> 未读
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
