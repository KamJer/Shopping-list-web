# ShoppingListWeb

Angular SPA for shopping list management with real-time WebSocket synchronization.
Part of a microservice ecosystem including a backend, auth service, recipe service, and an Android app.

## Features

- **Authentication** – login and registration with JWT Bearer tokens; HttpOnly refresh cookie with auto-refresh on startup and on 401
- **Shopping list** – full CRUD for categories and items with checkboxes, bought-to-history flow, category reordering and collapse
- **Real-time sync** – WebSocket with custom framed protocol (CONNECT, SUBSCRIBE, MESSAGE); per-topic CRUD dispatching and pip-change notifications
- **Units** – manage measurement units (add, edit, delete)
- **Bought items** – view purchased items grouped by category, un-bought toggle, delete, Polish-locale sorting
- **Recipes** – browse with pagination, search by name / ingredients (with maxMissing) / tags / "my recipes", detail view, full create/edit modal with tags, ingredients, steps, and public/private toggle
- **Notifications** – toast-style banner with auto-dismiss and 4 severity levels (error, warn, success, info)
- **HTTPS support** – forwarded-headers interceptor prevents mixed-content issues behind reverse proxy
- **Multi-tab sync** – token and username changes propagate across browser tabs

## Architecture

Standalone Angular components with signals-based state management.

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 (standalone components) |
| Language | TypeScript 5.9 |
| Reactive | RxJS 7.8 (WebSocketSubject for real-time) |
| State | Angular signals (`ShoppingListStateService`) |
| HTTP | Angular `HttpClient` with functional interceptors |
| Routing | Angular Router (HashLocationStrategy) |
| Testing | Vitest 4 |
| Formatting | Prettier |

## Ecosystem (microservices)

The app communicates with three backend services via HTTP and WebSocket:

```
                    ┌─────────────────────┐
                    │  ShoppingSecService  │
                    │  (auth, port 4443)   │
                    └──────────┬──────────┘
                               │ REST
          ┌────────────────────┼────────────────────┐
          │ REST               │ REST                │ WS
          ▼                    ▼                     ▼
 ┌────────────────┐ ┌──────────────────┐ ┌──────────────────┐
 │ShoppingListWeb │ │ShoppingList      │ │ShoppingListService│
 │(this app)      │ │(Android app)     │ │(shopping backend)│
 │Angular 21 SPA  │ │                  │ │port 5443         │
 └────────────────┘ └──────────────────┘ └──────────────────┘
          │                    │
          │                    └────────REST────────┐
          │                                         │
          │                              ┌──────────┴──────────┐
          └────────REST──────────────────│ShoppingListRecipes  │
                                         │Service (port 6443)  │
                                         └─────────────────────┘
```

## Stack

| Area | Technology |
|------|-----------|
| Framework | Angular 21 (`@angular/core`, `@angular/router`, `@angular/forms`, `@angular/platform-browser`) |
| Build | `@angular/build` 21 (application builder) |
| HTTP | Angular `HttpClient` + 3 functional interceptors |
| Real-time | RxJS `WebSocketSubject` (custom framed protocol) |
| State | Angular `signal()` / `computed()` / `effect()` |
| Tests | Vitest 4 (`ng test`) |
| Formatting | Prettier 3.8 |
| Package | npm 11.9 |

## Routes

| Path | Component | Guard | Description |
|------|-----------|-------|-------------|
| `/` | `Login` | `guestGuard` | Login / register page |
| `/list` | `ShoppingList` | `authGuard` | Main shopping list |
| `/units` | `Units` | `authGuard` | Measurement units management |
| `/bought` | `Bought` | `authGuard` | Bought items history |
| `/recipes` | `Recipes` | `authGuard` | Recipe list with search and create/edit |
| `/recipes/:id` | `RecipeDetail` | `authGuard` | Recipe detail view |

## Authentication

- **Login:** `POST /user/log` with `{ userName, password }` → receives JWT tokens
- **Registration:** `POST /user/register` (same payload) → auto-login on success
- **Token storage:** `localStorage` via `TokenService` with cross-tab `StorageEvent` sync
- **Refresh:** `GET /user/refresh` (with credentials) on startup (`APP_INITIALIZER`) and on 401 (with deduplication and retry)
- **Logout:** `GET /user/logout` → clears token, username, WebSocket, redirects to `/`

