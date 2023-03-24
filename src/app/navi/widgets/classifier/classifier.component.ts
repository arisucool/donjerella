import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScannerService } from '../../services/scanner.service';

@Component({
  selector: 'app-classifier',
  templateUrl: './classifier.component.html',
  styleUrls: ['./classifier.component.scss'],
})
export class ClassifierComponent implements OnInit, OnDestroy {
  public previewMediaStream?: MediaStream;
  public onScanned$ = this.scannerService.onScanned$;

  constructor(
    public scannerService: ScannerService,
    public snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    try {
      await this.scannerService.initialize();
      window.setTimeout(() => {
        this.previewMediaStream = this.scannerService.getCameraPreviewStream();
      }, 1000);
      await this.scannerService.start();
    } catch (e: any) {
      console.error(e);
      this.snackBar.open(`エラー: ${e.message}`);
    }
  }

  ngOnDestroy() {}

  detect() {
    return this.scannerService.detect();
  }
}
