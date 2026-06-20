import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  HardDrive,
  Trash2,
  Upload,
} from "lucide-react";
import { useComicStore } from "@/store/comicStore";
import {
  TAG_META,
  PLATFORM_META,
  READ_DIRECTION_META,
  FEEDBACK_STATUS_META,
  type SharePackage,
  type FeedbackStatus,
} from "@/types";
import {
  buildStandaloneHtml,
  exportFeedbackText,
  saveFeedbackDraft,
  loadFeedbackDraft,
  clearFeedbackDraft,
  parseFeedbackText,
  mergeFeedback,
  type FeedbackEntry,
  cn,
  uid,
} from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

type Props = { mode: "long" | "short" };

export default function SharePage({ mode }: Props) {
  const params = useParams();
  const navigate = useNavigate();
  const loadFromShare = useComicStore((s) => s.loadFromShare);
  const loadFromShort = useComicStore((s) => s.loadFromShortShare);
  const setWorkFromShare = useComicStore((s) => s.setWorkFromShare);

  const [pkg, setPkg] = useState<SharePackage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  const shareKey = useMemo(() => {
    const id = (params as { id?: string }).id || "";
    const data = (params as { data?: string }).data || "";
    return mode === "short" ? `short_${id}` : `long_${data.slice(0, 40)}`;
  }, [mode, params]);

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
      const draft = loadFeedbackDraft(shareKey, loaded.pg.length);
      setFeedback(draft);
    } catch {
      setError("解析分享数据失败。");
    }
  }, [mode, params, loadFromShare, loadFromShort, shareKey]);

  useEffect(() => {
    if (!pkg || feedback.length !== pkg.pg.length) return;
    saveFeedbackDraft(shareKey, feedback);
    setDraftSavedAt(Date.now());
  }, [feedback, pkg, shareKey]);

  const pages = useMemo(() => pkg?.pg ?? [], [pkg]);
  const current = pages[activeIdx];
  const progress = pages.length ? ((activeIdx + 1) / pages.length) * 100 : 0;

  const setFbText = useCallback((i: number, text: string) => {
    setFeedback((arr) => {
      const n = [...arr];
      n[i] = { ...n[i], text };
      return n;
    });
  }, []);

  const setFbStatus = useCallback((i: number, status: FeedbackStatus | null) => {
    setFeedback((arr) => {
      const n = [...arr];
      n[i] = { ...n[i], status };
      return n;
    });
  }, []);

  const hasAnyFeedback = feedback.some((t) => t?.text?.trim() || t?.status);
  const effectiveFeedbackCount = feedback.filter(
    (t) => t?.text?.trim() || t?.status,
  ).length;
  const textFeedbackCount = feedback.filter((t) => t?.text?.trim()).length;
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { review: 0, revise: 0, pass: 0 };
    feedback.forEach((f) => {
      if (f.status) counts[f.status] = (counts[f.status] || 0) + 1;
    });
    return counts;
  }, [feedback]);

  const totalStatusCount = statusCounts.review + statusCounts.revise + statusCounts.pass;

  const [isAuthorMode, setIsAuthorMode] = useState(false);
  const [showTodoPanel, setShowTodoPanel] = useState(false);
  const [importedFeedbacks, setImportedFeedbacks] = useState<
    Array<{ id: string; sourceName: string; importedAt: number; entries: FeedbackEntry[] }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const handleImportFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !pkg) return;
    const newImports: typeof importedFeedbacks = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let text = "";
        if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
          const htmlText = await file.text();
          const match = htmlText.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
          text = match ? match[1] : htmlText;
        } else {
          text = await file.text();
        }
        const entries = (parseFeedbackText as any)(text, file.name, pkg.pg.length);
        const hasAny = entries.some(
          (e: FeedbackEntry) => e?.text?.trim() || e?.status,
        );
        if (hasAny) {
          newImports.push({
            id: uid("imp_"),
            sourceName: file.name.replace(/\.(txt|html?)$/i, ""),
            importedAt: Date.now(),
            entries: entries.slice(0, pkg.pg.length),
          });
        }
      } catch {
        /* ignore parse errors */
      }
    }
    if (newImports.length > 0) {
      setImportedFeedbacks((prev) => [...prev, ...newImports]);
    }
    setFileInputKey((k) => k + 1);
  };

  const removeImported = (id: string) => {
    setImportedFeedbacks((prev) => prev.filter((x) => x.id !== id));
  };

  const mergedFeedback = useMemo(() => {
    if (!pkg) return [];
    return (mergeFeedback as any)(feedback, importedFeedbacks, pkg.pg.length) as Array<{
      pageIdx: number;
      statuses: Record<string, string[]>;
      texts: Array<{ source: string; text: string }>;
      resolved: boolean;
    }>;
  }, [feedback, importedFeedbacks, pkg]);

  const resolvedCount = useMemo(
    () => feedback.filter((f) => (f?.text?.trim() || f?.status) && f.resolved).length,
    [feedback],
  );
  const todoCount = effectiveFeedbackCount - resolvedCount;

  const toggleResolved = useCallback((i: number) => {
    setFeedback((arr) => {
      const n = [...arr];
      n[i] = { ...n[i], resolved: !n[i].resolved };
      return n;
    });
  }, []);

  const setAllResolved = (status: FeedbackStatus | "all") => {
    setFeedback((arr) =>
      arr.map((f, i) => {
        const hasContent = f?.text?.trim() || f?.status;
        if (!hasContent) return f;
        if (status === "all") return { ...f, resolved: true };
        if (f.status === status) return { ...f, resolved: true };
        return f;
      }),
    );
  };

  const downloadHtmlWithFeedback = () => {
    if (!pkg) return;
    const texts = feedback.map((f) => f.text || "");
    const html = buildStandaloneHtml(pkg, texts);
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
    exportFeedbackText(pkg, feedback, pkg.t || "分镜审稿反馈");
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

  const clearDraft = () => {
    if (!pkg) return;
    clearFeedbackDraft(shareKey);
    setFeedback(Array.from({ length: pkg.pg.length }, () => ({ text: "", status: null })));
    setDraftSavedAt(null);
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

  const currentEntry = feedback[activeIdx] || { text: "", status: null };

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
          {hasAnyFeedback && (
            <button
              type="button"
              onClick={() => setIsAuthorMode((v) => !v)}
              className={cn(
                "btn-ghost !py-1.5 !px-3 !text-xs border",
                isAuthorMode
                  ? "!bg-accent-green !text-white !border-accent-green"
                  : "!border-paper-300",
              )}
            >
              <Check size={13} />
              {isAuthorMode ? "作者回收台" : "切换到作者模式"}
            </button>
          )}
          {draftSavedAt && (
            <div className="text-[11px] text-ink-400 flex items-center gap-1 mr-1">
              <HardDrive size={12} className="text-accent-green" />
              已自动保存草稿
            </div>
          )}
          <button
            type="button"
            onClick={copySummary}
            disabled={!hasAnyFeedback}
            className="btn-ghost !border !border-paper-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "已复制摘要" : "复制反馈摘要"}
          </button>
          <button
            type="button"
            onClick={exportText}
            disabled={!hasAnyFeedback}
            className="btn-secondary !px-4 !py-2 !text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* 编辑反馈区 - 带状态 */}
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
                    {currentEntry.text?.trim() || currentEntry.status ? (
                      <div
                        className={cn(
                          "text-[11px] flex items-center gap-1",
                          currentEntry.resolved
                            ? "text-accent-green"
                            : "text-accent-orange",
                        )}
                      >
                        {currentEntry.resolved ? (
                          <>
                            <Check size={11} /> 已处理
                          </>
                        ) : (
                          <>
                            <AlertCircle size={11} /> 待处理
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* 状态选择 */}
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <span className="text-[11px] text-ink-500 mr-1">审稿状态：</span>
                    {(["review", "revise", "pass"] as const).map((s) => {
                      const meta = FEEDBACK_STATUS_META[s];
                      const active = currentEntry.status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setFbStatus(activeIdx, active ? null : s)
                          }
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border transition-all",
                            active
                              ? `${meta.color} text-white border-transparent shadow-paper`
                              : `${meta.softColor} text-ink-600 ${meta.borderColor} hover:shadow-sm`,
                          )}
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 作者模式：处理进度 */}
                  <AnimatePresence>
                    {isAuthorMode && (currentEntry.text?.trim() || currentEntry.status) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3"
                      >
                        <label className="flex items-center gap-2 p-2.5 rounded-lg bg-accent-greenSoft/30 border border-accent-green/20 cursor-pointer hover:bg-accent-greenSoft/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={currentEntry.resolved || false}
                            onChange={() => toggleResolved(activeIdx)}
                            className="w-4 h-4 rounded text-accent-green focus:ring-accent-green"
                          />
                          <span className="text-xs text-ink-700 font-medium">
                            ✓ 标记为已处理
                          </span>
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 作者模式：合并后的多人反馈展示 */}
                  <AnimatePresence>
                    {isAuthorMode && importedFeedbacks.length > 0 && (() => {
                      const merged = mergedFeedback[activeIdx];
                      if (!merged) return null;
                      const hasOthers = merged.texts.some((t) => t.source !== "当前") || Object.values(merged.statuses).some((arr) => arr.some((s) => s !== "当前"));
                      if (!hasOthers) return null;
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-3 rounded-xl border border-paper-200 bg-paper-50 p-3"
                        >
                          <div className="text-[11px] font-semibold text-ink-700 mb-2 flex items-center gap-1.5">
                            <BookMarked size={11} /> 朋友反馈汇总
                          </div>
                          {/* 各状态投票 */}
                          {Object.keys(merged.statuses).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {(Object.keys(merged.statuses) as Array<keyof typeof merged.statuses>).map((st) => {
                                const voters = merged.statuses[st].filter((s) => s !== "当前");
                                if (voters.length === 0) return null;
                                const meta = FEEDBACK_STATUS_META[st as FeedbackStatus] || { label: st, icon: "⚪" };
                                return (
                                  <span
                                    key={st}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border",
                                      st === "review"
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : st === "revise"
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : "bg-emerald-50 text-emerald-700 border-emerald-200",
                                    )}
                                  >
                                    {meta.icon} {meta.label}（{voters.length}人：{voters.join("、")}）
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {/* 各朋友的文字反馈 */}
                          {merged.texts.filter((t) => t.source !== "当前").length > 0 && (
                            <div className="space-y-1.5">
                              {merged.texts
                                .filter((t) => t.source !== "当前")
                                .map((t, i) => (
                                  <div key={i} className="rounded-lg bg-white border border-paper-200 p-2">
                                    <div className="text-[9px] text-ink-400 mb-0.5 font-medium">
                                      {t.source}
                                    </div>
                                    <div className="text-[11px] text-ink-600 whitespace-pre-wrap leading-relaxed">
                                      {t.text}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>

                  <textarea
                    value={currentEntry.text || ""}
                    onChange={(e) => setFbText(activeIdx, e.target.value)}
                    rows={4}
                    placeholder="试看后的感受：节奏快慢、画面清晰度、剧情是否看懂、悬念是否到位… 想到什么就写什么 📝"
                    className="input-field resize-none text-sm leading-relaxed bg-paper-100"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-400">
                    <span>
                      {currentEntry.text?.length || 0} 字
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
            <div className="p-4 border-b border-paper-200">
              {isAuthorMode ? (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-serif font-semibold text-ink-900 flex items-center gap-1.5">
                      <Check size={14} className="text-accent-green" />
                      作者回收台
                    </div>
                    <div className="text-[11px] text-ink-500 font-mono">
                      <span className="text-accent-green font-semibold">{resolvedCount}</span>
                      <span className="text-ink-300 mx-1">/</span>
                      <span>{effectiveFeedbackCount}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-paper-200 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent-green to-accent-orange"
                      animate={{ width: `${effectiveFeedbackCount > 0 ? (resolvedCount / effectiveFeedbackCount) * 100 : 0}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      {(["review", "revise", "pass"] as const).map((s) => {
                        const meta = FEEDBACK_STATUS_META[s];
                        const count = statusCounts[s] || 0;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setAllResolved(s)}
                            title={`一键标记所有${meta.label}为已处理`}
                            className="text-[10px] text-ink-400 hover:text-ink-600"
                          >
                            {meta.icon}
                            {count}
                          </button>
                        );
                      })}
                    </div>
                    {todoCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setAllResolved("all")}
                        className="text-[10px] text-accent-green hover:underline"
                      >
                        全部已处理
                      </button>
                    )}
                  </div>

                  {/* 导入反馈 */}
                  <div className="mt-3 pt-3 border-t border-paper-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-medium text-ink-700 flex items-center gap-1">
                        <Upload size={11} /> 合并朋友反馈
                      </div>
                      {importedFeedbacks.length > 0 && (
                        <span className="text-[10px] text-accent-green">
                          已导入 {importedFeedbacks.length} 份
                        </span>
                      )}
                    </div>
                    <label
                      className={cn(
                        "block w-full cursor-pointer rounded-lg border-2 border-dashed px-3 py-2 text-center transition-colors",
                        "border-paper-300 hover:border-accent-green/50 hover:bg-accent-greenSoft/30",
                      )}
                    >
                      <span className="text-[11px] text-ink-500">
                        📎 选择 TXT / HTML 反馈文件
                      </span>
                      <input
                        key={fileInputKey}
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".txt,.html,.htm"
                        className="hidden"
                        onChange={(e) => handleImportFiles(e.target.files)}
                      />
                    </label>
                    {importedFeedbacks.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {importedFeedbacks.map((imp) => {
                          const impCount = imp.entries.filter(
                            (e) => e?.text?.trim() || e?.status,
                          ).length;
                          return (
                            <div
                              key={imp.id}
                              className="flex items-center justify-between rounded-md bg-paper-100 px-2 py-1.5"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-medium text-ink-700 truncate">
                                  {imp.sourceName}
                                </div>
                                <div className="text-[9px] text-ink-400">
                                  {impCount} 页有反馈
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImported(imp.id)}
                                className="text-ink-300 hover:text-red-500 transition-colors ml-1 shrink-0"
                                title="移除"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <h3 className="font-serif font-semibold text-ink-900 text-sm">
                    {isAuthorMode ? "待办清单" : "页序总览"}
                  </h3>
                  {!isAuthorMode && (
                    <div className="text-[11px] text-ink-400 mt-0.5">
                      <span className="text-accent-green font-medium">
                        {effectiveFeedbackCount}
                      </span>{" "}
                      / {pages.length} 页已处理
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-ink-400 font-mono">
                  {pages.length}
                </div>
              </div>

              {/* 状态统计 */}
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-paper-100">
                {(["review", "revise", "pass"] as const).map((s) => {
                  const meta = FEEDBACK_STATUS_META[s];
                  return (
                    <span
                      key={s}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]",
                        statusCounts[s] > 0
                          ? `${meta.color} text-white`
                          : `bg-paper-100 text-ink-400`,
                      )}
                    >
                      <span>{meta.icon}</span>
                      <span>{statusCounts[s] || 0}</span>
                    </span>
                  );
                })}
                {hasAnyFeedback && (
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="ml-auto text-[10px] text-ink-400 hover:text-red-500 transition-colors flex items-center gap-0.5"
                    title="清空所有反馈"
                  >
                    <Trash2 size={10} /> 清空
                  </button>
                )}
              </div>
            </div>

            {isAuthorMode ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {(["review", "revise", "pass"] as const).map((statusKey) => {
                  const meta = FEEDBACK_STATUS_META[statusKey];
                  const items = feedback
                    .map((entry, idx) => ({ entry, idx }))
                    .filter(
                      ({ entry }) =>
                        (entry.status === statusKey) &&
                        (entry.text?.trim() || entry.status),
                    );
                  if (items.length === 0) return null;

                  const unresolvedCount = items.filter(({ entry }) => !entry.resolved).length;

                  return (
                    <div key={statusKey}>
                      <div className="flex items-center justify-between px-1 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-3 h-3 rounded-full", meta.color)} />
                          <span className="text-[11px] font-semibold text-ink-700">
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-ink-400">
                            ({unresolvedCount}/{items.length})
                          </span>
                        </div>
                        {unresolvedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setAllResolved(statusKey)}
                            className="text-[10px] text-accent-green hover:underline"
                          >
                            全部处理
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {items.map(({ entry, idx }) => {
                          const merged = mergedFeedback[idx];
                          const totalMentions = merged ? merged.texts.length + Object.values(merged.statuses).flat().length : 0;
                          const multiSources = merged && Object.values(merged.statuses).some((arr) => arr.length > 1);
                          return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveIdx(idx)}
                            className={cn(
                              "w-full text-left flex items-center gap-2 p-2 rounded-lg border transition-all",
                              entry.resolved
                                ? "bg-paper-50 border-paper-200 opacity-60"
                                : "bg-white border-paper-200 hover:border-accent-orange/40 hover:shadow-sm",
                              activeIdx === idx && "border-accent-orange bg-accent-orangeSoft/30",
                            )}
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleResolved(idx);
                              }}
                              className={cn(
                                "w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all",
                                entry.resolved
                                  ? "bg-accent-green border-accent-green text-white"
                                  : "border-paper-300 hover:border-accent-orange",
                              )}
                            >
                              {entry.resolved && <Check size={10} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-medium text-ink-700 flex items-center gap-1">
                                <span className="font-mono text-ink-400">
                                  {String(idx + 1).padStart(2, "0")}
                                </span>
                                <span className="truncate">
                                  {entry.text?.trim()
                                    ? entry.text.trim().split("\n")[0].slice(0, 20)
                                    : "（仅状态标记）"}
                                </span>
                                {multiSources && totalMentions > 1 && (
                                  <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent-orange/10 text-accent-orange text-[9px] font-bold border border-accent-orange/20">
                                    👥 {totalMentions}人提过
                                  </span>
                                )}
                              </div>
                              {entry.text?.trim() && entry.text.length > 20 && (
                                <div className="text-[10px] text-ink-400 truncate">
                                  {entry.text.trim().slice(20, 45)}…
                                </div>
                              )}
                              {merged && merged.texts.length > 1 && (
                                <div className="text-[9px] text-ink-400 mt-0.5 truncate">
                                  来源：{merged.texts.map((t) => t.source).join("、")}
                                </div>
                              )}
                            </div>
                          </button>
                        );})}
                      </div>
                    </div>
                  );
                })}

                {effectiveFeedbackCount === 0 && (
                  <div className="text-center text-[11px] text-ink-400 py-8">
                    还没有任何反馈
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2 content-start">
                {pages.map((p, i) => {
                  const active = activeIdx === i;
                  const entry = feedback[i] || { text: "", status: null };
                  const hasFb = entry.text?.trim();
                  const hasStatus = entry.status;
                  const isResolved = entry.resolved;
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      className={cn(
                        "relative rounded-lg overflow-hidden border-2 transition-all",
                        active
                          ? "border-accent-orange shadow-paperHover scale-[1.02] z-10"
                          : hasStatus
                            ? cn(`${FEEDBACK_STATUS_META[hasStatus].borderColor}`, "border-2")
                            : "border-paper-300 hover:border-ink-300",
                        isResolved && "opacity-60",
                      )}
                    >
                      <div className="aspect-[3/4] bg-paper-200 relative">
                        <img
                          src={p.i}
                          alt={`第 ${i + 1} 页`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isResolved && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-accent-green text-white flex items-center justify-center shadow-lg">
                              <Check size={13} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="absolute top-1 left-1 w-5 h-5 rounded bg-paper-50/90 text-[10px] font-semibold text-ink-700 flex items-center justify-center tabular-nums">
                        {i + 1}
                      </div>
                      {hasFb && !isResolved && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-accent-green text-white flex items-center justify-center shadow-paper">
                          <MessageSquare size={10} />
                        </div>
                      )}
                      {hasStatus && (
                        <div
                          className={cn(
                            "absolute bottom-1 right-1 px-1 py-0.5 rounded text-white text-[9px] font-medium shadow-paper",
                            FEEDBACK_STATUS_META[hasStatus].color,
                          )}
                        >
                          {FEEDBACK_STATUS_META[hasStatus].icon}
                        </div>
                      )}
                      {p.t && (
                        <div
                          className={`absolute bottom-1 left-1 tag-chip !px-1.5 !py-0.5 ${TAG_META[p.t].color}`}
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
            )}

            {hasAnyFeedback && (
              <div className="p-3 border-t border-paper-200 bg-paper-100/60">
                <div className="text-[11px] text-ink-500 mb-2 font-serif font-medium">
                  📋 已处理的页
                </div>
                <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto">
                  {feedback.map((entry, i) => {
                    const hasText = entry?.text?.trim();
                    const hasStatus = entry?.status;
                    if (!hasText && !hasStatus) return null;
                    return (
                      <span
                        key={i}
                        onClick={() => setActiveIdx(i)}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium cursor-pointer transition-colors",
                          hasStatus
                            ? `${FEEDBACK_STATUS_META[hasStatus].softColor} text-ink-700 hover:opacity-80`
                            : "bg-accent-greenSoft text-accent-green hover:bg-accent-green hover:text-white",
                        )}
                      >
                        <span>
                          {hasStatus
                            ? `${FEEDBACK_STATUS_META[hasStatus].icon} `
                            : ""}
                        </span>
                        第 {i + 1} 页
                        {hasText && (
                          <span className="opacity-60">
                            · {entry.text.trim().length} 字
                          </span>
                        )}
                      </span>
                    );
                  })}
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
  entries: FeedbackEntry[],
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

  const statusCounts: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.status) statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  });

  const lines: string[] = [];
  lines.push("=".repeat(50));
  lines.push(`📖 ${pkg.t || "未命名作品"} - 审稿反馈摘要`);
  lines.push("=".repeat(50));
  lines.push(`生成：${new Date().toLocaleString("zh-CN")}`);
  lines.push(`平台：${platformLabel}　方向：${directionLabel}`);
  lines.push(`页数：${pkg.pg.length}　有反馈：${entries.filter((t) => t?.text?.trim()).length} 页`);
  if (Object.keys(statusCounts).length > 0) {
    const parts: string[] = [];
    (["review", "revise", "pass"] as const).forEach((s) => {
      if (statusCounts[s]) {
        const meta = FEEDBACK_STATUS_META[s];
        parts.push(`${meta.icon} ${meta.label} ${statusCounts[s]}`);
      }
    });
    lines.push(`审稿统计：${parts.join("　")}`);
  }
  lines.push("");

  const grouped: Record<string, Array<{ idx: number; p: SharePackage['pg'][number]; entry: FeedbackEntry }>> = {
    review: [], revise: [], pass: [], unmarked: [],
  };
  pkg.pg.forEach((p, i) => {
    const entry = entries[i] || { text: "", status: null };
    const key = entry.status || "unmarked";
    grouped[key].push({ idx: i, p, entry });
  });

  (["review", "revise", "pass", "unmarked"] as const).forEach((groupKey) => {
    const items = grouped[groupKey];
    const hasContent = items.some((it) => it.p.c || it.entry.text?.trim());
    if (!hasContent) return;
    const meta = groupKey === "unmarked"
      ? { label: "未标注", icon: "⚪" }
      : FEEDBACK_STATUS_META[groupKey];
    lines.push(`${meta.icon} ${meta.label}`);
    lines.push("-".repeat(40));
    items.forEach(({ idx, p, entry }) => {
      const tagStr = p.t ? ` [${TAG_EMOJI[p.t]} ${TAG_LABEL[p.t]}]` : "";
      const text = entry.text?.trim();
      if (!p.c && !text) return;
      lines.push(`── 第 ${idx + 1} 页${tagStr} ──`);
      if (p.c) lines.push(`💭 作者：${p.c}`);
      if (text) lines.push(`💬 反馈：${text}`);
      lines.push("");
    });
    lines.push("");
  });

  return lines.join("\n");
}
