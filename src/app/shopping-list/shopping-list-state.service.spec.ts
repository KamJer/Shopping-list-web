import { ShoppingListStateService } from './services/shopping-list-state.service';
import { ModifyState } from './enums/modify-state.enum';
import { ShoppingItemDto } from './models/shopping-item-dto.model';
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
      localId: 123,
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
      localId: 123,
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
          localId: 777,
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
          localId: 777,
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
    expect(items[0].localId).toBe(777);
  });
});
