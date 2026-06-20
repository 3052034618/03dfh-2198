import { useCallback, useRef, useState } from "react";
import { ImagePlus, UploadCloud, Loader2 } from "lucide-react";
import { useComicStore } from "@/store/comicStore";
import { cn } from "@/utils";
import { motion } from "framer-motion";

export default function DropzoneCanvas() {
  const addFiles = useComicStore((s) => s.addFiles);
  const isUploading = useComicStore((s) => s.isUploading);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFiles = useCallback(
    async (list: FileList | File[]) => {
      const arr = Array.from(list);
      if (arr.length) await addFiles(arr);
    },
    [addFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) {
        void onFiles(e.dataTransfer.files);
      }
    },
    [onFiles],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) void onFiles(files);
    },
    [onFiles],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      onPaste={handlePaste}
      tabIndex={0}
      className={cn(
        "relative outline-none rounded-2xl h-[340px] w-full transition-all duration-200 overflow-hidden",
        "border-2 border-dashed",
        isDragging
          ? "border-accent-orange bg-accent-orangeSoft/40 scale-[1.01]"
          : "border-paper-400 bg-paper-50/70 hover:border-accent-orange/60 hover:bg-paper-50",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && void onFiles(e.target.files)}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center select-none">
        {isUploading ? (
          <div className="flex flex-col items-center gap-3 animate-float-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-accent-orangeSoft flex items-center justify-center text-accent-orange">
                <Loader2 size={28} className="animate-spin" />
              </div>
            </div>
            <div>
              <div className="font-serif text-ink-700 font-medium">
                正在导入分镜草图…
              </div>
              <div className="text-xs text-ink-400 mt-1">
                图片会自动压缩，保证分享链接不会太长
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col items-center gap-3 transition-transform",
              isDragging && "scale-105",
            )}
          >
            <motion.div
              animate={isDragging ? { y: -6, scale: 1.1 } : { y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-accent-orangeSoft to-paper-200 flex items-center justify-center shadow-paper">
                <UploadCloud size={36} className="text-accent-orange" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-paper-50 border border-paper-300 flex items-center justify-center shadow-paper">
                <ImagePlus size={16} className="text-ink-500" />
              </div>
            </motion.div>

            <div className="pt-2">
              <div className="font-serif text-xl font-semibold text-ink-900 tracking-wide">
                把分镜草图拖进这里
              </div>
              <div className="text-sm text-ink-400 mt-1.5 space-y-1">
                <div>
                  支持点击选择、批量拖拽，或者
                  <span className="inline-block mx-1 px-1.5 py-0.5 rounded bg-paper-200 text-ink-500 font-mono text-xs">
                    Ctrl+V
                  </span>
                  粘贴剪贴板图片
                </div>
                <div className="text-xs text-ink-300">
                  建议单张图片 1080×1920 左右，PNG/JPG/WebP 均可
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.05]"
        aria-hidden
      >
        <defs>
          <pattern id="guideGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#2C2A27"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#guideGrid)" />
      </svg>
    </motion.div>
  );
}
