import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecipeAdminService } from './services/recipe-admin.service';
import { RecipeDto } from '../recipes/models/recipe-dto.model';
import { NotificationService } from '../core/services/notification';
import { Messages } from '../core/messages';
import { ConfirmService } from '../shared/confirm.service';

@Component({
  selector: 'app-recipe-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recipe-admin.html',
  styleUrl: './recipe-admin.css'
})
export class RecipeAdmin implements OnInit {
  private readonly recipeAdminService = inject(RecipeAdminService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  protected readonly messages = Messages;
  protected readonly Math = Math;

  readonly recipes = signal<RecipeDto[]>([]);
  readonly page = signal(0);
  readonly pageSize = 10;
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly isLoading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  getRecipeName(recipe: RecipeDto): string {
    return recipe.name ?? '—';
  }

  getRecipeOwner(recipe: RecipeDto): string {
    return (recipe.userName ?? recipe.source ?? '—') as string;
  }

  isPublished(recipe: RecipeDto): boolean {
    return recipe['published'] === true;
  }

  getRecipeId(recipe: RecipeDto): number | null {
    const id = recipe.recipeId ?? null;
    return typeof id === 'number' ? id : null;
  }

  togglePublished(recipe: RecipeDto): void {
    const id = this.getRecipeId(recipe);
    if (id == null) {
      return;
    }
    this.recipeAdminService.changePublished(id, !this.isPublished(recipe)).subscribe({
      next: () => {
        this.notify.show(Messages.admin.recipePublishedChanged, 'success');
        this.load();
      },
      error: () => this.notify.show(Messages.admin.recipePublishFailed, 'error')
    });
  }

  async confirmDelete(recipe: RecipeDto): Promise<void> {
    const id = this.getRecipeId(recipe);
    if (id == null) {
      return;
    }
    const confirmed = await this.confirm.ask(
      Messages.admin.recipeDeleteConfirm,
      Messages.admin.recipeDeleteConfirm
    );
    if (!confirmed) {
      return;
    }
    this.recipeAdminService.deleteRecipe(id).subscribe({
      next: () => {
        this.notify.show(Messages.admin.recipeDeleted, 'success');
        this.load();
      },
      error: () => this.notify.show(Messages.admin.recipeDeleteFailed, 'error')
    });
  }

  load(): void {
    this.isLoading.set(true);
    this.recipeAdminService.getAll({ page: this.page(), size: this.pageSize }).subscribe({
      next: p => {
        this.recipes.set(Array.isArray(p?.content) ? p.content : []);
        this.totalPages.set(Number(p?.totalPages ?? 0));
        this.totalElements.set(Number(p?.totalElements ?? this.recipes().length));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notify.show(Messages.admin.recipesLoadFailed, 'error');
      }
    });
  }

  prevPage(): void {
    if (this.page() <= 0) {
      return;
    }
    this.page.update(p => p - 1);
    this.load();
  }

  nextPage(): void {
    if (this.totalPages() <= 0 || this.page() >= this.totalPages() - 1) {
      return;
    }
    this.page.update(p => p + 1);
    this.load();
  }
}
