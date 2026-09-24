import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RecipeFormService } from './recipe-form.service';
import { RecipeViewAdapter } from '../adapters/recipe-view.adapter';
import { RecipeDto } from '../models/recipe-dto.model';

describe('RecipeFormService', () => {
  let service: RecipeFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecipeFormService,
        RecipeViewAdapter
      ]
    });

    service = TestBed.inject(RecipeFormService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should build payload with canonical fields only', () => {
    const payload = service.buildPayload({
      title: 'Test Recipe',
      description: 'Test description',
      source: 'Test source',
      isPublic: true,
      editSource: null,
      tagRows: [],
      ingredientRows: [],
      stepRows: []
    });

    expect(payload.name).toBe('Test Recipe');
    expect(payload.description).toBe('Test description');
    expect(payload.source).toBe('Test source');
    expect(payload.tags).toEqual([]);
    expect(payload.published).toBe(true);
    expect(payload.userName).toBe('');
    expect(payload.ingredients).toEqual([]);
    expect(payload.steps).toEqual([]);

    expect(payload).not.toHaveProperty('title');
    expect(payload).not.toHaveProperty('recipeName');
    expect(payload).not.toHaveProperty('opis');
    expect(payload).not.toHaveProperty('recipeDescription');
    expect(payload).not.toHaveProperty('ingredientDtoList');
    expect(payload).not.toHaveProperty('recipeSteps');
  });

  it('should copy existing fields when editing', () => {
    const existing: RecipeDto = {
      recipeId: 1,
      name: 'Old Name',
      description: 'Old Description',
      source: 'Old Source',
      tags: ['tag1'],
      published: false,
      userName: 'user1'
    };

    const payload = service.buildPayload({
      title: 'New Title',
      description: 'New Description',
      source: 'New Source',
      isPublic: true,
      editSource: existing,
      tagRows: [],
      ingredientRows: [],
      stepRows: []
    });

    expect(payload.name).toBe('New Title');
    expect(payload.description).toBe('New Description');
    expect(payload.source).toBe('New Source');
    expect(payload.published).toBe(true);
  });
});
