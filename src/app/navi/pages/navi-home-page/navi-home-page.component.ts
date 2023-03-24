import { Component, OnInit } from '@angular/core';
import { DonjaraTileScannerResult } from 'src/app/shared/classes/donjara-tile-classifier/donjara-tile-scanner';
import { CgDonjaraTile } from '../../interfaces/cg-donjara-tile';
import { CgUnit } from '../../interfaces/cg-unit';
import { NaviService } from '../../services/navi.service';
import { ScannerService } from '../../services/scanner.service';

@Component({
  selector: 'app-navi-home-page',
  templateUrl: './navi-home-page.component.html',
  styleUrls: ['./navi-home-page.component.scss'],
})
export class NaviHomePageComponent implements OnInit {
  // 最新の認識結果
  public holdTiles: CgDonjaraTile[] = [];
  // 推奨されるユニット一覧
  public recommendedUnits: CgUnit[] = [];

  // スキャナを実行中か
  public isLaunchingScanner = false;

  constructor(
    private naviService: NaviService,
    private scannerService: ScannerService
  ) {}

  async ngOnInit() {
    this.holdTiles = [];
    if (!this.loadSession()) {
      this.holdTiles = await this.scannerService.getCgTilesByScannerResult(
        await this.scannerService.getExampleResult()
      );
    }

    this.recommendedUnits =
      await this.naviService.getRecommendedUnitsByHoldTiles(this.holdTiles);
  }

  async onScanned(result: DonjaraTileScannerResult) {
    this.isLaunchingScanner = false;
    const tiles = await this.scannerService.getCgTilesByScannerResult(result);
    this.holdTiles = tiles;
    if (tiles.length > 0) {
      this.saveSession();
    }
    this.recommendedUnits =
      await this.naviService.getRecommendedUnitsByHoldTiles(tiles);
  }

  onScannerDismissed() {
    this.isLaunchingScanner = false;
  }

  private loadSession() {
    const holdTiles = window.sessionStorage.getItem('holdTiles');
    if (holdTiles) {
      try {
        this.holdTiles = JSON.parse(holdTiles);
        return true;
      } catch (e) {}
    }
    return false;
  }

  private saveSession() {
    window.sessionStorage.setItem('holdTiles', JSON.stringify(this.holdTiles));
  }
}
