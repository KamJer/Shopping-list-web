import { describe, it, expect } from 'vitest';
import { canConfirmNewItem } from './confirm-utils';
import { Category } from '../models/category.model';
import { AmountType } from '../models/amount-type.model';

describe('canConfirmNewItem', () => {
  const categories: Category[] = [
    { categoryId: 1, categoryName: 'Warzywa', deleted: false, savedTime: null },
    { categoryId: 2, categoryName: 'Owoce', deleted: false, savedTime: null }
  ];

  const amountTypes: AmountType[] = [
    { amountTypeId: 1, typeName: 'szt', deleted: false, savedTime: null },
    { amountTypeId: 2, typeName: 'kg', deleted: false, savedTime: null }
  ];

  it('should return true for valid input', () => {
    expect(canConfirmNewItem(categories, amountTypes, 0, 1, 'Pomidor', '2')).toBe(true);
    expect(canConfirmNewItem(categories, amountTypes, 1, 2, 'Jabłko', '1.5')).toBe(true);
    expect(canConfirmNewItem(categories, amountTypes, 0, null, 'Pomidor', '2')).toBe(false);
    expect(canConfirmNewItem(categories, amountTypes, -1, 1, 'Pomidor', '2')).toBe(false);
    expect(canConfirmNewItem(categories, amountTypes, 5, 1, 'Pomidor', '2')).toBe(false);
    expect(canConfirmNewItem(categories, amountTypes, 0, 1, '', '2')).toBe(false);
    expect(canConfirmNewItem(categories, amountTypes, 0, 1, '  ', '2')).toBe(false);
    expect(canConfirmNewItem(categories, amountTypes, 0, 1, 'Pomidor', null)).toBe(false);
    expect(canConfirmNewItem(categories, amountTypes, 0, 1, 'Pomidor', 'abc')).toBe(false);
  });

  it('should return false for empty categories', () => {
    expect(canConfirmNewItem([], amountTypes, 0, 1, 'Pomidor', '2')).toBe(false);
  });

  it('should return false for empty amount types', () => {
    expect(canConfirmNewItem(categories, [], 0, 1, 'Pomidor', '2')).toBe(false);
  });
});
