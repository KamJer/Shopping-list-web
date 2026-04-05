export interface Category {
  categoryId: number;
  categoryName: string;
  deleted: boolean;
  savedTime: Date | null;
  /** Klient — przed odpowiedzią serwera (np. unikalny id przy categoryId 0). */
  localId?: number;
}
