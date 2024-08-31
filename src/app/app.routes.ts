import { Routes } from '@angular/router';
import { TabsComponent } from './tabs/tabs.component';

export const routes: Routes = [
  {
    path: 'tabs/:id',
    component: TabsComponent,
  },
];
