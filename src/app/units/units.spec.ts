import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Units } from './units';
import { ShoppingListDataService } from '../shopping-list/services/shopping-list-data.service';

describe('Units', () => {
  let component: Units;
  let fixture: ComponentFixture<Units>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Units],
      providers: [
        {
          provide: ShoppingListDataService,
          useValue: {
            ensureConnected: () => {},
            amountTypes: signal([]),
            saveAmountTypeFromDialog: () => {},
            deleteAmountType: () => {},
            getAmountTypeKey: () => 0
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Units);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
