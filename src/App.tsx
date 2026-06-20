import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import UploadPage from "@/pages/UploadPage";
import ReaderPage from "@/pages/ReaderPage";
import SharePage from "@/pages/SharePage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/upload" replace />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/reader" element={<ReaderPage />} />
        <Route path="/share/:data" element={<SharePage />} />
        <Route path="*" element={<Navigate to="/upload" replace />} />
      </Routes>
    </HashRouter>
  );
}
