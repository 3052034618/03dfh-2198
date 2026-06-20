import { create } from "zustand";
import type {
  ComicPage,
  PageTag,
  Platform,
  ReadDirection,
  ReadMode,
  SharePackage,
  Work,
} from "@/types";
import {
  buildSharePackage,
  exportFeedbackText,
  exportStandaloneHtml,
  fileToDataUrl,
  generateLongLink,
  generateShortLink,
  generateThumbnail,
  loadShortShare,
  loadWorkFromStorage,
  parseShareLink,
  saveShortShare,
  saveWorkToStorage,
  type ShareMode,
  type FeedbackEntry,
  uid,
} from "@/utils";

export interface ShareResult {
  mode: ShareMode;
  link: string;
  ok: boolean;
  reason?: string;
  htmlReady: boolean;
}

interface ComicState {
  currentWork: Work | null;
  selectedPageId: string | null;
  readMode: ReadMode;
  pauseDuration: number;
  isUploading: boolean;
  readingLog: { pageIdx: number; enterTime: number; leaveTime: number }[];

  // 工作区
  createWork: (data?: {
    title?: string;
    platform?: Platform;
    readDirection?: ReadDirection;
    estimatedPages?: number;
  }) => void;
  updateWork: (data: Partial<Pick<Work, "title" | "platform" | "readDirection" | "estimatedPages">>) => void;
  setWorkFromShare: (pkg: SharePackage) => void;

  // 页面操作
  addFiles: (files: File[]) => Promise<void>;
  removePage: (pageId: string) => void;
  reorderPages: (fromId: string, toId: string) => void;
  selectPage: (pageId: string | null) => void;

  // 标签与备注
  setPageTag: (pageId: string, tag: PageTag | null) => void;
  setPageConcerns: (pageId: string, concerns: string) => void;

  // 阅读模式
  setReadMode: (mode: ReadMode) => void;
  setPauseDuration: (sec: number) => void;

  // 阅读日志（用于复盘）
  logPageEnter: (pageIdx: number) => void;
  logPageLeave: (pageIdx: number) => void;
  resetReadingLog: () => void;
  saveReadingSnapshot: (name?: string) => void;
  readingSnapshots: Array<{ id: string; name: string; createdAt: number; log: { pageIdx: number; enterTime: number; leaveTime: number }[] }>;
  clearReadingSnapshots: () => void;

  // 分享
  generateShareLink: (mode?: ShareMode) => ShareResult;
  exportStandaloneFile: (feedback?: FeedbackEntry[] | string[]) => void;
  loadFromShare: (encoded: string) => SharePackage | null;
  loadFromShortShare: (id: string) => SharePackage | null;
  exportFeedbackSummary: (feedback: FeedbackEntry[] | string[]) => string;

  // 持久化
  hydrateFromStorage: () => void;
}

function makeInitialWork(): Work {
  return {
    id: uid("w_"),
    title: "",
    platform: "kuaikan",
    readDirection: "vertical",
    estimatedPages: 24,
    pages: [],
    createdTime: Date.now(),
    updatedTime: Date.now(),
  };
}

function persist(state: { currentWork: Work | null }) {
  if (state.currentWork) {
    state.currentWork.updatedTime = Date.now();
    saveWorkToStorage(state.currentWork);
  }
}

