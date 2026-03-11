## Reflow – Sketch‑to‑UI Design Workspace

Reflow is an AI‑assisted product design tool that turns **rough sketches, wireframes, and natural‑language prompts into production‑ready UI**.  
It combines an interactive canvas, brand style generation, and generative UI workflows into a single designer‑ and developer‑friendly workspace.

The app is built as a **Next.js 16 App Router** project with a **React 19** front‑end, **Prisma + PostgreSQL** backend, **Redux‑powered canvas editor**, and **Inngest‑driven AI workflows**.

---

## What this application does

- **Sketch → Component**
  - Upload or recreate sketches/wireframes on a canvas.
  - The system interprets layout structure and hierarchy.
  - Generates high‑fidelity Tailwind/React UI based on the sketch.

- **Interactive Canvas Editor**
  - Draw and manipulate frames, rectangles, ellipses, arrows, freehand paths, lines, and text.
  - Create **frames** that act as screens/pages, and **Generated UI** blocks that hold AI‑produced UI.
  - Supports selection, resizing handles, bounding boxes, and undo/redo history.

- **AI Design Chat on Generated UI**
  - Attach an AI assistant (DesignChat) to a generated UI block.
  - **Inspect elements** inside the generated UI (click‑to‑select) and send targeted refinement prompts.
  - The assistant updates the generated UI via background workflows and live updates.

- **Moodboard / Inspiration Board**
  - Upload up to 6 images per project as references (screenshots, dribbble shots, brand images, etc.).
  - Images are stored in S3 and linked to the project.
  - Board is fully integrated into the canvas workspace.

- **Brand Style Guide & Tokens**
  - Generate a **Style Guide** per project (colors, typography, tokens).
  - Derived from moodboard imagery and/or textual prompts using AI.
  - Style guide drives the generative UI (e.g., utility classes and HTML).

- **Production‑oriented Output**
  - Generated UI is **HTML/JSX‑ready** with strict class naming (e.g. `c-bg`, `c-card-bg`, etc.) and Tailwind utility usage.
  - Layout and structure strictly reflect the wireframe/canvas; no extra sections are added or removed.

- **Multi‑project Workspace**
  - Authenticated users can create multiple projects.
  - Each project encapsulates its own canvas, moodboard, style guide, and generated UIs.

---

## What it uses (tech stack)

### Core framework & language

- **Next.js 16 (App Router)** – `app/` directory structure with layouts, route groups, and API route handlers.
- **React 19** – client and server components, including interactive canvas and dashboards.
- **TypeScript** – strongly typed front‑ and back‑end.

### UI & styling

- **Tailwind CSS 4** – utility‑first styling for marketing pages, dashboard, canvas UI, and generated UI.
- **Custom UI kit (`components/ui`)** – shadcn/Radix‑style primitives:
  - Buttons, inputs, forms, dialogs, drawers, dropdowns, tables, sidebar, sheets, etc.
- **Radix UI primitives** – accessible low‑level UI building blocks (via the UI kit).
- **next-themes** – dark/light theme handling via a `ThemeProvider`.
- **lucide-react** – icon library for toolbar, buttons, and feedback.

### State management & canvas

- **Redux Toolkit** (`redux/`):
  - `shapes` slice – all shape entities on the canvas (frames, rects, text, generated UI, etc.).
  - `viewport` slice – zoom/pan, viewport coordinates, and overall canvas transform.
  - `history` slice – undo/redo stack for canvas changes.
  - `mood-board` slice – moodboard image state and operations.
  - `project` and `profile` slices – current project metadata and user profile data.
  - Central `store` and `ReduxProvider` integrated in `app/layout.tsx`.

### Backend, data & persistence

- **Prisma 7 + PostgreSQL**
  - `prisma/schema.prisma` models:
    - `User` – core user accounts.
    - `Session` – persisted JWT sessions for auth.
    - `Project` – top‑level design projects.
    - `Canvas` – canvas state as `Json` (shapes, tool, selection, viewport).
    - `MoodBoard` – per‑project moodboard images (filename + URL).
    - `StyleGuide` – per‑project colors, typography, and design tokens.
    - `GeneratedUI` – HTML/spec data for generated UI blocks, plus optional metadata.
  - Prisma client is configured in `lib/prisma.ts` with a `@prisma/adapter-pg` adapter and singleton global to avoid multiple instances in dev.

