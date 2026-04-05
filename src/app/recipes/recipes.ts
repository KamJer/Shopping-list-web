import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { RecipeViewAdapter } from './adapters/recipe-view.adapter';
import { RecipeDto } from './models/recipe-dto.model';
import { RecipesService } from './recipes.service';
import { RecipeRequestDto } from './models/recipe-request-dto.model';
import { TagDto } from './models/tag-dto.model';
import { PageResult } from './models/page-result.model';
import { RecipeFormService } from './services/recipe-form.service';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css'
})
export class Recipes implements OnInit {
  private readonly recipesService = inject(RecipesService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly view = inject(RecipeViewAdapter);
  private readonly form = inject(RecipeFormService);

  recipes: RecipeDto[] = [];
  totalPages = 0;
  totalElements = 0;
  page = 0;
  pageSize = 10;
  isLoading = false;
  initialLoadDone = false;
  private initialLoadRetries = 0;

  mode: 'all' | 'name' | 'products' | 'tags' | 'mine' = 'all';
  nameQuery = '';
  productsText = '';
  maxMissing = 0;
  tagsText = '';

  recipeFormEditSource: RecipeDto | null = null;
  showRecipeFormModal = false;
  newTitle = '';
  newDescription = '';
  createTagRows: { id: number; value: string }[] = [];
  createIngredientRows: { id: number; productName: string; amount: string; unitType: string }[] = [];
  createStepRows: { id: number; stepNumber: string; value: string }[] = [];
  recipeIsPublic = false;
  isFormSaving = false;
  private nextCreateRowId = 1;

  ngOnInit(): void {
    Promise.resolve().then(() => this.load(true));
  }

  getRecipeName(recipe: RecipeDto): string {
    return this.view.getRecipeName(recipe);
  }

  getRecipeId(recipe: RecipeDto): string {
    return this.view.getRecipeIdForList(recipe);
  }

  getDescriptionSnippet(recipe: RecipeDto, maxLen = 140): string {
    return this.view.getDescriptionSnippet(recipe, maxLen);
  }

  showUserRecipes(): void {
    this.mode = 'mine';
    this.page = 0;
    this.load();
  }

  openCreateRecipe(): void {
    this.recipeFormEditSource = null;
    this.resetCreateForm();
    this.showRecipeFormModal = true;
    this.cdr.markForCheck();
  }

  closeRecipeForm(): void {
    if (this.isFormSaving) {
      return;
    }
    this.showRecipeFormModal = false;
    this.recipeFormEditSource = null;
    this.resetCreateForm();
  }

  private resetCreateForm(): void {
    this.newTitle = '';
    this.newDescription = '';
    this.createTagRows = [];
    this.createIngredientRows = [];
    this.createStepRows = [];
    this.recipeIsPublic = false;
    this.nextCreateRowId = 1;
  }

  addTagField(): void {
    this.createTagRows.push({ id: this.nextCreateRowId++, value: '' });
  }

  removeTagField(index: number): void {
    this.createTagRows.splice(index, 1);
  }

  addIngredientField(): void {
    this.createIngredientRows.push({
      id: this.nextCreateRowId++,
      productName: '',
      amount: '',
      unitType: ''
    });
  }

  removeIngredientField(index: number): void {
    this.createIngredientRows.splice(index, 1);
  }

  addStepField(): void {
    const n = this.createStepRows.length + 1;
    this.createStepRows.push({ id: this.nextCreateRowId++, stepNumber: String(n), value: '' });
  }

  removeStepField(index: number): void {
    this.createStepRows.splice(index, 1);
  }

  trackCreateRowId(_index: number, row: { id: number }): number {
    return row.id;
  }

  submitRecipeForm(): void {
    const title = this.newTitle.trim();
    if (!title) {
      window.alert('Podaj tytuł przepisu.');
      return;
    }
    if (this.isFormSaving) {
      return;
    }
    this.isFormSaving = true;
    const payload = this.form.buildPayload({
      title: this.newTitle,
      description: this.newDescription,
      isPublic: this.recipeIsPublic,
      editSource: this.recipeFormEditSource,
      tagRows: this.createTagRows,
      ingredientRows: this.createIngredientRows,
      stepRows: this.createStepRows
    });

    this.recipesService.saveRecipe(payload).subscribe({
      next: () => {
        this.isFormSaving = false;
        this.closeRecipeForm();
        this.load();
      },
      error: err => {
        console.error('Zapis przepisu:', err);
        this.isFormSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  openEdit(recipe: RecipeDto, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.resetCreateForm();
    this.recipeFormEditSource = recipe;
    const populated = this.form.populateFromRecipe(recipe, this.nextCreateRowId);
    this.newTitle = populated.title;
    this.newDescription = populated.description;
    this.recipeIsPublic = populated.recipeIsPublic;
    this.createTagRows = populated.createTagRows;
    this.createIngredientRows = populated.createIngredientRows;
    this.createStepRows = populated.createStepRows;
    this.nextCreateRowId = populated.nextRowId;
    this.showRecipeFormModal = true;
    this.cdr.markForCheck();
  }

  confirmDelete(recipe: RecipeDto, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const id = this.view.getRecipeIdForApi(recipe);
    if (id == null) {
      return;
    }
    if (!window.confirm('Czy na pewno usunąć ten przepis?')) {
      return;
    }
    this.recipesService.deleteRecipe(id).subscribe({
      next: () => this.load(),
      error: err => console.error('Usuwanie przepisu:', err)
    });
  }

  load(isInitial = false): void {
    const pageable = { page: this.page, size: this.pageSize };
    this.isLoading = true;
    this.recipes = [];

    const handleError = (err: unknown): void => {
      console.error('Recipes load error:', err);
      this.isLoading = false;
      if (isInitial && this.initialLoadRetries < 2) {
        this.initialLoadRetries += 1;
        setTimeout(() => this.load(true), 300);
        return;
      }
      this.initialLoadDone = true;
    };

    const handleNext = (p: PageResult<RecipeDto>): void => {
      this.applyPage(p);
      this.isLoading = false;
      this.initialLoadDone = true;
    };

    if (this.mode === 'mine') {
      this.recipesService.getRecipesForUser(pageable).subscribe({ next: handleNext, error: handleError });
      return;
    }

    if (this.mode === 'all') {
      this.recipesService.getAll(pageable).subscribe({ next: handleNext, error: handleError });
      return;
    }

    if (this.mode === 'name') {
      this.recipesService.getByName(this.nameQuery, pageable).subscribe({ next: handleNext, error: handleError });
      return;
    }

    if (this.mode === 'products') {
      const products = this.parseCommaSeparated(this.productsText);
      if (products.length === 0) {
        this.recipesService.getAll(pageable).subscribe({ next: handleNext, error: handleError });
        return;
      }
      const body: RecipeRequestDto = {
        products,
        maxMissing: Number(this.maxMissing) || 0
      };
      this.recipesService.getByRequiredProducts(body, pageable).subscribe({ next: handleNext, error: handleError });
      return;
    }

    const tagNames = this.parseCommaSeparated(this.tagsText);
    if (tagNames.length === 0) {
      this.recipesService.getAll(pageable).subscribe({ next: handleNext, error: handleError });
      return;
    }
    const tags: TagDto[] = tagNames.map(t => ({ name: t }));
    this.recipesService.getByTags(tags, pageable).subscribe({ next: handleNext, error: handleError });
  }

  private applyPage(p: PageResult<RecipeDto>): void {
    this.recipes = Array.isArray(p?.content) ? p.content : [];
    this.totalPages = Number(p?.totalPages ?? 0);
    this.totalElements = Number(p?.totalElements ?? this.recipes.length);
    this.initialLoadRetries = 0;
    this.cdr.markForCheck();
  }

  prevPage(): void {
    if (this.page <= 0) {
      return;
    }
    this.page -= 1;
    this.load();
  }

  nextPage(): void {
    if (this.totalPages <= 0) {
      return;
    }
    if (this.page >= this.totalPages - 1) {
      return;
    }
    this.page += 1;
    this.load();
  }

  setMode(next: Exclude<typeof this.mode, 'mine'>): void {
    this.mode = next;
    this.page = 0;
    this.load();
  }

  private parseCommaSeparated(text: string): string[] {
    return text
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
}
