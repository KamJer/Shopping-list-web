import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-static-page',
  standalone: true,
  template: `
    <section class="static-page">
      <h2>{{ title }}</h2>
      <p>This page is ready for content.</p>
    </section>
  `,
  styles: [`
    .static-page {
      max-width: 760px;
      margin: 20px auto;
      padding: 16px;
      background: #ffffff;
      border: 1px solid #d9deea;
      border-radius: 10px;
      color: #2f3642;
      font-family: Arial, sans-serif;
    }
    h2 {
      margin: 0 0 8px;
    }
    p {
      margin: 0;
      color: #616b7b;
    }
  `]
})
export class StaticPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly title = this.route.snapshot.data['title'] ?? 'Page';
}
