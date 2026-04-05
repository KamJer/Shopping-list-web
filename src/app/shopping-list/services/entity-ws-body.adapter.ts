import { ModifyState } from '../enums/modify-state.enum';
import { AmountTypeDto } from '../models/amount-type-dto.model';
import { CategoryDto } from '../models/category-dto.model';
import { ShoppingItemDto } from '../models/shopping-item-dto.model';

function readNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function readModifyStateRaw(raw: Record<string, unknown>): ModifyState {
  const v = raw['modifyState'];
  if (
    typeof v === 'number' &&
    (v === ModifyState.INSERT ||
      v === ModifyState.UPDATE ||
      v === ModifyState.DELETE ||
      v === ModifyState.NONE)
  ) {
    return v;
  }
  if (typeof v === 'string') {
    const u = v.trim().toUpperCase();
    if (u === 'INSERT') {
      return ModifyState.INSERT;
    }
    if (u === 'UPDATE') {
      return ModifyState.UPDATE;
    }
    if (u === 'DELETE') {
      return ModifyState.DELETE;
    }
    if (u === 'NONE') {
      return ModifyState.NONE;
    }
  }
  return ModifyState.NONE;
}

/** Pojedynczy AmountTypeDto z BODY wiadomości WebSocket (tematy put/post/deleteAmountType). */
export function parseAmountTypeDtoFromWsBody(body: string): AmountTypeDto {
  const raw = JSON.parse(body) as Record<string, unknown>;
  return {
    amountTypeId: readNum(raw['amountTypeId']),
    typeName: String(raw['typeName'] ?? ''),
    deleted: Boolean(raw['deleted']),
    localId: readNum(raw['localId']),
    savedTime: (raw['savedTime'] as Date) ?? new Date(),
    modifyState: readModifyStateRaw(raw)
  };
}

/** Pojedynczy CategoryDto z BODY (tematy put/post/deleteCategory). */
export function parseCategoryDtoFromWsBody(body: string): CategoryDto {
  const raw = JSON.parse(body) as Record<string, unknown>;
  return {
    categoryId: readNum(raw['categoryId']),
    categoryName: String(raw['categoryName'] ?? raw['name'] ?? ''),
    deleted: Boolean(raw['deleted']),
    localId: readNum(raw['localId']),
    savedTime: (raw['savedTime'] as Date) ?? new Date(),
    modifyState: readModifyStateRaw(raw)
  };
}

/** Pojedynczy ShoppingItemDto z BODY (tematy put/post/deleteShoppingItem). */
export function parseShoppingItemDtoFromWsBody(body: string): ShoppingItemDto {
  const raw = JSON.parse(body) as Record<string, unknown>;
  return {
    shoppingItemId: readNum(raw['shoppingItemId']),
    itemAmountTypeId: readNum(raw['itemAmountTypeId'] ?? raw['amountTypeId']),
    itemCategoryId: readNum(raw['itemCategoryId'] ?? raw['categoryId']),
    itemName: String(raw['itemName'] ?? raw['name'] ?? ''),
    amount: (() => {
      const a = readNum(raw['amount'], NaN);
      return Number.isNaN(a) ? undefined : a;
    })(),
    bought: Boolean(raw['bought']),
    sendToBought: Boolean(raw['sendToBought']),
    deleted: Boolean(raw['deleted']),
    savedTime: raw['savedTime'] as Date | undefined,
    localId: raw['localId'] != null ? readNum(raw['localId']) : undefined,
    modifyState: readModifyStateRaw(raw)
  };
}
