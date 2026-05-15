# zr-chatbot-fe

React SPA for frontend of zr chatbot. Provides the full conversational UI: session management, streaming chat with thought-chain visualization, and an optional password gate for access control.

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | React 19 (JSX transform) |
| Language | TypeScript 5.7 (strict) |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 (`@tailwindcss/postcss`) |
| Routing | React Router 7 |
| Server state | TanStack React Query 5 (infinite queries, optimistic mutations) |
| Client state | Zustand 5 (installed; currently all server-state via RQ) |
| Validation | Zod 3 |
| Icons | Lucide React |

## Architecture

```
Browser
  │
  ├─ PasswordGate ── optional password gate (AES-GCM-encrypted localStorage session, 30-day expiry)
  │
  └─ AppRoutes (React Router)
       └─ Layout ── shell with responsive sidebar drawer
            ├─ Sidebar
            │    ├─ NewSessionDialog (modal portal)
            │    └─ SessionList (links, delete, inline title edit)
            ├─ EmptyState (route: /)
            └─ ChatView (route: /sessions/:id)
                 ├─ EditableSessionTitle (double-click to rename, enter/blur to save)
                 ├─ MessageBubble (per-message; thoughts popup for assistant turns)
                 ├─ StreamingAssistantBubble (SSE-driven; live thoughts + partial text)
                 ├─ MessageInput (auto-resize textarea, char counter, send button)
                 └─ Settings bar: thinking toggle + temperature slider (debounced 350ms PATCH)
```

### Data flow

1. **REST queries** via `api/client.ts` — all request/response shapes validated with Zod schemas. The Vite dev server proxies `/api/*` to the backend; in production `VITE_BACKEND_ORIGIN` sets the base URL.
2. **Infinite query** for session messages — paginated at 100 per page, older pages fetched on scroll-to-top via `useSessionDetailInfinite`.
3. **Streaming** via `postMessagesStream` in `api/streamClient.ts` — manual `fetch` + `ReadableStream` parsing of SSE (`text/event-stream`), since `EventSource` cannot POST. Events: `thought`, `delta`, `done`, `error`.
4. **Optimistic updates** on message send — user message inserted immediately into the React Query cache; on stream error the cache is rolled back so the input is retryable.
5. **Session mutations** (create, patch, delete) invalidate the relevant query keys on success.

## File Structure

```
frontend/
├── index.html                  # SPA shell (Nunito font, "左然" title, theme-color meta)
├── vite.config.ts              # Vite config: React plugin, @/ alias, /api proxy
├── tsconfig.json               # Project references root
├── tsconfig.app.json           # Strict TS config (ES2022, bundler resolution, @/* paths)
├── tsconfig.node.json          # TS config for vite.config.ts
├── postcss.config.js           # Tailwind CSS 4 PostCSS plugin
├── package.json                # deps & scripts (dev / build / preview / typecheck)
├── .env.example                # Template: VITE_BACKEND_ORIGIN, gate password & secret
│
└── src/
    ├── main.tsx                # Entry: StrictMode → QueryClientProvider → BrowserRouter → App
    ├── App.tsx                 # PasswordGate wrapping AppRoutes
    ├── routes.tsx              # Route definitions: / (EmptyState), /sessions/:id (ChatView), * → /
    │
    ├── api/
    │   ├── client.ts           # Typed REST client: Zod schemas, rawRequest, requestParsed, api object
    │   └── streamClient.ts     # SSE client: postMessagesStream (POST-based, manual chunk parsing)
    │
    ├── components/
    │   ├── Layout.tsx          # App shell: desktop sidebar + mobile drawer + <Outlet />
    │   ├── Sidebar.tsx         # Sidebar: brand header, "New conversation" button, SessionList, footer
    │   ├── SessionList.tsx     # Session list: links, summary text, relative time, delete button
    │   ├── NewSessionDialog.tsx # Modal portal: character picker, scope, mode, thinking, temperature
    │   ├── ChatView.tsx        # Main chat: infinite-scroll message list + streaming + input + settings
    │   ├── EmptyState.tsx      # Landing page when no session is selected
    │   ├── MessageBubble.tsx   # Single message: user (right-aligned, tail) / assistant (left, name label)
    │   ├── StreamingAssistantBubble.tsx # Live SSE response: typed thoughts + partial content + status
    │   ├── MessageInput.tsx    # Chat input: auto-resize textarea, Enter/Shift+Enter, 4000-char limit
    │   ├── ModePicker.tsx      # Radio group: canonical_live / pinned_scenario / sandbox
    │   ├── ScopePicker.tsx     # Dropdown: 未名篇 / 旖慕篇 / 甜蜜篇 / 挚爱篇 / 相守篇
    │   ├── EditableSessionTitle.tsx  # Double-click-to-rename (sidebar + header variants)
    │   ├── ThoughtsPopup.tsx   # Modal: merged thought chain with kind labels
    │   ├── TypingIndicator.tsx # Animated "..." dots (used by legacy send codepath)
    │   └── PasswordGate.tsx    # Optional auth gate: password check, encrypted 30-day session
    │
    ├── hooks/
    │   ├── useSessions.ts      # React Query hooks: CRUD + infinite detail + lookup (chars/scopes/modes)
    │   ├── useChat.ts          # useSendMessage — optimistic mutation with cache rollback
    │   └── useStreamMessage.ts # SSE hook: state machine (idle→thinking→streaming→done/error),
    │                           #   thought appending, partial content accumulation, auto-invalidation
    ├── lib/
    │   ├── labels.ts           # Display labels: MODE_LABELS, scopeLabel, characterLabel,
    │                           #   THOUGHT_KIND_LABELS, formatRelativeTime
    │   └── thoughtDisplay.ts   # Thought processing: CJK-aware text joining, stream append logic,
    │                           #   normalizeThoughtOrder, mergeAdjacentNativeThoughts
    ├── utils/
    │   └── gateSessionCrypto.ts # AES-GCM encrypt/decrypt for password gate session persistence
    │
    └── styles/
        └── index.css           # Tailwind v4 @theme tokens + @layer components + animations
```

