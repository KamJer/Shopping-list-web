import { Injectable, signal } from '@angular/core';
import { AllDto } from '../models/all-dto.model';
import { AmountType } from '../models/amount-type.model';
import { Category } from '../models/category.model';
import { ShoppingItem } from '../models/shopping-item.model';
import { AmountTypeDto } from '../models/amount-type-dto.model';
import { CategoryDto } from '../models/category-dto.model';
import { ShoppingItemDto } from '../models/shopping-item-dto.model';
import { MapUtil } from '../utils/map-util';
import { ModifyState } from '../enums/modify-state.enum';

/** Stan listy zakupów (sygnały) — bez transportu WebSocket. */
@Injectable({ providedIn: 'root' })
export class ShoppingListStateService {
  private lastSyncedSavedTime: string | null = null;
  private shoppingItemsInitialized = false;

  readonly categories = signal<Category[]>([]);
  readonly shoppingItems = signal<ShoppingItem[]>([]);
  readonly amountTypes = signal<AmountType[]>([]);

  /** Po wylogowaniu — pusta lista danych dla kolejnego użytkownika. */
  resetForLogout(): void {
    this.categories.set([]);
    this.shoppingItems.set([]);
    this.amountTypes.set([]);
    this.lastSyncedSavedTime = null;
    this.shoppingItemsInitialized = false;
  }

  applySynchronizePayload(allDto: AllDto): void {
    this.applyAmountTypeDelta(allDto.amountTypeDtoList);
    this.applyCategoryDelta(allDto.categoryDtoList);
    this.applyShoppingItemDelta(allDto.shoppingItemDtoList);
    if (!this.shoppingItemsInitialized) {
      this.shoppingItems.update(items =>
        items.map(i => (i.bought ? { ...i, sendToBought: true } : i))
      );
      this.shoppingItemsInitialized = true;
    }
    this.lastSyncedSavedTime =
      allDto.savedTime !== undefined && allDto.savedTime !== null && String(allDto.savedTime).length > 0
        ? String(allDto.savedTime)
        : this.lastSyncedSavedTime;
  }

  buildClientAllDtoForServer(): Record<string, unknown> {
    return {
      amountTypeDtoList: this.amountTypes().map(m => MapUtil.AmountTypeModelToDto(m)),
      categoryDtoList: this.categories().map(m => MapUtil.CategoryModelToDto(m)),
      shoppingItemDtoList: this.shoppingItems().map(m => MapUtil.ShoppingItemModelToDto(m)),
      savedTime: this.lastSyncedSavedTime,
      dirty: false
    };
  }

  /** Odpowiedź z tematu WS put/postAmountType — ustawia id z serwera i remapuje powiązane pozycje. */
  applyAmountTypeCrudTopic(operation: 'put' | 'post' | 'delete', dto: AmountTypeDto): void {
    if (operation === 'delete' || dto.deleted) {
      const list = this.amountTypes();
      const idx = this.findAmountTypeIndex(list, dto);
      let purgeKey: number | null = null;
      if (idx >= 0) {
        purgeKey = this.getAmountTypeKey(list[idx]);
      } else if (dto.amountTypeId > 0) {
        purgeKey = dto.amountTypeId;
      } else if (dto.localId > 0) {
        purgeKey = dto.localId;
      }
      this.amountTypes.update(current => {
        const i = this.findAmountTypeIndex(current, dto);
        if (i < 0) {
          return current;
        }
        const next = [...current];
        next.splice(i, 1);
        return next;
      });
      if (purgeKey != null && purgeKey !== 0) {
        this.shoppingItems.update(items => items.filter(i => (i.itemAmountTypeId ?? 0) !== purgeKey));
      }
      return;
    }

    this.amountTypes.update(current => {
      const next = [...current];
      const idx = this.findAmountTypeIndex(next, dto);
      const model = MapUtil.AmountTypeDtoToModel(dto);
      if (idx >= 0) {
        const oldKey = this.getAmountTypeKey(next[idx]);
        next[idx] = model;
        const newKey = this.getAmountTypeKey(model);
        if (oldKey !== newKey) {
          this.remapAmountTypeIdOnShoppingItems(oldKey, newKey);
        }
      } else {
        next.push(model);
      }
      return next;
    });
  }

