export interface AmountType {
  amountTypeId: number;
  typeName: string;
  deleted: boolean;
  savedTime: Date | null;
  /** Klient — przy `amountTypeId === 0` przed odpowiedzią serwera. */
  localId?: number;
}
