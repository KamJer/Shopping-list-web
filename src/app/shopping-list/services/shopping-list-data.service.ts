import { inject, Injectable } from '@angular/core';
import { TokenService } from '../../core/services/token.service';
import { Category } from '../models/category.model';
import { ShoppingItem } from '../models/shopping-item.model';
import { AmountType } from '../models/amount-type.model';
import { ShoppingListStateService } from './shopping-list-state.service';
import { ShoppingListWsService } from './shopping-list-ws.service';

/**
 * Fasada: stan listy + WebSocket — to samo publiczne API co wcześniej dla komponentów.
 */
@Injectable({ providedIn: 'root' })
export class ShoppingListDataService {
  private readonly state = inject(ShoppingListStateService);
  private readonly ws = inject(ShoppingListWsService);
  private readonly tokenService = inject(TokenService);

  readonly categories = this.state.categories;
  readonly shoppingItems = this.state.shoppingItems;
  readonly amountTypes = this.state.amountTypes;

  /** Po udanym wylogowaniu: wyczyszczenie listy i zamknięcie WS przed kolejnym logowaniem. */
  clearSessionForLogout(): void {
    this.state.resetForLogout();
    this.ws.resetForLogout();
  }

  ensureConnected(): void {
    this.ws.ensureConnected();
  }

  getCategoryKeyForItem(category: Category): number {
    return this.state.getCategoryKeyForItem(category);
  }

  itemsForCategory(category: Category): ShoppingItem[] {
    return this.state.itemsForCategory(category);
  }

  trackCategory(_index: number, c: Category): string {
    return this.state.trackCategory(_index, c);
  }

  getAmountTypeKey(unit: AmountType): number {
    return this.state.getAmountTypeKey(unit);
  }

  setShoppingItemBought(item: ShoppingItem, bought: boolean): void {
    item.bought = bought;
    if (!bought) {
      item.sendToBought = false;
    }
    const userName = this.tokenService.getUserName();

    if (item.shoppingItemId === 0) {
      this.ws.sendPutShoppingItem(item, userName);
    } else {
      this.ws.sendPostShoppingItem(item, userName);
    }

    this.state.shoppingItems.update(items => [...items]);
  }

  /**
   * Ręczna akcja użytkownika (przycisk strzałki): oznacza kupione elementy jako wysłane na listę "Kupione".
   * Poza inicjalizacją to jedyne miejsce automatycznej zmiany `sendToBought`.
   */
  sendBoughtItemsToBoughtList(): void {
    const userName = this.tokenService.getUserName();
    this.state.shoppingItems.update(items => {
      const next = items.map(item => {
        if (!item.bought || item.sendToBought) {
          return item;
        }
        const updated: ShoppingItem = { ...item, sendToBought: true, savedTime: new Date() };
        if (updated.shoppingItemId === 0) {
          this.ws.sendPutShoppingItem(updated, userName);
        } else {
          this.ws.sendPostShoppingItem(updated, userName);
        }
        return updated;
      });
      return next;
    });
  }

  removeShoppingItem(item: ShoppingItem): void {
    this.ws.sendDeleteShoppingItem(item, this.tokenService.getUserName());
    this.state.shoppingItems.update(items => items.filter(i => i !== item));
  }

  moveCategoryUp(index: number): void {
    this.state.moveCategoryUp(index);
  }

  moveCategoryDown(index: number): void {
    this.state.moveCategoryDown(index);
  }

  deleteCategory(category: Category): void {
    const key = this.state.getCategoryKeyForItem(category);
    this.ws.sendDeleteCategory(category, this.tokenService.getUserName());
    this.state.categories.update(c => c.filter(x => this.state.getCategoryKeyForItem(x) !== key));
    this.state.shoppingItems.update(items => items.filter(i => i.itemCategoryId !== key));
  }

  saveCategoryFromDialog(name: string, editing: Category | null): void {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const userName = this.tokenService.getUserName();
    if (editing) {
      editing.categoryName = trimmed;
      editing.savedTime = new Date();
      this.ws.sendPostCategory(editing, userName);
      this.state.categories.update(cats => [...cats]);
      return;
    }
    const localId = Date.now();
    const newCategory: Category = {
      categoryId: 0,
      categoryName: trimmed,
      deleted: false,
      savedTime: new Date(),
      localId
    };
    this.state.categories.update(c => [...c, newCategory]);
    this.ws.sendPutCategory(newCategory, userName);
  }

  saveAmountTypeFromDialog(name: string, editing: AmountType | null): void {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const userName = this.tokenService.getUserName();
    if (editing) {
      editing.typeName = trimmed;
      editing.savedTime = new Date();
      this.ws.sendPostAmountType(editing, userName);
      this.state.amountTypes.update(list => [...list]);
      return;
    }
    const localId = Date.now();
    const unit: AmountType = {
      amountTypeId: 0,
      typeName: trimmed,
      deleted: false,
      savedTime: new Date(),
      localId
    };
    this.state.amountTypes.update(list => [...list, unit]);
    this.ws.sendPutAmountType(unit, userName);
  }

  deleteAmountType(unit: AmountType): void {
    const key = this.state.getAmountTypeKey(unit);
    const userName = this.tokenService.getUserName();
    this.ws.sendDeleteAmountType(unit, userName);
    this.state.amountTypes.update(list => list.filter(u => this.state.getAmountTypeKey(u) !== key));
    this.state.shoppingItems.update(items => items.filter(i => i.itemAmountTypeId !== key));
  }

  confirmNewOrEditedItem(params: {
    categoryIndex: number;
    amountTypeId: number;
    name: string;
    amount: number;
    existing: ShoppingItem | null;
  }): void {
    const cats = this.state.categories();
    const cat = cats[params.categoryIndex];
    if (!cat) {
      return;
    }
    const userName = this.tokenService.getUserName();
    const key = this.state.getCategoryKeyForItem(cat);
    const existing = params.existing;

    if (existing) {
      existing.itemName = params.name.trim();
      existing.amount = params.amount;
      existing.itemCategoryId = key;
      existing.itemAmountTypeId = params.amountTypeId;
      existing.savedTime = new Date();
      this.ws.sendPostShoppingItem(existing, userName);
      this.state.shoppingItems.update(items => [...items]);
      return;
    }

    const item: ShoppingItem = {
      shoppingItemId: 0,
      itemCategoryId: key,
      itemAmountTypeId: params.amountTypeId,
      itemName: params.name.trim(),
      amount: params.amount,
      bought: false,
      sendToBought: false,
      deleted: false,
      savedTime: new Date(),
      localId: Date.now()
    };
    this.state.shoppingItems.update(items => [...items, item]);
    this.ws.sendPutShoppingItem(item, userName);
  }
}
