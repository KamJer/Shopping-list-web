import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, QueryList, signal, ViewChildren } from '@angular/core';
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
import { Messages } from '../core/messages';
import { ConfirmService } from '../shared/confirm.service';

type RecipeMode = 'all' | 'name' | 'products' | 'tags' | 'mine';

interface TagRow {
  id: number;
  value: string;
  suggestions: string[];
  showSuggestions: boolean;
  highlightIndex: number;
}

interface IngredientRow {
  id: number;
  productName: string;
  amount: string;
  unitType: string;
}

interface StepRow {
  id: number;
  stepNumber: string;
  value: string;
}

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css'
})
export class Recipes implements OnInit {
  private readonly recipesService = inject(RecipesService);
  private readonly view = inject(RecipeViewAdapter);
  private readonly form = inject(RecipeFormService);
  private readonly tagsService = inject(TagsService);
  private readonly notify = inject(NotificationService);
  private readonly tokenService = inject(TokenService);
  private readonly confirm = inject(ConfirmService);

  readonly recipes = signal<RecipeDto[]>([]);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly pageSize = 10;
  readonly isLoading = signal(false);
  readonly initialLoadDone = signal(false);
  private initialLoadRetries = 0;

  readonly mode = signal<RecipeMode>('all');
  readonly nameQuery = signal('');
  readonly productsText = signal('');
  readonly tagsText = signal('');

  readonly allTags = signal<string[]>([]);
  private tagsLoaded = false;

