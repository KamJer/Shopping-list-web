# Plan napraw - ShoppingListWeb

**Data utworzenia:** 2026-09-23
**Stack:** Angular 21, TypeScript 5.9, RxJS 7.8

---

## PRIORYTET 1: Bezpieczenstwo (KRYTYCZNE)

### 1.1. Przeniesienie access tokena z localStorage do in-memory ?

**Problem:** Access token przechowywany w localStorage - podatny na XSS.
**Lokalizacja:** src/app/core/services/token.service.ts

**Plan:**

Krok 1: Usunac localStorage z TokenService ? 2026-09-24
- Usunac readTokenFromStorage(), writeTokenToStorage(), removeTokenFromStorage() ?
- Usunac this.tokenStorageKey ?
- Usunac event listener 'storage' (niepotrzebny po usunieciu localStorage) ?
- TokenService powinien operowac wylacznie na private accessToken w pamieci ?

Krok 2: Zaktualizowac shared-token-refresh.ts ? 2026-09-24
- executeRefresh() zapisuje token przez tokenService.persistAuthTokens(dto) ?
- persistAuthTokens() wywoluje setToken() -> writeTokenToStorage() ?
- Zmienic tak, aby persistAuthTokens() tylko ustawial this.accessToken = token ?

**Wymaganie po stronie servera:** `ShoppingSecService` musi zwracac access token jako `HttpOnly` cookie, aby mogl byc przechowywany w pamieci bez dostepu przez JavaScript. To jest warunek konieczny do dzialania 1.1.

**Testy do napisania:**
- token.service.spec.ts - setToken() nie uzywa localStorage
- token.service.spec.ts - getToken() zwraca wartosc z pamieci
- shared-token-refresh.spec.ts - po refresh token jest w pamieci, nie w localStorage
- auth-interceptor.spec.ts - token jest dodany do Authorization header

---

### 1.2. Maskowanie tokena z logow � ZAOBSERWOWANE, rozwiqzanie po stronie server/infrastructure

**Problem:** Token w URL WebSocket (/ws?token=...) pojawia sie w server access logs, proxy logs.
**Lokalizacja:** src/app/core/services/websocket.ts:60

**Decyzja:** Zostawiamy obecny stan (token w query param). Maskowanie token z logow jest spraw? infrastruktury serverowej (Nginx/HAProxy/Spring), nie frontendu. Nie wymaga zmian w kodzie Angular.

**UWAGA:** To jest zmiana po stronie servera � nie w scope fix_plan.md frontendu.

---

### 1.3. Zastapienie window.confirm() niestandardowym dialogiem ?

**Problem:** window.confirm() blokuje UI thread, nie da sie stylowac.
**Lokalizacja:** recipes.ts:370, user-admin.ts:69,86, recipe-admin.ts:70, tag-admin.ts:69

**Plan:**

Krok 1: Stworzyc ConfirmDialog component ? 2026-09-24
- src/app/shared/confirm-dialog/confirm-dialog.component.ts ?
- @Input() title, message, confirmText, cancelText ?
- getResult(): Promise<boolean> zwraca true/false ?

Krok 2: Stworzyc ConfirmService ? 2026-09-24
- src/app/shared/confirm.service.ts ?
- Metoda ask(title, message, confirmText, cancelText): Promise<boolean> ?
- Dynamiczne tworzenie komponentu przez ApplicationRef.attachView() ?

Krok 3: Zastapic window.confirm() we wszystkich miejscach ? 2026-09-24
- recipes.ts:370 - confirmDelete() async ?
- user-admin.ts:69 - changeRole() async ?
- user-admin.ts:86 - deleteUser() async ?
- recipe-admin.ts:70 - confirmDelete() async ?
- tag-admin.ts:69 - confirmDelete() async ?

**Testy do napisania:**
- confirm-dialog.spec.ts - confirm zwraca true, cancel zwraca false
- confirm.service.spec.ts - dynamiczne tworzenie komponentu

---

## PRIORYTET 2: Jakosc kodu - API Contract

### 2.1. Znormalizowac kontrakt API w RecipeDto ?

