import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NaviHomePageComponent } from './pages/navi-home-page/navi-home-page.component';

const routes: Routes = [
  {
    path: '',
    component: NaviHomePageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NaviRoutingModule {}