  readonly recipeFormEditSource = signal<RecipeDto | null>(null);
  readonly showRecipeFormModal = signal(false);
  readonly newTitle = signal('');
  readonly newDescription = signal('');
  readonly newSource = signal('');
  readonly createTagRows = signal<TagRow[]>([]);
  readonly createIngredientRows = signal<IngredientRow[]>([]);
  readonly createStepRows = signal<StepRow[]>([]);
  readonly recipeIsPublic = signal(false);
  readonly isFormSaving = signal(false);
  readonly recipeFormError = signal<string | null>(null);
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
    this.mode.set('mine');
    this.page.set(0);
    this.load();
  }

  openCreateRecipe(): void {
    this.recipeFormEditSource.set(null);
    this.resetCreateForm();
    this.loadTags();
    this.showRecipeFormModal.set(true);
  }

  closeRecipeForm(): void {
    if (this.isFormSaving()) {
      return;
    }
    this.showRecipeFormModal.set(false);
    this.recipeFormEditSource.set(null);
    this.resetCreateForm();
  }

  @HostListener('document:keydown', ['$event'])
  onFormKeydown(ev: KeyboardEvent): void {
    if (!this.showRecipeFormModal()) {
      return;
    }
    if (ev.key === 'Escape') {
      ev.preventDefault();
      this.closeRecipeForm();
    }
  }

  private resetCreateForm(): void {
    this.newTitle.set('');
    this.newDescription.set('');
    this.newSource.set('');
    this.createTagRows.set([]);
    this.createIngredientRows.set([]);
    this.createStepRows.set([]);
    this.recipeIsPublic.set(false);
    this.recipeFormError.set(null);
    this.nextCreateRowId = 1;
  }

  addTagField(): void {
    this.createTagRows.update(rows => [
      ...rows,
      { id: this.nextCreateRowId++, value: '', suggestions: [], showSuggestions: false, highlightIndex: -1 }
    ]);
    setTimeout(() => {
      const inputs = this.tagInputs?.toArray();
      if (inputs && inputs.length > 0) {
        inputs[inputs.length - 1].nativeElement.focus();
      }
    });
  }

  removeTagField(index: number): void {
    this.createTagRows.update(rows => rows.filter((_, i) => i !== index));
  }

  private loadTags(): void {
    if (this.tagsLoaded) {
      return;
    }
    this.tagsService.getAll().subscribe({
      next: tags => {
        this.allTags.set(tags);
        this.tagsLoaded = true;
        for (const row of this.createTagRows()) {
          if (!row.value?.trim()) {
            this.onTagInput(row, '', true);
          }
        }
      },
      error: err => {
        this.notify.show('Nie udało się pobrać listy tagów (autocomplete wyłączony).', 'warn');
        this.allTags.set([]);
      }
    });
  }

  onTagInput(row: TagRow, value: string, force = false): void {
    const query = (value || '').toLowerCase().trim();
    const selectedElsewhere = new Set(
      this.createTagRows()
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
    row.suggestions = this.allTags().filter(t => {
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

  onTagFocus(row: TagRow): void {
    this.onTagInput(row, row.value, true);
  }

  onTagBlur(row: TagRow): void {
    setTimeout(() => { row.showSuggestions = false; }, 150);
  }

  onTagKeydown(
    ev: KeyboardEvent,
    row: TagRow
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
    row: TagRow,
    index: number
  ): void {
    row.highlightIndex = index;
  }

  selectSuggestion(row: TagRow, tag: string): void {
    row.value = tag;
    row.suggestions = [];
    row.showSuggestions = false;
    row.highlightIndex = -1;
  }

  addIngredientField(): void {
    this.createIngredientRows.update(rows => [
      ...rows,
      {
        id: this.nextCreateRowId++,
        productName: '',
        amount: '',
        unitType: ''
      }
    ]);
  }

  removeIngredientField(index: number): void {
    this.createIngredientRows.update(rows => rows.filter((_, i) => i !== index));
  }

  addStepField(): void {
    this.createStepRows.update(rows => {
      const n = rows.length + 1;
      return [...rows, { id: this.nextCreateRowId++, stepNumber: String(n), value: '' }];
    });
  }

  removeStepField(index: number): void {
    this.createStepRows.update(rows => rows.filter((_, i) => i !== index));
  }

  submitRecipeForm(): void {
    const title = this.newTitle().trim();
    if (!title) {
      this.notify.show(Messages.recipes.titleRequired, 'warn');
      return;
    }
    if (this.isFormSaving()) {
      return;
    }
    this.isFormSaving.set(true);
    const payload = this.form.buildPayload({
      title: this.newTitle(),
      description: this.newDescription(),
      source: this.newSource(),
      isPublic: this.recipeIsPublic(),
      editSource: this.recipeFormEditSource(),
      tagRows: this.createTagRows(),
      ingredientRows: this.createIngredientRows(),
      stepRows: this.createStepRows()
    });

    this.recipesService.saveRecipe(payload).subscribe({
      next: () => {
        this.isFormSaving.set(false);
        this.closeRecipeForm();
        this.load();
      },
      error: (err: unknown) => {
        const httpErr = err as { status?: number; error?: string };
        this.recipeFormError.set(
          httpErr.status === 409 && httpErr.error
            ? httpErr.error
            : Messages.recipes.saveFailed
        );
        this.isFormSaving.set(false);
      }
    });
  }

  openEdit(recipe: RecipeDto, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.resetCreateForm();
    this.recipeFormEditSource.set(recipe);
    const populated = this.form.populateFromRecipe(recipe, this.nextCreateRowId);
    this.newTitle.set(populated.title);
    this.newDescription.set(populated.description);
    this.newSource.set(populated.source);
    this.recipeIsPublic.set(populated.recipeIsPublic);
    this.createTagRows.set(populated.createTagRows.map(row => ({
      ...row,
      suggestions: [],
      showSuggestions: false,
      highlightIndex: -1
    })));
    this.createIngredientRows.set(populated.createIngredientRows);
    this.createStepRows.set(populated.createStepRows);
    this.nextCreateRowId = populated.nextRowId;
    this.showRecipeFormModal.set(true);
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

  async confirmDelete(recipe: RecipeDto, ev: Event): Promise<void> {
    ev.preventDefault();
    ev.stopPropagation();
    const id = this.view.getRecipeIdForApi(recipe);
    if (id == null) {
      return;
    }
    const confirmed = await this.confirm.ask(
      Messages.recipes.confirmDelete,
      Messages.recipes.confirmDelete
    );
    if (!confirmed) {
      return;
    }
    this.recipesService.deleteRecipe(id).subscribe({
      next: () => this.load(),
      error: () => this.notify.show(Messages.recipes.deleteFailed, 'error')
    });
  }

  load(isInitial = false): void {
    const pageable = { page: this.page(), size: this.pageSize };
    this.isLoading.set(true);
    this.recipes.set([]);

    const handleError = (): void => {
      this.notify.show(Messages.recipes.loadFailed, 'error');
      this.isLoading.set(false);
      if (isInitial && this.initialLoadRetries < 2) {
        this.initialLoadRetries += 1;
        setTimeout(() => this.load(true), 300);
        return;
      }
      this.initialLoadDone.set(true);
    };

    const handleNext = (p: PageResult<RecipeDto>): void => {
      this.applyPage(p);
      this.isLoading.set(false);
      this.initialLoadDone.set(true);
    };

    if (this.mode() === 'mine') {
      this.recipesService.getRecipesForUser(pageable).subscribe({ next: handleNext, error: handleError });
      return;
    }

    if (this.mode() === 'all') {
      this.recipesService.getAll(pageable).subscribe({ next: handleNext, error: handleError });
      return;
    }

    if (this.mode() === 'name') {
      this.recipesService.getByName(this.nameQuery(), pageable).subscribe({ next: handleNext, error: handleError });
      return;
    }

    if (this.mode() === 'products') {
      const products = this.parseCommaSeparated(this.productsText());
      if (products.length === 0) {
        this.recipesService.getAll(pageable).subscribe({ next: handleNext, error: handleError });
        return;
      }
      this.recipesService.getByIngredients(products, pageable).subscribe({ next: handleNext, error: handleError });
      return;
    }

    const tagNames = this.parseCommaSeparated(this.tagsText());
    if (tagNames.length === 0) {
      this.recipesService.getAll(pageable).subscribe({ next: handleNext, error: handleError });
      return;
    }
    this.recipesService.getByTags(tagNames, pageable).subscribe({ next: handleNext, error: handleError });
  }

  private applyPage(p: PageResult<RecipeDto>): void {
    this.recipes.set(Array.isArray(p?.content) ? p.content : []);
    this.totalPages.set(Number(p?.totalPages ?? 0));
    this.totalElements.set(Number(p?.totalElements ?? this.recipes().length));
    this.initialLoadRetries = 0;
  }

  prevPage(): void {
    if (this.page() <= 0) {
      return;
    }
    this.page.update(p => p - 1);
    this.load();
  }

  nextPage(): void {
    if (this.totalPages() <= 0) {
      return;
    }
    if (this.page() >= this.totalPages() - 1) {
      return;
    }
    this.page.update(p => p + 1);
    this.load();
  }

  setMode(next: Exclude<RecipeMode, 'mine'>): void {
    this.mode.set(next);
    this.page.set(0);
    this.load();
  }

  private parseCommaSeparated(text: string): string[] {
    return text
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
}
