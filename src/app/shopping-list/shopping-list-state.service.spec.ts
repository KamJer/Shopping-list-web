import { ShoppingListStateService } from './services/shopping-list-state.service';
import { ModifyState } from './enums/modify-state.enum';
import { ShoppingItemDto } from './models/shopping-item-dto.model';
import { CategoryDto } from './models/category-dto.model';
import { AmountTypeDto } from './models/amount-type-dto.model';
import { AllDto } from './models/all-dto.model';

describe('ShoppingListStateService', () => {
  let service: ShoppingListStateService;

  beforeEach(() => {
    service = new ShoppingListStateService();
  });

  it('updates existing item by localId on CRUD topic without creating duplicates', () => {
    const initialDto: ShoppingItemDto = {
      shoppingItemId: 0,
      itemAmountTypeId: 1,
      itemCategoryId: 1,
      itemName: 'Mleko',
      amount: 1,
      bought: true,
      sendToBought: true,
      deleted: false,
      localId: -1,
      modifyState: ModifyState.INSERT
    };

    service.applyShoppingItemCrudTopic('put', initialDto);

    const updatedDto: ShoppingItemDto = {
      shoppingItemId: 10,
      itemAmountTypeId: 1,
      itemCategoryId: 1,
      itemName: 'Mleko',
      amount: 1,
      bought: false,
      sendToBought: false,
      deleted: false,
      localId: -1,
      modifyState: ModifyState.UPDATE
    };

    service.applyShoppingItemCrudTopic('post', updatedDto);

    const items = service.shoppingItems();
    expect(items.length).toBe(1);
    expect(items[0].shoppingItemId).toBe(10);
    expect(items[0].bought).toBeFalsy();
    expect(items[0].sendToBought).toBeFalsy();
  });

  it('merges synchronize payload item by localId instead of appending duplicate', () => {
    const firstSync: AllDto = {
      amountTypeDtoList: [],
      categoryDtoList: [],
      shoppingItemDtoList: [
        {
          shoppingItemId: 0,
          itemAmountTypeId: 1,
          itemCategoryId: 1,
          itemName: 'Chleb',
          amount: 1,
          bought: false,
          sendToBought: false,
          deleted: false,
          localId: -1,
          modifyState: ModifyState.INSERT
        }
      ],
      savedTime: '1',
      dirty: false
    };

    const secondSync: AllDto = {
      amountTypeDtoList: [],
      categoryDtoList: [],
      shoppingItemDtoList: [
        {
          shoppingItemId: 0,
          itemAmountTypeId: 1,
          itemCategoryId: 1,
          itemName: 'Chleb',
          amount: 2,
          bought: false,
          sendToBought: false,
          deleted: false,
          localId: -1,
          modifyState: ModifyState.UPDATE
        }
      ],
      savedTime: '2',
      dirty: false
    };

    service.applySynchronizePayload(firstSync);
    service.applySynchronizePayload(secondSync);

    const items = service.shoppingItems();
    expect(items.length).toBe(1);
    expect(items[0].amount).toBe(2);
    expect(items[0].localId).toBe(-1);
  });

  it('remaps fresh category and its items on CRUD put response from server', () => {
    service.applyCategoryCrudTopic('put', {
      categoryId: 0,
      categoryName: 'Warzywa',
      deleted: false,
      localId: -1,
      savedTime: new Date(),
      modifyState: ModifyState.INSERT
    });

    const itemDto: ShoppingItemDto = {
      shoppingItemId: 0,
      itemAmountTypeId: 1,
      itemCategoryId: -1,
      itemName: 'Marchew',
      amount: 1,
      bought: false,
      sendToBought: false,
      deleted: false,
      localId: -2,
      modifyState: ModifyState.INSERT
    };
    service.applyShoppingItemCrudTopic('put', itemDto);

    service.applyCategoryCrudTopic('put', {
      categoryId: 5,
      categoryName: 'Warzywa',
      deleted: false,
      localId: -1,
      savedTime: new Date(),
      modifyState: ModifyState.UPDATE
    });

    const cats = service.categories();
    expect(cats.length).toBe(1);
    expect(cats[0].categoryId).toBe(5);
    expect(cats[0].localId).toBe(-1);
    const items = service.shoppingItems();
    expect(items.length).toBe(1);
    expect(items[0].itemCategoryId).toBe(5);
  });

  it('merges fresh category by localId on synchronize payload instead of duplicating', () => {
    const firstSync: AllDto = {
      amountTypeDtoList: [],
      categoryDtoList: [
        {
          categoryId: 0,
          categoryName: 'Warzywa',
          deleted: false,
          localId: -1,
          savedTime: new Date(),
          modifyState: ModifyState.INSERT
        }
      ],
      shoppingItemDtoList: [
        {
          shoppingItemId: 0,
          itemAmountTypeId: 1,
          itemCategoryId: -1,
          itemName: 'Marchew',
          amount: 1,
          bought: false,
          sendToBought: false,
          deleted: false,
          localId: -2,
          modifyState: ModifyState.INSERT
        }
      ],
      savedTime: '1',
      dirty: false
    };
    service.applySynchronizePayload(firstSync);

    const secondSync: AllDto = {
      amountTypeDtoList: [],
      categoryDtoList: [
        {
          categoryId: 5,
          categoryName: 'Warzywa',
          deleted: false,
          localId: -1,
          savedTime: new Date(),
          modifyState: ModifyState.NONE
        }
      ],
      shoppingItemDtoList: [],
      savedTime: '2',
      dirty: false
    };
    service.applySynchronizePayload(secondSync);

    const cats = service.categories();
    expect(cats.length).toBe(1);
    expect(cats[0].categoryId).toBe(5);
    const items = service.shoppingItems();
    expect(items.length).toBe(1);
    expect(items[0].itemCategoryId).toBe(5);
  });

  it('remaps fresh amount type and its items on CRUD put response from server', () => {
    service.applyAmountTypeCrudTopic('put', {
      amountTypeId: 0,
      typeName: 'kg',
      deleted: false,
      localId: -1,
      savedTime: new Date(),
      modifyState: ModifyState.INSERT
    });

    const itemDto: ShoppingItemDto = {
      shoppingItemId: 0,
      itemAmountTypeId: -1,
      itemCategoryId: 1,
      itemName: 'Mąka',
      amount: 2,
      bought: false,
      sendToBought: false,
      deleted: false,
      localId: -2,
      modifyState: ModifyState.INSERT
    };
    service.applyShoppingItemCrudTopic('put', itemDto);

    service.applyAmountTypeCrudTopic('put', {
      amountTypeId: 7,
      typeName: 'kg',
      deleted: false,
      localId: -1,
      savedTime: new Date(),
      modifyState: ModifyState.UPDATE
    });

    const units = service.amountTypes();
    expect(units.length).toBe(1);
    expect(units[0].amountTypeId).toBe(7);
    const items = service.shoppingItems();
    expect(items.length).toBe(1);
    expect(items[0].itemAmountTypeId).toBe(7);
  });
});
