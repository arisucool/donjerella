import { Injectable } from '@angular/core';
import {
  DonjaraTileScanner,
  DonjaraTileScannerResult,
} from '../../shared/classes/donjara-tile-scanner/donjara-tile-scanner';
import { environment } from '../../../environments/environment';
import { CgDonjaraTile } from '../../shared/interfaces/cg-donjara-tile';
import { TileDatabaseService } from './tile-database.service';

@Injectable({
  providedIn: 'root',
})
export class ScannerService {
  private classifier?: DonjaraTileScanner;

  constructor(private tileDatabaseService: TileDatabaseService) {}

  async initialize() {
    this.classifier = new DonjaraTileScanner({
      modelBaseUrl: environment.modelBaseUrl,
    });
    await this.classifier.initialize();
  }

  public getCameraPreviewStream() {
    return this.classifier!.getPreviewMediaStream();
  }

  public get onScanned$() {
    return this.classifier!.onScanned$;
  }

  public get onDetectionStatusChanged$() {
    return this.classifier!.onDetectionStatusChanged$;
  }

  async onVideoFrame(videoElement: HTMLVideoElement) {
    await this.classifier!.onVideoFrame(videoElement);
  }

  async detect() {
    return this.classifier!.detect();
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
    const EXAMPLE_TILE_IDENTIFIERS = [
      '0087',
      '0015',
      '0155',
      '0104',
      '0124',
      '0140',
      '0024',
      '0060',
    ];

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
