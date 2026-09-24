import { describe, it, expect } from 'vitest';
import { RecipeViewAdapter } from './recipe-view.adapter';
import { RecipeDto } from '../models/recipe-dto.model';

describe('RecipeViewAdapter', () => {
  let adapter: RecipeViewAdapter;

  beforeEach(() => {
    adapter = new RecipeViewAdapter();
  });

  it('should create', () => {
    expect(adapter).toBeTruthy();
  });

  it('should get recipe name from name field', () => {
    const recipe: RecipeDto = { name: 'Test Recipe', description: '', source: '', tags: [], published: false, userName: '' };
    expect(adapter.getRecipeName(recipe)).toBe('Test Recipe');
  });

  it('should return default name when name is missing', () => {
    const recipe: RecipeDto = { name: '', description: '', source: '', tags: [], published: false, userName: '' };
    expect(adapter.getRecipeName(recipe)).toBe('Przepis');
  });

  it('should get description from description field', () => {
    const recipe: RecipeDto = { name: 'Test', description: 'Test description', source: '', tags: [], published: false, userName: '' };
    expect(adapter.getDescriptionPlain(recipe)).toBe('Test description');
  });

  it('should return empty description when description is missing', () => {
    const recipe: RecipeDto = { name: 'Test', description: '', source: '', tags: [], published: false, userName: '' };
    expect(adapter.getDescriptionPlain(recipe)).toBe('');
  });

  it('should get tags from tags field', () => {
    const recipe: RecipeDto = { name: 'Test', description: '', source: '', tags: ['tag1', 'tag2'], published: false, userName: '' };
    expect(adapter.getTags(recipe)).toEqual(['tag1', 'tag2']);
  });

  it('should return empty tags when tags is missing', () => {
    const recipe: RecipeDto = { name: 'Test', description: '', source: '', tags: [], published: false, userName: '' };
    expect(adapter.getTags(recipe)).toEqual([]);
  });

  it('should get steps from steps field', () => {
    const recipe: RecipeDto = {
      name: 'Test',
      description: '',
      source: '',
      tags: [],
      published: false,
      userName: '',
      steps: [{ stepNumber: 1, description: 'Step 1' }, { stepNumber: 2, description: 'Step 2' }]
    };
    expect(adapter.getSteps(recipe)).toEqual(['Step 1', 'Step 2']);
  });

  it('should return empty steps when steps is missing', () => {
    const recipe: RecipeDto = { name: 'Test', description: '', source: '', tags: [], published: false, userName: '' };
    expect(adapter.getSteps(recipe)).toEqual([]);
  });

  it('should get source from source field', () => {
    const recipe: RecipeDto = { name: 'Test', description: '', source: 'Test source', tags: [], published: false, userName: '' };
    expect(adapter.getSource(recipe)).toBe('Test source');
  });

  it('should get recipe owner from userName field', () => {
    const recipe: RecipeDto = { name: 'Test', description: '', source: '', tags: [], published: false, userName: 'user1' };
    expect(adapter.getRecipeOwner(recipe)).toBe('user1');
  });

  it('should return null owner when userName is missing', () => {
    const recipe: RecipeDto = { name: 'Test', description: '', source: '', tags: [], published: false, userName: '' };
    expect(adapter.getRecipeOwner(recipe)).toBeNull();
  });

  it('should get published flag from published field', () => {
    const recipe: RecipeDto = { name: 'Test', description: '', source: '', tags: [], published: true, userName: '' };
    expect(adapter.readRecipePublicFlag(recipe)).toBe(true);
  });

  it('should return false published when published is missing', () => {
    const recipe: RecipeDto = { name: 'Test', description: '', source: '', tags: [], published: false, userName: '' };
    expect(adapter.readRecipePublicFlag(recipe)).toBe(false);
  });

  it('should get recipe id from recipeId field', () => {
    const recipe: RecipeDto = { name: 'Test', description: '', source: '', tags: [], published: false, userName: '', recipeId: 123 };
    expect(adapter.getRecipeIdForApi(recipe)).toBe(123);
  });

  it('should return null recipe id when recipeId is missing', () => {
    const recipe: RecipeDto = { name: 'Test', description: '', source: '', tags: [], published: false, userName: '' };
    expect(adapter.getRecipeIdForApi(recipe)).toBeNull();
  });
});
