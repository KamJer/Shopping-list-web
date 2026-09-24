import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FocusDirective } from './focus.directive';

@Component({
  standalone: true,
  imports: [FocusDirective],
  template: `<input [appFocus]="shouldFocus" />`
})
class TestComponent {
  shouldFocus = false;
}

describe('FocusDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let inputDebugElement: DebugElement;
  let inputElement: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, FocusDirective]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    inputDebugElement = fixture.debugElement.query(By.directive(FocusDirective));
    inputElement = inputDebugElement.nativeElement as HTMLInputElement;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should focus input when when=true', async () => {
    component.shouldFocus = true;
    fixture.detectChanges();

    await new Promise<void>(resolve => {
      queueMicrotask(() => {
        resolve();
      });
    });

    expect(document.activeElement).toBe(inputElement);
  });

  it('should not focus input when when=false', () => {
    component.shouldFocus = false;
    fixture.detectChanges();

    expect(document.activeElement).not.toBe(inputElement);
  });
});
