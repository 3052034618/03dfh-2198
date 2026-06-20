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
  fileToDataUrl,
  generateShareLink,
  generateThumbnail,
  loadWorkFromStorage,
  parseShareLink,
  saveWorkToStorage,
  uid,
} from "@/utils";

interface ComicState {
  currentWork: Work | null;
  selectedPageId: string | null;
  readMode: ReadMode;
  pauseDuration: number;
  isUploading: boolean;

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

  // 分享
  generateShareLink: () => { link: string; ok: boolean; reason?: string };
  loadFromShare: (encoded: string) => SharePackage | null;

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

  generateShareLink: () => {
    const { currentWork } = get();
    if (!currentWork || currentWork.pages.length === 0) {
      return { ok: false, link: "", reason: "请先上传分镜图" };
    }
    const pkg = buildSharePackage(currentWork);
    try {
      const link = generateShareLink(pkg);
      if (link.length > 8000) {
        return {
          ok: false,
          link,
          reason: "内容过长，建议减少图片尺寸或下载 JSON 文件分享",
        };
      }
      return { ok: true, link };
    } catch (e) {
      return { ok: false, link: "", reason: "分享链接生成失败" };
    }
  },

  loadFromShare: (encoded) => parseShareLink(encoded),

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
