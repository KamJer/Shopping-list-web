import { Injectable, inject } from '@angular/core';
import { RecipeViewAdapter } from '../adapters/recipe-view.adapter';
import { RecipeDto, RecipeIngredientDto, RecipeStepDto } from '../models/recipe-dto.model';

export interface RecipeFormTagRow {
  id: number;
  value: string;
}

export interface RecipeFormIngredientRow {
  id: number;
  productName: string;
  amount: string;
  unitType: string;
}

export interface RecipeFormStepRow {
  id: number;
  stepNumber: string;
  value: string;
}

export interface RecipeFormPopulateResult {
  title: string;
  description: string;
  source: string;
  recipeIsPublic: boolean;
  createTagRows: RecipeFormTagRow[];
  createIngredientRows: RecipeFormIngredientRow[];
  createStepRows: RecipeFormStepRow[];
  nextRowId: number;
}

/** Budowa payloadu z formularza tworzenia/edycji przepisu — jedna warstwa mapowania na DTO. */
@Injectable({ providedIn: 'root' })
export class RecipeFormService {
  private readonly view = inject(RecipeViewAdapter);

  buildPayload(input: {
    title: string;
    description: string;
    source: string;
    isPublic: boolean;
    editSource: RecipeDto | null;
    tagRows: RecipeFormTagRow[];
    ingredientRows: RecipeFormIngredientRow[];
    stepRows: RecipeFormStepRow[];
  }): RecipeDto {
    const title = input.title.trim();
    const description = input.description.trim();

    const tagStrings: string[] = input.tagRows
      .map(r => r.value.trim())
      .filter(Boolean);

    const ingredientDtos = input.ingredientRows
      .map(row => this.buildIngredientDto(row))
      .filter((dto): dto is RecipeIngredientDto => dto != null);

    const stepDtos = this.buildStepDtosFromRows(input.stepRows);

    const base: RecipeDto = input.editSource != null
      ? { ...input.editSource }
      : {
          name: '',
          description: '',
          source: '',
          tags: [],
          published: false,
          userName: ''
        };

    base.name = title;
    base.description = description;
    base.source = input.source;
    base.tags = tagStrings;
    base.published = input.isPublic;
    base.ingredients = ingredientDtos;
    base.steps = stepDtos;

    return base;
  }

  populateFromRecipe(recipe: RecipeDto, startRowId: number): RecipeFormPopulateResult {
    let next = startRowId;
    const bump = (): number => next++;

    const title = recipe.name ?? 'Przepis';
    const description = recipe.description ?? '';
    const source = recipe.source ?? '';
    const recipeIsPublic = recipe.published ?? false;

    const tagStrings = recipe.tags ?? [];
    const createTagRows: RecipeFormTagRow[] = tagStrings.map(s => ({ id: bump(), value: s }));

    const ing = this.view.getIngredientRows(recipe);
    const createIngredientRows: RecipeFormIngredientRow[] = ing.map(r => ({
      id: bump(),
      productName: r.name,
      amount: r.amount,
      unitType: r.unit
    }));

    const stepTexts = this.view.getSteps(recipe);
    const createStepRows: RecipeFormStepRow[] = stepTexts.map((text, idx) => ({
      id: bump(),
      stepNumber: String(idx + 1),
      value: text
    }));

    return {
      title,
      description,
      source,
      recipeIsPublic,
      createTagRows,
      createIngredientRows,
      createStepRows,
      nextRowId: next
    };
  }

  private buildIngredientDto(row: RecipeFormIngredientRow): RecipeIngredientDto | null {
    const name = row.productName.trim();
    const unit = row.unitType.trim();
    const amtNormalized = row.amount.trim().replace(/\s/g, '').replace(',', '.');
    const amountNum = amtNormalized === '' ? NaN : Number(amtNormalized);
    const hasAmount = amtNormalized !== '' && Number.isFinite(amountNum);
    if (!name && !unit && !hasAmount) {
      return null;
    }
    return {
      name: name || 'Produkt',
      amount: hasAmount ? amountNum : amtNormalized,
      unit
    };
  }

  private buildStepPayloadObject(text: string, stepNumber: number): RecipeStepDto {
    return {
      stepNumber,
      description: text
    };
  }

  private buildStepDtosFromRows(stepRows: RecipeFormStepRow[]): RecipeStepDto[] {
    const nonEmpty = stepRows
      .map((row, listIndex) => ({ row, listIndex }))
      .filter(({ row }) => row.value.trim().length > 0);

    const rows = nonEmpty.map(({ row, listIndex }, idx) => {
      const text = row.value.trim();
      const looseNo = String(row.stepNumber ?? '')
        .trim()
        .replace(',', '.');
      const parsed = parseInt(looseNo, 10);
      const stepNum = Number.isFinite(parsed) && parsed > 0 ? parsed : idx + 1;
      return { text, stepNum, listIndex };
    });

    rows.sort((a, b) => a.stepNum - b.stepNum || a.listIndex - b.listIndex);

    return rows.map(r => this.buildStepPayloadObject(r.text, r.stepNum));
  }
}
