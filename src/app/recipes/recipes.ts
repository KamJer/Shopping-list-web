import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, ElementRef, HostListener, inject, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { RecipeViewAdapter } from './adapters/recipe-view.adapter';
import { RecipeDto } from './models/recipe-dto.model';
import { RecipesService } from './recipes.service';
import { PageResult } from './models/page-result.model';
import { RecipeFormService } from './services/recipe-form.service';
import { TagsService } from './services/tags.service';
import { NotificationService } from '../core/services/notification';
import { TokenService } from '../core/services/token.service';

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
  private readonly tagsService = inject(TagsService);
  private readonly notify = inject(NotificationService);
  private readonly tokenService = inject(TokenService);

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
  tagsText = '';

  allTags: string[] = [];
  private tagsLoaded = false;

  recipeFormEditSource: RecipeDto | null = null;
  showRecipeFormModal = false;
  newTitle = '';
  newDescription = '';
  newSource = '';
  createTagRows: { id: number; value: string; suggestions: string[]; showSuggestions: boolean; highlightIndex: number }[] = [];
  createIngredientRows: { id: number; productName: string; amount: string; unitType: string }[] = [];
  createStepRows: { id: number; stepNumber: string; value: string }[] = [];
  recipeIsPublic = false;
  isFormSaving = false;
  recipeFormError: string | null = null;
  private nextCreateRowId = 1;

  @ViewChildren('tagInput') tagInputs!: QueryList<ElementRef<HTMLInputElement>>;

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
    this.loadTags();
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

  @HostListener('document:keydown', ['$event'])
  onFormKeydown(ev: KeyboardEvent): void {
    if (!this.showRecipeFormModal) {
      return;
    }
    if (ev.key === 'Escape') {
      ev.preventDefault();
      this.closeRecipeForm();
    }
  }

  private resetCreateForm(): void {
    this.newTitle = '';
    this.newDescription = '';
    this.newSource = '';
    this.createTagRows = [];
    this.createIngredientRows = [];
    this.createStepRows = [];
    this.recipeIsPublic = false;
    this.recipeFormError = null;
    this.nextCreateRowId = 1;
  }

  addTagField(): void {
    this.createTagRows.push({ id: this.nextCreateRowId++, value: '', suggestions: [], showSuggestions: false, highlightIndex: -1 });
    setTimeout(() => {
      const inputs = this.tagInputs?.toArray();
      if (inputs && inputs.length > 0) {
        inputs[inputs.length - 1].nativeElement.focus();
      }
    });
  }

  removeTagField(index: number): void {
    this.createTagRows.splice(index, 1);
  }

  private loadTags(): void {
    if (this.tagsLoaded) {
      return;
    }
    this.tagsService.getAll().subscribe({
      next: tags => {
        this.allTags = tags;
        this.tagsLoaded = true;
        for (const row of this.createTagRows) {
          if (!row.value?.trim()) {
            this.onTagInput(row, '', true);
          }
        }
      },
      error: err => {
        console.warn('Nie udało się pobrać listy tagów (autocomplete wyłączony):', err);
        this.allTags = [];
      }
    });
  }

  onTagInput(row: { value: string; suggestions: string[]; showSuggestions: boolean; highlightIndex: number }, value: string, force = false): void {
    const query = (value || '').toLowerCase().trim();
    const selectedElsewhere = new Set(
      this.createTagRows
        .filter(r => r !== row)
        .map(r => r.value.trim().toLowerCase())
        .filter(Boolean)
    );
    if (!query && !force) {
      row.suggestions = [];
      row.showSuggestions = false;
      row.highlightIndex = -1;
      return;
    }
    row.suggestions = this.allTags.filter(t => {
      const name = t.toLowerCase();
      if (query && !name.includes(query)) {
        return false;
      }
      if (selectedElsewhere.has(name)) {
        return false;
      }
      return true;
    });
    row.showSuggestions = row.suggestions.length > 0;
    row.highlightIndex = row.suggestions.length > 0 ? 0 : -1;
  }

  onTagFocus(row: { value: string; suggestions: string[]; showSuggestions: boolean; highlightIndex: number }): void {
    this.onTagInput(row, row.value, true);
  }

  onTagBlur(row: { showSuggestions: boolean }): void {
    setTimeout(() => { row.showSuggestions = false; }, 150);
  }

  onTagKeydown(
    ev: KeyboardEvent,
    row: { value: string; suggestions: string[]; showSuggestions: boolean; highlightIndex: number }
  ): void {
    if (!row.showSuggestions || row.suggestions.length === 0) {
      if (ev.key === 'ArrowDown' || ev.key === 'Enter') {
        this.onTagInput(row, row.value);
      }
      return;
    }
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      row.highlightIndex = (row.highlightIndex + 1) % row.suggestions.length;
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      row.highlightIndex = row.highlightIndex <= 0 ? row.suggestions.length - 1 : row.highlightIndex - 1;
    } else if (ev.key === 'Enter') {
      if (row.highlightIndex >= 0 && row.highlightIndex < row.suggestions.length) {
        ev.preventDefault();
        this.selectSuggestion(row, row.suggestions[row.highlightIndex]);
      }
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      row.showSuggestions = false;
      row.highlightIndex = -1;
    }
  }

  setTagHighlight(
    row: { highlightIndex: number; suggestions: string[] },
    index: number
  ): void {
    row.highlightIndex = index;
  }

  selectSuggestion(    row: { value: string; suggestions: string[]; showSuggestions: boolean; highlightIndex: number }, tag: string): void {
    row.value = tag;
    row.suggestions = [];
    row.showSuggestions = false;
    row.highlightIndex = -1;
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
      this.notify.show('Podaj tytuł przepisu.', 'warn');
      return;
    }
    if (this.isFormSaving) {
      return;
    }
    this.isFormSaving = true;
    const payload = this.form.buildPayload({
      title: this.newTitle,
      description: this.newDescription,
      source: this.newSource,
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
      error: (err: unknown) => {
        const httpErr = err as { status?: number; error?: string };
        this.recipeFormError = httpErr.status === 409 && httpErr.error
          ? httpErr.error
          : 'Nie udało się zapisać przepisu';
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
    this.newSource = populated.source;
    this.recipeIsPublic = populated.recipeIsPublic;
    this.createTagRows = populated.createTagRows.map(row => ({
      ...row,
      suggestions: [],
      showSuggestions: false,
      highlightIndex: -1
    }));
    this.createIngredientRows = populated.createIngredientRows;
    this.createStepRows = populated.createStepRows;
    this.nextCreateRowId = populated.nextRowId;
    this.showRecipeFormModal = true;
    this.cdr.markForCheck();
  }

  isOwnRecipe(recipe: RecipeDto): boolean {
    const currentUser = this.tokenService.getUserName();
    if (!currentUser) {
      return false;
    }
    const owner = this.view.getRecipeOwner(recipe);
    if (!owner) {
      return false;
    }
    return owner.toLowerCase() === currentUser.toLowerCase();
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
      error: () => this.notify.show('Nie udało się usunąć przepisu', 'error')
    });
  }

  load(isInitial = false): void {
    const pageable = { page: this.page, size: this.pageSize };
    this.isLoading = true;
    this.recipes = [];

    const handleError = (): void => {
      this.notify.show('Nie udało się załadować przepisów', 'error');
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
      this.recipesService.getByIngredients(products, pageable).subscribe({ next: handleNext, error: handleError });
      return;
    }

    const tagNames = this.parseCommaSeparated(this.tagsText);
    if (tagNames.length === 0) {
      this.recipesService.getAll(pageable).subscribe({ next: handleNext, error: handleError });
      return;
    }
    this.recipesService.getByTags(tagNames, pageable).subscribe({ next: handleNext, error: handleError });
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
