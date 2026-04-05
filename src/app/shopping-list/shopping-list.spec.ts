import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShoppingList } from './shopping-list';
import { ShoppingListDataService } from './services/shopping-list-data.service';

describe('ShoppingList', () => {
  let component: ShoppingList;
  let fixture: ComponentFixture<ShoppingList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingList],
      providers: [
        {
          provide: ShoppingListDataService,
          useValue: {
            ensureConnected: () => {},
            categories: signal([]),
            shoppingItems: signal([]),
            amountTypes: signal([]),
            itemsForCategory: () => [],
            getCategoryKeyForItem: () => 0,
            trackCategory: () => 'k',
            moveCategoryUp: () => {},
            moveCategoryDown: () => {},
            removeShoppingItem: () => {},
            deleteCategory: () => {},
            saveCategoryFromDialog: () => {},
            confirmNewOrEditedItem: () => {},
            getAmountTypeKey: (a: { amountTypeId: number; localId?: number }) =>
              a.amountTypeId !== 0 ? a.amountTypeId : (a.localId ?? 0)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShoppingList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
