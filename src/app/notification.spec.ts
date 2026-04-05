import { TestBed } from '@angular/core/testing';

import { Notification } from './core/services/notification';

describe('Notification', () => {
  let service: Notification;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Notification);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
