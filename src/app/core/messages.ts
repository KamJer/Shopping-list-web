export const Messages = {
  auth: {
    loginInvalid: 'Niepoprawny login lub hasło',
    loginError: 'Błąd logowania',
    registerNoTokens: 'Rejestracja nie zwróciła tokenów — sprawdź odpowiedź serwisu.',
    registerFailed: 'Rejestracja nieudana — dane nie przeszły walidacji.\nWymagania dla nowego konta:\n• Login — wymagany, musi być unikalny\n• Hasło — od 8 do 64 znaków',
    logoutFailed: 'Wylogowanie nie powiodło się',
    logoutError: 'Błąd wylogowania'
  },
  authValidation: {
    loginRequired: 'Login jest wymagany.',
    passwordRequired: 'Hasło jest wymagane.',
    passwordLength: 'Hasło musi mieć od 8 do 64 znaków.'
  },
  connection: {
    connectError: 'Błąd połączenia — spróbuj odświeżyć stronę',
    realtimeError: 'Błąd połączenia czasu rzeczywistego'
  },
  recipes: {
    titleRequired: 'Podaj tytuł przepisu.',
    saveFailed: 'Nie udało się zapisać przepisu',
    deleteFailed: 'Nie udało się usunąć przepisu',
    loadFailed: 'Nie udało się załadować przepisów',
    fetchFailed: 'Nie udało się pobrać przepisu.',
    noId: 'Brak identyfikatora przepisu.',
    notFound: 'Przepis nie został znaleziony.',
    unitNotFound: 'Nie znaleziono jednostki "{unit}" — wybrano domyślną.',
    addedToShoppingList: 'Dodano "{name}" do listy zakupów.',
    increasedShoppingItem: 'Zwiększono ilość "{name}" na liście zakupów.',
    confirmDelete: 'Czy na pewno usunąć ten przepis?'
  }
} as const;

export function formatMessage(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match
  );
}
