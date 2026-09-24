export interface RecipeIngredientDto {
  name: string;
  amount: number | string;
  unit: string;
}

export interface RecipeStepDto {
  stepNumber: number;
  description: string;
}

export interface RecipeDto {
  recipeId?: number;
  name: string;
  description: string;
  source: string;
  tags: string[];
  published: boolean;
  userName: string;
  ingredients?: RecipeIngredientDto[];
  steps?: RecipeStepDto[];
}
