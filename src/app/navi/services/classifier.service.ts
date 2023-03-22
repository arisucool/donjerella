import { Injectable } from '@angular/core';
import { DonjaraTileClassifier } from 'src/app/shared/classes/donjara-tile-classifier/donjara-tile-classifier';

@Injectable({
  providedIn: 'root',
})
export class ClassifierService {
  private classifier = new DonjaraTileClassifier();

  constructor() {}

  async initialize() {
    await this.classifier.initialize();
  }

  public getCameraPreviewStream() {
    return this.classifier.getPreviewMediaStream();
  }

  async start() {
    return this.classifier.start();
  }

  async stop() {
    return this.classifier.stop();
  }
}
