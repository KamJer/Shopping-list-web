import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appFocus]',
  standalone: true
})
export class FocusDirective implements OnChanges {
  @Input('appFocus') when = false;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['when'] && this.when) {
      this.focus();
    }
  }

  private focus(): void {
    queueMicrotask(() => {
      this.el.nativeElement?.focus();
    });
  }
}
