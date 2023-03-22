import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'navi',
    loadChildren: () => import('./navi/navi.module').then((m) => m.NaviModule),
  },
  {
    path: '**',
    redirectTo: 'navi',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
