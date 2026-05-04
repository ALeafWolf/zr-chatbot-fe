import { MessageSquarePlus } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <MessageSquarePlus size={28} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Start a conversation with 左然
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          Pick a continuity scope and a mode in the sidebar to begin. The Phase 1
          default is the <span className="font-medium text-fg">main_sweet</span>{" "}
          scope in <span className="font-medium text-fg">canonical_live</span>{" "}
          mode.
        </p>
      </div>
    </div>
  );
}