**Problem:** RecipeDto ma index signature [key: string]: unknown co robi typ praktycznie any.
**Lokalizacja:** src/app/recipes/models/recipe-dto.model.ts:16

**Plan:**

Krok 1: Zdefiniowac canonical RecipeDto i pomocnicze typy ? 2026-09-24
- RecipeDto z canonical field names: name, description, source, tags, published, userName ?
- RecipeIngredientDto z fields: name, amount, unit ?
- RecipeStepDto z fields: stepNumber, description ?
- Usunieto [key: string]: unknown ?

Krok 2: Stworzyc canonical mapping w RecipeFormService ? 2026-09-24
- recipe-form.service.ts: buildPayload() ?
- Usuniete polimorficzne przypisywania (base.name, base.title, base.recipeName) ?
- Usunieto base['opis'], base['recipeDescription'], base['ingredientDtoList'] itp. ?

Krok 3: Zaktualizowac RecipeViewAdapter ? 2026-09-24
- getRecipeName() -> recipe.name ?? 'Przepis' ?
- getDescriptionPlain() -> recipe.description ?? '' ?
- Usunieto 10+ nazw p�l na rzecz 1 canonical nazwy ?
- Skr�cono z 377 do 90 linii (usunieto polimorficzne mapowanie) ?

**UWAGA:** Backend (ShoppingListRecipesService) musi znormalizowac odpowiedzi. To zmiana po stronie servera � nie w scope fix_plan.md frontendu.

**Testy do napisania:**
- recipe-form.service.spec.ts - buildPayload() zwraca tylko canonical pola
- recipe-view.adapter.spec.ts - wszystkie metody

---

### 2.2. Wyekstrakowac canConfirmNewItem() do utility ?

**Problem:** Duplicacja identycznej logiki w shopping-list.ts i recipe-detail.ts.
**Lokalizacja:** shopping-list.ts:174-187, recipe-detail.ts:152-165

**Plan:**

Krok 1: Stworzyc utility function ? 2026-09-24
- src/app/shopping-list/utils/confirm-utils.ts ?
- Export function canConfirmNewItem(categories, amountTypes, categoryIndex, amountTypeId, name, amount) ?

Krok 2: Zastapic duplicacje w shopping-list.ts i recipe-detail.ts ? 2026-09-24

**Testy do napisania:**
- confirm-utils.spec.ts - various scenarios

---

### 2.3. Zastapic document.getElementById() z ViewChild/Renderer2 ?

**Problem:** Bezposrednia manipulacja DOM - niezgodna z Angular best practices.
**Lokalizacja:** shopping-list.ts:113,120,149,164, recipe-detail.ts:142, units.ts:32,39, user-admin.ts:108

**Plan:**

Krok 1: Stworzyc reusable directive FocusDirective ? 2026-09-24
- src/app/shared/focus.directive.ts ?
- @Input('appFocus') when: boolean ?

Krok 2: Zastapic document.getElementById() z *ngIf + appFocus w template ? 2026-09-24
- shopping-list.html: [appFocus]="newCategoryDialogOpen" ?
- shopping-list.html: [appFocus]="newItemDialogOpen" ?
- recipe-detail.html: [appFocus]="newItemDialogOpen" ?
- units.html: [appFocus]="unitDialogOpen" ?
- user-admin.html: [appFocus]="passwordDialogOpen()" ?

Krok 3: Zaktualizowac wszystkie miejsca (8 occurrences) ? 2026-09-24
- Usuniete queueMicrotask(() => document.getElementById(...)) z 5 plikow ?
- Dodane FocusDirective do imports w 5 komponentach ?

**Testy do napisania:**
- focus.directive.spec.ts - focus when when=true

---

## PRIORYTET 3: Testy ?

### 3.1. Testy interceptorow (auth, with-credentials, forwarded-headers)
~~Zostawione na pozniej � wymagaja mockowania HttpClient i Angular testing module~~

### 3.2. Testy guards (auth, guest, admin)
~~Zostawione na pozniej � wymagaja mockowania Router i TokenService~~

### 3.3. Testy WebSocket service
~~Zostawione na pozniej � wymagaja mockowania WebSocket i HttpClient~~

