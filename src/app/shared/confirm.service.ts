import { Injectable, ComponentRef, ApplicationRef, createComponent, EnvironmentInjector, inject } from '@angular/core';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private componentRef: ComponentRef<ConfirmDialogComponent> | null = null;

  ask(
    title: string,
    message: string,
    confirmText?: string,
    cancelText?: string
  ): Promise<boolean> {
    const componentRef = createComponent(ConfirmDialogComponent, {
      environmentInjector: this.envInjector
    });

    componentRef.instance.title = title;
    componentRef.instance.message = message;
    componentRef.instance.confirmText = confirmText ?? '';
    componentRef.instance.cancelText = cancelText ?? '';

    this.appRef.attachView(componentRef.hostView);
    const domElement = (componentRef.hostView as any).root as HTMLElement;
    document.body.appendChild(domElement);

    this.componentRef = componentRef;

    return componentRef.instance.getResult().finally(() => {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      this.componentRef = null;
    });
  }
}
