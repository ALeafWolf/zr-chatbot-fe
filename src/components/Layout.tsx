import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  return (
    <div className="app-shell flex h-screen w-screen overflow-hidden text-text-main">
      <div className="app-shell-inner flex h-full min-h-0 w-full flex-1 relative">
        {/* Desktop sidebar */}
        <aside className="hidden h-full shrink-0 border-r-2 border-border-pink bg-surface/92 shadow-soft-pink backdrop-blur-sm lg:flex lg:w-72 xl:w-80">
          <Sidebar />
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 bg-overlay lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={`sidebar-drawer fixed inset-y-0 left-0 z-50 h-full transform border-r-2 border-border-pink bg-surface/95 shadow-soft-pink backdrop-blur-sm transition-transform duration-200 ease-out lg:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-hidden={!sidebarOpen}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b-2 border-border-soft bg-surface/88 px-4 py-3 backdrop-blur-sm lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="icon-button icon-button--dark -ml-1"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="font-extrabold tracking-tight text-primary-strong">
              左然 · Chat
            </div>
          </header>

          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
