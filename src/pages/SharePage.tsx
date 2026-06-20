import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Share2,
  ArrowLeft,
  Download,
  CircleHelp,
  Sparkles,
  FileJson,
  RefreshCw,
} from "lucide-react";
import { useComicStore } from "@/store/comicStore";
import { TAG_META, PLATFORM_META, READ_DIRECTION_META, type SharePackage } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function SharePage() {
  const { data = "" } = useParams();
  const navigate = useNavigate();
  const loadFromShare = useComicStore((s) => s.loadFromShare);
  const setWorkFromShare = useComicStore((s) => s.setWorkFromShare);

  const [pkg, setPkg] = useState<SharePackage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    try {
      const loaded = loadFromShare(data);
      if (!loaded) {
        setError("链接无效或数据已损坏，请确认分享链接是否完整。");
        return;
      }
      setPkg(loaded);
    } catch (e) {
      setError("解析分享数据失败，可能是链接不完整或编码错误。");
    }
  }, [data, loadFromShare]);

  const pages = useMemo(() => pkg?.pg ?? [], [pkg]);
  const current = pages[activeIdx];
  const progress = pages.length ? ((activeIdx + 1) / pages.length) * 100 : 0;

  const downloadJson = () => {
    if (!pkg) return;
    const blob = new Blob([JSON.stringify(pkg, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pkg.t || "分镜审稿包"}-share.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
            <RefreshCw size={22} />
          </div>
          <h2 className="font-serif text-lg font-semibold text-ink-900 mb-2">
            链接无法打开
          </h2>
          <p className="text-sm text-ink-500 mb-6 leading-relaxed">{error}</p>
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadJson}
            className="btn-secondary !px-4 !py-2"
          >
            <Download size={15} /> 下载 JSON
          </button>
          <button
            type="button"
            onClick={importToEdit}
            className="btn-primary !px-4 !py-2"
          >
            <FileJson size={15} /> 导入并编辑
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 pb-10 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <section className="space-y-4 min-w-0">
            <div className="paper-card overflow-hidden grain-overlay">
              <div className="relative w-full max-w-md mx-auto p-4 md:p-6">
                <div className="relative mx-auto rounded-[34px] bg-[#101012] p-2.5 shadow-phone" style={{ width: "100%", maxWidth: 320 }}>
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
                        <span className="text-[11px]">{TAG_META[current.t].icon}</span>
                        <span className="text-[11px]">{TAG_META[current.t].label}</span>
                      </div>
                    )}

                    <div
                      className="absolute inset-y-0 left-0 w-1/2 cursor-ew-resize z-10"
                      onClick={() => activeIdx > 0 && setActiveIdx(activeIdx - 1)}
                    />
                    <div
                      className="absolute inset-y-0 right-0 w-1/2 cursor-ew-resize z-10"
                      onClick={() =>
                        activeIdx < pages.length - 1 && setActiveIdx(activeIdx + 1)
                      }
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
                    <span>
                      <span className="text-ink-700 font-semibold">{activeIdx + 1}</span>
                      <span className="mx-1">/</span>
                      <span>{pages.length}</span>
                    </span>
                    <span>点击屏幕左右两侧翻页</span>
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
          </section>

          <aside className="paper-card grain-overlay overflow-hidden">
            <div className="p-4 border-b border-paper-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-semibold text-ink-900 text-sm">
                  页序总览
                </h3>
                <span className="text-[11px] text-ink-400">
                  点击跳转
                </span>
              </div>
              <span className="text-[11px] text-ink-400 font-mono">
                {pages.length}
              </span>
            </div>
            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto p-3 grid grid-cols-3 gap-2">
              {pages.map((p, i) => {
                const active = activeIdx === i;
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      active
                        ? "border-accent-orange shadow-paperHover scale-[1.02] z-10"
                        : "border-paper-300 hover:border-ink-300"
                    }`}
                  >
                    <div className="aspect-[3/4] bg-paper-200">
                      <img
                        src={p.i}
                        alt={`第 ${i + 1} 页`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute top-1 left-1 w-5 h-5 rounded bg-paper-50/90 text-[10px] font-semibold text-ink-700 flex items-center justify-center">
                      {i + 1}
                    </div>
                    {p.t && (
                      <div
                        className={`absolute bottom-1 right-1 tag-chip !px-1.5 !py-0.5 ${TAG_META[p.t].color}`}
                      >
                        <span className="text-[9px]">{TAG_META[p.t].icon}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
