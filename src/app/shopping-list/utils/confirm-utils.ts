import { AmountType } from '../models/amount-type.model';
import { Category } from '../models/category.model';

export function canConfirmNewItem(
  categories: Category[],
  amountTypes: AmountType[],
  categoryIndex: number,
  amountTypeId: number | null,
  name: string,
  amount: string | number | null
): boolean {
  return (
    categories.length > 0 &&
    categoryIndex >= 0 &&
    categoryIndex < categories.length &&
    amountTypeId != null &&
    amountTypes.some(a => a.amountTypeId === amountTypeId) &&
    name.trim().length > 0 &&
    amount != null &&
    !Number.isNaN(Number(amount))
  );
}
