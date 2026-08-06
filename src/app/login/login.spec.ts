import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { vi } from 'vitest';

import { Login } from './login';
import { Messages } from '../core/messages';
import { NotificationService } from '../core/services/notification';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let notify: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: NotificationService, useValue: { show: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    notify = TestBed.inject(NotificationService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onRegister pokazuje komunikat i nie wysyła POST dla za krótkiego hasła', () => {
    component.username = 'kamil';
    component.password = '1234567';
    const postSpy = vi.spyOn(TestBed.inject(HttpClient), 'post');

    component.onRegister();

    expect(notify.show).toHaveBeenCalledWith(Messages.authValidation.passwordLength, 'error');
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('onRegister pokazuje komunikat i nie wysyła POST dla za długiego hasła', () => {
    component.username = 'kamil';
    component.password = 'x'.repeat(65);
    const postSpy = vi.spyOn(TestBed.inject(HttpClient), 'post');

    component.onRegister();

    expect(notify.show).toHaveBeenCalledWith(Messages.authValidation.passwordLength, 'error');
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('onRegister wysyła POST dla hasła spełniającego wymagania (8-64)', () => {
    component.username = 'kamil';
    component.password = 'haslo12345';
    const postSpy = vi.spyOn(TestBed.inject(HttpClient), 'post');

    component.onRegister();

    expect(postSpy).toHaveBeenCalled();
  });
});
