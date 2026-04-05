import { AmountTypeDto } from '../models/amount-type-dto.model';
import { AmountType } from '../models/amount-type.model';
import { CategoryDto } from '../models/category-dto.model';
import { Category } from '../models/category.model';
import { ShoppingItemDto } from '../models/shopping-item-dto.model';
import { ShoppingItem } from '../models/shopping-item.model';
import { ModifyState } from '../enums/modify-state.enum';

export class MapUtil {
  static AmountTypeDtoToModel(dto: AmountTypeDto): AmountType {
    const d = dto as AmountTypeDto & Record<string, unknown>;
    return {
      amountTypeId: dto.amountTypeId,
      typeName: dto.typeName,
      deleted: dto.deleted,
      savedTime: dto.savedTime,
      localId: (d.localId as number | undefined) ?? undefined
    };
  }

  static CategoryDtoToModel(dto: CategoryDto): Category {
    const d = dto as CategoryDto & Record<string, unknown>;
    const categoryId = Number(d.categoryId ?? 0);
    const loc = d.localId != null ? Number(d.localId) : undefined;
    const name = (d.categoryName ?? d['name'] ?? d['category_name'] ?? '') as string;
    return {
      categoryId: Number.isFinite(categoryId) ? categoryId : 0,
      categoryName: String(name),
      deleted: Boolean(d.deleted),
      savedTime: (d.savedTime as Date) ?? null,
      localId: loc !== undefined && Number.isFinite(loc) && loc !== 0 ? loc : undefined
    };
  }

  static ShoppingItemDtoToModel(dto: ShoppingItemDto): ShoppingItem {
    const d = dto as ShoppingItemDto & Record<string, unknown>;
    return {
      shoppingItemId: d.shoppingItemId,
      itemAmountTypeId: (d.itemAmountTypeId ?? d['amountTypeId']) as number | undefined,
      itemCategoryId: (d.itemCategoryId ?? d['categoryId']) as number | undefined,
      itemName: String(d.itemName ?? d['name'] ?? ''),
      amount: d.amount as number | undefined,
      bought: Boolean(d.bought),
      sendToBought: Boolean(d.sendToBought),
      deleted: Boolean(d.deleted),
      savedTime: d.savedTime as Date | null | undefined
    };
  }

  /** Full payload for server validation / merge (round-trip from current UI models). */
  static AmountTypeModelToDto(model: AmountType): AmountTypeDto {
    const saved = model.savedTime ?? new Date();
    const localId = model.localId ?? model.amountTypeId;
    return {
      amountTypeId: model.amountTypeId,
      typeName: model.typeName,
      deleted: model.deleted,
      modifyState: ModifyState.NONE,
      localId,
      savedTime: saved
    };
  }

  static CategoryModelToDto(model: Category): CategoryDto {
    const saved = model.savedTime ?? new Date();
    const localId = model.localId ?? model.categoryId;
    return {
      categoryId: model.categoryId,
      categoryName: model.categoryName,
      deleted: model.deleted,
      modifyState: ModifyState.NONE,
      localId,
      savedTime: saved
    };
  }

  static ShoppingItemModelToDto(model: ShoppingItem): ShoppingItemDto {
    return {
      shoppingItemId: model.shoppingItemId,
      itemAmountTypeId: model.itemAmountTypeId,
      itemCategoryId: model.itemCategoryId,
      itemName: model.itemName,
      amount: model.amount,
      bought: model.bought,
      sendToBought: model.sendToBought,
      deleted: model.deleted,
      savedTime: model.savedTime ?? undefined,
      localId: model.localId,
      modifyState: ModifyState.NONE
    };
  }
}
