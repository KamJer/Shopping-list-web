import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bought } from './bought';

describe('Bought', () => {
  let component: Bought;
  let fixture: ComponentFixture<Bought>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bought], 
    }).compileComponents();

    fixture = TestBed.createComponent(Bought);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
