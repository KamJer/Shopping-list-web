import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShoppingListDataService } from '../shopping-list/services/shopping-list-data.service';
import { AmountType } from '../shopping-list/models/amount-type.model';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './units.html',
  styleUrl: './units.css',
})
export class Units implements OnInit {
  protected readonly data = inject(ShoppingListDataService);

  unitDialogOpen = false;
  unitName = '';
  editingUnit: AmountType | null = null;

  ngOnInit(): void {
    this.data.ensureConnected();
  }

  readonly trackByAmountType = (_index: number, a: AmountType): string =>
    `${a.localId ?? ''}-${a.amountTypeId}-${a.typeName}`;

  openNewUnitDialog(): void {
    this.editingUnit = null;
    this.unitName = '';
    this.unitDialogOpen = true;
    queueMicrotask(() => document.getElementById('unit-name-input')?.focus());
  }

  openEditUnitDialog(unit: AmountType): void {
    this.editingUnit = unit;
    this.unitName = unit.typeName;
    this.unitDialogOpen = true;
    queueMicrotask(() => document.getElementById('unit-name-input')?.focus());
  }

  closeUnitDialog(): void {
    this.unitDialogOpen = false;
    this.editingUnit = null;
    this.unitName = '';
  }

  confirmUnitDialog(): void {
    this.data.saveAmountTypeFromDialog(this.unitName, this.editingUnit);
    this.closeUnitDialog();
  }

  deleteUnit(unit: AmountType): void {
    this.data.deleteAmountType(unit);
  }
}
