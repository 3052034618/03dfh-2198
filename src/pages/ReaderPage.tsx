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

  const pages = useMemo(
    () => [...(work?.pages ?? [])].sort((a, b) => a.index - b.index),
    [work?.pages],
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [dir, setDir] = useState<"next" | "prev" | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const current = pages[currentIdx] ?? null;
  const total = pages.length;
  const progress = total > 0 ? ((currentIdx + 1) / total) * 100 : 0;

  const goNext = () => {
    if (currentIdx < total - 1) {
      setDir("next");
      setCurrentIdx((i) => i + 1);
    } else {
      setAutoRunning(false);
    }
  };
  const goPrev = () => {
    if (currentIdx > 0) {
      setDir("prev");
      setCurrentIdx((i) => i - 1);
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
      <header className="px-4 md:px-8 pt-5 pb-4 flex items-center justify-between max-w-[1400px] mx-auto w-full">
        <button
          type="button"
          onClick={() => navigate("/upload")}
          className="btn-ghost !text-ink-600"
        >
          <ArrowLeft size={16} />
          返回整理
        </button>
        <div className="text-center">
          <div className="font-serif text-ink-900 font-semibold leading-tight">
            {work.title || "未命名作品"}
          </div>
          <div className="text-[11px] text-ink-400 mt-0.5 flex items-center justify-center gap-2">
            <span>{PLATFORM_META[work.platform].label}</span>
            <span className="text-ink-200">·</span>
            <span>{READ_DIRECTION_META[work.readDirection].label}</span>
          </div>
        </div>
        <div className="text-sm font-mono text-ink-400 tabular-nums">
          <span className="text-ink-700 font-semibold">{currentIdx + 1}</span>
          <span className="mx-1">/</span>
          <span>{total}</span>
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

        <div className="w-full max-w-md space-y-4">
          <div className="h-1.5 rounded-full bg-paper-300 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-orange to-accent-green"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
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
      </main>
    </div>
  );
}
