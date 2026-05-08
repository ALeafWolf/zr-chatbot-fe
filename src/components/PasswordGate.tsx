import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import {
  GATE_SESSION_STORAGE_KEY,
  decryptGateSessionBlob,
  encryptGateSessionBlob,
} from "@/utils/gateSessionCrypto";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type Props = {
  children: ReactNode;
};

type GateState = "checking" | "locked" | "unlocked";

function gateEnv() {
  const password = import.meta.env.VITE_APP_GATE_PASSWORD ?? "";
  const sessionSecret = import.meta.env.VITE_APP_GATE_SESSION_SECRET ?? "";
  return {
    password: password.trim(),
    sessionSecret: sessionSecret.trim(),
  };
}

export default function PasswordGate({ children }: Props) {
  const [state, setState] = useState<GateState>("checking");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { password, sessionSecret } = gateEnv();

  useEffect(() => {
    let cancelled = false;

    async function maybeUnlockFromStorage() {
      if (!password) {
        setState("unlocked");
        return;
      }

      if (!sessionSecret) {
        setState("locked");
        return;
      }

      const raw = localStorage.getItem(GATE_SESSION_STORAGE_KEY);
      if (!raw) {
        if (!cancelled) setState("locked");
        return;
      }

      const expiresAtMs = await decryptGateSessionBlob(sessionSecret, raw);
      if (
        expiresAtMs !== null &&
        expiresAtMs > Date.now()
      ) {
        if (!cancelled) setState("unlocked");
        return;
      }

      localStorage.removeItem(GATE_SESSION_STORAGE_KEY);
      if (!cancelled) setState("locked");
    }

    maybeUnlockFromStorage();
    return () => {
      cancelled = true;
    };
  }, [password, sessionSecret]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password || !sessionSecret) return;

    if (input !== password) {
      setError("密码不正确");
      return;
    }

    const expiresAtMs = Date.now() + THIRTY_DAYS_MS;
    try {
      const blob = await encryptGateSessionBlob(sessionSecret, expiresAtMs);
      localStorage.setItem(GATE_SESSION_STORAGE_KEY, blob);
      setInput("");
      setState("unlocked");
    } catch {
      setError("无法保存会话，请稍后重试。");
    }
  }

  if (!password) {
    return children;
  }

  if (!sessionSecret) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col bg-bg-main-deep/90 text-text-main">
        <main className="flex flex-1 items-center justify-center p-6">
          <div
            role="alert"
            className="max-w-md rounded-panel border-2 border-border-pink bg-surface/92 p-8 shadow-soft-pink backdrop-blur-sm"
          >
            <h1 className="text-xl font-extrabold tracking-tight text-primary-strong">
              站点暂不可用
            </h1>
            <p className="mt-3 text-15 leading-15 text-text-muted">
              访问入口尚未就绪，请联系维护人员处理后再试。
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (state === "checking") {
    return (
      <div
        className="flex h-full min-h-0 w-full items-center justify-center bg-bg-main-deep/90 text-text-muted"
        aria-busy="true"
        aria-label="校验访问"
      >
        <div className="h-10 w-10 animate-pulse rounded-full border-2 border-border-soft border-t-primary-strong" />
      </div>
    );
  }

  if (state === "unlocked") {
    return children;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-bg-main-deep text-text-main">
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-panel border-2 border-border-pink bg-surface/95 p-8 shadow-soft-pink backdrop-blur-sm">
          <h1 className="text-center text-xl font-extrabold tracking-tight text-primary-strong">
            访问验证
          </h1>
          <p className="mt-2 text-center text-13 leading-13 text-text-muted">
            输入密码后继续
          </p>
          <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1 text-13 text-text-muted">
              密码
              <input
                type="password"
                name="gate-password"
                autoComplete="current-password"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="rounded-soft border-2 border-border-soft bg-cream px-3 py-2.5 text-15 text-header-dark outline-none transition-[border-color,box-shadow] focus:border-primary-pink focus:ring-2 focus:ring-primary-light/65"
              />
            </label>
            {error !== null ? (
              <p className="text-13 leading-13 text-danger-soft" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="rounded-soft bg-primary-strong py-3 text-15 font-bold text-white shadow-soft-pink transition-[filter] hover:brightness-105 active:brightness-95"
            >
              进入
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
