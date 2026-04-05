export interface ShoppingItem {
  shoppingItemId?: number;
  itemAmountTypeId?: number;
  itemCategoryId?: number;
  itemName: string;
  amount?: number;
  bought: boolean;
  sendToBought: boolean;
  deleted: boolean;
  savedTime?: Date | null;
  /** Klient — przy nowym rekordzie przed id z serwera (put). */
  localId?: number;
}
