<!-- Banner / Title -->
<h1 align="center">⭐️ Star Wars Graph</h1>
<p align="center">
  React app that lists Star Wars characters and visualizes relations <b>Person → Films → Starships</b> with <a href="https://reactflow.dev">React Flow</a>.
</p>

<p align="center">
  <img alt="Build" src="https://img.shields.io/badge/build-Vite-646CFF?logo=vite&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC?logo=tailwindcss&logoColor=white">
  <img alt="Tests" src="https://img.shields.io/badge/Tests-Vitest%20%2B%20Playwright-6E40C9?logo=vitest&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-0F172A">
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech stack</a> •
  <a href="#-quick-start">Quick start</a> •
  <a href="#-scripts">Scripts</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-testing">Testing</a> •
  <a href="#-quality--linting">Quality</a> •
  <a href="#-troubleshooting">Troubleshooting</a>
</p>

---

## ✨ Features

- **People list** with pagination and debounced search.  
- **Details graph**: selected **Person** → their **Films** → related **Starships**.  
- **Clean UI** on **Tailwind v4** (OKLCH tokens), **Light/Dark** theme.  
- **Zero real HTTP in tests** via **MSW** with `onUnhandledRequest: "error"`.

> _Screenshots (optional — add images to `.github/` and uncomment):_
>
> <!-- ![People List](./.github/people-list.png) -->
> <!-- ![Details Graph](./.github/details-graph.png) -->

---

## 🧰 Tech stack

- **React 18**, **TypeScript**, **React Router 6**  
- **TanStack Query** (data fetching & caching)  
- **React Flow** + **Dagre** (graph & layered layout)  
- **Tailwind CSS v4** (tokens, utilities, components)  
- **Vitest + Testing Library + MSW** (unit), **Playwright** (E2E)  
- **Biome** (TS/JS), **Stylelint** (CSS), **RustyWind / Prettier plugin** (Tailwind class sorting)  
- **Fastify** dev proxy for `/api` (optional)

---

## 🚀 Quick start

```bash
# 1) Install
npm i

# 2) Dev server
npm run dev
# → http://localhost:5173
```

<details>
<summary><b>Optional: Local API proxy to /api/*</b></summary>

```bash
npm run proxy
# SW_API_BASE defaults to https://sw-api.starnavi.io
# The proxy exposes /api/* and adds simple caching/ETag.
```
</details>

<details>
<summary><b>Production build / preview</b></summary>

```bash
npm run build
npm run preview
```
</details>

---

## 🧪 Testing

```bash
# Unit (Vitest)
npm run test       # watch
npm run test:run   # single run

# E2E (Playwright; network fully mocked)
npm run test:e2e
```

> **Guarantee:** Unit tests use **MSW** with `onUnhandledRequest: "error"` — no real HTTP requests can slip through.

---

## 📜 Scripts

```bash
# Lint & types
npm run typecheck
npm run lint
npm run lint:css

# Auto-fix & formatting
npm run lint:fix
npm run lint:css:fix

# Tailwind class sorting (run the one you have configured)
npm run sort:tw:prettier   # via prettier-plugin-tailwindcss
# (If you also use RustyWind directly, call it via lint-staged or add a script)
```

> Pre-commit hooks: **Husky + lint-staged** are configured to auto-check only staged files.

---

## 🗂 Project structure

```
src/
  api/                # API types & adapters
  components/         # shared UI (Header, ThemeToggle, etc.)
  features/
    people/           # list, pagination, search
    person/           # details page, graph builder, React Flow view
  styles/
    index.css         # Tailwind v4, tokens, component CSS
  test/
    setup.ts          # Vitest + MSW setup (no real HTTP)
    handlers.ts       # default request handlers for tests
  __tests__/          # unit tests (RTL + MSW)
server.ts             # optional Fastify proxy for /api
```

---

## 🏗 Architecture notes

- **Data layer:** TanStack Query manages caching, loading & error states; adapters normalize API responses.  
- **Graph builder:** pure function `buildGraph(person, films, starships)` returns `nodes/edges`; **Dagre** computes positions.  
- **Styling:** Tailwind v4 tokens + semantic classes (`.node--person|film|starship`), **no `!important`**, stable focus rings.  
- **A11y:** visible focus, ARIA labels/roles, proper button types.  
- **Perf:** memoized graph inputs; optional prefetch of the next page on the list.

---

## ✅ Quality & linting

- **Biome** for TS/JS: `npm run lint` / `npm run lint:fix`  
- **Stylelint** for CSS: `npm run lint:css` / `npm run lint:css:fix`  
- **Tailwind class sorting:** `npm run sort:tw:prettier` (prettier plugin)  
  > _lint-staged also uses **RustyWind** to sort classes on staged files._

**Suggested local check before commit:**
```bash
npm run lint:css:fix && npm run sort:tw:prettier && npm run lint:fix && npm run typecheck
npm run test:run
```

---

## 🧯 Troubleshooting

**MSW “unhandled request” error**  
Add a handler in your test:
```ts
import { http, HttpResponse } from "msw";
import { server } from "@/test/setup";

server.use(
  http.get("/api/people/:id/", () => HttpResponse.json({ /* mock */ }))
);
```

**Blurry header text**  
`backdrop-blur` is intentionally disabled; header uses a translucent background for crisp text while scrolling.

**Card focus “jumps”**  
Focus ring is applied on `.card:focus-within` with smooth transitions — no layout shifts.

---

## 🔭 Possible improvements

- Infinite scroll alternative to pagination  
- Prefetch next page for smoother UX on list  
- Graph theming controls (toggle minimap, edge animation)  
- Persisted query cache across navigations

---

## 📄 License

MIT © 2025
