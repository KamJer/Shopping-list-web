import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { Command, WebSocketService } from '../../core/services/websocket';
import { TokenService } from '../../core/services/token.service';
import { ShoppingListWsService } from './shopping-list-ws.service';
import { ShoppingListStateService } from './shopping-list-state.service';
import { ModifyState } from '../enums/modify-state.enum';

describe('ShoppingListWsService', () => {
  let service: ShoppingListWsService;
  let state: ShoppingListStateService;
  let messages: Subject<any>;

  beforeEach(() => {
    messages = new Subject<any>();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WebSocketService,
          useValue: {
            messages$: messages,
            setToken: () => {},
            connect: () => {},
            sendMessage: () => {},
            disconnect: () => {}
          }
        },
        {
          provide: TokenService,
          useValue: {
            getToken: () => 'test-token',
            getUserName: () => 'tester'
          }
        },
        ShoppingListStateService,
        ShoppingListWsService
      ]
    });
    service = TestBed.inject(ShoppingListWsService);
    state = TestBed.inject(ShoppingListStateService);
    state.resetForLogout();
  });

  it('applies putCategory response on parameterized dest to fresh category and remaps items', () => {
    state.categories.set([
      { categoryId: 0, categoryName: 'Warzywa', deleted: false, savedTime: new Date(), localId: -1 }
    ]);
    state.shoppingItems.set([
      {
        shoppingItemId: 0,
        itemAmountTypeId: 1,
        itemCategoryId: -1,
        itemName: 'Marchew',
        amount: 1,
        bought: false,
        sendToBought: false,
        deleted: false,
        savedTime: new Date(),
        localId: -2
      }
    ]);

    service.ensureConnected();

    const body = JSON.stringify({
      categoryId: 5,
      categoryName: 'Warzywa',
      deleted: false,
      localId: -1,
      savedTime: '2026-01-01T00:00:00',
      modifyState: ModifyState.UPDATE
    });
    messages.next({ command: Command.MESSAGE, headers: { DEST: '/{userName}/putCategory', BODY: body } });

    const cats = state.categories();
    expect(cats.length).toBe(1);
    expect(cats[0].categoryId).toBe(5);
    const items = state.shoppingItems();
    expect(items.length).toBe(1);
    expect(items[0].itemCategoryId).toBe(5);
  });
});

function base64UrlJson(o: unknown): string {
  return btoa(JSON.stringify(o))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function jwtWithSub(name: string): string {
  return `${base64UrlJson({ alg: 'HS256' })}.${base64UrlJson({ sub: name })}.sig`;
}

describe('ShoppingListWsService session handling', () => {
  let connectCount: number;

  function configure(tokenServiceMock: { [K in string]: unknown }): ShoppingListWsService {
    connectCount = 0;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WebSocketService,
          useValue: {
            messages$: new Subject<any>(),
            setToken: () => {},
            connect: () => {
              connectCount++;
            },
            sendMessage: () => {},
            disconnect: () => {}
          }
        },
        { provide: TokenService, useValue: tokenServiceMock },
        ShoppingListStateService,
        ShoppingListWsService
      ]
    });
    return TestBed.inject(ShoppingListWsService);
  }

  it('does not connect when there is no token', () => {
    const service: ShoppingListWsService = configure({
      getToken: () => null,
      getUserName: () => 'tester'
    });

    service.ensureConnected();
    expect(connectCount).toBe(0);
  });

  it('restores userName from JWT sub and connects after reload', () => {
    let savedUserName: string | null = null;
    const service: ShoppingListWsService = configure({
      getToken: () => jwtWithSub('tester'),
      getUserName: () => null,
      setUserName: (n: string) => {
        savedUserName = n;
      }
    });

    service.ensureConnected();

    expect(savedUserName).toBe('tester');
    expect(connectCount).toBe(1);
  });

  it('does not connect when userName cannot be restored and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const service: ShoppingListWsService = configure({
      getToken: () => 'not-a-jwt-token',
      getUserName: () => null,
      setUserName: () => {
        throw new Error('setUserName should not be called');
      }
    });

    service.ensureConnected();

    expect(connectCount).toBe(0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
