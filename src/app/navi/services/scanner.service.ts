import { Injectable } from '@angular/core';
import {
  DonjaraTileScanner,
  DonjaraTileScannerResult,
  DonjaraTileScannerResultItem,
} from 'src/app/shared/classes/donjara-tile-classifier/donjara-tile-scanner';
import { environment } from 'src/environments/environment';
import { CgDonjaraTile } from '../interfaces/cg-donjara-tile';
import { NaviService } from './navi.service';
import { TileDatabaseService } from './tile-database.service';

@Injectable({
  providedIn: 'root',
})
export class ScannerService {
  private classifier = new DonjaraTileScanner({
    modelBaseUrl: environment.modelBaseUrl,
  });

  constructor(
    private naviService: NaviService,
    private tileDatabaseService: TileDatabaseService
  ) {}

  async initialize() {
    await this.classifier.initialize();
  }

  public getCameraPreviewStream() {
    return this.classifier.getPreviewMediaStream();
  }

  public get onScanned$() {
    return this.classifier.onScanned$;
  }

  async startCamera() {
    return this.classifier.startCamera();
  }

  async startLoop() {
    return this.classifier.startLoop();
  }

  async detect() {
    return this.classifier.detect();
  }

  async stopLoop() {
    return this.classifier.stopLoop();
  }

  async getCgTilesByScannerResult(
    result: DonjaraTileScannerResult
  ): Promise<CgDonjaraTile[]> {
    const tiles: CgDonjaraTile[] = [];
    for (const item of result.tiles) {
      const tile = await this.tileDatabaseService.getTileByIdentifier(
        item.top.identifier
      );
      if (tile) {
        tiles.push(tile);
      }
    }
    return tiles;
  }

  async getExampleResult(): Promise<DonjaraTileScannerResult> {
    const EXAMPLE_TILE_IDENTIFIERS = ['0087'];

    let result: DonjaraTileScannerResult = {
      tiles: [],
    };

    for (const identifier of EXAMPLE_TILE_IDENTIFIERS) {
      const tile = await this.tileDatabaseService.getTileByIdentifier(
        identifier
      );
      if (!tile) {
        continue;
      }
      result.tiles.push({
        top: tile,
        imageDataUrl: 'assets/example-tiles/' + identifier + '.png',
        predicts: [tile],
      });
    }

    return result;
  }
}
