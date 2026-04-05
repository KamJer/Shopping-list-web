import { ModifyState } from '../enums/modify-state.enum';

export interface CategoryDto {
  categoryId: number;
  categoryName: string;
  deleted: boolean;
  localId: number;
  savedTime: Date;
  modifyState: ModifyState;
}
