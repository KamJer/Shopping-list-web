import { Component, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { NotificationService } from '../services/notification';

@Component({
  selector: 'app-notification-banner',
  standalone: true,
  imports: [AsyncPipe, NgIf],
  templateUrl: './notification-banner.html',
  styleUrl: './notification-banner.css'
})
export class NotificationBanner {
  private readonly notify = inject(NotificationService);
  protected readonly message$ = this.notify.currentMessage$;

  protected dismiss(): void {
    this.notify.clear();
  }
}
