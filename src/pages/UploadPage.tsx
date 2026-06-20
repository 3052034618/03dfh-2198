import WorkInfoForm from "@/components/WorkInfoForm";
import DropzoneCanvas from "@/components/DropzoneCanvas";
import PagesStrip from "@/components/PagesStrip";
import SidePanel from "@/components/SidePanel";
import ActionBar from "@/components/ActionBar";
import PagesCheck from "@/components/PagesCheck";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UploadPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full">
      <header className="px-4 md:px-8 pt-6 pb-4 flex items-center justify-between max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-orange to-accent-green flex items-center justify-center text-white shadow-paper">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold text-ink-900 leading-tight tracking-wide">
              分镜自查
            </h1>
            <p className="text-xs text-ink-400 leading-tight">
              给独立漫画作者的投稿前节奏检查工具
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <span className="px-3 py-1.5 rounded-lg bg-paper-50 text-accent-orange font-medium border border-accent-orange/20">
            上传整理
          </span>
          <button
            type="button"
            onClick={() => navigate("/reader")}
            className="px-3 py-1.5 rounded-lg text-ink-500 hover:bg-paper-50 hover:text-ink-700 transition-colors flex items-center gap-1"
          >
            模拟阅读
            <ArrowRight size={14} />
          </button>
        </nav>
      </header>

      <main className="px-4 md:px-8 pb-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <section className="space-y-6 min-w-0">
            <WorkInfoForm />
            <PagesCheck />
            <DropzoneCanvas />
            <PagesStrip />
          </section>

          <section className="min-h-[600px] xl:sticky xl:top-6 xl:self-start xl:max-h-[calc(100vh-6rem)]">
            <SidePanel />
          </section>
        </div>
      </main>

      <ActionBar />
    </div>
  );
}