- **S3 (AWS or S3‑compatible)**
  - `lib/s3-uploads.ts` handles:
    - Client upload helpers and presigned URLs.
    - Storage of moodboard and asset images.

- **Pusher**
  - `lib/pusher.ts` configures realtime channels.
  - Used to push updates (e.g., refined/generated UI) back into the canvas without polling.

- **Inngest**
  - `inngest/client.ts` and `inngest/functions.ts` define background workflows such as:
    - Generating UI from a frame.
    - Refining generated UI based on chat prompts and selected elements.
    - Generating style guides from moodboards or prompts.
  - Next.js route under `app/api/inngest/route.ts` receives Inngest events.

### AI integration

- **Google Generative AI (`@google/generative-ai`)**
  - Used inside Inngest functions and `lib/agents/*` to:
    - Interpret wireframes / canvas shapes.
    - Generate HTML/JSX with tightly controlled class naming.
    - Propose color palettes, typography systems, and layout recommendations.
  - Prompt templates live under `lib/agents/prompts.ts`.

### Auth & security

- **JWT + cookie‑based auth**
  - `lib/auth.ts` manages:
    - JWT token creation/verification.
    - An `access-token` cookie with ~2‑hour lifetime.
    - `Session` table records for revocation and tracking.
    - `requireAuth` / `requireApiAuth` helpers for server components and route handlers.
  - Next.js route handlers under:
    - `app/api/sign-in/route.ts`
    - `app/api/sign-up/route.ts`
    - `app/api/auth/session/route.ts`
    - `app/api/auth/logout/route.ts`
  - Client‑side auth flows at:
    - `app/auth/sign-in/page.tsx`
    - `app/auth/sign-up/page.tsx`

### Tooling & build

- **Next.js configuration** – `next.config.ts`
  - Custom webpack with `copy-webpack-plugin` to copy Prisma runtime `.wasm`/`.mjs` for serverless compatibility.
  - `serverExternalPackages: ["@prisma/client"]` to treat Prisma as a server external.
- **TypeScript config** – `tsconfig.json` with module path aliases (e.g. `@/lib`, `@/components`, `@/redux`).
- **ESLint** – `eslint.config.mjs` with Next.js + TypeScript rules.
- **PostCSS/Tailwind** – `postcss.config.mjs` and Tailwind config (via `components.json`).

---

## High‑level architecture

At a high level, the system is organized into:

1. **Next.js App Router front‑end** (`app/`, `components/`)
2. **API & server actions** (`app/api/*`, `app/actions/*`)
3. **State management & canvas logic** (`redux/`, `lib/canvas-utils.ts`)
4. **Persistence layer** (`prisma/`, `lib/prisma.ts`)
5. **Background workflows & AI agents** (`inngest/`, `lib/agents/*`)

### High‑level architecture diagram

