export interface RecipeDto {
  /** Id przepisu (nazwa pola zależy od backendu, trzymamy opcjonalnie). */
  recipeId?: number;
  /** Najczęściej: nazwa przepisu. */
  name?: string;
  recipeName?: string;
  title?: string;

  /** Reszta pól jest zależna od backendu. */
  [key: string]: unknown;
}

