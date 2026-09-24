import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ConfirmService } from './confirm.service';

@Component({
  standalone: true,
  template: `<div>Test</div>`
})
class TestHostComponent {}

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [ConfirmService]
    }).compileComponents();

    service = TestBed.inject(ConfirmService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
