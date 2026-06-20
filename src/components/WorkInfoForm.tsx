import { BookOpen, Layers, Compass, ScrollText } from "lucide-react";
import { useComicStore } from "@/store/comicStore";
import {
  PLATFORM_META,
  READ_DIRECTION_META,
  type Platform,
  type ReadDirection,
} from "@/types";
import { ChevronDown } from "lucide-react";

export default function WorkInfoForm() {
  const work = useComicStore((s) => s.currentWork);
  const update = useComicStore((s) => s.updateWork);
  const create = useComicStore((s) => s.createWork);

  const active = work ?? {
    title: "",
    platform: "kuaikan" as Platform,
    readDirection: "vertical" as ReadDirection,
    estimatedPages: 24,
  };

  const ensure = () => {
    if (!work) create();
  };

  return (
    <div className="paper-card p-5 grain-overlay">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent-orangeSoft flex items-center justify-center text-accent-orange shrink-0">
          <BookOpen size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-lg font-semibold text-ink-900 tracking-wide">
            作品信息
          </h2>
          <p className="text-xs text-ink-400 mt-0.5">
            简单填几项，帮你把审稿包整理得更清楚
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700 mb-1.5">
            <ScrollText size={14} className="text-ink-400" />
            标题
          </label>
          <input
            type="text"
            className="input-field font-serif"
            placeholder="例如：《迷雾森林》第 03 话"
            value={active.title}
            onChange={(e) => {
              ensure();
              update({ title: e.target.value });
            }}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700 mb-1.5">
            <Layers size={14} className="text-ink-400" />
            目标平台
          </label>
          <div className="relative">
            <select
              className="select-field"
              value={active.platform}
              onChange={(e) => {
                ensure();
                update({ platform: e.target.value as Platform });
              }}
            >
              {Object.entries(PLATFORM_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
            />
          </div>
          <p className="text-[11px] text-ink-400 mt-1 ml-1">
            {PLATFORM_META[active.platform].hint}
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700 mb-1.5">
            <Compass size={14} className="text-ink-400" />
            阅读方向
          </label>
          <div className="relative">
            <select
              className="select-field"
              value={active.readDirection}
              onChange={(e) => {
                ensure();
                update({ readDirection: e.target.value as ReadDirection });
              }}
            >
              {Object.entries(READ_DIRECTION_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
            />
          </div>
          <p className="text-[11px] text-ink-400 mt-1 ml-1">
            {READ_DIRECTION_META[active.readDirection].desc}
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700 mb-1.5">
            <Layers size={14} className="text-ink-400" />
            预计页数
          </label>
          <input
            type="number"
            min={1}
            max={200}
            className="input-field"
            placeholder="24"
            value={active.estimatedPages || ""}
            onChange={(e) => {
              ensure();
              const n = Number(e.target.value);
              if (!isNaN(n)) update({ estimatedPages: Math.max(1, n) });
            }}
          />
        </div>

        <div className="flex items-end">
          <div className="w-full rounded-lg bg-paper-200/60 border border-dashed border-paper-300 px-4 py-2.5">
            <div className="text-[11px] text-ink-400">
              已上传
            </div>
            <div className="font-serif text-base font-semibold text-ink-700">
              <span className="text-accent-orange">
                {work?.pages.length ?? 0}
              </span>
              <span className="text-ink-300 mx-1">/</span>
              <span>{active.estimatedPages || "-"}</span>
              <span className="text-ink-400 ml-1 text-xs font-normal">页</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
