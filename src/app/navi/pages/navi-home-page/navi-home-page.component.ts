import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { lastValueFrom } from 'rxjs';
import { DonjaraTileScannerResult } from 'src/app/shared/classes/donjara-tile-scanner/donjara-tile-scanner';
import {
  CgDonjaraHoldTile,
  CgDonjaraTile,
} from '../../../shared/interfaces/cg-donjara-tile';
import { CgUnit } from '../../../shared/interfaces/cg-unit';
import { NaviService } from '../../services/navi.service';
import { ScannerService } from '../../services/scanner.service';
import { TileDatabaseService } from '../../services/tile-database.service';
import { TileSelectorDialogComponent } from '../../widgets/tile-selector-dialog/tile-selector-dialog.component';

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
    private snackBar: MatSnackBar,
    private dialog: MatDialog
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
    if (this.selectedHoldTile?.identifier === tile.identifier) {
      this.resetHoldTileSelect();
      return;
    }

    this.selectedHoldTile = tile;
    this.recommendedUnits = await this.naviService.getRecommendedUnits(
      tile,
      this.holdTiles
    );
  }

  resetHoldTileSelect() {
    this.selectedHoldTile = undefined;
    this.recommendedUnits = [];
  }

  async addHoldTile() {
    // ダイアログを開く
    const dialogRef = this.dialog.open(TileSelectorDialogComponent, {
      data: {
        title: '手牌を追加',
        excludeTiles: this.holdTiles,
      },
      panelClass: 'full-width-dialog',
    });

    const result = await lastValueFrom(dialogRef.afterClosed());
    if (!result) return;

    // 手牌に追加
    this.holdTiles.push({
      ...result,
    });

    // 推奨される組み合わせを取得
    this.holdTiles = await this.naviService.groupingHoldTiles(this.holdTiles);

    // 選択を解除
    this.resetHoldTileSelect();
  }

  async fixWrongHoldTile(tile: CgDonjaraTile) {
    // ダイアログを開く
    const dialogRef = this.dialog.open(TileSelectorDialogComponent, {
      data: {
        title: '正しい牌を選択',
      },
      panelClass: 'full-width-dialog',
    });

    const result = await lastValueFrom(dialogRef.afterClosed());
    if (!result) return;

    // 誤った牌と交換
    this.holdTiles = this.holdTiles.map((t) => {
      if (t.identifier === tile.identifier) {
        return {
          ...result,
        };
      }
      return t;
    });

    // 推奨される組み合わせを取得
    this.holdTiles = await this.naviService.groupingHoldTiles(this.holdTiles);

    // 選択を解除
    this.resetHoldTileSelect();
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
        duration: 2000,
      }
    );
  }

  /**
   * 手牌をおすすめ順に並び替え
   */
  sortHoldTiles() {
    this.holdTiles.sort((a, b) => {
      const labelA = a.suggestedGroup?.groupingLabel || 'ZZ';
      const labelB = b.suggestedGroup?.groupingLabel || 'ZZ';
      return labelA.localeCompare(labelB);
    });
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
