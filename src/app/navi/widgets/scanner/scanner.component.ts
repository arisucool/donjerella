import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { interval } from 'rxjs';
import { ScannerService } from '../../services/scanner.service';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss'],
})
export class ScannerComponent implements OnInit, OnDestroy {
  public previewMediaStream?: MediaStream;
  public onScanned$ = this.scannerService.onScanned$;
  public isTakingPhoto = false;

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

  async detect() {
    this.isTakingPhoto = true;
    try {
      await this.scannerService.detect();
    } catch (e: any) {
      console.error(e);
      this.snackBar.open(`エラー: ${e.message}`);
    }
    interval(3000).subscribe(() => {
      this.isTakingPhoto = false;
    });
  }
}
