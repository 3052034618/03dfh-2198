import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useComicStore } from "@/store/comicStore";
import { TAG_META, type ComicPage } from "@/types";
import { cn } from "@/utils";

function PageThumbCard({
  page,
  selected,
  onSelect,
  onRemove,
}: {
  page: ComicPage;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const tagMeta = page.tag ? TAG_META[page.tag] : null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isDragging ? 1.05 : 1,
        zIndex: isDragging ? 50 : selected ? 10 : 1,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative shrink-0 w-[116px] cursor-pointer group",
        "rounded-xl overflow-hidden transition-all",
        "bg-paper-50 border-2",
        selected
          ? "border-accent-orange shadow-paperHover ring-2 ring-accent-orange/20"
          : "border-paper-300 hover:border-ink-300 shadow-paper",
        isDragging && "opacity-80 shadow-paperHover",
      )}
    >
      <div
        className="absolute top-1.5 left-1.5 z-10"
        {...attributes}
        {...listeners}
      >
        <div
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center backdrop-blur-sm",
            selected
              ? "bg-accent-orange text-white"
              : "bg-paper-50/80 text-ink-500 hover:bg-paper-200",
          )}
        >
          <GripVertical size={13} />
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={cn(
          "absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-md flex items-center justify-center",
          "bg-paper-50/80 text-ink-500 opacity-0 group-hover:opacity-100",
          "hover:bg-red-50 hover:text-red-500 backdrop-blur-sm transition-all",
        )}
      >
        <Trash2 size={13} />
      </button>

      <div className="absolute bottom-1.5 left-1.5 z-10">
        <div
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold",
            selected
              ? "bg-accent-orange text-white"
              : "bg-paper-50/85 text-ink-700 backdrop-blur-sm",
          )}
        >
          {page.index + 1}
        </div>
      </div>

      {tagMeta && (
        <div
          className={cn(
            "absolute bottom-1.5 right-1.5 z-10 tag-chip",
            tagMeta.color,
          )}
        >
          <span className="text-[11px] leading-none">{tagMeta.icon}</span>
        </div>
      )}

      <div className="aspect-[3/4] w-full bg-paper-200 overflow-hidden">
        <img
          src={page.imageDataUrl}
          alt={`第 ${page.index + 1} 页`}
          draggable={false}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </motion.div>
  );
}

export default function PagesStrip() {
  const work = useComicStore((s) => s.currentWork);
  const selectedId = useComicStore((s) => s.selectedPageId);
  const selectPage = useComicStore((s) => s.selectPage);
  const reorder = useComicStore((s) => s.reorderPages);
  const removePage = useComicStore((s) => s.removePage);

  const pages = useMemo(
    () => [...(work?.pages ?? [])].sort((a, b) => a.index - b.index),
    [work?.pages],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    reorder(String(e.active.id), String(e.over.id));
  };

  if (!pages.length) {
    return (
      <div className="rounded-xl border border-dashed border-paper-300 py-8 text-center text-sm text-ink-400 bg-paper-50/50">
        还没有上传分镜，先拖几张草图上来吧 ✍️
      </div>
    );
  }

  return (
    <div className="paper-card p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-base font-semibold text-ink-900">
            页序
          </h3>
          <span className="text-xs text-ink-400">
            拖动调整顺序 · 点击选中编辑
          </span>
        </div>
        <div className="text-xs text-ink-400 font-mono">
          {pages.length} pages
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pages.map((p) => p.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-3 overflow-x-auto pb-2 px-1 min-h-[184px]">
            <AnimatePresence mode="popLayout">
              {pages.map((p) => (
                <PageThumbCard
                  key={p.id}
                  page={p}
                  selected={selectedId === p.id}
                  onSelect={() => selectPage(p.id)}
                  onRemove={() => removePage(p.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
