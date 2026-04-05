import { AllDto } from '../models/all-dto.model';

/** Jedyna warstwa mapowania surowego JSON (WebSocket BODY) → `AllDto`. */
export function parseAllDtoFromWsBody(body: string): AllDto {
  const raw = JSON.parse(body) as Record<string, unknown>;
  const amountList =
    (raw['amountTypeDtoList'] as AllDto['amountTypeDtoList'] | undefined) ??
    (raw['amountTypes'] as AllDto['amountTypeDtoList'] | undefined) ??
    [];
  const categoryList =
    (raw['categoryDtoList'] as AllDto['categoryDtoList'] | undefined) ??
    (raw['categoryDTOList'] as AllDto['categoryDtoList'] | undefined) ??
    (raw['categories'] as AllDto['categoryDtoList'] | undefined) ??
    [];
  const itemList =
    (raw['shoppingItemDtoList'] as AllDto['shoppingItemDtoList'] | undefined) ??
    (raw['shoppingItems'] as AllDto['shoppingItemDtoList'] | undefined) ??
    [];
  const savedRaw = raw['savedTime'];
  return {
    amountTypeDtoList: Array.isArray(amountList) ? amountList : [],
    categoryDtoList: Array.isArray(categoryList) ? categoryList : [],
    shoppingItemDtoList: Array.isArray(itemList) ? itemList : [],
    savedTime: typeof savedRaw === 'string' ? savedRaw : '',
    dirty: Boolean(raw['dirty'])
  };
}
