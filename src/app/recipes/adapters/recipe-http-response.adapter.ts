import { RecipeDto } from '../models/recipe-dto.model';
import { PageResult } from '../models/page-result.model';

/**
 * Jedyna warstwa dopasowania surowych odpowiedzi HTTP /recipe* do `PageResult` i pojedynczego `RecipeDto`.
 */
export function unwrapHttpBody(res: unknown): unknown {
  if (res == null) {
    return null;
  }
  if (Array.isArray(res)) {
    return res;
  }
  if (typeof res === 'object' && res !== null && 'body' in res) {
    const b = (res as { body: unknown }).body;
    return unwrapHttpBody(b);
  }
  return res;
}

export function adaptRecipePageResult(res: unknown): PageResult<RecipeDto> {
  const payload = unwrapHttpBody(res);
  const pageObj = resolvePageObject(payload);

  let rawList: unknown[];
  if (pageObj && Array.isArray(pageObj['content'])) {
    rawList = pageObj['content'] as unknown[];
  } else if (Array.isArray(payload)) {
    rawList = payload;
  } else {
    rawList = extractRecipeArray(payload);
  }

  const content = rawList.map(item => shallowUnwrapListItem(item));

  if (pageObj) {
    return {
      content,
      ...readSpringPageMeta(pageObj, content.length)
    };
  }

  const n = content.length;
  return {
    content,
    page: 0,
    size: n,
    totalPages: n > 0 ? 1 : 0,
    totalElements: n
  };
}

export function adaptSingleRecipeResponse(res: unknown): RecipeDto {
  const raw = unwrapHttpBody(res);
  return unwrapSingleRecipe(raw);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function looksLikePage(o: unknown): o is Record<string, unknown> {
  return (
    isRecord(o) &&
    (Array.isArray(o['content']) ||
      'totalElements' in o ||
      'totalPages' in o ||
      typeof o['number'] === 'number')
  );
}

function resolvePageObject(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) {
    return null;
  }
  if (looksLikePage(payload)) {
    return payload;
  }
  for (const k of ['data', 'result', 'body', 'response']) {
    const inner = payload[k];
    if (looksLikePage(inner)) {
      return inner;
    }
  }
  return null;
}

function readSpringPageMeta(
  pageObj: Record<string, unknown>,
  contentLength: number
): { page: number; size: number; totalPages: number; totalElements: number } {
  const page = Number(pageObj['number'] ?? pageObj['page'] ?? 0);
  let size = Number(pageObj['size'] ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    size = contentLength > 0 ? contentLength : 10;
  }

  let totalElements = Number(pageObj['totalElements'] ?? pageObj['total_elements'] ?? 0);
  let totalPages = Number(pageObj['totalPages'] ?? pageObj['total_pages'] ?? 0);
  if (!Number.isFinite(totalElements) || totalElements < 0) {
    totalElements = 0;
  }
  if (!Number.isFinite(totalPages) || totalPages < 0) {
    totalPages = 0;
  }

  if (totalElements <= 0 && contentLength > 0) {
    totalElements = contentLength;
  }
  if (totalPages <= 0 && totalElements > 0 && size > 0) {
    totalPages = Math.max(1, Math.ceil(totalElements / size));
  } else if (totalPages <= 0 && contentLength > 0) {
    totalPages = 1;
  }

  return { page, size, totalPages, totalElements };
}

function tryArrayKeys(obj: Record<string, unknown>): unknown[] | null {
  const ordered = [
    'content',
    'recipes',
    'items',
    'results',
    'list',
    'records',
    'elements',
    'data',
    'payload'
  ];
  for (const key of ordered) {
    const v = obj[key];
    if (Array.isArray(v)) {
      return v;
    }
  }
  return null;
}

function extractRecipeArray(payload: unknown): unknown[] {
  if (payload == null) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!isRecord(payload)) {
    return [];
  }

  const direct = tryArrayKeys(payload);
  if (direct) {
    return direct;
  }

  for (const wrap of ['data', 'result', 'body', 'response']) {
    const inner = payload[wrap];
    if (isRecord(inner)) {
      const nested = tryArrayKeys(inner);
      if (nested) {
        return nested;
      }
    }
    if (Array.isArray(inner)) {
      return inner;
    }
  }

  return [];
}

function shallowUnwrapListItem(item: unknown): RecipeDto {
  if (isRecord(item)) {
    const r = item['recipe'];
    if (isRecord(r)) {
      return r as RecipeDto;
    }
  }
  return item as RecipeDto;
}

export function unwrapSingleRecipe(raw: unknown): RecipeDto {
  if (raw == null || typeof raw !== 'object') {
    return raw as RecipeDto;
  }
  const o = raw as Record<string, unknown>;
  const recipe = o['recipe'];
  if (isRecord(recipe)) {
    return recipe as RecipeDto;
  }
  const data = o['data'];
  if (isRecord(data)) {
    if (data['content'] == null) {
      return data as RecipeDto;
    }
  }
  return raw as RecipeDto;
}
