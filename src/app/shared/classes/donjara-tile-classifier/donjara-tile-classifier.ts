import { TileDetector } from './internals/tile-detector';

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

  // プレビュー映像
  private previewCanvas: HTMLCanvasElement | undefined;
  private previewCanvasContext: CanvasRenderingContext2D | undefined;
  private previewMediaStream: MediaStream | undefined;

  // オブジェクト検出器
  private tileDetector!: TileDetector;

  constructor(params: { modelBaseUrl: string }) {
    this.tileDetector = new TileDetector({
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

    this.previewCanvasContext!.fillStyle = 'black';
    this.previewCanvasContext!.fillRect(0, 0, 100, 100);
    this.previewMediaStream = this.previewCanvas.captureStream(30);

    // 入力映像からフレームを抽出するためのキャンバスを初期化
    this.inputFrameCanvas = document.createElement('canvas');

    // モデルの読み込み
    await this.tileDetector.loadModel();
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

      const ctx = this.inputFrameCanvas.getContext('2d')!;
      ctx.drawImage(
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

      // プレビュー映像を描画
      this.previewCanvas.width = tileDetectionResult.preview.width;
      this.previewCanvas.height = tileDetectionResult.preview.height;
      this.previewCanvasContext.drawImage(
        tileDetectionResult.preview,
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
