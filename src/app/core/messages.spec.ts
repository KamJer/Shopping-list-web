import { describe, expect, it } from 'vitest';

import { Messages, formatMessage } from './messages';

describe('formatMessage', () => {
  it('interpolates placeholders', () => {
    expect(formatMessage(Messages.recipes.unitNotFound, { unit: 'szt.' }))
      .toBe('Nie znaleziono jednostki "szt." — wybrano domyślną.');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(formatMessage('Przyklad "{unit}" koniec', {}))
      .toBe('Przyklad "{unit}" koniec');
  });

  it('replaces a placeholder appearing multiple times', () => {
    expect(formatMessage('{name} i {name}', { name: 'Mleko' }))
      .toBe('Mleko i Mleko');
  });
});

describe('auth.registerFailed', () => {
  it('lists account requirements', () => {
    expect(Messages.auth.registerFailed).toContain('Login — wymagany, musi być unikalny');
    expect(Messages.auth.registerFailed).toContain('Hasło — od 8 do 64 znaków');
    expect(Messages.auth.registerFailed).toContain('\n');
  });
});

describe('authValidation', () => {
  it('provides field-level messages', () => {
    expect(Messages.authValidation.loginRequired).toBe('Login jest wymagany.');
    expect(Messages.authValidation.passwordRequired).toBe('Hasło jest wymagane.');
    expect(Messages.authValidation.passwordLength).toBe('Hasło musi mieć od 8 do 64 znaków.');
  });
});