## HTTP interceptors

Three functional interceptors run on every outgoing request:

| Interceptor | Purpose |
|-------------|---------|
| `auth-interceptor` | Injects `Authorization: Bearer <token>`; catches 401 and triggers token refresh with retry |
| `forwarded-headers.interceptor` | Adds `X-Forwarded-Proto: https` and `X-Forwarded-Host` when served over HTTPS |
| `with-credentials.interceptor` | Sets `withCredentials: true` for session cookies |

## WebSocket

- **Endpoint:** `ws[s]://<host>/ws?token=<JWT>` (proxied in dev via `/ws`)
- **Protocol:** Custom framed JSON (same as ShoppingListService backend) with commands `CONNECT`, `CONNECTED`, `MESSAGE`, `SUBSCRIBE`, `SUBSCRIBED`, `UNSUBSCRIBE`, `UNSUBSCRIBED`, `ERROR`
- **Topics subscribed:**
  - `/synchronizeData` – full bidirectional sync with dirty-flag conflict detection
  - `/{userName}/pip` – push notification when data has changed
  - `/{userName}/putCategory`, `/{userName}/postCategory`, `/{userName}/deleteCategory`
  - `/{userName}/putAmountType`, `/{userName}/postAmountType`, `/{userName}/deleteAmountType`
  - `/{userName}/putShoppingItem`, `/{userName}/postShoppingItem`, `/{userName}/deleteShoppingItem`

Incoming messages are dispatched by `ShoppingListWsService` to `ShoppingListStateService`, which applies deltas via Angular signals.

## Proxy configuration (development)

`proxy.conf.json` forwards requests to backend services during `ng serve`:

| Path | Target |
|------|--------|
| `/user` | `http://localhost:4443` (ShoppingSecService) |
| `/recipe` | `http://localhost:6443` (ShoppingListRecipesService) |
| `/ws` | `ws://localhost:5443` (ShoppingListService) |

## Requirements

- **Node.js** 20.x / 22.x (LTS)
- **npm** 11.x
- Running backend services during development (see [Related repositories](#related-repositories))

## Installation

```bash
git clone <repository-url>
cd ShoppingListWeb
npm install
```

## Local development

```bash
npm start
```

App URL: **http://localhost:4200/**

## Production build

```bash
npm run build
```

Output: `dist/ShoppingListWeb/browser/` (static files for nginx or similar).

## Testing

```bash
npm test
```

Uses Vitest via `ng test`.

## npm scripts

| Script | Description |
|--------|-------------|
| `npm start` | Dev server with proxy |
| `npm run build` | Production build |
| `npm run watch` | Dev build in watch mode |
| `npm test` | Unit tests (Vitest) |

## Project structure

```
src/app/
├── core/                  # Guards, interceptors, services, models
│   ├── auth/              # Token refresh logic
│   ├── components/        # Notification banner
│   ├── guards/            # authGuard, guestGuard
│   ├── interceptors/      # auth, forwarded-headers, with-credentials
│   ├── models/            # User, TokenDto
│   └── services/          # WebSocket, token, notification, auth bootstrap
├── login/                 # Login / register page
├── shopping-list/         # Shopping list (state, WS, models, utils)
├── recipes/               # Recipe list, detail, create/edit, service, adapters
├── bought/                # Bought items history
├── units/                 # Measurement units management
└── static-page/           # Generic static page (unused / orphan)
```

## Related repositories

### Client applications

| Repository | Description |
|------------|-------------|
| [**Shopping-List-Client**](https://github.com/KamJer/Shopping-List-Client) | Android application |

### Backend services

| Repository | Description |
|------------|-------------|
| [**shopping-list-service**](https://github.com/KamJer/shopping-list-service) | Shopping list backend with WebSocket sync |
| [**Shopping-security-service**](https://github.com/KamJer/Shopping-security-service) | Auth microservice: JWT, login, registration, refresh |
| [**RecipeService**](https://github.com/KamJer/RecipeService) | Recipe microservice |

---

## Privacy Policy

Detailed information about data processing can be found here:
[Privacy Policy](PRIVACY_POLICY.md)

## Account Deletion

If you want to delete your account and associated data, follow the instructions here:
[Account Deletion](ACCOUNT_DELETION.md)

## Contact

For questions or concerns: [kamjersoft@gmail.com](mailto:kamjersoft@gmail.com)