```mermaid
flowchart LR
  %% Clients
  subgraph Clients
    U[User Browser]
  end

  %% Next.js app
  subgraph NextApp[Next.js App Router (React 19 + TS)]
    direction TB

    subgraph UI[UI / Pages & Components]
      LP[Landing Page<br/>app/page.tsx]
      DASH[(Dashboard Layout<br/>(dashboard)/layout.tsx)]
      PROJ[Projects Page<br/>(dashboard)/projects]
      CANVAS[Canvas Workspace<br/>(dashboard)/projects/[projectId]]
      STYLE[Style Guide View<br/>(dashboard)/projects/[projectId]/style-guide]
      AUTH[Auth Pages<br/>auth/sign-in, auth/sign-up]

      subgraph Components
        direction TB
        CANVAS_UI[Canvas & Shapes<br/>components/(dashboard)/canvas/*]
        DESIGN_CHAT[DesignChat<br/>components/(dashboard)/canvas/design-chat]
        INSP_BOARD[Inspiration Board<br/>components/(dashboard)/canvas/inspiration-board]
        UIKIT[UI Kit<br/>components/ui/*]
      end
    end

    subgraph State[Redux Toolkit Store]
      SHAPES[shapes slice<br/>canvas entities]
      VIEWPORT[viewport slice<br/>zoom/pan]
      HISTORY[history slice<br/>undo/redo]
      MOOD[mood-board slice]
      PROJECT[project slice]
      PROFILE[profile slice]
    end

    subgraph APIs[Next.js Route Handlers (app/api/*)]
      AUTH_API[Auth APIs<br/>sign-in, sign-up, session, logout]
      PROJ_API[Project APIs<br/>/project, /project/[id]]
      CANVAS_API[Canvas API<br/>/project/[id]/canvas]
      MOOD_API[Moodboard API<br/>/project/[id]/mood-board]
      STYLE_API[Style Guide API<br/>/project/[id]/generate-style]
      GENUI_API[Generate UI API<br/>/project/[id]/generate-ui]
      REFINE_API[Refine UI API<br/>/project/[id]/refine-ui]
      INNGEST_EP[Inngest HTTP Endpoint<br/>/api/inngest]
    end

    subgraph Lib[Server/Shared Lib]
      AUTH_LIB[lib/auth.ts<br/>JWT + sessions]
      PRISMA_LIB[lib/prisma.ts]
      CANVAS_UTILS[lib/canvas-utils.ts]
      S3_LIB[lib/s3-uploads.ts]
      PUSHER_LIB[lib/pusher.ts]
      AGENTS[lib/agents/*<br/>(workflow/style/uid)]
    end
  end

  %% Backend & infra
  subgraph Data[Data & Infra]
    DB[(PostgreSQL<br/>Prisma models)]
    S3[(S3 Bucket<br/>assets & moodboard)]
    PUSHER[(Pusher<br/>realtime)]
  end

  subgraph Workflows[Background Workflows]
    INNGEST[Inngest Functions<br/>inngest/functions.ts]
    GENAI[@google/generative-ai]
  end

  %% Main flows
  U -->|HTTP + SPA| LP
  U --> DASH
  U --> CANVAS
  U --> STYLE
  U --> AUTH

  UI -->|dispatch actions| State
  State -->|select state| UI

  UI -->|fetch/POST| APIs

  %% APIs to Lib/DB
  AUTH_API --> AUTH_LIB
  AUTH_LIB --> PRISMA_LIB
  PRISMA_LIB --> DB

  PROJ_API --> PRISMA_LIB
  CANVAS_API --> PRISMA_LIB
  MOOD_API --> PRISMA_LIB
  STYLE_API --> PRISMA_LIB
  GENUI_API --> PRISMA_LIB
  REFINE_API --> PRISMA_LIB

  MOOD_API --> S3_LIB --> S3

  %% AI workflows
  GENUI_API --> INNGEST
  REFINE_API --> INNGEST
  STYLE_API --> INNGEST
  INNGEST_EP --> INNGEST

  INNGEST --> AGENTS
  AGENTS --> GENAI
  INNGEST --> PRISMA_LIB
  INNGEST --> PUSHER_LIB --> PUSHER

  %% Realtime back to client
  PUSHER --> UI

  %% Canvas specifics
  CANVAS_UI --> State
  DESIGN_CHAT --> REFINE_API
  INSP_BOARD --> MOOD_API
```

### 1. Front‑end / UI architecture

- **App shell**
  - `app/layout.tsx` defines the global HTML structure:
    - Loads global CSS and fonts.
    - Wraps children with `ReduxProvider`, `ThemeProvider`, and `Toaster`.
  - `app/page.tsx` is the public marketing/landing page (“From Napkin to Navbar”).

- **Route groups**
  - Marketing vs. app:
    - Public marketing at `app/page.tsx`.
    - Authenticated dashboard and project workspace under the `(dashboard)` route group:
      - `app/(dashboard)/layout.tsx` – dashboard frame (navigation, layout).
      - `app/(dashboard)/projects/page.tsx` – project index/list.
      - `app/(dashboard)/projects/[projectId]/page.tsx` – core canvas workspace.
      - `app/(dashboard)/projects/[projectId]/style-guide/page.tsx` – project style guide.

- **Canvas UI**
  - Components live under `components/(dashboard)/canvas/`:
    - `toolbar.tsx`, `undo-redo.tsx`, `resize-handles.tsx`, `selection.tsx` – direct manipulation tools.
    - `shapes/*` – React components to render each shape type (frame, rect, ellipse, arrow, line, text, generated UI).
    - `inspiration-board.tsx` – moodboard side panel.
    - `design-chat.tsx` – Design AI chat panel attached to generated UI.

