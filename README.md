# Shopping List Web

Frontend for a shopping-list application — an SPA that talks to separate user and recipe services and a WebSocket endpoint for real-time synchronization.

## What this project is

**Shopping List Web** is the presentation layer (Angular client) for a shopping-list ecosystem: sign-in, product list, units, purchase history, and a recipes module. The app does not ship its own API — it expects backends to be running at known URLs (see [Backend and proxy](#backend-and-proxy)).

## What the application does

| Area | Description |
|------|-------------|
| **Sign-in** | Login form (`/`), `POST /user/log`, tokens (including Bearer in the `Authorization` header). |
| **Shopping list** | Main list view (`/list`) with sync over **WebSocket** (`/ws`). |
| **Units** | Managing measurement units (`/units`). |
| **Bought** | View / handling of bought items (`/bought`). |
| **Recipes** | Recipe list and details (`/recipes`, `/recipes/:id`) via REST **`/recipe`**… |

Protected routes require authentication (`authGuard`); the home route for guests uses `guestGuard`.

## Technology stack

- **[Angular](https://angular.dev/)** 21 (standalone components, router, HTTP client, functional interceptors)
- **TypeScript** ~5.9
- **[RxJS](https://rxjs.dev/)** — streams, including WebSocket via `WebSocketSubject`
- **[@angular/build](https://angular.dev/tools/cli/build)** — application build and dev server
- **[Vitest](https://vitest.dev/)** — unit tests (`ng test`)
- **Prettier** — code formatting
- **npm** (use the version aligned with `packageManager` in `package.json`)

## Requirements

- **Node.js** (LTS, e.g. 20.x or 22.x — per Angular 21 requirements)
- **npm** (e.g. 11.x)
- Running **backends** during local development (see below) if you need full functionality (login, list, recipes, WS)

## Installation

```bash
git clone <repository-url>
cd ShoppingListWeb
npm install
```

## Related backend repositories

This UI expects three separate backend services. Clone and run them according to each project’s README (ports must match your environment or update `proxy.conf.json` / reverse proxy).

| Repository | Role | Proxied path (dev default) |
|------------|------|----------------------------|
| [**RecipeService**](https://github.com/KamJer/RecipeService) | Recipes REST API | `/recipe` → `http://localhost:6443` |
| [**Shopping-security-service**](https://github.com/KamJer/Shopping-security-service) | Users — login, tokens, refresh, logout | `/user` → `http://localhost:4443` |
| [**shopping-list-service**](https://github.com/KamJer/shopping-list-service) | Shopping list — **WebSocket** for real-time list sync | `/ws` → `ws://localhost:5443` |

## Backend and proxy

In development, `npm start` runs the dev server with **`proxy.conf.json`**, which forwards:

| Path | Target service (default) |
|------|--------------------------|
| `/user` | `http://localhost:4443` — user API (login, refresh, logout) |
| `/recipe` | `http://localhost:6443` — recipes API |
| `/ws` | `ws://localhost:5443` — WebSocket (list synchronization) |

Without these services, some features will fail with network errors. In **production** (e.g. nginx), configure a **reverse proxy** for `/user`, `/recipe`, and `/ws` to the same internal services and serve the static build from the `browser` folder (see [Production build](#production-build)).

## Local development

```bash
npm start
```

This is `ng serve` with `proxy.conf.json`. App URL: **http://localhost:4200/**

## Production build

```bash
npm run build
```

Output goes to **`dist/ShoppingListWeb/browser/`** (including `index.html` and bundled JS/CSS). Point nginx (or another static server) `root` at that directory and add `try_files` for Angular routing, for example:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## Testing

```bash
npm test
```

Runs unit tests (Vitest) via `ng test`.

## npm scripts

| Script | Description |
|--------|-------------|
| `npm start` | Dev server + proxy |
| `npm run build` | Production build |
| `npm run watch` | Development build in watch mode |
| `npm test` | Unit tests |

## Repository structure (overview)

- `src/app/` — components, routes, guards, interceptors, services (including WebSocket, tokens)
- `src/app/login/` — authentication
- `src/app/shopping-list/` — shopping list and WS integration
- `src/app/recipes/` — recipes
- `src/app/units/`, `src/app/bought/` — units and bought items
- `public/` — static assets
- `proxy.conf.json` — proxy for `ng serve` only

---

*Originally scaffolded with Angular CLI; this README reflects the current feature set and deployment notes.*
