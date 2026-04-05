export interface RecipeRequestDto {
  /** Produkty wymagane (np. nazwy). */
  products: string[];
  /** Maksymalna liczba brakujących składników. */
  maxMissing: number;
}

