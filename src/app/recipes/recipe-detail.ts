import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { RecipeViewAdapter, RecipeIngredientRow } from './adapters/recipe-view.adapter';
import { RecipeDto } from './models/recipe-dto.model';
import { RecipesService } from './recipes.service';
import { NotificationService } from '../core/services/notification';
import { ShoppingListDataService } from '../shopping-list/services/shopping-list-data.service';
import { ShoppingItem } from '../shopping-list/models/shopping-item.model';

export type { RecipeIngredientRow };

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css'
})
export class RecipeDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipesService = inject(RecipesService);
  private readonly notify = inject(NotificationService);
  private readonly view = inject(RecipeViewAdapter);
  protected readonly data = inject(ShoppingListDataService);

  recipe: RecipeDto | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  private subscription = new Subscription();

  newItemDialogOpen = false;
  editingShoppingItem: ShoppingItem | null = null;
  newItemCategoryIndex = 0;
  newItemAmountTypeId: number | null = null;
  newItemName = '';
  newItemAmount: number | null = null;

  ngOnInit(): void {
    this.data.ensureConnected();
    this.subscription.add(
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (!id) {
          this.errorMessage = 'Brak identyfikatora przepisu.';
          this.isLoading = false;
          return;
        }
        this.loadRecipe(id);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadRecipe(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    const navigation = this.router.getCurrentNavigation();
    const stateRecipe = (navigation?.extras?.state?.['recipe'] as RecipeDto | undefined)
      ?? (history.state?.recipe as RecipeDto | undefined);

    if (stateRecipe) {
      this.recipe = this.view.unwrapRecipeObject(stateRecipe);
      this.isLoading = false;
      return;
    }

    this.recipesService.getById(id).subscribe({
      next: recipe => {
        this.recipe = this.view.unwrapRecipeObject(recipe);
        this.isLoading = false;
      },
      error: () => {
        this.notify.show('Nie udało się pobrać przepisu.', 'error');
        this.errorMessage = 'Nie udało się pobrać przepisu.';
        this.isLoading = false;
      }
    });
  }

  getRecipeName(recipe: RecipeDto): string {
    return this.view.getRecipeName(recipe);
  }

  getDescription(recipe: RecipeDto): string | null {
    return this.view.getDescription(recipe);
  }

  getSource(recipe: RecipeDto): string {
    return this.view.getSource(recipe);
  }

  getTags(recipe: RecipeDto): string[] {
    return this.view.getTags(recipe);
  }

  getIngredientRows(recipe: RecipeDto): RecipeIngredientRow[] {
    return this.view.getIngredientRows(recipe);
  }

  getSteps(recipe: RecipeDto): string[] {
    return this.view.getSteps(recipe);
  }

  openAddToShoppingList(ing: RecipeIngredientRow): void {
    this.editingShoppingItem = null;
    this.newItemName = ing.name;

    const parsed = parseFloat(String(ing.amount).replace(',', '.'));
    this.newItemAmount = Number.isFinite(parsed) ? parsed : null;

    const cats = this.data.categories();
    this.newItemCategoryIndex = cats.length > 0 ? 0 : 0;

    const at = this.data.amountTypes();
    const matchedUnit = at.find(
      a => a.typeName.toLowerCase() === ing.unit.trim().toLowerCase()
    );
    if (matchedUnit != null) {
      this.newItemAmountTypeId = this.data.getAmountTypeKey(matchedUnit);
    } else {
      if (ing.unit.trim().length > 0 && at.length > 0) {
        this.notify.show(
          `Nie znaleziono jednostki "${ing.unit}" — wybrano domyślną.`,
          'warn'
        );
      }
      this.newItemAmountTypeId = at.length > 0 ? this.data.getAmountTypeKey(at[0]) : null;
    }

    this.newItemDialogOpen = true;
    queueMicrotask(() => document.getElementById('recipe-item-name')?.focus());
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
    const merged = this.data.mergeOrAddShoppingItem({
      categoryIndex: this.newItemCategoryIndex,
      amountTypeId: this.newItemAmountTypeId,
      name: this.newItemName,
      amount: Number(this.newItemAmount)
    });
    if (merged) {
      this.notify.show(
        `Zwiększono ilość "${this.newItemName.trim()}" na liście zakupów.`,
        'success'
      );
    } else {
      this.notify.show(
        `Dodano "${this.newItemName.trim()}" do listy zakupów.`,
        'success'
      );
    }
    this.closeNewItemDialog();
  }

  goBack(): void {
    void this.router.navigate(['/recipes']);
  }
}