- **Design chat & inspection**
  - `SelectionOverlay` identifies which shapes are selected and, for generated UI shapes, mounts a `DesignChat` wrapper.
  - DesignChat:
    - Manages prompt input and send/submit logic.
    - Toggles inspection mode and coordinates with the generated UI via `CustomEvent`s.
    - Sends refinement requests to `/api/project/[projectId]/refine-ui`.

- **Shared UI components**
  - Located in `components/ui/*` (buttons, inputs, dialogs, dropdowns, etc.).
  - Encourages consistent styling and interaction patterns across the app.

### 2. API & server actions

- **Project APIs**
  - `app/api/project/route.ts` – create/list projects for the authenticated user.
  - `app/api/project/[projectId]/route.ts` – fetch/update/delete a specific project.
  - `app/api/project/[projectId]/canvas/route.ts` – read/write a project’s canvas (shapes, tool, viewport, selection).
  - `app/api/project/[projectId]/mood-board/route.ts` – create/list moodboard images.
  - `app/api/project/[projectId]/mood-board/[imageId]/route.ts` – delete a specific moodboard image.
  - `app/api/project/[projectId]/generate-style/route.ts` – generate/update style guide via AI.
  - `app/api/project/[projectId]/generate-ui/route.ts` – trigger generated UI from a frame shape.
  - `app/api/project/[projectId]/refine-ui/route.ts` – refine generated UI using DesignChat prompts.

- **Auth APIs**
  - `app/api/sign-in/route.ts`, `app/api/sign-up/route.ts` – credentials‑based auth; issue JWT and a `Session` row, set cookie.
  - `app/api/auth/session/route.ts` – get current user session details.
  - `app/api/auth/logout/route.ts` – revoke session and clear cookie.

- **Server actions**
  - `app/actions/auth.ts` – server actions for auth flows used by client components or forms.

- **Inngest endpoint**
  - `app/api/inngest/route.ts` – Inngest’s HTTP entrypoint for workflows defined in `inngest/functions.ts`.

All API handlers enforce authentication via helpers in `lib/auth.ts` (e.g. `requireApiAuth`).

### 3. State management & canvas logic

- **Redux store**
  - `redux/store.ts` initializes the store with slices:
    - `shapes`, `viewport`, `history`, `mood-board`, `project`, `profile`.
  - `redux/provider.tsx` wraps the app and exposes typed hooks from `redux/hooks.ts`.

- **Shapes slice**
  - `redux/slices/shapes/index.ts` defines:
    - Shape types (`FrameShape`, `RectShape`, `EllipseShape`, `FreeDrawShape`, `ArrowShape`, `LineShape`, `TextShape`, `GeneratedUIShape`).
    - Entity adapter for normalized shape state (ids/entities).
    - Actions to add/update/remove shapes, manage selection, clear canvas, and set generating/inspection state.
  - Canvas components dispatch these actions to respond to mouse events, drags, and background updates.

- **Viewport slice**
  - `redux/slices/viewport/index.ts` tracks scale, translate, and viewBox.
  - Drives zooming and panning behavior for the canvas component tree.

- **History slice**
  - `redux/slices/history.ts`:
    - Wraps canvas mutations to add entries to an undo/redo stack.
    - Integrates with toolbar controls for undo/redo.

- **Canvas utilities**
  - `lib/canvas-utils.ts` centralizes:
    - Hit testing.
    - Coordinate transforms.
    - Shape manipulation helpers.
    - Serialization/deserialization between Redux state and Prisma `Canvas` JSON.

### 4. Persistence layer / data model

- **Prisma schema**
  - Lives in `prisma/schema.prisma`, with migrations under `prisma/migrations/`.
  - Models and relationships:
    - `User` has many `Project`s and `Session`s.
    - `Project` has one `Canvas`, many `MoodBoard` entries, optional `StyleGuide`, and many `GeneratedUI` entries.
    - `Canvas` stores:
      - `shapes` (Redux entity state rendered by the canvas).
      - `tool`, `selected`, `frameCounter`, `viewport` (also serialized Redux state).

