import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TokenService } from '../../core/services/token.service';
import { Command, WebSocketService, WsMessage } from '../../core/services/websocket';
import { Category } from '../models/category.model';
import { ShoppingItem } from '../models/shopping-item.model';
import { AmountType } from '../models/amount-type.model';
import { MapUtil } from '../utils/map-util';
import { parseAllDtoFromWsBody } from './all-dto.adapter';
import {
  parseAmountTypeDtoFromWsBody,
  parseCategoryDtoFromWsBody,
  parseShoppingItemDtoFromWsBody
} from './entity-ws-body.adapter';
import { ShoppingListStateService } from './shopping-list-state.service';

/** Subskrypcja WebSocket i wysyłka komend — używane przez fasadę listy. */
@Injectable({ providedIn: 'root' })
export class ShoppingListWsService {
  private readonly ws = inject(WebSocketService);
  private readonly tokenService = inject(TokenService);
  private readonly state = inject(ShoppingListStateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly synchronizeDataUrl = '/synchronizeData';
  private pipSyncDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private readonly pipSyncDebounceMs = 250;

  private sessionId = '';
  private messageSubscriptionStarted = false;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.pipSyncDebounceHandle != null) {
        clearTimeout(this.pipSyncDebounceHandle);
        this.pipSyncDebounceHandle = null;
      }
    });
  }

  /** Zeruje sesję WS (id synchronizacji, timer PIP) i zamyka gniazdo. */
  resetForLogout(): void {
    if (this.pipSyncDebounceHandle != null) {
      clearTimeout(this.pipSyncDebounceHandle);
      this.pipSyncDebounceHandle = null;
    }
    this.sessionId = '';
    this.ws.disconnect();
  }

  ensureConnected(): void {
    const token = this.tokenService.getToken();
    const userName = this.tokenService.getUserName();
    if (!token) {
      return;
    }
    if (!userName) {
    }

    this.ws.setToken(token);
    const pipUrl = this.getPipUrl();
    if (!this.messageSubscriptionStarted) {
      this.messageSubscriptionStarted = true;
      this.ws.connect();
      const pipDestNorm = this.normalizeTopic(pipUrl);
      const syncDest = this.normalizeTopic(this.synchronizeDataUrl);
      const syncTopicSuffix = this.synchronizeDataUrl.replace(/^\//, '').toLowerCase();

      this.ws.messages$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(raw => {
        let message: WsMessage;
        try {
          message = this.parseWsPayload(raw);
        } catch (e) {
          return;
        }
        switch (message.command) {
          case Command.CONNECTED:
            if (message.headers.ID) {
              this.sessionId = message.headers.ID;
              this.sendSynchronizeRequest(userName);
            }
            break;
          case Command.MESSAGE: {
            const dest = this.normalizeTopic(message.headers.DEST);

            if (dest === pipDestNorm) {
              if (this.sessionId) {
                this.scheduleSynchronizeAfterPipNotification();
              } else {
              }
              break;
            }

            if (this.isSynchronizeDestination(dest, syncDest, syncTopicSuffix)) {
              const body = message.headers.BODY;
              if (!body) {
                break;
              }
              try {
                const allDto = parseAllDtoFromWsBody(body);
                this.state.applySynchronizePayload(allDto);
              } catch (e) {
                void e;
              }
              break;
            }

            const userNameLive = this.tokenService.getUserName();
            const crudTail = this.getCrudTopicTailIfForUser(dest, userNameLive);
            const bodyCrud = message.headers.BODY;
            if (crudTail && bodyCrud && this.isKnownEntityCrudTopicTail(crudTail)) {
              try {
                this.dispatchCrudTopicMessage(crudTail, bodyCrud);
              } catch (e) {
              }
              break;
            }

            const body = message.headers.BODY;
            if (!body) {
              break;
            }

            try {
              const candidate = parseAllDtoFromWsBody(body);
              if (
                candidate.categoryDtoList.length > 0 ||
                candidate.shoppingItemDtoList.length > 0 ||
                candidate.amountTypeDtoList.length > 0
              ) {
                this.state.applySynchronizePayload(candidate);
              }
            } catch {
              /* not an AllDto body */
            }
            break;
          }
        }
      });

      this.subscribeToShoppingListTopics(userName);
    } else {
      this.ws.setToken(token);
      this.ws.connect();
      this.subscribeToShoppingListTopics(userName);
    }
  }

  private subscribeToShoppingListTopics(userName: string | null): void {
    const pipUrl = this.getPipUrl();
    const para = userName ? [userName] : [];
    this.sendMsgSubscribe(this.synchronizeDataUrl);
    this.sendMsgSubscribe(pipUrl, para);
    const crudTopics = [
      this.getPutAmountTypeUrl(),
      this.getPostAmountTypeUrl(),
      this.getDeleteAmountTypeUrl(),
      this.getPutCategoryUrl(),
      this.getPostCategoryUrl(),
      this.getDeleteCategoryUrl(),
      this.getPutShoppingItemUrl(),
      this.getPostShoppingItemUrl(),
      this.getDeleteShoppingItemUrl()
    ];
    for (const topic of crudTopics) {
      this.sendMsgSubscribe(topic, para);
    }
  }

  /** Ostatni segment ścieżki (np. putCategory), jeśli pierwszy segment to zalogowany użytkownik. */
  private getCrudTopicTailIfForUser(dest: string, userName: string | null): string | null {
    const parts = dest.split('/').filter(Boolean);
    if (parts.length < 2) {
      return null;
    }
    const u = userName?.trim();
    if (u && parts[0].toLowerCase() !== u.toLowerCase()) {
      return null;
    }
    return parts[parts.length - 1];
  }

  private isKnownEntityCrudTopicTail(tail: string): boolean {
    const t = tail.toLowerCase();
    return (
      t === 'putamounttype' ||
      t === 'postamounttype' ||
      t === 'deleteamounttype' ||
      t === 'putcategory' ||
      t === 'postcategory' ||
      t === 'deletecategory' ||
      t === 'putshoppingitem' ||
      t === 'postshoppingitem' ||
      t === 'deleteshoppingitem'
    );
  }

  private dispatchCrudTopicMessage(tail: string, body: string): void {
    const t = tail.toLowerCase();
    switch (t) {
      case 'putamounttype':
        this.state.applyAmountTypeCrudTopic('put', parseAmountTypeDtoFromWsBody(body));
        break;
      case 'postamounttype':
        this.state.applyAmountTypeCrudTopic('post', parseAmountTypeDtoFromWsBody(body));
        break;
      case 'deleteamounttype':
        this.state.applyAmountTypeCrudTopic('delete', parseAmountTypeDtoFromWsBody(body));
        break;
      case 'putcategory':
        this.state.applyCategoryCrudTopic('put', parseCategoryDtoFromWsBody(body));
        break;
      case 'postcategory':
        this.state.applyCategoryCrudTopic('post', parseCategoryDtoFromWsBody(body));
        break;
      case 'deletecategory':
        this.state.applyCategoryCrudTopic('delete', parseCategoryDtoFromWsBody(body));
        break;
      case 'putshoppingitem':
        this.state.applyShoppingItemCrudTopic('put', parseShoppingItemDtoFromWsBody(body));
        break;
      case 'postshoppingitem':
        this.state.applyShoppingItemCrudTopic('post', parseShoppingItemDtoFromWsBody(body));
        break;
      case 'deleteshoppingitem':
        this.state.applyShoppingItemCrudTopic('delete', parseShoppingItemDtoFromWsBody(body));
        break;
      default:
        break;
    }
  }

  scheduleSynchronizeAfterPipNotification(): void {
    if (this.pipSyncDebounceHandle != null) {
      clearTimeout(this.pipSyncDebounceHandle);
    }
    this.pipSyncDebounceHandle = setTimeout(() => {
      this.pipSyncDebounceHandle = null;
      const u = this.tokenService.getUserName();
      this.sendSynchronizeRequest(u);
    }, this.pipSyncDebounceMs);
  }

  sendSynchronizeRequest(userName: string | null): void {
    if (!this.sessionId) {
      return;
    }
    const payload = this.state.buildClientAllDtoForServer();
    this.sendMsg(
      this.synchronizeDataUrl,
      JSON.stringify(payload),
      this.sessionId,
      userName != null && userName.trim().length > 0 ? [userName.trim()] : []
    );
  }

  sendPutCategory(category: Category, userName: string | null): void {
    if (!this.sessionId) {
      return;
    }
    const u = userName?.trim();
    if (!u) {
      return;
    }
    const dest = this.getPutCategoryUrl();
    const dto = MapUtil.CategoryModelToDto(category);
    this.sendMsg(dest, JSON.stringify(dto), this.sessionId, [u]);
  }

  sendPostCategory(category: Category, userName: string | null): void {
    if (!this.sessionId) {
      return;
    }
    const u = userName?.trim();
    if (!u) {
      return;
    }
    const dest = this.getPostCategoryUrl();
    const dto = MapUtil.CategoryModelToDto(category);
    this.sendMsg(dest, JSON.stringify(dto), this.sessionId, [u]);
  }

  sendDeleteCategory(category: Category, userName: string | null): void {
    if (!this.sessionId) {
      return;
    }
    const u = userName?.trim();
    if (!u) {
      return;
    }
    const dest = this.getDeleteCategoryUrl();
    const dto = MapUtil.CategoryModelToDto({ ...category, deleted: true });
    this.sendMsg(dest, JSON.stringify(dto), this.sessionId, [u]);
  }

  sendPutAmountType(unit: AmountType, userName: string | null): void {
    if (!this.sessionId) {
      return;
    }
    const u = userName?.trim();
    if (!u) {
      return;
    }
    const dest = this.getPutAmountTypeUrl();
    const dto = MapUtil.AmountTypeModelToDto(unit);
    this.sendMsg(dest, JSON.stringify(dto), this.sessionId, [u]);
  }

  sendPostAmountType(unit: AmountType, userName: string | null): void {
    if (!this.sessionId) {
      return;
    }
    const u = userName?.trim();
    if (!u) {
      return;
    }
    const dest = this.getPostAmountTypeUrl();
    const dto = MapUtil.AmountTypeModelToDto(unit);
    this.sendMsg(dest, JSON.stringify(dto), this.sessionId, [u]);
  }

  sendDeleteAmountType(unit: AmountType, userName: string | null): void {
    if (!this.sessionId) {
      return;
    }
    const u = userName?.trim();
    if (!u) {
      return;
    }
    const dest = this.getDeleteAmountTypeUrl();
    const dto = MapUtil.AmountTypeModelToDto({ ...unit, deleted: true });
    this.sendMsg(dest, JSON.stringify(dto), this.sessionId, [u]);
  }

  sendPutShoppingItem(item: ShoppingItem, userName: string | null): void {
    if (!this.sessionId) {
      return;
    }
    const u = userName?.trim();
    if (!u) {
      return;
    }
    const dest = this.getPutShoppingItemUrl();
    const dto = MapUtil.ShoppingItemModelToDto(item);
    this.sendMsg(dest, JSON.stringify(dto), this.sessionId, [u]);
  }

  sendPostShoppingItem(item: ShoppingItem, userName: string | null): void {
    if (!this.sessionId) {
      return;
    }
    const u = userName?.trim();
    if (!u) {
      return;
    }
    const dest = this.getPostShoppingItemUrl();
    const dto = MapUtil.ShoppingItemModelToDto(item);
    this.sendMsg(dest, JSON.stringify(dto), this.sessionId, [u]);
  }

  sendDeleteShoppingItem(item: ShoppingItem, userName: string | null): void {
    if (!this.sessionId) {
      return;
    }
    const u = userName?.trim();
    if (!u) {
      return;
    }
    const dest = this.getDeleteShoppingItemUrl();
    const dto = MapUtil.ShoppingItemModelToDto({ ...item, deleted: true });
    this.sendMsg(dest, JSON.stringify(dto), this.sessionId, [u]);
  }

  private normalizeTopic(topic: string | undefined): string {
    if (!topic) {
      return '';
    }
    const t = topic.trim();
    return t.startsWith('/') ? t : `/${t}`;
  }

  private isSynchronizeDestination(dest: string, syncDest: string, syncSuffixLower: string): boolean {
    const d = dest.toLowerCase();
    const s = syncDest.toLowerCase();
    if (d === s) {
      return true;
    }
    if (syncSuffixLower.length === 0) {
      return false;
    }
    const segments = d.split('/').filter(Boolean);
    const last = segments[segments.length - 1]?.toLowerCase() ?? '';
    if (last === syncSuffixLower) {
      return true;
    }
    return d.includes(syncSuffixLower);
  }

  private parseWsPayload(raw: unknown): WsMessage {
    if (typeof raw === 'string') {
      return JSON.parse(raw) as WsMessage;
    }
    return raw as WsMessage;
  }

  private getPipUrl(): string {
    return '/{userName}/pip';
  }

  private getPutCategoryUrl(): string {
    return '/{userName}/putCategory';
  }

  private getPostCategoryUrl(): string {
    return '/{userName}/postCategory';
  }

  private getDeleteCategoryUrl(): string {
    return '/{userName}/deleteCategory';
  }

  private getPutShoppingItemUrl(): string {
    return '/{userName}/putShoppingItem';
  }

  private getPostShoppingItemUrl(): string {
    return '/{userName}/postShoppingItem';
  }

  private getDeleteShoppingItemUrl(): string {
    return '/{userName}/deleteShoppingItem';
  }

  private getPutAmountTypeUrl(): string {
    return '/{userName}/putAmountType';
  }

  private getPostAmountTypeUrl(): string {
    return '/{userName}/postAmountType';
  }

  private getDeleteAmountTypeUrl(): string {
    return '/{userName}/deleteAmountType';
  }

  private sendMsgSubscribe(topic: string, para?: string[]): void {
    const message: WsMessage = {
      command: Command.SUBSCRIBE,
      headers: {
        DEST: topic
      }
    };

    if (para) {
      message.headers.PARA = para.join(';');
    }

    this.ws.sendMessage(message);
  }

  private sendMsg(topic: string, body: string, id?: string, para?: string[]): void {
    const message: WsMessage = {
      command: Command.MESSAGE,
      headers: {
        DEST: topic,
        BODY: body
      }
    };
    if (id) {
      message.headers.ID = id;
    }

    if (para) {
      message.headers.PARA = para.join(';');
    }

    this.ws.sendMessage(message);
  }
}
