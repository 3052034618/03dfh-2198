export type PageTag =
  | "setup"
  | "climax"
  | "transition"
  | "fight"
  | "daily"
  | "suspense"
  | "comedy"
  | "emotion";

export type ReadDirection = "vertical" | "rtl";

export type Platform = "wechat" | "kuaikan" | "bilibili" | "dongman" | "other";

export interface ComicPage {
  id: string;
  index: number;
  imageDataUrl: string;
  fileName: string;
  tag: PageTag | null;
  concerns: string;
  createdTime: number;
}

export interface Work {
  id: string;
  title: string;
  platform: Platform;
  readDirection: ReadDirection;
  estimatedPages: number;
  pages: ComicPage[];
  createdTime: number;
  updatedTime: number;
}

export type ReadMode = "flip" | "pause";

export interface SharePackage {
  t: string;
  p: Platform;
  d: ReadDirection;
  pg: Array<{
    i: string;
    t: PageTag | null;
    c: string;
  }>;
}

export const TAG_META: Record<
  PageTag,
  { label: string; color: string; softColor: string; icon: string }
> = {
  setup: { label: "铺垫", color: "bg-tag-setup", softColor: "bg-tag-setup/15", icon: "🌱" },
  climax: { label: "爆点", color: "bg-tag-climax", softColor: "bg-tag-climax/15", icon: "💥" },
  transition: { label: "转场", color: "bg-tag-transition", softColor: "bg-tag-transition/15", icon: "↪️" },
  fight: { label: "打斗", color: "bg-tag-fight", softColor: "bg-tag-fight/15", icon: "⚔️" },
  daily: { label: "日常", color: "bg-tag-daily", softColor: "bg-tag-daily/15", icon: "🏠" },
  suspense: { label: "悬疑", color: "bg-tag-suspense", softColor: "bg-tag-suspense/15", icon: "👁️" },
  comedy: { label: "搞笑", color: "bg-tag-comedy", softColor: "bg-tag-comedy/15", icon: "😄" },
  emotion: { label: "情感", color: "bg-tag-emotion", softColor: "bg-tag-emotion/15", icon: "💗" },
};

export const PLATFORM_META: Record<Platform, { label: string; hint: string }> = {
  wechat: { label: "微信公众号", hint: "竖屏长条为主" },
  kuaikan: { label: "快看漫画", hint: "条漫，节奏明快" },
  bilibili: { label: "哔哩哔哩漫画", hint: "页漫/条漫均可" },
  dongman: { label: "腾讯动漫", hint: "页漫为主" },
  other: { label: "其他平台", hint: "自定义目标平台" },
};

export const READ_DIRECTION_META: Record<ReadDirection, { label: string; desc: string }> = {
  vertical: { label: "从上到下（条漫）", desc: "手机竖屏滚动阅读" },
  rtl: { label: "从右到左（页漫）", desc: "传统日漫翻页方式" },
};