- **Prisma usage pattern**
  - API handlers and Inngest functions:
    - Fetch and update entities by `projectId`/`userId`.
    - Keep canvas and generated UI in sync with user actions and AI outputs.
  - `lib/prisma.ts` ensures a single shared Prisma client is used across the app.

### 5. Background workflows & AI agents

- **Inngest functions**
  - `inngest/functions.ts` defines strongly typed workflows like:
    - `generateStyleGuide` – uses moodboard + prompts to produce a style guide.
    - `generateUIFromFrame` – transforms frame shapes + style guide into generated UI HTML.
    - `refineGeneratedUI` – take existing UI + element context + DesignChat prompt and apply incremental changes.
  - Workflows typically:
    1. Validate input (project, user, shape, style guide).
    2. Construct a rich prompt (via `lib/agents/prompts.ts`).
    3. Call the Google Generative AI model.
    4. Persist results to `GeneratedUI` or `StyleGuide`.
    5. Emit Pusher events to update the client in real time.

- **AI agents & tools**
  - `lib/agents/*` contains:
    - `workflow-agent.ts`, `style-guide-agent.ts`, `generative-ui-agent.ts` – “agents” that orchestrate prompts and responses.
    - `lib/agents/tools/*` – helper “tools” like:
      - `save-style-guide.ts`
      - `get-canvas-wireframe.ts`
      - `fetch-mood-board.ts`
  - These agents emphasize:
    - Deterministic structure (never changing layout beyond the wireframe).
    - Strict mapping from style guide tokens to CSS class names.

---

## Running the app locally

1. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

2. **Set up environment variables**

   Create a `.env` file (or use your preferred secret manager) with at least:

   - Database connection string for PostgreSQL (`DATABASE_URL`).
   - Prisma direct URL if needed (`DIRECT_URL`).
   - Google Generative AI API key.
   - S3 bucket name, region, access keys (or IAM‑based configuration).
   - Pusher app credentials (key, secret, cluster, etc.).
   - JWT signing secret and cookie configuration for auth.

   Check the code under `lib/` and `inngest/` for the exact variable names used.

3. **Run database migrations**

   ```bash
   npx prisma migrate dev
   # or
   pnpm prisma migrate dev
   ```

4. **Start the dev server**

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

   Visit `http://localhost:3000` to open the app.

---

## Project structure overview

High‑level directory layout:

- `app/`
  - `layout.tsx` – global layout (providers, theme, Redux).
  - `page.tsx` – marketing landing page.
  - `(dashboard)/layout.tsx` – authenticated shell.
  - `(dashboard)/projects/*` – project list, canvas workspace, style guide views.
  - `auth/*` – sign‑in/sign‑up pages.
  - `api/*` – REST‑like API endpoints for auth, projects, canvas, moodboard, style guide, and AI workflows.
- `components/`
  - `(dashboard)/canvas/*` – canvas, shapes, design chat, inspiration board.
  - `ui/*` – reusable UI primitives.
  - `theme-provider.tsx`, `seamless-background.tsx`, `logo.tsx`, etc.
- `redux/`
  - `store.ts`, `provider.tsx`, `hooks.ts`.
  - `slices/*` – shapes, viewport, history, mood-board, project, profile.
- `lib/`
  - `auth.ts` – auth/session helpers.
  - `prisma.ts` – Prisma client.
  - `canvas-utils.ts` – core canvas logic.
  - `project-name.ts`, `project-thumbnail.ts` – project display helpers.
  - `pusher.ts`, `s3-uploads.ts`, `utils.ts`.
  - `agents/*` – AI orchestration and prompts.
- `prisma/`
  - `schema.prisma` and `migrations/*`.
- `inngest/`
  - `client.ts`, `functions.ts`.
- Root config files
  - `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, etc.

---

## Future directions / extension points

- **Multi‑user collaboration** – extend Pusher channels and canvas state to support multi‑cursor editing and presence.
- **Versioning & history** – extend `history` and Prisma models to support project snapshots and branching.
- **Custom export targets** – export generated UI as:
  - Standalone React components.
  - Design tokens JSON.
  - Figma plugin payloads.
- **Role‑based access control** – expand auth to support teams, shared projects, and granular permissions.

The existing architecture (clear separation of canvas, agents, workflows, and persistence) is designed to make these future features straightforward to implement.

