import { Pipe, PipeTransform } from '@angular/core';
import { RecipeDto } from '../models/recipe-dto.model';
import { RecipeViewAdapter } from './recipe-view.adapter';

@Pipe({
  name: 'recipeView',
  pure: true
})
export class RecipeViewPipe implements PipeTransform {
  constructor(private readonly adapter: RecipeViewAdapter) {}

  transform(recipe: RecipeDto): RecipeViewAdapter {
    return this.adapter;
  }
}
