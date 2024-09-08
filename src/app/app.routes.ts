import { Routes } from '@angular/router';
import { DiffComponent } from './views/diff/diff.component';

export const routes: Routes = [
  {
    path: 'tabs/:id',
    component: DiffComponent,
  },
];
