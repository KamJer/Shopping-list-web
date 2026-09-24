import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Component({
  standalone: true,
  imports: [ConfirmDialogComponent],
  template: `<app-confirm-dialog
    [title]="title"
    [message]="message"
    [confirmText]="confirmText"
    [cancelText]="cancelText"
  ></app-confirm-dialog>`
})
class HostComponent {
  title = 'Czy na pewno?';
  message = 'Ta operacja jest nieodwracalna.';
  confirmText = 'Potwierdź';
  cancelText = 'Anuluj';
}

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, ConfirmDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    const titleElement = fixture.nativeElement.querySelector('h3');
    expect(titleElement.textContent).toContain('Czy na pewno?');
  });

  it('should display message', () => {
    const messageElement = fixture.nativeElement.querySelector('p');
    expect(messageElement.textContent).toContain('Ta operacja jest nieodwracalna.');
  });

  it('should display confirm and cancel buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Anuluj');
    expect(buttons[1].textContent).toContain('Potwierdź');
  });
});
