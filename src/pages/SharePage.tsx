import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Share2,
  ArrowLeft,
  Download,
  CircleHelp,
  Sparkles,
  FileJson,
  FileText,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Send,
  BookMarked,
  AlertCircle,
} from "lucide-react";
import { useComicStore } from "@/store/comicStore";
import {
  TAG_META,
  PLATFORM_META,
  READ_DIRECTION_META,
  type SharePackage,
} from "@/types";
import { buildStandaloneHtml, exportFeedbackText, cn } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

type Props = { mode: "long" | "short" };

export default function SharePage({ mode }: Props) {
  const params = useParams();
  const navigate = useNavigate();
  const loadFromShare = useComicStore((s) => s.loadFromShare);
  const loadFromShort = useComicStore((s) => s.loadFromShortShare);
  const setWorkFromShare = useComicStore((s) => s.setWorkFromShare);
  const exportFeedbackSummary = useComicStore((s) => s.exportFeedbackSummary);

  const [pkg, setPkg] = useState<SharePackage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      let loaded: SharePackage | null = null;
      if (mode === "short") {
        const id = (params as { id?: string }).id || "";
        loaded = loadFromShort(id);
        if (!loaded) {
          setError(
            "短链接已过期或找不到数据。短链接数据存在作者的浏览器里，如果对方换了浏览器会无法打开。",
          );
          return;
        }
      } else {
        const data = (params as { data?: string }).data || "";
        loaded = loadFromShare(data);
        if (!loaded) {
          setError("链接无效或数据已损坏，请确认分享链接是否完整。");
          return;
        }
      }
      setPkg(loaded);
      setFeedback(new Array(loaded.pg.length).fill(""));
    } catch {
      setError("解析分享数据失败。");
    }
  }, [mode, params, loadFromShare, loadFromShort]);

  const pages = useMemo(() => pkg?.pg ?? [], [pkg]);
  const current = pages[activeIdx];
  const progress = pages.length ? ((activeIdx + 1) / pages.length) * 100 : 0;

  const setFb = (i: number, v: string) => {
    setFeedback((arr) => {
      const n = [...arr];
      n[i] = v;
      return n;
    });
  };

  const feedbackCount = feedback.filter((t) => t?.trim()).length;

  const downloadHtmlWithFeedback = () => {
    if (!pkg) return;
    const html = buildStandaloneHtml(pkg, feedback);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pkg.t || "分镜审稿包"}-含反馈.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportText = () => {
    if (!pkg) return;
    try {
      exportFeedbackSummary(feedback);
    } catch {
      /* fallback: 直接从这里调用 */
      exportFeedbackText(pkg, feedback, pkg.t || "分镜审稿反馈");
    }
  };

  const copySummary = async () => {
    if (!pkg) return;
    const text = buildSummaryText(pkg, feedback);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const importToEdit = () => {
    if (!pkg) return;
    setWorkFromShare(pkg);
    navigate("/upload");
  };

  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="paper-card p-8 text-center max-w-md grain-overlay">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-accent-orangeSoft flex items-center justify-center text-accent-orange">
            <AlertCircle size={22} />
          </div>
          <h2 className="font-serif text-lg font-semibold text-ink-900 mb-2">
            链接无法打开
          </h2>
          <p className="text-sm text-ink-500 mb-6 leading-relaxed">{error}</p>
          {mode === "short" && (
            <div className="text-left text-[11px] text-ink-400 rounded-lg bg-paper-100 border border-paper-200 p-3 mb-5 leading-relaxed">
              <Sparkles size={11} className="inline mr-1 text-accent-orange" />
              <b className="text-ink-500">建议作者：</b>
              导出审稿包时，除了短链接再下载一份 HTML 文件，
              对方打开 HTML 就能直接看，不依赖任何服务器或浏览器。
            </div>
          )}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => navigate("/upload")}
              className="btn-primary"
            >
              <ArrowLeft size={16} /> 自己创建作品
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-ink-400">
          <RefreshCw size={26} className="animate-spin" />
          <div className="font-serif">正在解析审稿包…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <header className="px-4 md:px-8 pt-5 pb-4 flex items-center justify-between max-w-[1400px] mx-auto w-full flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-green to-accent-orange flex items-center justify-center text-white shadow-paper">
            <Share2 size={17} />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold text-ink-900 leading-tight">
              {pkg.t || "未命名作品"} · 审稿包
            </h1>
            <p className="text-[11px] text-ink-400 leading-tight flex items-center gap-2">
              <span>{PLATFORM_META[pkg.p].label}</span>
              <span className="text-ink-200">·</span>
              <span>{READ_DIRECTION_META[pkg.d].label}</span>
              <span className="text-ink-200">·</span>
              <span>{pages.length} 页</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={copySummary}
            className="btn-ghost !border !border-paper-300 text-xs"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "已复制摘要" : "复制反馈摘要"}
          </button>
          <button
            type="button"
            onClick={exportText}
            disabled={feedbackCount === 0}
            className="btn-secondary !px-4 !py-2 !text-xs"
          >
            <FileText size={14} /> 导出 TXT
          </button>
          <button
            type="button"
            onClick={downloadHtmlWithFeedback}
            className="btn-secondary !px-4 !py-2 !text-xs"
          >
            <FileText size={14} /> 下载含反馈 HTML
          </button>
          <button
            type="button"
            onClick={importToEdit}
            className="btn-primary !px-4 !py-2 !text-xs"
          >
            <FileJson size={14} /> 导入编辑
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 pb-10 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          <section className="space-y-4 min-w-0">
            <div className="paper-card overflow-hidden grain-overlay">
              <div className="relative w-full max-w-md mx-auto p-4 md:p-6">
                <div
                  className="relative mx-auto rounded-[34px] bg-[#101012] p-2.5 shadow-phone"
                  style={{ width: "100%", maxWidth: 320 }}
                >
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-black z-10" />
                  <div className="w-full aspect-[9/16] rounded-[24px] overflow-hidden relative bg-black">
                    <AnimatePresence mode="wait">
                      {current && (
                        <motion.img
                          key={activeIdx}
                          src={current.i}
                          alt={`第 ${activeIdx + 1} 页`}
                          initial={{ opacity: 0, x: 30, scale: 1.02 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -30, scale: 0.98 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="absolute inset-0 w-full h-full object-contain"
                          draggable={false}
                        />
                      )}
                    </AnimatePresence>

                    {current?.t && (
                      <div
                        className={`absolute left-2.5 bottom-2.5 tag-chip !px-2.5 !py-1 shadow-lg ${TAG_META[current.t].color}`}
                      >
                        <span className="text-[11px]">
                          {TAG_META[current.t].icon}
                        </span>
                        <span className="text-[11px]">
                          {TAG_META[current.t].label}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        activeIdx > 0 && setActiveIdx(activeIdx - 1)
                      }
                      className="absolute inset-y-0 left-0 w-1/3 cursor-ew-resize z-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        activeIdx < pages.length - 1 &&
                        setActiveIdx(activeIdx + 1)
                      }
                      className="absolute inset-y-0 right-0 w-1/3 cursor-ew-resize z-10"
                    />
                  </div>
                </div>

                <div className="mt-4 max-w-md mx-auto">
                  <div className="h-1.5 rounded-full bg-paper-300 overflow-hidden mb-2">
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent-green to-accent-orange"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.25 }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-ink-400 font-mono">
                    <button
                      type="button"
                      onClick={() =>
                        activeIdx > 0 && setActiveIdx(activeIdx - 1)
                      }
                      className="btn-ghost !p-1.5 disabled:opacity-30"
                      disabled={activeIdx === 0}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>
                      <span className="text-ink-700 font-semibold tabular-nums">
                        {activeIdx + 1}
                      </span>
                      <span className="mx-1">/</span>
                      <span className="tabular-nums">{pages.length}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        activeIdx < pages.length - 1 &&
                        setActiveIdx(activeIdx + 1)
                      }
                      className="btn-ghost !p-1.5 disabled:opacity-30"
                      disabled={activeIdx >= pages.length - 1}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {current?.c && (
              <motion.div
                key={activeIdx + "_c"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="paper-card p-4 flex gap-3 grain-overlay"
              >
                <div className="w-9 h-9 rounded-xl bg-accent-orangeSoft flex items-center justify-center text-accent-orange shrink-0">
                  <CircleHelp size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-ink-500 mb-1 flex items-center gap-1.5">
                    <Sparkles size={11} className="text-accent-orange" />
                    作者担心的问题
                  </div>
                  <p className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">
                    {current.c}
                  </p>
                </div>
              </motion.div>
            )}

            {/* 编辑反馈区 - 按页 */}
            <motion.div
              key={activeIdx + "_fb"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="paper-card p-4 grain-overlay"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-greenSoft flex items-center justify-center text-accent-green shrink-0">
                  <MessageSquare size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="text-xs font-medium text-ink-700 flex items-center gap-1.5">
                      <BookMarked size={12} className="text-accent-green" />
                      第 {activeIdx + 1} 页反馈
                      {current?.t && (
                        <span
                          className={`tag-chip ml-1 !py-0.5 !px-2 ${TAG_META[current.t].color}`}
                        >
                          <span className="text-[10px]">
                            {TAG_META[current.t].icon}{" "}
                            {TAG_META[current.t].label}
                          </span>
                        </span>
                      )}
                    </div>
                    {feedback[activeIdx]?.trim() && (
                      <div className="text-[11px] text-accent-green flex items-center gap-1">
                        <Check size={11} /> 已记录
                      </div>
                    )}
                  </div>
                  <textarea
                    value={feedback[activeIdx] || ""}
                    onChange={(e) => setFb(activeIdx, e.target.value)}
                    rows={4}
                    placeholder="试看后的感受：节奏快慢、画面清晰度、剧情是否看懂、悬念是否到位… 想到什么就写什么 📝"
                    className="input-field resize-none text-sm leading-relaxed bg-paper-100"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-400">
                    <span>
                      {feedback[activeIdx]?.length || 0} 字
                    </span>
                    <div className="flex items-center gap-2">
                      {activeIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveIdx(activeIdx - 1)}
                          className="btn-ghost !py-1 !px-2 !text-[11px] border border-paper-200"
                        >
                          ← 上一页
                        </button>
                      )}
                      {activeIdx < pages.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setActiveIdx(activeIdx + 1)}
                          className="btn-primary !py-1.5 !px-3 !text-[11px]"
                        >
                          下一页 <Send size={11} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={exportText}
                          className="btn-primary !py-1.5 !px-3 !text-[11px] !bg-accent-green hover:!bg-accent-greenHover"
                        >
                          完成 & 导出
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <aside className="paper-card grain-overlay overflow-hidden flex flex-col max-h-[calc(100vh-10rem)]">
            <div className="p-4 border-b border-paper-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-semibold text-ink-900 text-sm">
                  页序总览
                </h3>
                <div className="text-[11px] text-ink-400 mt-0.5">
                  <span className="text-accent-green font-medium">
                    {feedbackCount}
                  </span>{" "}
                  / {pages.length} 页已写反馈
                </div>
              </div>
              <div className="text-[11px] text-ink-400 font-mono">
                {pages.length}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2 content-start">
              {pages.map((p, i) => {
                const active = activeIdx === i;
                const hasFb = feedback[i]?.trim();
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={cn(
                      "relative rounded-lg overflow-hidden border-2 transition-all",
                      active
                        ? "border-accent-orange shadow-paperHover scale-[1.02] z-10"
                        : "border-paper-300 hover:border-ink-300",
                    )}
                  >
                    <div className="aspect-[3/4] bg-paper-200">
                      <img
                        src={p.i}
                        alt={`第 ${i + 1} 页`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute top-1 left-1 w-5 h-5 rounded bg-paper-50/90 text-[10px] font-semibold text-ink-700 flex items-center justify-center tabular-nums">
                      {i + 1}
                    </div>
                    {hasFb && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-accent-green text-white flex items-center justify-center shadow-paper">
                        <MessageSquare size={10} />
                      </div>
                    )}
                    {p.t && (
                      <div
                        className={`absolute bottom-1 right-1 tag-chip !px-1.5 !py-0.5 ${TAG_META[p.t].color}`}
                      >
                        <span className="text-[9px]">
                          {TAG_META[p.t].icon}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {feedbackCount > 0 && (
              <div className="p-3 border-t border-paper-200 bg-paper-100/60">
                <div className="text-[11px] text-ink-500 mb-2 font-serif font-medium">
                  📋 已写反馈的页
                </div>
                <div className="flex flex-wrap gap-1 max-h-[88px] overflow-y-auto">
                  {feedback.map((t, i) =>
                    t?.trim() ? (
                      <span
                        key={i}
                        onClick={() => setActiveIdx(i)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-greenSoft text-accent-green text-[11px] font-medium cursor-pointer hover:bg-accent-green hover:text-white transition-colors"
                      >
                        第 {i + 1} 页
                        <span className="opacity-60">
                          · {t.trim().length} 字
                        </span>
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function buildSummaryText(
  pkg: SharePackage,
  feedback: string[],
): string {
  const TAG_LABEL: Record<string, string> = {
    setup: "铺垫",
    climax: "爆点",
    transition: "转场",
    fight: "打斗",
    daily: "日常",
    suspense: "悬疑",
    comedy: "搞笑",
    emotion: "情感",
  };
  const TAG_EMOJI: Record<string, string> = {
    setup: "🌱",
    climax: "💥",
    transition: "↪️",
    fight: "⚔️",
    daily: "🏠",
    suspense: "👁️",
    comedy: "😄",
    emotion: "💗",
  };
  const platformLabel =
    {
      wechat: "微信公众号",
      kuaikan: "快看漫画",
      bilibili: "哔哩哔哩漫画",
      dongman: "腾讯动漫",
      other: "其他平台",
    }[pkg.p] || pkg.p;
  const directionLabel =
    {
      vertical: "从上到下（条漫）",
      rtl: "从右到左（页漫）",
    }[pkg.d] || pkg.d;

  const lines: string[] = [];
  lines.push("=".repeat(50));
  lines.push(`📖 ${pkg.t || "未命名作品"} - 审稿反馈摘要`);
  lines.push("=".repeat(50));
  lines.push(`生成：${new Date().toLocaleString("zh-CN")}`);
  lines.push(`平台：${platformLabel}　方向：${directionLabel}`);
  lines.push(`页数：${pkg.pg.length}　有反馈：${feedback.filter((t) => t?.trim()).length} 页`);
  lines.push("");
  pkg.pg.forEach((p, i) => {
    const tagStr = p.t ? ` [${TAG_EMOJI[p.t]} ${TAG_LABEL[p.t]}]` : "";
    const fb = feedback[i]?.trim();
    if (!p.c && !fb) return;
    lines.push(`── 第 ${i + 1} 页${tagStr} ──`);
    if (p.c) lines.push(`💭 作者：${p.c}`);
    if (fb) lines.push(`💬 反馈：${fb}`);
    lines.push("");
  });
  return lines.join("\n");
}
