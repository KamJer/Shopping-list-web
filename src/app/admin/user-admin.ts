import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserAdminService } from './services/user-admin.service';
import { UserAdmin as UserAdminModel } from './models/user-admin.model';
import { TokenService } from '../core/services/token.service';
import { NotificationService } from '../core/services/notification';
import { Messages } from '../core/messages';

@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-admin.html',
  styleUrl: './user-admin.css'
})
export class UserAdmin implements OnInit {
  private readonly userAdminService = inject(UserAdminService);
  private readonly tokenService = inject(TokenService);
  private readonly notify = inject(NotificationService);

  protected readonly messages = Messages;

  readonly users = signal<UserAdminModel[]>([]);
  readonly isLoading = signal(false);
  readonly passwordDialogOpen = signal(false);
  readonly editingUser = signal<UserAdminModel | null>(null);
  readonly passwordError = signal<string | null>(null);
  newPassword = '';
  confirmPassword = '';
  currentUser: string | null = this.tokenService.getUserName();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.userAdminService.getAll().subscribe({
      next: users => {
        this.users.set(Array.isArray(users) ? users : []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notify.show(Messages.admin.usersLoadFailed, 'error');
      }
    });
  }

  isCurrentUser(user: UserAdminModel): boolean {
    return (
      !!this.currentUser &&
      user.userName.toLowerCase() === this.currentUser.toLowerCase()
    );
  }

  changeRole(user: UserAdminModel): void {
    if (user.role === 'SUPER_ADMIN') {
      this.notify.show(Messages.admin.cannotModifySuperAdmin, 'warn');
      return;
    }
    const targetRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const confirmText =
      targetRole === 'ADMIN'
        ? Messages.admin.promoteConfirm
        : Messages.admin.demoteConfirm;
    if (!window.confirm(confirmText.replace('{user}', user.userName))) {
      return;
    }
    this.userAdminService.changeRole(user.userName, targetRole).subscribe({
      next: () => {
        this.notify.show(Messages.admin.roleChanged, 'success');
        this.load();
      },
      error: () => this.notify.show(Messages.admin.roleChangeFailed, 'error')
    });
  }

  deleteUser(user: UserAdminModel): void {
    if (user.role === 'SUPER_ADMIN') {
      this.notify.show(Messages.admin.cannotModifySuperAdmin, 'warn');
      return;
    }
    if (!window.confirm(Messages.admin.deleteConfirm.replace('{user}', user.userName))) {
      return;
    }
    this.userAdminService.deleteUser(user.userName).subscribe({
      next: () => {
        this.notify.show(Messages.admin.userDeleted, 'success');
        this.load();
      },
      error: () => this.notify.show(Messages.admin.userDeleteFailed, 'error')
    });
  }

  openPasswordDialog(user: UserAdminModel): void {
    if (user.role === 'SUPER_ADMIN') {
      this.notify.show(Messages.admin.cannotModifySuperAdmin, 'warn');
      return;
    }
    this.editingUser.set(user);
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError.set(null);
    this.passwordDialogOpen.set(true);
    queueMicrotask(() => document.getElementById('new-password-input')?.focus());
  }

  closePasswordDialog(): void {
    this.passwordDialogOpen.set(false);
    this.editingUser.set(null);
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError.set(null);
  }

  savePassword(): void {
    const user = this.editingUser();
    if (!user) {
      return;
    }
    const password = this.newPassword;
    if (!password) {
      this.passwordError.set(Messages.admin.passwordRequired);
      return;
    }
    if (password.length < 8 || password.length > 64) {
      this.passwordError.set(Messages.admin.passwordTooShort);
      return;
    }
    if (password !== this.confirmPassword) {
      this.passwordError.set(Messages.admin.passwordMismatch);
      return;
    }
    this.userAdminService.changePassword(user.userName, password).subscribe({
      next: () => {
        this.closePasswordDialog();
        this.notify.show(Messages.admin.passwordChanged, 'success');
      },
      error: () => {
        this.closePasswordDialog();
        this.notify.show(Messages.admin.passwordChangeFailed, 'error');
      }
    });
  }
}
