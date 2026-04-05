import { Component, HostListener, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ShoppingListDataService } from './services/shopping-list-data.service';
import { Category } from './models/category.model';
import { ShoppingItem } from './models/shopping-item.model';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.css'
})
export class ShoppingList implements OnInit {
  protected readonly data = inject(ShoppingListDataService);

  newCategoryDialogOpen = false;
  newCategoryName = '';
  editingCategory: Category | null = null;

  categoryMenuOpenKey: number | null = null;
  private readonly collapsedCategoryKeys = new Set<number>();

  newItemDialogOpen = false;
  editingShoppingItem: ShoppingItem | null = null;
  newItemCategoryIndex = 0;
  newItemAmountTypeId: number | null = null;
  newItemName = '';
  newItemAmount: number | null = null;

  ngOnInit(): void {
    this.data.ensureConnected();
  }

  moveCategoryUp(index: number): void {
    this.data.moveCategoryUp(index);
  }

  moveCategoryDown(index: number): void {
    this.data.moveCategoryDown(index);
  }

  deleteShoppingItem(item: ShoppingItem): void {
    this.data.removeShoppingItem(item);
  }

  onBoughtToggle(item: ShoppingItem, bought: boolean): void {
    this.data.setShoppingItemBought(item, bought);
  }

  sendBoughtItemsToBoughtList(): void {
    this.data.sendBoughtItemsToBoughtList();
  }

  visibleItemsForCategory(category: Category): ShoppingItem[] {
    const items = this.data.itemsForCategory(category);
    return items.filter(i => !i.sendToBought);
  }

  readonly trackByCategory = (_index: number, c: Category): string =>
    this.data.trackCategory(_index, c);

  isCategoryMenuOpen(category: Category): boolean {
    return this.categoryMenuOpenKey === this.data.getCategoryKeyForItem(category);
  }

  isCategoryCollapsed(category: Category): boolean {
    return this.collapsedCategoryKeys.has(this.data.getCategoryKeyForItem(category));
  }

  toggleCategoryMenu(event: MouseEvent, category: Category): void {
    event.stopPropagation();
    const key = this.data.getCategoryKeyForItem(category);
    this.categoryMenuOpenKey = this.categoryMenuOpenKey === key ? null : key;
  }

  closeCategoryMenu(): void {
    this.categoryMenuOpenKey = null;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeCategoryMenu();
  }

  toggleCategoryCollapsedFromMenu(category: Category): void {
    const key = this.data.getCategoryKeyForItem(category);
    if (this.collapsedCategoryKeys.has(key)) {
      this.collapsedCategoryKeys.delete(key);
    } else {
      this.collapsedCategoryKeys.add(key);
    }
    this.closeCategoryMenu();
  }

  collapseCategoryMenuLabel(category: Category): string {
    return this.isCategoryCollapsed(category) ? 'Rozwiń kategorię' : 'Zwiń kategorię';
  }

  deleteCategory(category: Category): void {
    const key = this.data.getCategoryKeyForItem(category);
    this.data.deleteCategory(category);
    this.collapsedCategoryKeys.delete(key);
    this.closeCategoryMenu();
  }

  openEditCategoryDialog(category: Category): void {
    this.editingCategory = category;
    this.newCategoryName = category.categoryName;
    this.categoryMenuOpenKey = null;
    this.newCategoryDialogOpen = true;
    queueMicrotask(() => document.getElementById('new-cat-name')?.focus());
  }

  openNewCategoryDialog(): void {
    this.editingCategory = null;
    this.newCategoryName = '';
    this.newCategoryDialogOpen = true;
    queueMicrotask(() => document.getElementById('new-cat-name')?.focus());
  }

  closeNewCategoryDialog(): void {
    this.newCategoryDialogOpen = false;
    this.editingCategory = null;
    this.newCategoryName = '';
  }

  confirmNewCategory(): void {
    this.data.saveCategoryFromDialog(this.newCategoryName, this.editingCategory);
    this.closeNewCategoryDialog();
  }

  openNewItemDialog(category: Category): void {
    this.editingShoppingItem = null;
    const cats = this.data.categories();
    const idx = cats.findIndex(
      c =>
        c.categoryId === category.categoryId &&
        c.categoryName === category.categoryName &&
        (c.localId ?? null) === (category.localId ?? null)
    );
    this.newItemCategoryIndex = idx >= 0 ? idx : 0;
    const at = this.data.amountTypes();
    this.newItemAmountTypeId = at.length > 0 ? this.data.getAmountTypeKey(at[0]) : null;
    this.newItemName = '';
    this.newItemAmount = null;
    this.newItemDialogOpen = true;
    queueMicrotask(() => document.getElementById('new-item-name')?.focus());
  }

  openEditItemDialog(item: ShoppingItem): void {
    this.editingShoppingItem = item;
    const catKey = item.itemCategoryId;
    const cats = this.data.categories();
    const idx = catKey != null ? cats.findIndex(c => this.data.getCategoryKeyForItem(c) === catKey) : -1;
    this.newItemCategoryIndex = idx >= 0 ? idx : 0;
    const at = this.data.amountTypes();
    this.newItemAmountTypeId =
      item.itemAmountTypeId ?? (at[0] != null ? this.data.getAmountTypeKey(at[0]) : null);
    this.newItemName = item.itemName;
    this.newItemAmount = item.amount ?? null;
    this.newItemDialogOpen = true;
    queueMicrotask(() => document.getElementById('new-item-name')?.focus());
  }

  closeNewItemDialog(): void {
    this.newItemDialogOpen = false;
    this.editingShoppingItem = null;
    this.newItemName = '';
    this.newItemAmount = null;
  }

  canConfirmNewItem(): boolean {
    const cats = this.data.categories();
    const atList = this.data.amountTypes();
    return (
      cats.length > 0 &&
      this.newItemCategoryIndex >= 0 &&
      this.newItemCategoryIndex < cats.length &&
      this.newItemAmountTypeId != null &&
      atList.some(a => this.data.getAmountTypeKey(a) === this.newItemAmountTypeId) &&
      this.newItemName.trim().length > 0 &&
      this.newItemAmount != null &&
      !Number.isNaN(Number(this.newItemAmount))
    );
  }

  confirmNewItem(): void {
    if (!this.canConfirmNewItem() || this.newItemAmountTypeId == null) {
      return;
    }
    this.data.confirmNewOrEditedItem({
      categoryIndex: this.newItemCategoryIndex,
      amountTypeId: this.newItemAmountTypeId,
      name: this.newItemName,
      amount: Number(this.newItemAmount),
      existing: this.editingShoppingItem
    });
    this.closeNewItemDialog();
  }
}
