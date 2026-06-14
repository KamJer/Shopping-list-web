import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { RecipeViewAdapter, RecipeIngredientRow } from './adapters/recipe-view.adapter';
import { RecipeDto } from './models/recipe-dto.model';
import { RecipesService } from './recipes.service';
import { NotificationService } from '../core/services/notification';

export type { RecipeIngredientRow };

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css'
})
export class RecipeDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipesService = inject(RecipesService);
  private readonly notify = inject(NotificationService);
  private readonly view = inject(RecipeViewAdapter);

  recipe: RecipeDto | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  private subscription = new Subscription();

  ngOnInit(): void {
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

  getTags(recipe: RecipeDto): string[] {
    return this.view.getTags(recipe);
  }

  getIngredientRows(recipe: RecipeDto): RecipeIngredientRow[] {
    return this.view.getIngredientRows(recipe);
  }

  getSteps(recipe: RecipeDto): string[] {
    return this.view.getSteps(recipe);
  }

  goBack(): void {
    void this.router.navigate(['/recipes']);
  }
}
