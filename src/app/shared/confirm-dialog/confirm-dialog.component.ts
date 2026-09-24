import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="confirm-dialog-backdrop" (click)="onCancel()">
      <div class="confirm-dialog-panel" (click)="$event.stopPropagation()">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="confirm-dialog-actions">
          <button class="cancel-btn" (click)="onCancel()">{{ cancelText || 'Anuluj' }}</button>
          <button class="confirm-btn" (click)="onConfirm()">{{ confirmText || 'Potwierdź' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .confirm-dialog-panel {
      background: white;
      padding: 24px;
      border-radius: 8px;
      min-width: 300px;
      max-width: 500px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: #333;
    }
    p {
      margin: 0 0 24px 0;
      color: #666;
    }
    .confirm-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .cancel-btn {
      background: #e0e0e0;
      color: #333;
    }
    .cancel-btn:hover {
      background: #d0d0d0;
    }
    .confirm-btn {
      background: #1976d2;
      color: white;
    }
    .confirm-btn:hover {
      background: #1565c0;
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() title = '';
  @Input() message = '';
  @Input() confirmText = '';
  @Input() cancelText = '';

  private result: boolean | null = null;
  private resolve: ((value: boolean) => void) | null = null;

  getResult(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.resolve = resolve;
    });
  }

  onConfirm(): void {
    this.result = true;
    this.close();
  }

  onCancel(): void {
    this.result = false;
    this.close();
  }

  private close(): void {
    if (this.resolve) {
      this.resolve(this.result ?? false);
      this.resolve = null;
    }
  }
}
