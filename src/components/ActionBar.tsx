import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Share2,
  Link as LinkIcon,
  Copy,
  Download,
  AlertTriangle,
  Check,
  X,
  Loader2,
  FileCode,
  FileText,
  ShieldCheck,
  Clock,
  Globe,
} from "lucide-react";
import { useComicStore, type ShareResult } from "@/store/comicStore";
import { buildSharePackage, type ShareMode, SHORT_SHARE_TTL, cn } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

const TTL_DAYS = Math.round(SHORT_SHARE_TTL / (1000 * 60 * 60 * 24));

function ModeSwitcher({
  mode,
  onChange,
  disabled,
}: {
  mode: ShareMode;
  onChange: (m: ShareMode) => void;
  disabled?: boolean;
}) {
  const items: Array<{
    key: ShareMode;
    label: string;
    sub: string;
    icon: typeof Globe;
  }> = [
    { key: "long", label: "完整链接", sub: "数据直接编码，跨设备可用", icon: Globe },
    { key: "short", label: "短链接", sub: `同浏览器可用，保留 ${TTL_DAYS} 天`, icon: Clock },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {items.map((it) => {
        const active = mode === it.key;
        const Icon = it.icon;
        return (
          <button
            key={it.key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(it.key)}
            className={
              "text-left p-3 rounded-xl border-2 transition-all disabled:opacity-50 " +
              (active
                ? "border-accent-orange/60 bg-accent-orangeSoft/50 shadow-paper"
                : "border-paper-300 bg-paper-50 hover:bg-paper-100")
            }
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon
                size={14}
                className={active ? "text-accent-orange" : "text-ink-400"}
              />
              <span
                className={
                  "text-sm font-semibold " +
                  (active ? "text-ink-900" : "text-ink-600")
                }
              >
                {it.label}
              </span>
            </div>
            <div className="text-[11px] text-ink-400 leading-tight pl-6">
              {it.sub}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ShareModal({ onClose }: { onClose: () => void }) {
  const generate = useComicStore((s) => s.generateShareLink);
  const exportStandalone = useComicStore((s) => s.exportStandaloneFile);
  const work = useComicStore((s) => s.currentWork);
  const [mode, setMode] = useState<ShareMode>("long");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<ShareResult>(() => generate());
  const [loading, setLoading] = useState(false);

  const regenerate = (nextMode?: ShareMode) => {
    const target = nextMode ?? mode;
    setLoading(true);
    setTimeout(() => {
      setResult(generate(target));
      setLoading(false);
    }, 0);
  };

  const switchMode = (m: ShareMode) => {
    setMode(m);
    regenerate(m);
  };

  const copyLink = async () => {
    if (!result.ok) return;
    try {
      await navigator.clipboard.writeText(result.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const downloadJson = () => {
    if (!work) return;
    const pkg = buildSharePackage(work);
    const blob = new Blob([JSON.stringify(pkg, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${work.title || "分镜审稿包"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const linkCharCount = result.link.length;
  const isLongLinkTooLong = result.mode === "long" && linkCharCount > 6000;
  const charCountColor = useMemo(
    () =>
      linkCharCount > 6000
        ? "text-red-500"
        : linkCharCount > 3000
          ? "text-accent-orange"
          : "text-ink-300",
    [linkCharCount],
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="paper-card w-full max-w-xl p-6 grain-overlay"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-greenSoft flex items-center justify-center text-accent-green">
                <Share2 size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-ink-900">
                  导出审稿包
                </h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  选择最适合的分享方式，让编辑/朋友直接试看
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost !p-1.5"
            >
              <X size={18} />
            </button>
          </div>

          <ModeSwitcher mode={mode} onChange={switchMode} />

          <AnimatePresence mode="wait">
            {!result.ok && result.reason ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="rounded-xl bg-accent-orangeSoft/60 border border-accent-orange/20 p-4 mb-4 flex items-start gap-3"
              >
                <AlertTriangle
                  size={18}
                  className="text-accent-orange shrink-0 mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-accent-orange font-serif">
                    {result.reason}
                  </div>
                  <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                    建议直接下载 HTML 文件，对方双击就能打开，最稳妥。
                    或者试试短链接方式（仅同浏览器可用）。
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="space-y-2 mb-4"
              >
                {isLongLinkTooLong && (
                  <div className="rounded-xl bg-accent-orangeSoft/40 border border-accent-orange/20 p-3 flex items-start gap-2.5">
                    <AlertTriangle
                      size={15}
                      className="text-accent-orange shrink-0 mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-medium text-accent-orange">
                        链接比较长，部分浏览器/聊天软件可能打不开
                      </div>
                      <p className="text-[11px] text-ink-500 mt-0.5 leading-relaxed">
                        建议优先用下方的 HTML 文件分享，对方收到直接打开就能看。
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-ink-500 ml-1">
                    {result.mode === "long" ? "完整分享链接" : "短分享链接"}
                  </label>
                  <span className={`text-[10px] font-mono ${charCountColor}`}>
                    {linkCharCount.toLocaleString()} 字符
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 rounded-lg border border-paper-300 bg-paper-100 px-3 py-2 overflow-hidden">
                    <LinkIcon size={14} className="text-ink-400 shrink-0" />
                    <input
                      type="text"
                      readOnly
                      value={result.link}
                      className="flex-1 bg-transparent outline-none text-xs text-ink-600 truncate font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={copyLink}
                    disabled={!result.ok}
                    className={
                      copied
                        ? "btn-primary !bg-accent-green !px-3"
                        : "btn-primary !px-3"
                    }
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : copied ? (
                      <>
                        <Check size={16} /> 已复制
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> 复制
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-ink-400 leading-relaxed px-1 flex items-start gap-1.5">
                  <ShieldCheck size={12} className="mt-0.5 shrink-0 text-ink-300" />
                  {result.mode === "long" ? (
                    <span>
                      数据直接编码在链接里，任何设备打开就能看，
                      <span className="text-ink-500">不需要服务器，也不会上传</span>。
                    </span>
                  ) : (
                    <span className="text-accent-orange">
                      ⚠️ 仅在<strong>同一台浏览器</strong>中可用。
                      数据存在你当前的浏览器里，对方换设备/清缓存就打不开了。
                      <span className="text-ink-500">
                        重要内容务必再导出一份 HTML。
                      </span>
                    </span>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={cn(
              "rounded-xl p-3.5 mb-4 border transition-all",
              isLongLinkTooLong || !result.ok
                ? "bg-accent-greenSoft/30 border-accent-green/30"
                : "bg-paper-100/70 border-paper-200",
            )}
          >
            <div className="flex items-center gap-2 mb-2.5">
              {isLongLinkTooLong || !result.ok ? (
                <div className="w-7 h-7 rounded-lg bg-accent-green text-white flex items-center justify-center shrink-0">
                  <ShieldCheck size={15} />
                </div>
              ) : (
                <FileCode size={14} className="text-accent-green" />
              )}
              <div>
                <div
                  className={cn(
                    "text-xs font-semibold font-serif",
                    isLongLinkTooLong || !result.ok
                      ? "text-accent-green"
                      : "text-ink-700",
                  )}
                >
                  {(isLongLinkTooLong || !result.ok) && "⭐ 推荐 "}
                  自包含 HTML 文件（最稳妥）
                </div>
              </div>
            </div>
            <p className="text-[11px] text-ink-500 leading-relaxed mb-3 pl-0 md:pl-9">
              HTML 文件嵌入了全部图片 + 样式，对方双击就能在浏览器打开，
              不用依赖这个网站。通过微信、邮件、网盘发送都没问题。
            </p>
            <div className="flex flex-wrap gap-2 pl-0 md:pl-9">
              <button
                type="button"
                onClick={() => exportStandalone()}
                disabled={!work}
                className={cn(
                  "!py-2 !px-3 text-xs",
                  isLongLinkTooLong || !result.ok
                    ? "btn-primary !bg-accent-green hover:!bg-accent-greenHover"
                    : "btn-secondary",
                )}
              >
                <FileText size={14} /> 下载 HTML 分享包
              </button>
              <button
                type="button"
                onClick={downloadJson}
                disabled={!work}
                className="btn-ghost !py-2 !px-3 text-xs border border-paper-300"
              >
                <FileCode size={14} /> JSON 源文件
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-paper-200">
            <div className="text-[11px] text-ink-400 flex items-center gap-1.5">
              <Clock size={12} />
              {work ? `${work.pages.length} 页分镜` : "暂无分镜"}
            </div>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => regenerate()}
              className="btn-ghost"
              title="重新生成"
              disabled={loading}
            >
              <Loader2 size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ActionBar() {
  const navigate = useNavigate();
  const work = useComicStore((s) => s.currentWork);
  const create = useComicStore((s) => s.createWork);
  const [shareOpen, setShareOpen] = useState(false);

  const hasPages = !!work && work.pages.length > 0;
  const hasTitle = !!work?.title?.trim();

  return (
    <>
      <div className="h-20 shrink-0" aria-hidden />
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-paper-100 via-paper-100/95 to-paper-100/0 pt-6 pb-4 px-4 md:px-6 pointer-events-none">
        <div className="max-w-[1400px] mx-auto pointer-events-auto">
          <div className="paper-card px-4 py-3 flex flex-wrap items-center justify-between gap-3 grain-overlay">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-ink-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                本地自动保存
              </div>
              {!hasTitle && (
                <button
                  type="button"
                  onClick={() => !work && create()}
                  className="text-xs text-ink-400 hover:text-ink-600 transition-colors"
                >
                  开始一个新作品
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                disabled={!hasPages}
                className="btn-secondary !px-4 !py-2"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">导出审稿包</span>
                <span className="sm:hidden">分享</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/reader")}
                disabled={!hasPages}
                className="btn-primary !px-5 !py-2"
              >
                <Play size={16} className="fill-current" />
                <span>开始模拟阅读</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
    </>
  );
}
