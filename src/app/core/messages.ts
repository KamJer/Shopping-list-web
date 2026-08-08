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
  },
  admin: {
    usersLoadFailed: 'Nie udało się pobrać listy użytkowników',
    promoteConfirm: 'Promować użytkownika {user} do roli ADMIN?',
    demoteConfirm: 'Zdegradować użytkownika {user} do roli USER?',
    roleChanged: 'Rola użytkownika została zmieniona',
    roleChangeFailed: 'Nie udało się zmienić roli użytkownika',
    passwordChanged: 'Hasło użytkownika zostało zmienione',
    passwordChangeFailed: 'Nie udało się zmienić hasła użytkownika',
    passwordRequired: 'Hasło jest wymagane.',
    passwordTooShort: 'Hasło musi mieć od 8 do 64 znaków.',
    passwordMismatch: 'Podane hasła nie są zgodne.',
    deleteConfirm: 'Usunąć konto użytkownika {user}? Tej operacji nie można cofnąć.',
    userDeleted: 'Konto użytkownika zostało usunięte',
    userDeleteFailed: 'Nie udało się usunąć konta użytkownika',
    cannotModifySuperAdmin: 'Konto super admina nie może być modyfikowane lub usunięte',
    recipesLoadFailed: 'Nie udało się pobrać listy przepisów',
    recipePublishedChanged: 'Zmieniono status publikacji',
    recipePublishFailed: 'Nie udało się zmienić statusu publikacji',
    recipeDeleteConfirm: 'Czy na pewno usunąć ten przepis?',
    recipeDeleted: 'Przepis został usunięty',
    recipeDeleteFailed: 'Nie udało się usunąć przepisu',
    tagsLoadFailed: 'Nie udało się pobrać listy tagów',
    tagCreated: 'Tag został dodany',
    tagCreateFailed: 'Nie udało się dodać tagu',
    tagDeleteConfirm: 'Usunąć tag "{tag}"?',
    tagDeleted: 'Tag został usunięty',
    tagDeleteFailed: 'Nie udało się usunąć tagu'
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
