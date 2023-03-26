import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExternalScannerComponent } from './pages/external-scanner/external-scanner.component';
import { NaviHomePageComponent } from './pages/navi-home-page/navi-home-page.component';

const routes: Routes = [
  {
    path: '',
    component: NaviHomePageComponent,
  },
  {
    path: 'external/scanner',
    component: ExternalScannerComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NaviRoutingModule {}