## Key Features

### Chat Modes
- **Canonical · live** — continues from latest canon point; memory writes back to the world
- **Pinned scenario** — replay a fixed time/place; optional memory writeback
- **Sandbox** — free exploration; no memory persistence

### Continuity Scopes
Five relationship stages: 未名篇 (pre-relationship) → 旖慕篇 (situationship) → 甜蜜篇 (relationship) → 挚爱篇 (engaged) → 相守篇 (married)

### Streaming & Thought Chain
- SSE streaming with typed events (`thought`, `delta`, `done`, `error`)
- Real-time thought display: 回忆 (recall), 查找 (tool_decision), 收到 (tool_result), 起草 (drafting), 重整 (rewrite), 转移话题 (deflect), 思考 (native)
- Native reasoning fragments joined CJK-aware (no spurious spaces between Chinese characters)
- Popup "thought chain" viewer for completed messages

### Session Management
- Infinite-scroll message history (100 messages per page)
- Editable session titles (double-click, Enter/Blur to save, Escape to cancel)
- Thinking toggle with latency/quality tradeoff hint
- Temperature slider (0–2, 350ms debounced PATCH)
- Soft-delete with confirmation

### Password Gate (optional)
- Configured via `VITE_APP_GATE_PASSWORD` + `VITE_APP_GATE_SESSION_SECRET`
- AES-GCM encrypted 30-day session stored in localStorage
- Graceful degradation when secrets are missing

## Setup

```bash
# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local:
#   VITE_BACKEND_ORIGIN=http://localhost:4000   # default; change for remote backend
#   VITE_APP_GATE_PASSWORD=                     # optional access password
#   VITE_APP_GATE_SESSION_SECRET=               # required if gate password is set

# Develop (starts on :5173, proxies /api → backend)
npm run dev

# Type-check
npm run typecheck

# Build
npm run build       # → dist/

# Preview production build
npm run preview
```

The dev server runs on **port 5173** (strict) and proxies `/api/*` requests to the backend origin (`VITE_BACKEND_ORIGIN`, default `http://localhost:4000`).

## Design System

The UI uses a custom pink-companion theme defined as Tailwind v4 `@theme` tokens in `src/styles/index.css`:

- **Background**: `bg-main` (#F7B2AB) → `bg-main-deep` (#F29A95) gradient with radial dot pattern
- **Surfaces**: `surface` (#FFF8F5), `surface-2`, `surface-3`, `cream` (#FFFCF9)
- **Primary**: `primary-pink` (#E9838C), `primary-strong` (#D85F6D), `primary-light`, `primary-pale`
- **Components**: `.panel`, `.section-card`, `.btn-pink`, `.icon-button`, `.message-bubble`, `.input-shell`, `.thought-card`
- **Animations**: `typing-bounce` (dots), `fade-in` (messages)
- **Font**: Nunito (Google Fonts) with CJK fallbacks (PingFang SC, Microsoft YaHei, Noto Sans SC)
