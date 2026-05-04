import { MessageSquarePlus } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <MessageSquarePlus size={28} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          左然正在等待你
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          默认篇章：<span className="font-medium text-fg">挚爱篇</span><br/>
          默认模式:<span className="font-medium text-fg">canonical_live</span>
        </p>
      </div>
    </div>
  );
}
