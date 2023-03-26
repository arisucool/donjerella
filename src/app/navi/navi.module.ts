import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NaviHomePageComponent } from './pages/navi-home-page/navi-home-page.component';
import { NaviRoutingModule } from './navi-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ScannerComponent } from './widgets/scanner/scanner.component';
import { ExternalScannerComponent } from './pages/external-scanner/external-scanner.component';

@NgModule({
  declarations: [NaviHomePageComponent, ScannerComponent, ExternalScannerComponent],
  imports: [CommonModule, NaviRoutingModule, SharedModule],
})
export class NaviModule {}
