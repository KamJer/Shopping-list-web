import { ModifyState } from '../enums/modify-state.enum';

export interface AmountTypeDto {
  amountTypeId: number;
  typeName: string;
  deleted: boolean;
  localId: number;
  savedTime: Date;
  modifyState: ModifyState;
}
