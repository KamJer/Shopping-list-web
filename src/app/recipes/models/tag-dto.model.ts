export interface TagDto {
  /** Identyfikator, jeśli serwer go zwraca/oczekuje. */
  tagId?: number;
  /** Nazwa tagu (zakładamy najczęstszą konwencję). */
  name: string;
}

