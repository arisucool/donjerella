import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NaviHomePageComponent } from './pages/navi-home-page/navi-home-page.component';
import { NaviRoutingModule } from './navi-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [NaviHomePageComponent],
  imports: [CommonModule, NaviRoutingModule, SharedModule],
})
export class NaviModule {}