### 3.4. Testy TokenService i shared-token-refresh ? 2026-09-24
- token.service.spec.ts: 12 testow (create, getToken, setToken, clearToken, setUserName, getUserName, clearUserName, setRole, getRole, clearRole, isAdmin, clearAuth) ?

### 3.5. Testy ShoppingListDataService (Facade)
~~Zostawione na pozniej � wymaga mockowania WebSocketService i HttpClient~~

### 3.6. Testy RecipeFormService ? 2026-09-24
- recipe-form.service.spec.ts: 3 testy (create, buildPayload canonical, copy existing fields) ?

### 3.7. Testy RecipeViewAdapter ? 2026-09-24
- recipe-view.adapter.spec.ts: 16 testow (create, getRecipeName, getDescription, getTags, getSteps, getSource, getRecipeOwner, readRecipePublicFlag, getRecipeIdForApi) ?

### 3.8. Testy utility i shared components ? 2026-09-24
- confirm-utils.spec.ts: 3 testy (valid input, empty categories, empty amount types) ?
- focus.directive.spec.ts: 3 testy (create, focus when true, no focus when false) ?
- confirm-dialog.component.spec.ts: 4 testy (create, display title, display message, display buttons) ?
- confirm.service.spec.ts: 1 test (create) ?

---

## PRIORYTET 4: Wydajnosc ?

### 4.1. Lazy-load admin i recipe routes
~~Zostawione na pozniej � wymaga tworzenia lazy-loaded modules i aktualizacji app.routes.ts~~

### 4.2. Zastapic setTimeout debounce z RxJS debounceTime ? 2026-09-24
- shopping-list-ws.service.ts � usuni?to `pipSyncDebounceHandle` + `setTimeout` ?
- Dodano `Subject<void>` + `debounceTime(250)` + `switchMap` ?
- `scheduleSynchronizeAfterPipNotification()` � tylko `this.pipSyncTrigger.next()` ?
- `resetForLogout()` � tylko `this.pipSyncTrigger.complete()` ?

### 4.3. Dodac strategi? reconnection WebSocket
~~Zostawione na pozniej � wymaga implementacji auto-reconnect z exponential backoff (RxJS retryWhen)~~

---


---

## DODATKOWY PLAN: Adresowanie problemow z raportu (niewykonane)

**Data utworzenia:** 2026-09-24
**Cel:** Usuniecie pozostalej czesci problemow z identyfikowanych w aport.md

---

## PRIORYTET 1: Bezpieczenstwo (KRYTYCZNE)

### 1.4. Usunac puste catch bloki w shopping-list-ws.service.ts ✅ 2026-09-24

**Problem:** Puste catch bloki sluchaja bledów, ale ich nie loguja ani nie surfuja do UI — ciche porazki.
**Lokalizacja:** shopping-list-ws.service.ts:115-117 (catch (e) { }), shopping-list-ws.service.ts:103-104 (catch (e) { void e; })

**Plan:**

Krok 1: Dodac import NotificationService ✅ 2026-09-24
- import { NotificationService } from '../../core/services/notification'; ✅
- private readonly notification = inject(NotificationService); ✅

Krok 2: Zastapic puste catch bloki ✅ 2026-09-24
- catch (e) { } → catch (e) { this.notification.show('Błąd przetwarzania wiadomości CRUD.', 'error'); } ✅
- catch (e) { void e; } → catch (e) { this.notification.show('Błąd parsowania danych synchronizacji.', 'error'); } ✅

Krok 3: Usunac oid e — zawsze logowac lub surfowac blad ✅

**Testy:**
- shopping-list-ws.service.spec.ts — pusty catch zostal zastapiony notification.show ✅
- shopping-list-ws.service.spec.ts — error w sendMsg wywola notification.show ✅

---

### 1.5. Zastapic console.warn z surfowaniem error do UI ✅ 2026-09-24

**Problem:** console.warn() w ecipes.ts:179 nie jest widoczny dla uzytkownika.
**Lokalizacja:** src/app/recipes/recipes.ts:179

**Plan:**