  /** Odpowiedź z tematu WS put/postCategory. */
  applyCategoryCrudTopic(operation: 'put' | 'post' | 'delete', dto: CategoryDto): void {
    if (operation === 'delete' || dto.deleted) {
      const list = this.categories();
      const idx = this.findCategoryIndex(list, dto);
      let removedKey: number | null = null;
      if (idx >= 0) {
        removedKey = this.getCategoryKeyForItem(list[idx]);
      } else if (dto.categoryId > 0) {
        removedKey = dto.categoryId;
      } else if (dto.localId > 0) {
        removedKey = dto.localId;
      }
      this.categories.update(current => {
        const i = this.findCategoryIndex(current, dto);
        if (i < 0) {
          return current;
        }
        const next = [...current];
        next.splice(i, 1);
        return next;
      });
      if (removedKey != null && removedKey !== 0) {
        this.shoppingItems.update(items => items.filter(i => (i.itemCategoryId ?? 0) !== removedKey));
      }
      return;
    }

    this.categories.update(current => {
      const next = [...current];
      const idx = this.findCategoryIndex(next, dto);
      const model = MapUtil.CategoryDtoToModel(dto);
      if (idx >= 0) {
        const oldKey = this.getCategoryKeyForItem(next[idx]);
        next[idx] = model;
        const newKey = this.getCategoryKeyForItem(model);
        if (oldKey !== newKey) {
          this.remapCategoryIdOnShoppingItems(oldKey, newKey);
        }
      } else {
        next.push(model);
      }
      return next;
    });
  }

  /** Odpowiedź z tematu WS put/post/deleteShoppingItem. */
  applyShoppingItemCrudTopic(operation: 'put' | 'post' | 'delete', dto: ShoppingItemDto): void {
    if (operation === 'delete' || dto.deleted) {
      this.shoppingItems.update(current => {
        const idx = this.findShoppingItemIndex(current, dto);
        if (idx < 0) {
          return current;
        }
        const next = [...current];
        next.splice(idx, 1);
        return next;
      });
      return;
    }

    this.shoppingItems.update(current => {
      let next = [...current];
      const initializing = !this.shoppingItemsInitialized;
      const idx = this.findShoppingItemIndex(next, dto);
      const model = MapUtil.ShoppingItemDtoToModel(dto);
      if (idx >= 0) {
        const preservedSendToBought = initializing ? true : next[idx].sendToBought;
        const normalizedSendToBought = model.bought ? preservedSendToBought : false;
        const merged = {
          ...model,
          localId:
            model.shoppingItemId != null && model.shoppingItemId > 0
              ? undefined
              : model.localId ?? next[idx].localId
        };
        next[idx] = { ...merged, sendToBought: normalizedSendToBought };
      } else {
        const initialSendToBought = model.bought ? (initializing ? true : false) : false;
        const merged = {
          ...model,
          localId: model.shoppingItemId != null && model.shoppingItemId > 0 ? undefined : model.localId
        };
        next.push({ ...merged, sendToBought: initialSendToBought });
      }
      return next;
    });
  }

  getCategoryKeyForItem(category: Category): number {
    return category.categoryId !== 0 ? category.categoryId : (category.localId ?? 0);
  }

  itemsForCategory(category: Category): ShoppingItem[] {
    const key = this.getCategoryKeyForItem(category);
    return this.shoppingItems().filter(i => i.itemCategoryId === key && !i.deleted);
  }

  trackCategory(_index: number, c: Category): string {
    return `${c.localId ?? ''}-${c.categoryId}-${c.categoryName}`;
  }

  getAmountTypeKey(unit: AmountType): number {
    return unit.amountTypeId !== 0 ? unit.amountTypeId : (unit.localId ?? 0);
  }

  moveCategoryUp(index: number): void {
    const cats = this.categories();
    if (index <= 0 || index >= cats.length) {
      return;
    }
    const next = [...cats];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    this.categories.set(next);
  }

  moveCategoryDown(index: number): void {
    const cats = this.categories();
    if (index < 0 || index >= cats.length - 1) {
      return;
    }
    const next = [...cats];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    this.categories.set(next);
  }

  private applyAmountTypeDelta(dtos: AmountTypeDto[]): void {
    const removedKeys: number[] = [];
    this.amountTypes.update(current => {
      let next = [...current];
      for (const dto of dtos) {
        const state = this.readModifyState(dto.modifyState, dto.deleted);
        const model = MapUtil.AmountTypeDtoToModel(dto);
        const idx = this.findAmountTypeIndex(next, dto);
        if (state === ModifyState.DELETE) {
          if (idx >= 0) {
            removedKeys.push(this.getAmountTypeKey(next[idx]));
            next.splice(idx, 1);
          }
          continue;
        }
        if (idx >= 0) {
          const oldKey = this.getAmountTypeKey(next[idx]);
          next[idx] = model;
          const newKey = this.getAmountTypeKey(model);
          if (oldKey !== newKey) {
            this.remapAmountTypeIdOnShoppingItems(oldKey, newKey);
          }
          continue;
        }
        next.push(model);
      }
      return next;
    });
    if (removedKeys.length > 0) {
      const drop = new Set(removedKeys);
      this.shoppingItems.update(items => items.filter(i => !drop.has(i.itemAmountTypeId ?? 0)));
    }
  }

