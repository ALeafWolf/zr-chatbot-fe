import { useState } from "react";
import { Plus, X } from "lucide-react";
import SessionList from "./SessionList";
import NewSessionDialog from "./NewSessionDialog";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="section-card__header flex w-full shrink-0 items-center justify-between gap-2 px-4">
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-tight">左然</div>
          <div className="text-2xs font-medium text-primary-light/90">
            会话列表
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-primary-light hover:bg-white/10 md:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="border-b-2 border-border-soft px-3 py-3">
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="btn-pink flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm"
        >
          <Plus size={16} />
          <span>New conversation</span>
        </button>
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto custom-scrollbar px-2">
        <SessionList />
      </div>

      <div className="border-t-2 border-border-soft px-4 py-3 text-2xs text-text-soft">
        local_dev
      </div>

      <NewSessionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