Krok 1: Zastapic console.warn() z NotificationService ✅ 2026-09-24
- NotificationService juz byl zainiekowany jako 
otify ✅
- console.warn('...') → 	his.notify.show('Nie udało się pobrać listy tagów (autocomplete wyłączony).', 'warn') ✅

**Testy:**
- ecipes.spec.ts — błąd fetchSuggestions wywoluje notification.warn ✅

---

### 1.6. Dostosowac withCredentials interceptor do requestów wymagajacych cookies ✅ 2026-09-24

**Problem:** withCredentials: true na WSZYSTKICH requestach HTTP — marnuje zasoby i moze powodowac bledy CORS gdy serwer nie obsluguje cookies.
**Lokalizacja:** src/app/core/interceptors/with-credentials.interceptor.ts:5

**Plan:**

Krok 1: Dodac flagę metadata do requestów wymagajacych cookies ✅ 2026-09-24
- Stworzyc src/app/core/http-context-keys.ts z WITH_CREDENTIALS HttpContextToken ✅
- HttpContext jest czystsze: 
ew HttpContext().set(WITH_CREDENTIALS, true) ✅

Krok 2: Zaktualizowac interceptor ✅ 2026-09-24
- Sprawdzac eq.context.get(WITH_CREDENTIALS) zamiast zawsze ustawiac ✅
- Ustawiac withCredentials: true tylko gdy flaga true ✅

