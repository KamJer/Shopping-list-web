import { AmountTypeDto } from './amount-type-dto.model';
import { CategoryDto } from './category-dto.model';
import { ShoppingItemDto } from './shopping-item-dto.model';

export interface AllDto {
  amountTypeDtoList: AmountTypeDto[];
  categoryDtoList: CategoryDto[];
  shoppingItemDtoList: ShoppingItemDto[];
  savedTime: string;
  dirty: boolean;
}