export const useComicStore = create<ComicState>((set, get) => ({
  currentWork: null,
  selectedPageId: null,
  readMode: "flip",
  pauseDuration: 3,
  isUploading: false,
  readingLog: [],
  readingSnapshots: [],

  createWork: (data = {}) => {
    const work = {
      ...makeInitialWork(),
      ...Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined),
      ),
    };
    set({ currentWork: work, selectedPageId: null });
    persist(get());
  },

  updateWork: (data) => {
    set((s) => {
      if (!s.currentWork) return s;
      return { currentWork: { ...s.currentWork, ...data } };
    });
    persist(get());
  },

  setWorkFromShare: (pkg) => {
    const base = makeInitialWork();
    const work: Work = {
      ...base,
      title: pkg.t,
      platform: pkg.p,
      readDirection: pkg.d,
      estimatedPages: pkg.pg.length,
      pages: pkg.pg.map((p, i) => ({
        id: uid("p_"),
        index: i,
        imageDataUrl: p.i,
        fileName: `page-${i + 1}`,
        tag: p.t,
        concerns: p.c,
        createdTime: Date.now(),
      })),
    };
    set({ currentWork: work, selectedPageId: null });
    persist(get());
  },

  addFiles: async (files) => {
    const valid = files.filter((f) => f.type.startsWith("image/"));
    if (!valid.length) return;
    set({ isUploading: true });

    try {
      const { currentWork } = get();
      const base = currentWork ?? makeInitialWork();
      const startIdx = base.pages.length;

      const newPages: ComicPage[] = [];
      for (let i = 0; i < valid.length; i++) {
        const f = valid[i];
        try {
          const dataUrl = await fileToDataUrl(f);
          const thumb = await generateThumbnail(dataUrl, 320);
          newPages.push({
            id: uid("p_"),
            index: startIdx + i,
            imageDataUrl: thumb,
            fileName: f.name,
            tag: null,
            concerns: "",
            createdTime: Date.now(),
          });
        } catch {
          /* skip */
        }
      }

      if (!currentWork) {
        set({
          currentWork: { ...base, pages: newPages },
          selectedPageId: newPages[0]?.id ?? null,
        });
      } else {
        const state = get();
        const merged = [...base.pages, ...newPages];
        merged.forEach((p, i) => (p.index = i));
        set({
          currentWork: { ...base, pages: merged },
          selectedPageId:
            state.selectedPageId ?? newPages[0]?.id ?? null,
        } as ComicState);
      }
      persist(get());
    } finally {
      set({ isUploading: false });
    }
  },

  removePage: (pageId) => {
    set((s) => {
      if (!s.currentWork) return s;
      const pages = s.currentWork.pages
        .filter((p) => p.id !== pageId)
        .map((p, i) => ({ ...p, index: i }));
      const next = { ...s.currentWork, pages };
      const selectedPageId =
        s.selectedPageId === pageId ? pages[0]?.id ?? null : s.selectedPageId;
      return { currentWork: next, selectedPageId };
    });
    persist(get());
  },

  reorderPages: (fromId, toId) => {
    set((s) => {
      if (!s.currentWork) return s;
      if (fromId === toId) return s;
      const pages = [...s.currentWork.pages];
      const from = pages.findIndex((p) => p.id === fromId);
      const to = pages.findIndex((p) => p.id === toId);
      if (from < 0 || to < 0) return s;
      const [moved] = pages.splice(from, 1);
      pages.splice(to, 0, moved);
      pages.forEach((p, i) => (p.index = i));
      return { currentWork: { ...s.currentWork, pages } };
    });
    persist(get());
  },

  selectPage: (pageId) => set({ selectedPageId: pageId }),

  setPageTag: (pageId, tag) => {
    set((s) => {
      if (!s.currentWork) return s;
      const pages = s.currentWork.pages.map((p) =>
        p.id === pageId ? { ...p, tag } : p,
      );
      return { currentWork: { ...s.currentWork, pages } };
    });
    persist(get());
  },

  setPageConcerns: (pageId, concerns) => {
    set((s) => {
      if (!s.currentWork) return s;
      const pages = s.currentWork.pages.map((p) =>
        p.id === pageId ? { ...p, concerns } : p,
      );
      return { currentWork: { ...s.currentWork, pages } };
    });
    persist(get());
  },

  setReadMode: (mode) => set({ readMode: mode }),
  setPauseDuration: (sec) =>
    set({ pauseDuration: Math.min(15, Math.max(1, sec)) }),

  logPageEnter: (pageIdx) => {
    set((s) => {
      const now = Date.now();
      const existing = s.readingLog.find((l) => l.pageIdx === pageIdx);
      if (existing) {
        existing.enterTime = now;
        return { readingLog: [...s.readingLog] };
      }
      return {
        readingLog: [...s.readingLog, { pageIdx, enterTime: now, leaveTime: 0 }],
      };
    });
  },

  logPageLeave: (pageIdx) => {
    set((s) => {
      const now = Date.now();
      const log = s.readingLog.map((l) =>
        l.pageIdx === pageIdx && l.leaveTime === 0 ? { ...l, leaveTime: now } : l,
      );
      return { readingLog: log };
    });
  },

  resetReadingLog: () => set({ readingLog: [] }),

  saveReadingSnapshot: (name) => {
    const { readingLog, readingSnapshots } = get();
    if (readingLog.length === 0) return;
    const snap = {
      id: uid("snap_"),
      name: name || `第 ${readingSnapshots.length + 1} 次阅读`,
      createdAt: Date.now(),
      log: [...readingLog],
    };
    set({ readingSnapshots: [...readingSnapshots, snap] });
  },

  clearReadingSnapshots: () => set({ readingSnapshots: [] }),

  generateShareLink: (mode) => {
    const { currentWork } = get();
    if (!currentWork || currentWork.pages.length === 0) {
      return { ok: false, link: "", reason: "请先上传分镜图", mode: "long", htmlReady: false };
    }
    const pkg = buildSharePackage(currentWork);
    const htmlReady = true;

    /* 默认自动：长链接能放就长，不行就短 */
    if (!mode) {
      try {
        const longLink = generateLongLink(pkg);
        if (longLink.length <= 6000) {
          return { ok: true, link: longLink, mode: "long", htmlReady };
        }
      } catch {
        /* fallback */
      }
      try {
        const id = saveShortShare(pkg);
        return {
          ok: true,
          link: generateShortLink(id),
          mode: "short",
          htmlReady,
        };
      } catch (e) {
        return {
          ok: false,
          link: "",
          mode: "short",
          reason: e instanceof Error ? e.message : "存储空间不足",
          htmlReady,
        };
      }
    }

    if (mode === "long") {
      try {
        const link = generateLongLink(pkg);
        if (link.length > 8000) {
          return {
            ok: false,
            link,
            mode: "long",
            reason: "图片太多导致链接过长（超过 8000 字符），建议改用短链接或导出 HTML 文件",
            htmlReady,
          };
        }
        return { ok: true, link, mode: "long", htmlReady };
      } catch {
        return {
          ok: false,
          link: "",
          mode: "long",
          reason: "长链接生成失败",
          htmlReady,
        };
      }
    }

    /* short */
    try {
      const id = saveShortShare(pkg);
      return {
        ok: true,
        link: generateShortLink(id),
        mode: "short",
        htmlReady,
      };
    } catch (e) {
      return {
        ok: false,
        link: "",
        mode: "short",
        reason: e instanceof Error ? e.message : "存储空间不足",
        htmlReady,
      };
    }
  },

  exportStandaloneFile: (feedback) => {
    const { currentWork } = get();
    if (!currentWork) return;
    const pkg = buildSharePackage(currentWork);
    const feedbackTexts = Array.isArray(feedback)
      ? feedback.map((f) => (typeof f === "string" ? f : f?.text || ""))
      : undefined;
    exportStandaloneHtml(pkg, currentWork.title || "分镜审稿包", feedbackTexts);
  },

  loadFromShare: (encoded) => parseShareLink(encoded),
  loadFromShortShare: (id) => loadShortShare(id),
  exportFeedbackSummary: (feedback) => {
    const { currentWork } = get();
    if (!currentWork) return "";
    const pkg = buildSharePackage(currentWork);
    if (Array.isArray(feedback) && feedback.length > 0 && typeof feedback[0] === "object") {
      return exportFeedbackText(pkg, feedback as FeedbackEntry[], currentWork.title || "分镜审稿反馈");
    }
    const entries = (feedback as string[] || []).map((text) => ({ text, status: null }));
    return exportFeedbackText(pkg, entries, currentWork.title || "分镜审稿反馈");
  },

  hydrateFromStorage: () => {
    const w = loadWorkFromStorage();
    if (w) {
      set({
        currentWork: w,
        selectedPageId: w.pages[0]?.id ?? null,
      });
    }
  },
}));
