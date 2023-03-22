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
  public onClassified$ = this.classifierService.onClassified$;

  constructor(
    public classifierService: ClassifierService,
    public snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    try {
      await this.classifierService.initialize();
      window.setTimeout(() => {
        this.previewMediaStream =
          this.classifierService.getCameraPreviewStream();
      }, 1000);
      await this.classifierService.start();
    } catch (e: any) {
      console.error(e);
      this.snackBar.open(`エラー: ${e.message}`);
    }
  }

  ngOnDestroy() {}
}
