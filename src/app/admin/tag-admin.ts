import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TagsService } from '../recipes/services/tags.service';
import { NotificationService } from '../core/services/notification';
import { Messages } from '../core/messages';

@Component({
  selector: 'app-tag-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tag-admin.html',
  styleUrl: './tag-admin.css'
})
export class TagAdmin implements OnInit {
  private readonly tagsService = inject(TagsService);
  private readonly notify = inject(NotificationService);

  protected readonly messages = Messages;

  readonly tags = signal<string[]>([]);
  readonly newTag = signal('');
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.tagsService.getAll().subscribe({
      next: tags => {
        this.tags.set(Array.isArray(tags) ? tags : []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notify.show(Messages.admin.tagsLoadFailed, 'error');
      }
    });
  }

  addTag(): void {
    const tag = this.newTag().trim();
    if (!tag) {
      return;
    }
    if (this.isSaving()) {
      return;
    }
    this.isSaving.set(true);
    this.tagsService.create(tag).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.newTag.set('');
        this.notify.show(Messages.admin.tagCreated, 'success');
        this.load();
      },
      error: () => {
        this.isSaving.set(false);
        this.notify.show(Messages.admin.tagCreateFailed, 'error');
      }
    });
  }

  confirmDelete(tag: string): void {
    if (!window.confirm(Messages.admin.tagDeleteConfirm.replace('{tag}', tag))) {
      return;
    }
    this.tagsService.delete(tag).subscribe({
      next: () => {
        this.notify.show(Messages.admin.tagDeleted, 'success');
        this.load();
      },
      error: () => this.notify.show(Messages.admin.tagDeleteFailed, 'error')
    });
  }
}
