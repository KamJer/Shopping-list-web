import { Injectable } from '@angular/core';
import { RecipeDto } from '../models/recipe-dto.model';
import { unwrapSingleRecipe } from './recipe-http-response.adapter';

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

  getRecipeName(recipe: RecipeDto): string {
    const r = recipe as Record<string, unknown>;
    return (
      (typeof r['name'] === 'string' ? r['name'] : undefined) ??
      (typeof r['recipeName'] === 'string' ? r['recipeName'] : undefined) ??
      (typeof r['title'] === 'string' ? r['title'] : undefined) ??
      (typeof r['nazwa'] === 'string' ? r['nazwa'] : undefined) ??
      'Przepis'
    );
  }

  /** Tekst opisu lub `null` gdy brak — wygodne pod `*ngIf` w szablonie. */
  getDescription(recipe: RecipeDto): string | null {
    const s = this.getDescriptionPlain(recipe);
    return s.length > 0 ? s : null;
  }

  getDescriptionPlain(recipe: RecipeDto): string {
    return this.getFirstString(recipe, [
      'description',
      'recipeDescription',
      'opis',
      'desc',
      'summary',
      'shortDescription',
      'longDescription',
      'about',
      'recipeDetails',
      'recipeText',
      'tresc',
      'treść'
    ]);
  }

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

  getTags(recipe: RecipeDto): string[] {
    const tagKeys = ['tags', 'tagList', 'tagDtoList', 'recipeTags', 'categories', 'labels', 'tagi', 'kategorie'];
    for (const key of tagKeys) {
      const normalized = this.normalizeTagList(recipe[key as keyof RecipeDto]);
      if (normalized.length > 0) {
        return normalized;
      }
    }
    return this.getStringArray(recipe, tagKeys);
  }

  getIngredientRows(recipe: RecipeDto): RecipeIngredientRow[] {
    const keys = [
      'ingredients',
      'ingredientList',
      'ingredientDtoList',
      'recipeIngredients',
      'products',
      'productList',
      'components',
      'items',
      'shoppingList',
      'skladniki',
      'składniki',
      'produkty'
    ];
    for (const key of keys) {
      const normalized = this.normalizeIngredientRows(recipe[key as keyof RecipeDto]);
      if (normalized.length > 0) {
        return normalized;
      }
    }
    const fallback = this.getStringArray(recipe, keys);
    return fallback.map(name => ({ name, amount: '', unit: '' }));
  }

  getSteps(recipe: RecipeDto): string[] {
    const keys = [
      'steps',
      'recipeSteps',
      'stepDtoList',
      'preparationSteps',
      'instructions',
      'directions',
      'procedure',
      'preparation',
      'kroki',
      'instrukcje',
      'wykonanie'
    ];
    for (const key of keys) {
      const normalized = this.normalizeStepList(recipe[key as keyof RecipeDto]);
      if (normalized.length > 0) {
        return normalized;
      }
    }
    return this.getStringArray(recipe, keys);
  }

  getRecipeOwner(recipe: RecipeDto): string | null {
    const r = recipe as Record<string, unknown>;
    const keys = [
      'userName',
      'source',
      'createdBy',
      'owner',
      'author',
      'createdByName',
      'recipeOwner',
      'authorName',
      'ownerName'
    ];
    for (const key of keys) {
      const v = r[key];
      if (typeof v === 'string' && v.trim()) {
        return v.trim();
      }
    }
    return null;
  }

  readRecipePublicFlag(recipe: RecipeDto): boolean {
    const keys = ['published', 'isPublic', 'publicRecipe', 'isPublished', 'publiczny', 'public'];
    for (const key of keys) {
      const v = (recipe as Record<string, unknown>)[key];
      if (typeof v === 'boolean') {
        return v;
      }
      if (v === 1 || v === '1' || v === 'true') {
        return true;
      }
      if (v === 0 || v === '0' || v === 'false') {
        return false;
      }
    }
    return false;
  }

  getRecipeIdForList(recipe: RecipeDto): string {
    const r = recipe as Record<string, unknown>;
    const id = recipe.recipeId ?? r['id'] ?? r['_id'] ?? r['name'] ?? r['recipeName'] ?? r['title'];
    return String(id ?? '');
  }

  getRecipeIdForApi(recipe: RecipeDto): string | number | null {
    const n = recipe.recipeId ?? (recipe as Record<string, unknown>)['id'];
    if (typeof n === 'number' && Number.isFinite(n)) {
      return n;
    }
    if (typeof n === 'string' && n.trim() !== '') {
      const parsed = Number(n);
      return Number.isFinite(parsed) ? parsed : n;
    }
    return null;
  }

  private getFirstString(recipe: RecipeDto, keys: string[]): string {
    const o = recipe as Record<string, unknown>;
    for (const key of keys) {
      const value = o[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  }

  private getStringArray(recipe: RecipeDto, keys: string[]): string[] {
    const o = recipe as Record<string, unknown>;
    for (const key of keys) {
      const value = o[key];
      const result = this.normalizeToStringArray(value);
      if (result.length > 0) {
        return result;
      }
    }
    return [];
  }

  private normalizeTagList(value: unknown): string[] {
    if (!value && value !== 0) {
      return [];
    }
    if (typeof value === 'string') {
      return this.normalizeToStringArray(value);
    }
    if (!Array.isArray(value)) {
      return [];
    }
    const out: string[] = [];
    for (const item of value) {
      if (typeof item === 'string' && item.trim()) {
        out.push(item.trim());
        continue;
      }
      if (isRecord(item)) {
        const label = item['tag'] ?? item['name'] ?? item['tagName'] ?? item['label'] ?? item['title'] ?? item['text'];
        if (typeof label === 'string' && label.trim()) {
          out.push(label.trim());
        }
      }
    }
    return out;
  }

  private normalizeIngredientRows(value: unknown): RecipeIngredientRow[] {
    if (!value && value !== 0) {
      return [];
    }
    if (typeof value === 'string') {
      return this.normalizeToStringArray(value).map(s => ({ name: s, amount: '', unit: '' }));
    }
    if (!Array.isArray(value)) {
      return [];
    }
    const out: RecipeIngredientRow[] = [];
    for (const item of value) {
      if (typeof item === 'string' && item.trim()) {
        out.push({ name: item.trim(), amount: '', unit: '' });
        continue;
      }
      if (isRecord(item)) {
        const row = this.parseIngredientFields(item);
        if (row) {
          out.push(row);
        }
      }
    }
    return out;
  }

  private parseIngredientFields(o: Record<string, unknown>): RecipeIngredientRow | null {
    const nameRaw = o['productName'] ?? o['name'] ?? o['ingredientName'] ?? o['title'] ?? o['label'];
    const name =
      typeof nameRaw === 'string' ? nameRaw.trim() : nameRaw != null ? String(nameRaw).trim() : '';

    const amountRaw = o['amount'] ?? o['quantity'] ?? o['qty'];
    let amount = '';
    if (amountRaw != null && String(amountRaw).trim() !== '') {
      amount = String(amountRaw).trim();
    }

    const unitCompound =
      (typeof o['unitName'] === 'string' ? o['unitName'] : undefined) ??
      (typeof o['unit'] === 'string' ? o['unit'] : undefined) ??
      (isRecord(o['amountType'])
        ? String((o['amountType'] as Record<string, unknown>)['typeName'] ?? '')
        : typeof o['amountType'] === 'string'
          ? o['amountType']
          : undefined);
    const unit = unitCompound != null && String(unitCompound).trim() !== '' ? String(unitCompound).trim() : '';

    if (!name && !amount && !unit) {
      const text = o['text'] ?? o['description'];
      if (typeof text === 'string' && text.trim()) {
        return { name: text.trim(), amount: '', unit: '' };
      }
      return null;
    }
    return { name, amount, unit };
  }

  private normalizeStepList(value: unknown): string[] {
    if (!value && value !== 0) {
      return [];
    }
    if (typeof value === 'string') {
      return this.normalizeToStringArray(value);
    }
    if (!Array.isArray(value)) {
      return [];
    }
    type StepRow = { order: number; text: string };
    const rows: StepRow[] = [];
    value.forEach((item, idx) => {
      if (typeof item === 'string' && item.trim()) {
        rows.push({ order: idx, text: item.trim() });
        return;
      }
      if (!isRecord(item)) {
        return;
      }
      const rawOrder =
        item['stepNumber'] ?? item['order'] ?? item['stepOrder'] ?? item['index'] ?? item['no'] ?? item['step'] ?? idx;
      const order = Number(rawOrder);
      const text =
        item['stepDescription'] ??
        item['recipeStepDescription'] ??
        item['description'] ??
        item['text'] ??
        item['instruction'] ??
        item['content'] ??
        item['name'];
      if (typeof text === 'string' && text.trim()) {
        rows.push({ order: Number.isFinite(order) ? order : idx, text: text.trim() });
      }
    });
    rows.sort((a, b) => a.order - b.order);
    return rows.map(r => r.text);
  }

  private normalizeToStringArray(value: unknown): string[] {
    if (!value && value !== 0) {
      return [];
    }

    if (typeof value === 'string') {
      return value
        .split(/\r?\n|\n|,/)
        .map(item => item.trim())
        .filter(Boolean);
    }

    if (Array.isArray(value)) {
      return value
        .flatMap(item => {
          if (typeof item === 'string') {
            return item.split(/\r?\n|\n|,/).map(s => s.trim()).filter(Boolean);
          }
          if (isRecord(item)) {
            const name = item['name'] ?? item['title'] ?? item['label'] ?? item['text'];
            return name ? [String(name).trim()] : [];
          }
          return [];
        })
        .filter(Boolean);
    }

    if (isRecord(value)) {
      const name = value['name'] ?? value['title'] ?? value['label'] ?? value['text'];
      return name ? [String(name).trim()] : [];
    }

    return [];
  }
}
