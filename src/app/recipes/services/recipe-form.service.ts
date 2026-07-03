import { Injectable, inject } from '@angular/core';
import { RecipeViewAdapter } from '../adapters/recipe-view.adapter';
import { RecipeDto } from '../models/recipe-dto.model';
import { TagDto } from '../models/tag-dto.model';

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
    const isEdit = input.editSource != null;

    const tagDtos: TagDto[] = input.tagRows
      .map(r => r.value.trim())
      .filter(Boolean)
      .map(name => ({ tag: name }));

    const ingredientDtos = input.ingredientRows
      .map(row => this.buildIngredientDto(row))
      .filter((dto): dto is Record<string, unknown> => dto != null);

    const stepDtos = this.buildStepDtosFromRows(input.stepRows);

    const base: RecipeDto = isEdit ? { ...input.editSource! } : {};

    base.name = title;
    base.title = title;
    base.recipeName = title;
    base['description'] = description;
    base['opis'] = description;
    base['recipeDescription'] = description;

    base['source'] = input.source;

    this.applyPublicationFlags(base, input.isPublic);

    const setTags = (): void => {
      base['tags'] = tagDtos;
    };
    const setIngredients = (): void => {
      base['ingredients'] = ingredientDtos;
      base['ingredientDtoList'] = ingredientDtos;
    };
    const setSteps = (): void => {
      base['steps'] = stepDtos;
      base['recipeSteps'] = stepDtos;
      base['stepDtoList'] = stepDtos;
    };

    setTags();
    setIngredients();
    setSteps();

    return base;
  }

  populateFromRecipe(recipe: RecipeDto, startRowId: number): RecipeFormPopulateResult {
    let next = startRowId;
    const bump = (): number => next++;

    const title = this.view.getRecipeName(recipe);
    const description = this.view.getDescriptionPlain(recipe);
    const source = this.view.getSource(recipe);
    const recipeIsPublic = this.view.readRecipePublicFlag(recipe);

    const tagStrings = this.view.getTags(recipe);
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

  private buildIngredientDto(row: RecipeFormIngredientRow): Record<string, unknown> | null {
    const name = row.productName.trim();
    const unit = row.unitType.trim();
    const amtNormalized = row.amount.trim().replace(/\s/g, '').replace(',', '.');
    const amountNum = amtNormalized === '' ? NaN : Number(amtNormalized);
    const hasAmount = amtNormalized !== '' && Number.isFinite(amountNum);
    if (!name && !unit && !hasAmount) {
      return null;
    }
    const dto: Record<string, unknown> = {};
    if (name) {
      dto['name'] = name;
      dto['productName'] = name;
    }
    if (unit) {
      dto['unitName'] = unit;
      dto['unit'] = unit;
    }
    if (hasAmount) {
      dto['amount'] = amountNum;
      dto['quantity'] = amountNum;
    }
    return dto;
  }

  private buildStepPayloadObject(text: string, stepNumber: number): Record<string, unknown> {
    return {
      description: text,
      stepDescription: text,
      recipeStepDescription: text,
      instruction: text,
      content: text,
      text,
      stepNumber,
      order: stepNumber,
      stepOrder: stepNumber
    };
  }

  private buildStepDtosFromRows(stepRows: RecipeFormStepRow[]): Record<string, unknown>[] {
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

  private applyPublicationFlags(base: RecipeDto, isPublic: boolean): void {
    base['published'] = isPublic;
    base['isPublic'] = isPublic;
    base['publicRecipe'] = isPublic;
    base['isPublished'] = isPublic;
    base['publiczny'] = isPublic;
  }
}
