import { Injectable } from '@angular/core';
import { DonjaraTileClassifier } from 'src/app/shared/classes/donjara-tile-classifier/donjara-tile-classifier';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ClassifierService {
  private classifier = new DonjaraTileClassifier({
    modelBaseUrl: environment.modelBaseUrl,
  });

  constructor() {}

  async initialize() {
    await this.classifier.initialize();
  }

  public getCameraPreviewStream() {
    return this.classifier.getPreviewMediaStream();
  }

  public get onClassified$() {
    return this.classifier.onClassified$;
  }

  async start() {
    return this.classifier.start();
  }

  async stop() {
    return this.classifier.stop();
  }
}
