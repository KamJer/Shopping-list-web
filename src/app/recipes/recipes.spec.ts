import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Recipes } from './recipes';
import { RecipesService } from './recipes.service';
import { of } from 'rxjs';
import { ConfirmService } from '../shared/confirm.service';

describe('Recipes', () => {
  let component: Recipes;
  let fixture: ComponentFixture<Recipes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recipes],
      providers: [
        {
          provide: RecipesService,
          useValue: {
            getAll: () => of({ content: [], page: 0, size: 10, totalPages: 0, totalElements: 0 }),
            getByName: () => of({ content: [], page: 0, size: 10, totalPages: 0, totalElements: 0 }),
            getByRequiredProducts: () => of({ content: [], page: 0, size: 10, totalPages: 0, totalElements: 0 }),
            getByTags: () => of({ content: [], page: 0, size: 10, totalPages: 0, totalElements: 0 }),
            getRecipesForUser: () =>
              of({ content: [], page: 0, size: 10, totalPages: 0, totalElements: 0 }),
            saveRecipe: () => of({}),
            deleteRecipe: () => of({})
          }
        },
        {
          provide: ConfirmService,
          useValue: {
            ask: () => Promise.resolve(true)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Recipes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