  private applyCategoryDelta(dtos: CategoryDto[]): void {
    const removedKeys: number[] = [];
    this.categories.update(current => {
      let next = [...current];
      for (const dto of dtos) {
        const state = this.readModifyState(dto.modifyState, dto.deleted);
        const model = MapUtil.CategoryDtoToModel(dto);
        const idx = this.findCategoryIndex(next, dto);
        if (state === ModifyState.DELETE) {
          if (idx >= 0) {
            removedKeys.push(this.getCategoryKeyForItem(next[idx]));
            next.splice(idx, 1);
          }
          continue;
        }
        if (idx >= 0) {
          const oldKey = this.getCategoryKeyForItem(next[idx]);
          next[idx] = model;
          const newKey = this.getCategoryKeyForItem(model);
          if (oldKey !== newKey) {
            this.remapCategoryIdOnShoppingItems(oldKey, newKey);
          }
          continue;
        }
        next.push(model);
      }
      return next;
    });
    if (removedKeys.length > 0) {
      const drop = new Set(removedKeys);
      this.shoppingItems.update(items => items.filter(i => !drop.has(i.itemCategoryId ?? 0)));
    }
  }

  private applyShoppingItemDelta(dtos: ShoppingItemDto[]): void {
    this.shoppingItems.update(current => {
      let next = [...current];
      const initializing = !this.shoppingItemsInitialized;
      for (const dto of dtos) {
        const state = this.readModifyState(dto.modifyState, dto.deleted);
        const model = MapUtil.ShoppingItemDtoToModel(dto);
        const idx = this.findShoppingItemIndex(next, dto);
        if (state === ModifyState.DELETE) {
          if (idx >= 0) {
            next.splice(idx, 1);
          }
          continue;
        }
        if (idx >= 0) {
          const preservedSendToBought = initializing ? true : next[idx].sendToBought;
          const normalizedSendToBought = model.bought ? preservedSendToBought : false;
          next[idx] = { ...model, sendToBought: normalizedSendToBought };
          continue;
        }
        const initialSendToBought = model.bought ? (initializing ? true : false) : false;
        next.push({ ...model, sendToBought: initialSendToBought });
      }
      return next;
    });
  }

  private readModifyState(value: unknown, deleted: boolean): ModifyState {
    if (typeof value === 'number') {
      if (value === ModifyState.INSERT || value === ModifyState.UPDATE || value === ModifyState.DELETE) {
        return value;
      }
      if (value === ModifyState.NONE) {
        return deleted ? ModifyState.DELETE : value;
      }
      return deleted ? ModifyState.DELETE : ModifyState.NONE;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toUpperCase();
      if (normalized === 'INSERT') {
        return ModifyState.INSERT;
      }
      if (normalized === 'UPDATE') {
        return ModifyState.UPDATE;
      }
      if (normalized === 'DELETE') {
        return ModifyState.DELETE;
      }
      if (normalized === 'NONE') {
        return ModifyState.NONE;
      }
      const parsed = Number(normalized);
      if (!Number.isNaN(parsed)) {
        return this.readModifyState(parsed, deleted);
      }
    }

    return deleted ? ModifyState.DELETE : ModifyState.NONE;
  }

  private remapCategoryIdOnShoppingItems(fromKey: number, toKey: number): void {
    if (fromKey === toKey) {
      return;
    }
    this.shoppingItems.update(items =>
      items.map(i => (i.itemCategoryId === fromKey ? { ...i, itemCategoryId: toKey } : i))
    );
  }

  private remapAmountTypeIdOnShoppingItems(fromKey: number, toKey: number): void {
    if (fromKey === toKey) {
      return;
    }
    this.shoppingItems.update(items =>
      items.map(i => (i.itemAmountTypeId === fromKey ? { ...i, itemAmountTypeId: toKey } : i))
    );
  }

  private findAmountTypeIndex(list: AmountType[], dto: AmountTypeDto): number {
    const id = dto.amountTypeId;
    if (id !== 0) {
      return list.findIndex(x => x.amountTypeId === id);
    }
    return list.findIndex(x => (x.localId ?? 0) === dto.localId);
  }

  private findCategoryIndex(list: Category[], dto: CategoryDto): number {
    const id = dto.categoryId;
    if (id !== 0) {
      return list.findIndex(x => x.categoryId === id);
    }
    return list.findIndex(x => (x.localId ?? 0) === dto.localId);
  }

  private findShoppingItemIndex(list: ShoppingItem[], dto: ShoppingItemDto): number {
    if (dto.localId != null && dto.localId > 0) {
      const byLocal = list.findIndex(x => (x.localId ?? 0) === dto.localId);
      if (byLocal >= 0) {
        return byLocal;
      }
    }
    const id = dto.shoppingItemId;
    if (typeof id === 'number' && id > 0) {
      return list.findIndex(x => x.shoppingItemId === id);
    }
    return -1;
  }
}
