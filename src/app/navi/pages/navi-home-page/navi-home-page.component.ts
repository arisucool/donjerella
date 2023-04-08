import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DonjaraTileScannerResult } from 'src/app/shared/classes/donjara-tile-scanner/donjara-tile-scanner';
import {
  CgDonjaraHoldTile,
  CgDonjaraTile,
} from '../../interfaces/cg-donjara-tile';
import { CgUnit } from '../../interfaces/cg-unit';
import { NaviService } from '../../services/navi.service';
import { ScannerService } from '../../services/scanner.service';

@Component({
  selector: 'app-navi-home-page',
  templateUrl: './navi-home-page.component.html',
  styleUrls: ['../../../shared/style.scss', './navi-home-page.component.scss'],
})
export class NaviHomePageComponent implements OnInit {
  // 最新の認識結果
  public holdTiles: CgDonjaraHoldTile[] = [];
  // 推奨されるユニット一覧
  public recommendedUnits: CgUnit[] = [];
  // 選択中の手牌
  public selectedHoldTile: CgDonjaraHoldTile | undefined;

  // スキャナを実行中か
  public isLaunchingScanner = false;

  constructor(
    private naviService: NaviService,
    private scannerService: ScannerService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    this.holdTiles = [];
    if (!this.loadSession()) {
      // サンプルの手札を読み取る
      const cgTiles = await this.scannerService.getCgTilesByScannerResult(
        await this.scannerService.getExampleResult()
      );
      // 推奨される組み合わせを取得
      this.holdTiles = await this.naviService.groupingHoldTiles(cgTiles);
    }

    this.recommendedUnits = [];
  }

  async onScanned(result: DonjaraTileScannerResult) {
    this.isLaunchingScanner = false;
    const tiles = await this.scannerService.getCgTilesByScannerResult(result);
    this.holdTiles = await this.naviService.groupingHoldTiles(tiles);
    if (tiles.length > 0) {
      this.saveSession();
    }
    this.recommendedUnits = [];
  }

  onScannerDismissed() {
    this.isLaunchingScanner = false;
  }

  async onHoldTileSelect(tile: CgDonjaraTile) {
    this.selectedHoldTile = tile;
    this.recommendedUnits = await this.naviService.getRecommendedUnits(
      tile,
      this.holdTiles
    );
  }

  addHoldTile() {
    this.snackBar.open(`TODO: 本機能は実装中です`, undefined, {
      duration: 3000,
    });
  }

  fixWrongHoldTile(tile: CgDonjaraTile) {
    this.snackBar.open(`TODO: 本機能は実装中です`, undefined, {
      duration: 3000,
    });
  }

  removeHoldTile(tile: CgDonjaraTile) {
    this.holdTiles = this.holdTiles.filter(
      (t) => t.identifier !== tile.identifier
    );
    this.saveSession();

    this.snackBar.open(
      `手牌から "${tile.label}" の牌を捨てました。新しい牌を追加してください。`,
      undefined,
      {
        duration: 3000,
      }
    );
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
