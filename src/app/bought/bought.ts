import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ShoppingListDataService } from '../shopping-list/services/shopping-list-data.service';
import { Category } from '../shopping-list/models/category.model';
import { ShoppingItem } from '../shopping-list/models/shopping-item.model';

@Component({
  selector: 'app-bought',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bought.html',
  styleUrl: './bought.css'
})
export class Bought implements OnInit {
  protected readonly data = inject(ShoppingListDataService);

  ngOnInit(): void {
    this.data.ensureConnected();
  }

  readonly trackByCategory = (_index: number, c: Category): string =>
    this.data.trackCategory(_index, c);

  visibleBoughtItemsForCategory(category: Category): ShoppingItem[] {
    return this.data.itemsForCategory(category).filter(i => i.bought && i.sendToBought);
  }

  onBoughtToggle(item: ShoppingItem, bought: boolean): void {
    this.data.setShoppingItemBought(item, bought);
  }

  deleteBoughtItem(item: ShoppingItem): void {
    this.data.removeShoppingItem(item);
  }
}

