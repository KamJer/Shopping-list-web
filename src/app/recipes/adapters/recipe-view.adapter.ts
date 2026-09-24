import { Injectable } from '@angular/core';
import { RecipeDto } from '../models/recipe-dto.model';
import { unwrapSingleRecipe } from './recipe-http-response.adapter';
import { memoize } from '../utils/memoize';

export type RecipeIngredientRow = {
  name: string;
  amount: string;
  unit: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Wyświetlanie / odczyt pól przepisu z różnych kształtów DTO (lista, szczegóły, formularz).
 */
@Injectable({ providedIn: 'root' })
export class RecipeViewAdapter {
  unwrapRecipeObject(raw: RecipeDto | null): RecipeDto | null {
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
      return raw;
    }
    return unwrapSingleRecipe(raw);
  }

  getRecipeName = memoize((recipe: RecipeDto): string => {
    return recipe.name && recipe.name.trim() ? recipe.name.trim() : 'Przepis';
  });

  /** Tekst opisu lub `null` gdy brak — wygodne pod `*ngIf` w szablonie. */
  getDescription(recipe: RecipeDto): string | null {
    const s = this.getDescriptionPlain(recipe);
    return s.length > 0 ? s : null;
  }

  getDescriptionPlain = memoize((recipe: RecipeDto): string => {
    return recipe.description ?? '';
  });

  getDescriptionSnippet(recipe: RecipeDto, maxLen = 140): string {
    const full = this.getDescriptionPlain(recipe);
    if (!full) {
      return '';
    }
    if (full.length <= maxLen) {
      return full;
    }
    return full.slice(0, maxLen).trimEnd() + '…';
  }

  getTags = memoize((recipe: RecipeDto): string[] => {
    return recipe.tags ?? [];
  });

  getIngredientRows(recipe: RecipeDto): RecipeIngredientRow[] {
    const ingredients = recipe.ingredients ?? [];
    return ingredients.map(ing => ({
      name: String(ing.name ?? ''),
      amount: String(ing.amount ?? ''),
      unit: String(ing.unit ?? '')
    }));
  }

  getSteps(recipe: RecipeDto): string[] {
    const steps = recipe.steps ?? [];
    return steps.map(step => step.description ?? '');
  }

  getSource = memoize((recipe: RecipeDto): string => {
    return recipe.source ?? '';
  });

  getRecipeOwner = memoize((recipe: RecipeDto): string | null => {
    const userName = recipe.userName;
    return userName && userName.trim() ? userName.trim() : null;
  });

  readRecipePublicFlag(recipe: RecipeDto): boolean {
    return recipe.published ?? false;
  }

  getRecipeIdForList(recipe: RecipeDto): string {
    const id = recipe.recipeId;
    return String(id ?? '');
  }

  getRecipeIdForApi(recipe: RecipeDto): string | number | null {
    const n = recipe.recipeId;
    if (typeof n === 'number' && Number.isFinite(n)) {
      return n;
    }
    return null;
  }
}
