import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { useComicStore } from "@/store/comicStore";

function Bootstrap() {
  const hydrate = useComicStore((s) => s.hydrateFromStorage);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
