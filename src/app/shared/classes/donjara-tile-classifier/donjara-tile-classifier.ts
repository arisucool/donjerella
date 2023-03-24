import { Subject } from 'rxjs';
import { TileClassifier } from './internals/tile-classifier';
import { TileDetector } from './internals/tile-detector';
import { TileSurfaceExtractor } from './internals/tile-surface-extractor';

export interface DonjaraTileClassifierResultItem {
  identifier: string;
  label: string;
  pack: 'initial' | 'expansion';
  status?: 'normal' | 'reached';
  score: number;
}

export interface DonjaraTileClassifierResult {
  tiles: {
    top: DonjaraTileClassifierResultItem;
    predicts: DonjaraTileClassifierResultItem[];
    imageDataUrl: string;
  }[];
}

export class DonjaraTileClassifier {
  // 入力映像
  static readonly DEFAULT_MEDIA_STREAM_CONSTRAINTS: MediaStreamConstraints = {
    video: {
      facingMode: 'environment',
    },
    audio: false,
  };
  private inputMediaStream: MediaStream | undefined;
  private inputVideoElement: HTMLVideoElement | undefined;

  // 入力映像からフレームを抽出するためのキャンバス
  private inputFrameCanvas: HTMLCanvasElement | undefined;
  private inputFrameCanvasContext: CanvasRenderingContext2D | undefined;

  // プレビュー映像
  private previewCanvas: HTMLCanvasElement | undefined;
  private previewCanvasContext: CanvasRenderingContext2D | undefined;
  private previewMediaStream: MediaStream | undefined;

  // 検出結果を返すためのイベント
  private onClassified = new Subject<DonjaraTileClassifierResult>();
  public onClassified$ = this.onClassified.asObservable();

  // オブジェクト検出器
  private tileDetector!: TileDetector;

  // パイの表面領域の抽出器
  private tileSurfaceExtractor!: TileSurfaceExtractor;

  // パイの表面領域の分類器
  private tileClassifier!: TileClassifier;

  constructor(params: { modelBaseUrl: string }) {
    this.tileDetector = new TileDetector({
      modelBaseUrl: params.modelBaseUrl,
    });
    this.tileSurfaceExtractor = new TileSurfaceExtractor();
    this.tileClassifier = new TileClassifier({
      modelBaseUrl: params.modelBaseUrl,
    });
  }

  async initialize() {
    // プレビュー映像生成用キャンバスを初期化
    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.width = 100;
    this.previewCanvas.height = 100;
    this.previewCanvasContext =
      this.previewCanvas.getContext('2d') ?? undefined;
    if (this.previewCanvasContext === undefined) {
      throw new Error('Failed to get canvas context');
    }

    this.previewCanvasContext.fillStyle = 'black';
    this.previewCanvasContext.fillRect(0, 0, 100, 100);
    this.previewMediaStream = this.previewCanvas.captureStream(30);

    // 入力映像からフレームを抽出するためのキャンバスを初期化
    this.inputFrameCanvas = document.createElement('canvas');
    this.inputFrameCanvas.width = 100;
    this.inputFrameCanvas.height = 100;
    this.inputFrameCanvasContext =
      this.inputFrameCanvas.getContext('2d') ?? undefined;
    if (this.inputFrameCanvasContext === undefined) {
      throw new Error('Failed to get canvas context');
    }

    this.inputFrameCanvasContext.fillStyle = 'black';
    this.inputFrameCanvasContext.fillRect(0, 0, 100, 100);

    // モデルの読み込み
    await this.tileDetector.loadModel();
    await this.tileClassifier.loadModel();

    // ウォームアップ
    await this.tileDetector.detect(this.inputFrameCanvas);
    await this.tileClassifier.classify(this.inputFrameCanvas);
  }

  getPreviewMediaStream() {
    return this.previewMediaStream;
  }

  async start(
    constraints: MediaStreamConstraints = DonjaraTileClassifier.DEFAULT_MEDIA_STREAM_CONSTRAINTS
  ) {
    this.inputMediaStream = await navigator.mediaDevices.getUserMedia(
      constraints
    );
    if (!this.inputMediaStream) {
      throw new Error('Failed to get media stream');
    }

    this.inputVideoElement = document.createElement('video');
    this.inputVideoElement.srcObject = this.inputMediaStream;
    this.inputVideoElement.play();

    this.tick();
  }

  stop() {
    if (this.inputMediaStream) {
      this.inputMediaStream.getTracks().forEach((track) => track.stop());
      this.inputMediaStream = undefined;
    }
    if (this.inputVideoElement) {
      this.inputVideoElement.srcObject = null;
      this.inputVideoElement = undefined;
    }
  }

  async detect(inputFrame: HTMLImageElement) {}

  private async tick() {
    if (
      !this.inputVideoElement ||
      !this.inputFrameCanvasContext ||
      !this.inputMediaStream ||
      !this.inputFrameCanvas ||
      !this.previewCanvas ||
      !this.previewCanvasContext
    )
      return;

    if (
      this.inputVideoElement.videoWidth === 0 ||
      this.inputVideoElement.videoHeight === 0
    ) {
      requestAnimationFrame(async () => {
        await this.tick();
      });
      return;
    }

    try {
      // 入力映像からフレームを抽出
      this.inputFrameCanvas.width = this.inputVideoElement.videoWidth;
      this.inputFrameCanvas.height = this.inputVideoElement.videoHeight;
      this.inputFrameCanvasContext.drawImage(
        this.inputVideoElement,
        0,
        0,
        this.inputFrameCanvas.width,
        this.inputFrameCanvas.height
      );

      // パイを検出
      const tileDetectionResult = await this.tileDetector.detect(
        this.inputFrameCanvas
      );
      if (!tileDetectionResult) {
        return;
      }
      let previewImage = tileDetectionResult.preview;

      // 検出された各パイを処理
      const classifiedTiles: {
        top: DonjaraTileClassifierResultItem;
        predicts: DonjaraTileClassifierResultItem[];
        imageDataUrl: string;
      }[] = [];
      if (tileDetectionResult.tiles.length > 0) {
        for (const tile of tileDetectionResult.tiles) {
          // パイから表面領域を抽出
          let surfaceImage = this.tileSurfaceExtractor.extractSurface(
            tile.image
          );
          if (!surfaceImage) {
            continue;
          }

          // 抽出された表面領域からパイを分類
          const classifierResult = await this.tileClassifier.classify(
            surfaceImage
          );

          const predicts: DonjaraTileClassifierResultItem[] = [];
          for (const item of classifierResult.predicts) {
            predicts.push({
              identifier: item.className,
              label: item.className,
              pack: 'initial',
              status: 'normal',
              score: item.score,
            });
          }
          classifiedTiles.push({
            top: predicts[0],
            predicts: predicts,
            imageDataUrl: classifierResult.image
              ? classifierResult.image.toDataURL('image/jpeg')
              : surfaceImage.toDataURL('image/jpeg'),
          });
        }
      }
      if (classifiedTiles.length > 0) {
        this.onClassified.next({
          tiles: classifiedTiles,
        });
      }

      // プレビュー映像を描画
      this.previewCanvas.width = tileDetectionResult.preview.width;
      this.previewCanvas.height = tileDetectionResult.preview.height;
      this.previewCanvasContext.drawImage(
        previewImage!,
        0,
        0,
        this.previewCanvas.width,
        this.previewCanvas.height
      );
    } catch (e) {
      console.error(`[DonjaraTileClassifier] tick`, e);
      return;
    }

    requestAnimationFrame(async () => {
      await this.tick();
    });
  }
}
