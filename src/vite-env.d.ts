/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_ORIGIN?: string;
  /** Plain password gate; empty or unset skips the gate (dev). */
  readonly VITE_APP_GATE_PASSWORD?: string;
  /** Separate secret for AES-GCM session blob in localStorage (32+ random chars recommended). */
  readonly VITE_APP_GATE_SESSION_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
