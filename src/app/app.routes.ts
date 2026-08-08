import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/guards/auth.guard';
import { Login } from './login/login';
import { ShoppingList } from './shopping-list/shopping-list';
import { Units } from './units/units';
import { Bought } from './bought/bought';
import { Recipes } from './recipes/recipes';
import { RecipeDetail } from './recipes/recipe-detail';
import { AdminDashboard } from './admin/admin-dashboard';
import { UserAdmin } from './admin/user-admin';
import { RecipeAdmin } from './admin/recipe-admin';
import { TagAdmin } from './admin/tag-admin';

export const routes: Routes = [
  { path: '', component: Login, canActivate: [guestGuard] },
  { path: 'list', component: ShoppingList, canActivate: [authGuard] },
  { path: 'units', component: Units, canActivate: [authGuard] },
  { path: 'bought', component: Bought, canActivate: [authGuard] },
  { path: 'recipes/:id', component: RecipeDetail, canActivate: [authGuard] },
  { path: 'recipes', component: Recipes, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboard, canActivate: [authGuard, adminGuard] },
  { path: 'admin/users', component: UserAdmin, canActivate: [authGuard, adminGuard] },
  { path: 'admin/recipes', component: RecipeAdmin, canActivate: [authGuard, adminGuard] },
  { path: 'admin/tags', component: TagAdmin, canActivate: [authGuard, adminGuard] }
];