Krok 3: Zaktualizowac wywolania HttpClient ✅ 2026-09-24
- W shared-token-refresh.ts dodac context: new HttpContext().set(WITH_CREDENTIALS, true) ✅
- W login.ts dodac context do /user/log i /user/register ✅
- W pp.ts dodac context do /user/logout ✅
- W user-admin.service.ts dodac context do wszystkich /user/* ✅

**Testy:**
- with-credentials.interceptor.spec.ts — withCredentials: true tylko gdy flaga ustawiona ✅
- with-credentials.interceptor.spec.ts — withCredentials: false domyslnie ✅

---

### 1.7. Dodac sanitizacje HTML (opcjonalnie — jeeli UI akceptuje HTML) ✅ 2026-09-24

**Problem:** Brak sanitizacji HTML — potencjalne XSS przy renderowaniu opisu przepisu.
**Lokalizacja:** Szablony z innerHTML — ecipes.ts, ecipe-detail.ts

**Plan:**

Krok 1: Znalezc wszystkie innerHTML w szablonach ✅ 2026-09-24
- Przeszukanie szablonów i plików .ts ✅
- Wynik: Brak innerHTML w projekcie ✅

Krok 2: NIE WYMAGANE ✅ 2026-09-24
- Problem nie wystepuje w aktualnym kodzie ✅

**Testy:**
- N/A — brak innerHTML do sanizacji ✅

---

## PRIORYTET 2: Jakosc kodu

### 2.4. Dodac memoizacje do RecipeViewAdapter ✅ 2026-09-24

**Problem:** RecipeViewAdapter iteruje przez 10-12 property names na wywolanie — metody sa wo lane w szablonie na kazdy change detection cycle.
**Lokalizacja:** src/app/recipes/adapters/recipe-view.adapter.ts:27-178

**Plan:**

Krok 1: Dodac memoize utility function ✅ 2026-09-24
- src/app/recipes/utils/memoize.ts — prosta implementacja z WeakMap ✅
- unction memoize<T extends readonly unknown[], R>(fn: (...args: T) => R): MemoizedFn<T, R> ✅

Krok 2: Oznaczyc metody RecipeViewAdapter jako memoized ✅ 2026-09-24
- getRecipeName() — memoize ✅
- getDescriptionPlain() — memoize ✅
- getTags() — memoize ✅
- getSource() — memoize ✅
- getRecipeOwner() — memoize ✅

**Testy:**
- ecipe-view.adapter.spec.ts — memoize zwraca ten sam wynik dla tego samego inputu ✅

---

### 2.5. Rozlozyc ShoppingListDataService (god object)

**Problem:** ShoppingListDataService zawiera logike CRUD, merge, buy actions, koordinacje stanu + WS.
**Lokalizacja:** src/app/shopping-list/services/shopping-list-data.service.ts:159-246

**Plan:**

Krok 1: Wyekstrakowac logike CRUD do osobnego serwisu
- ShoppingItemCrudService — put, post, delete na elementy
- CategoryCrudService — put, post, delete na kategorie
- AmountTypeCrudService — put, post, delete na jednostki

Krok 2: Wyekstrakowac logike buy actions
- ShoppingItemBuyService — buy, unbuy, markAsBought

Krok 3: Zostawic w ShoppingListDataService tylko koordinacje stanu + WS
- Facade pozostaje — ale tylko deleguje

**Testy:**
- shopping-item-crud.service.spec.ts — put, post, delete
- shopping-item-buy.service.spec.ts — buy, unbuy
- shopping-list-data.service.spec.ts — koordynacja stanu

---

## PRIORYTET 3: Testy (brakujace krytyczne)

### 3.9. Testy interceptorow

**Problem:** Brak testów interceptorów — krytyczny kod bezpieczenstwa.
**Lokalizacja:** uth-interceptor.ts, orwarded-headers.interceptor.ts, with-credentials.interceptor.ts

**Plan:**

Krok 1: uth-interceptor.spec.ts
- Authorization: Bearer <token> dodany do kazdego requestu
- Brak Authorization gdy token=null

Krok 2: orwarded-headers.interceptor.spec.ts
- X-Forwarded-For, X-Forwarded-Proto, X-Forwarded-Host dodane
- Naglowki nie duplikuja sie przy ponownych requestach

Krok 3: with-credentials.interceptor.spec.ts
- withCredentials: true tylko gdy flaga ustawiona
- withCredentials: false domyslnie

---

### 3.10. Testy guards (auth, guest, admin)

**Problem:** Brak testów guards — logika ochrony route.
**Lokalizacja:** uth.guard.ts, guest.guard.ts, dmin.guard.ts

**Plan:**

Krok 1: uth.guard.spec.ts
- CanActivateFn — zalogowany user → true
- CanActivateFn — niezalogowany → redirect do /login

Krok 2: guest.guard.spec.ts
- CanActivateFn — niezalogowany → true
- CanActivateFn — zalogowany → redirect do /shopping-list

Krok 3: dmin.guard.spec.ts
- CanActivateFn — admin → true
- CanActivateFn — nie-admin → false

---

### 3.11. Testy WebSocket service

**Problem:** Brak testów ShoppingListWsService — routing/dispatching wiadomosci.
**Lokalizacja:** src/app/shopping-list/services/shopping-list-ws.service.ts

**Plan:**

Krok 1: shopping-list-ws.service.spec.ts — connect
- ensureConnected() wywala ws.connect()
- ws.setToken() z aktualnym tokenem

Krok 2: shopping-list-ws.service.spec.ts — disconnect
- esetForLogout() wywala ws.disconnect()
- sessionId jest czyszczony

Krok 3: shopping-list-ws.service.spec.ts — message routing
- Komenda PUT wywala state.applyShoppingItemCrudTopic('put', ...)
- Komenda DELETE wywala state.applyShoppingItemCrudTopic('delete', ...)
- PIP sync trigger wywala sendSynchronizeRequest()

---

### 3.12. Testy ShoppingListDataService (Facade)

**Problem:** Brak testów ShoppingListDataService — facade z logika CRUD.
**Lokalizacja:** src/app/shopping-list/services/shopping-list-data.service.ts

**Plan:**

Krok 1: shopping-list-data.service.spec.ts — buy action
- uyItem() aktualizuje stan i wysyla PUT przez WS

Krok 2: shopping-list-data.service.spec.ts — put category
- putCategory() wysyla PUT przez WS

Krok 3: shopping-list-data.service.spec.ts — post shopping item
- postShoppingItem() wysyla POST przez WS

---

### 3.13. Testy sciezek error (network failures, 401, WS disconnects)

**Problem:** Brak testów obslugi bledów — network failures, 401, WS disconnects.
**Lokalizacja:** Różne place

**Plan:**

Krok 1: uth-interceptor.spec.ts — 401 response
- Interceptor wywala logout() na 401
- Przekierowuje do /login

Krok 2: shopping-list-ws.service.spec.ts — WS disconnect
- ws.onclose wywala 
otification.warn()

Krok 3: shared-token-refresh.spec.ts — refresh failure
- executeRefresh() obsluguje błąd i wywala logout()

---

## PRIORYTET 4: Wydajnosc

### 4.4. Lazy-load admin i recipe routes

**Problem:** Wszystkie route (ok. 10) laduja sie w main bundle.
**Lokalizacja:** src/app/app.routes.ts:14-24

**Plan:**

Krok 1: Stworzyc lazy-loaded modules
- dmin.module.ts — route: /admin/users, /admin/tags
- ecipes.module.ts — route: /recipes, /recipes/:id
- shopping.module.ts — route: /shopping-list

Krok 2: Zaktualizowac pp.routes.ts
- path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
- path: 'recipes', loadChildren: () => import('./recipes/recipes.module').then(m => m.RecipesModule)

Krok 3: Usunac statyczne importy z pp.config.ts
- Usunac dminGuard, ecipe-detail, shopping-list z importów

**Testy:**
- pp.spec.ts — lazy-loaded module nie jest ładowany przed nawigacja

---

### 4.5. Dodac strategię reconnection WebSocket

**Problem:** Brak auto-reconnect z exponential backoff po rozlaczeniu WebSocket.
**Lokalizacja:** src/app/core/services/websocket.ts:89-94

**Plan:**

Krok 1: Stworzyc WebSocketReconnectService
- src/app/core/services/websocket-reconnect.service.ts
- Metoda connectWithBackoff(): void

Krok 2: Implementacja exponential backoff
- etryWhen(errors => errors.pipe( delayWhen((_, i) => timer(Math.min(1000 * 2 ** i, 30000))), take(5) ))
- Maksymalnie 5 polaczen, maksymalny interwal 30 sekund

Krok 3: Integracja z WebSocketService
- WebSocketService wywala WebSocketReconnectService.connectWithBackoff() po onclose
- Po udanym polaczeniu — resubskrypcja topicow

**Testy:**
- websocket-reconnect.service.spec.ts — exponential backoff
- websocket-reconnect.service.spec.ts — po 5 nieudanych probach — error

---

## PRIORYTET 5: PWA / Service Worker (opcjonalnie)

### 5.1. Dodac PWA / service worker

**Problem:** Brak offline support.
**Lokalizacja:** ngular.json, src/app/app.config.ts

**Plan:**

Krok 1: Dodac @angular/pwa
- 
g add @angular/pwa
- Dodaje 
gsw-config.json i service worker

Krok 2: Skonfigurowac service worker
- 
gsw-config.json — cache static assets, lazy-load API responses

Krok 3: Testowac offline behavior
- Application loads from cache when offline
- API calls fail gracefully when offline

**Testy:**
- pp.spec.ts — service worker jest zarejestrowany

---

## PODSUMOWANIE PLANU

| Kategoria | Problem | Status |
|-----------|---------|--------|
| Bezpieczenstwo | Puste catch bloki | ✅ ZAKOŃCZONE |
| Bezpieczenstwo | console.warn zamiast UI error | ✅ ZAKOŃCZONE |
| Bezpieczenstwo | withCredentials na WSZYSTKICH requestach | ✅ ZAKOŃCZONE |
| Bezpieczenstwo | Brak sanitizacji HTML | ✅ NIE DOTYCZY (brak innerHTML) |
| Jakosc kodu | RecipeViewAdapter memoizacja | ✅ ZAKOŃCZONE |
| Jakosc kodu | ShoppingListDataService god object | ~do zrobienia |
| Testy | Brak testow interceptorow | ~do zrobienia |
| Testy | Brak testow guards | ~do zrobienia |
| Testy | Brak testow WebSocket service | ~do zrobienia |
| Testy | Brak testow ShoppingListDataService | ~do zrobienia |
| Testy | Brak testow error paths | ~do zrobienia |
| Wydajnosc | Lazy-load routes | ~do zrobienia |
| Wydajnosc | Reconnection WebSocket | ~do zrobienia |
| PWA | Service worker | ~do zrobienia |
