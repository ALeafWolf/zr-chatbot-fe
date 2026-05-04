import { useState } from "react";
import { Plus, X } from "lucide-react";
import SessionList from "./SessionList";
import NewSessionDialog from "./NewSessionDialog";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight">左然 · Chat</div>
          <div className="text-xs text-fg-subtle">Phase 1 · main world</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-fg-muted hover:bg-surface-hover hover:text-fg md:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* New session */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
        >
          <Plus size={16} />
          <span>New conversation</span>
        </button>
      </div>

      {/* Sessions list */}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto scrollbar-thin px-2">
        <SessionList />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <div className="text-xs text-fg-subtle">local_dev</div>
        <ThemeToggle />
      </div>

      <NewSessionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
