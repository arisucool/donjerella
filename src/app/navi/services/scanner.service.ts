import { Injectable } from '@angular/core';
import { DonjaraTileScanner } from 'src/app/shared/classes/donjara-tile-classifier/donjara-tile-scanner';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ScannerService {
  private classifier = new DonjaraTileScanner({
    modelBaseUrl: environment.modelBaseUrl,
  });

  constructor() {}

  async initialize() {
    await this.classifier.initialize();
  }

  public getCameraPreviewStream() {
    return this.classifier.getPreviewMediaStream();
  }

  public get onScanned$() {
    return this.classifier.onScanned$;
  }

  async start() {
    return this.classifier.start();
  }

  async detect() {
    return this.classifier.detect();
  }

  async stop() {
    return this.classifier.stop();
  }
}
