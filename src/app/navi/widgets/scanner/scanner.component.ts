import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { interval, Subscription, timer } from 'rxjs';
import { DonjaraTileScannerResult } from 'src/app/shared/classes/donjara-tile-classifier/donjara-tile-scanner';
import { ScannerService } from '../../services/scanner.service';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss'],
})
export class ScannerComponent implements OnInit, OnDestroy {
  // 検出が完了したときのイベント
  @Output()
  onScanned: EventEmitter<DonjaraTileScannerResult> = new EventEmitter();

  // キャンセルしたときのイベント
  @Output()
  onDismissed: EventEmitter<void> = new EventEmitter();

  // 状態
  public status: 'initializing' | 'ready' | 'processing' | 'error' =
    'initializing';

  // カメラ映像を再生するための Video 要素
  @ViewChild('cameraVideo')
  cameraVideoElement!: ElementRef<HTMLVideoElement>;

  // カメラ映像のストリーム
  public cameraVideoStream?: MediaStream;

  // プレビュー映像のストリーム
  public previewMediaStream?: MediaStream;

  // オブジェクト検出の状態
  public numOfDetections: number = 0;

  // オブジェクト検出の状態変化を取得するための Subscription
  private onDetectionStatusChangedSubscription?: Subscription;

  // シャッターボタンの要素
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
    this.stopCamera();

    if (this.onDetectionStatusChangedSubscription) {
      this.onDetectionStatusChangedSubscription.unsubscribe();
    }
  }

  close() {
    console.log(`[ScannerComponent] close`);
    this.onDismissed.emit();
  }

  async onClickShutterButton() {
    event!.stopPropagation();
    this.detect();
  }

  async detect() {
    this.status = 'processing';

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
      this.status = 'ready';
      return;
    }

    timer(1000).subscribe(() => {
      this.snackBar.open(
        `${result!.tiles.length} 個の牌を検出しました`,
        undefined,
        {
          duration: 2000,
        }
      );
      this.status = 'ready';
      this.stopCamera();
      this.onScanned.next(result!);
    });
  }

  private async initialize() {
    this.status = 'initializing';

    try {
      // イベントの購読
      this.onDetectionStatusChangedSubscription =
        this.scannerService.onDetectionStatusChanged$.subscribe(
          (numOfDetections: number) => {
            // オブジェクト検出の状態が変化したとき
            this.numOfDetections = numOfDetections;
          }
        );

      // カメラの起動
      let mes = this.snackBar.open('カメラを起動しています...');
      await this.initCamera();
      mes.dismiss();

      // 学習モデルの読み込み
      mes = this.snackBar.open(
        '学習モデルを読み込んでいます... 初回は数十秒ほどかかる場合があります...'
      );
      await this.scannerService.initialize();
      mes.dismiss();
    } catch (e: any) {
      this.onFatalError(e);
      return;
    }
    this.previewMediaStream = this.scannerService.getCameraPreviewStream();

    // シャッターボタンにフォーカスを当てる
    this.setFocusToShutterButton();

    // 完了
    this.status = 'ready';
  }

  private async initCamera() {
    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          facingMode: 'environment',
        },
        audio: false,
      });
    } catch (e: any) {
      if (e.message === 'Permission denied') {
        const message = this.snackBar.open(
          `エラー: 「カメラへのアクセス」を許可してから、ページを再読み込みしてください`,
          '再読み込み'
        );
        message.onAction().subscribe(() => {
          window.location.reload();
        });
        return;
      }
      this.snackBar.open(`カメラが使用できません... ${e.message}`, 'OK');
      return;
    }

    if (!stream) {
      this.snackBar.open(`カメラが使用できません`, 'OK');
      return;
    }

    this.cameraVideoStream = stream;
    await this.waitForCameraVideoFrame();
    await this.onCameraVideoFrame();
  }

  private async onCameraVideoFrame() {
    const videoElement = this.cameraVideoElement?.nativeElement;
    if (!videoElement) return;

    if (videoElement.paused || videoElement.ended) {
      return;
    }

    await this.scannerService.onVideoFrame(videoElement);
    await new Promise(requestAnimationFrame);
    this.onCameraVideoFrame();
  }

  private waitForCameraVideoFrame(
    i: number = 0,
    resolver?: any
  ): Promise<void> {
    console.log(`[ScannerComponent] waitForCameraVideoFrame`, i, resolver);
    return new Promise((resolve) => {
      const waitTimer = setInterval(() => {
        const videoElement = this.cameraVideoElement?.nativeElement;
        if (!videoElement) return;

        if (!videoElement.paused && !videoElement.ended) {
          clearInterval(waitTimer);
          resolve();
        }
      }, 500);
    });
  }

  private stopCamera() {
    if (this.cameraVideoStream) {
      this.cameraVideoStream.getTracks().forEach((track) => track.stop());
    }

    if (this.cameraVideoElement) {
      this.cameraVideoElement.nativeElement.pause();
    }
  }

  private setFocusToShutterButton() {
    setTimeout(() => {
      if (this.shutterButtonRef === undefined) return;
      this.shutterButtonRef.focus();
    }, 100);
  }

  private onFatalError(e: any) {
    this.status = 'error';
    console.error(e);
    const mes = this.snackBar.open(`エラー: ${e.message}`, '再読み込み');
    mes.onAction().subscribe(() => {
      mes.dismiss();
      window.location.reload();
    });
  }
}
