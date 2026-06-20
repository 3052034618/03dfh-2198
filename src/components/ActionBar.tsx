import { useState } from "react";
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
} from "lucide-react";
import { useComicStore } from "@/store/comicStore";
import { buildSharePackage } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

function ShareModal({ onClose }: { onClose: () => void }) {
  const generate = useComicStore((s) => s.generateShareLink);
  const work = useComicStore((s) => s.currentWork);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState(() => generate());

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
          className="paper-card w-full max-w-lg p-6 grain-overlay"
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
                  生成可分享链接，或者下载 JSON 文件
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

          {!result.ok ? (
            <div className="rounded-xl bg-accent-orangeSoft/60 border border-accent-orange/20 p-4 mb-4 flex items-start gap-3">
              <AlertTriangle
                size={18}
                className="text-accent-orange shrink-0 mt-0.5"
              />
              <div>
                <div className="text-sm font-medium text-accent-orange font-serif">
                  {result.reason || "无法生成链接"}
                </div>
                <p className="text-xs text-ink-500 mt-1">
                  可以尝试下载 JSON 文件，通过微信/邮件等方式发送给对方
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              <label className="text-xs font-medium text-ink-500 ml-1">
                分享链接
              </label>
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
                  className={
                    copied
                      ? "btn-primary !bg-accent-green !px-3"
                      : "btn-primary !px-3"
                  }
                >
                  {copied ? (
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
              <p className="text-[11px] text-ink-400 leading-relaxed px-1">
                链接里包含图片和自评信息，打开即可查看审稿内容。
                <span className="text-ink-500">
                  注意：由于图片直接编码在链接中，图片越多链接越长。
                </span>
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-paper-200">
            <button
              type="button"
              onClick={downloadJson}
              className="btn-secondary flex-1"
              disabled={!work}
            >
              <Download size={16} /> 下载审稿包 JSON
            </button>
            <button
              type="button"
              onClick={() => setResult(generate())}
              className="btn-ghost"
              title="重新生成"
            >
              <Loader2 size={16} />
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
