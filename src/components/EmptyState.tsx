import { MessageSquarePlus } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-6 py-16">
      <div className="panel w-full max-w-md overflow-hidden">
        <div className="section-card__header justify-center px-4 py-2 text-center">
          <span className="text-sm font-extrabold">左然</span>
        </div>
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border-2 border-border-soft bg-primary-pale text-primary-strong shadow-soft-pink">
            <MessageSquarePlus size={28} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-text-main">
            左然正在等待你
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            默认篇章：
            <span className="font-bold text-text-main">挚爱篇</span>
            <br />
            默认模式:
            <span className="font-bold text-text-main">canonical_live</span>
          </p>
        </div>
      </div>
    </div>
  );
}
