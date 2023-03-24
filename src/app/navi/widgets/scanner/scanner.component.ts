import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { interval } from 'rxjs';
import { DonjaraTileScannerResult } from 'src/app/shared/classes/donjara-tile-classifier/donjara-tile-scanner';
import { ScannerService } from '../../services/scanner.service';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss'],
})
export class ScannerComponent implements OnInit, OnDestroy {
  public previewMediaStream?: MediaStream;
  public isShowingCamera = true;
  public isTakingPhoto = false;

  @Output()
  onScanned = this.scannerService.onScanned$;

  @Output()
  onDismissed: EventEmitter<void> = new EventEmitter();

  @ViewChild('shutterButton')
  shutterButtonRef?: MatButton;

  constructor(
    public scannerService: ScannerService,
    public snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    this.initialize();
  }

  ngOnDestroy() {
    this.stop();
  }

  close() {
    console.log(`[ScannerComponent] close`);
    this.stop();
    this.onDismissed.emit();
  }

  async detect() {
    event!.stopPropagation();
    this.isTakingPhoto = true;

    let result: DonjaraTileScannerResult | undefined;
    try {
      result = await this.scannerService.detect();
    } catch (e: any) {
      console.error(e);
      this.snackBar.open(`エラー: ${e.message}`, 'OK');
    }

    if (!result || result?.tiles.length === 0) {
      this.snackBar.open(
        '牌を検出できませんでした。もう少し近づけてください。',
        undefined,
        {
          duration: 2000,
        }
      );
      this.isTakingPhoto = false;
      return;
    }

    interval(1500).subscribe(() => {
      this.isTakingPhoto = false;
      this.stop();
    });
  }

  private async initialize() {
    try {
      // カメラの起動
      let mes = this.snackBar.open('カメラを起動しています...');
      await this.scannerService.startCamera();
      this.isShowingCamera = true;
      mes.dismiss();

      // 学習モデルの読み込み
      mes = this.snackBar.open(
        '学習モデルを読み込んでいます... 初回は数十秒ほどかかる場合があります...'
      );
      await this.scannerService.initialize();
      mes.dismiss();

      // 検出の開始
      await this.start();
    } catch (e: any) {
      this.onFatalError(e);
      return;
    }
    this.previewMediaStream = this.scannerService.getCameraPreviewStream();

    // シャッターボタンにフォーカスを当てる
    this.setFocusToShutterButton();
  }

  private async start() {
    await this.scannerService.startLoop();
  }

  private async stop() {
    await this.scannerService.stopLoop();
    this.isShowingCamera = false;
  }

  private setFocusToShutterButton() {
    setTimeout(() => {
      if (this.shutterButtonRef === undefined) return;
      this.shutterButtonRef.focus();
    }, 100);
  }

  private onFatalError(e: any) {
    console.error(e);
    const mes = this.snackBar.open(`エラー: ${e.message}`, 'OK');
    mes.onAction().subscribe(() => {
      mes.dismiss();
      window.location.reload();
    });
  }
}
