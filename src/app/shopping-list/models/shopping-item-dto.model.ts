import { ModifyState } from '../enums/modify-state.enum';

export interface ShoppingItemDto {
  shoppingItemId?: number;
  itemAmountTypeId?: number;
  itemCategoryId?: number;
  itemName: string;
  amount?: number;
  bought: boolean;
  sendToBought?: boolean;
  deleted: boolean;
  savedTime?: Date;
  /** Odsłanie serwera / klient — dopasowanie przy put zanim jest shoppingItemId > 0. */
  localId?: number;
  modifyState: ModifyState;
}
