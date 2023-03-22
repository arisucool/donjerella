import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { ClassifierService } from '../../services/classifier.service';

@Component({
  selector: 'app-classifier',
  templateUrl: './classifier.component.html',
  styleUrls: ['./classifier.component.scss'],
})
export class ClassifierComponent implements OnInit, OnDestroy {
  public previewMediaStream?: MediaStream;

  constructor(
    public classifierService: ClassifierService,
    public snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    try {
      await this.classifierService.initialize();
      this.previewMediaStream = this.classifierService.getCameraPreviewStream();
      await this.classifierService.start();
    } catch (e: any) {
      this.snackBar.open(`エラー: ${e.message}`);
    }
  }

  ngOnDestroy() {}
}
