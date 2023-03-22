import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NaviHomePageComponent } from './pages/navi-home-page/navi-home-page.component';
import { NaviRoutingModule } from './navi-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ClassifierComponent } from './widgets/classifier/classifier.component';

@NgModule({
  declarations: [NaviHomePageComponent, ClassifierComponent],
  imports: [CommonModule, NaviRoutingModule, SharedModule],
})
export class NaviModule {}
