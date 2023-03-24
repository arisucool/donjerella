import { Subject } from 'rxjs';
import { TileClassifier } from './internals/tile-classifier';
import { TileDetector, TileDetectorResult } from './internals/tile-detector';
import { TileSurfaceExtractor } from './internals/tile-surface-extractor';

export interface DonjaraTileScannerResultItem {
  identifier: string;
  label: string;
  pack: 'initial' | 'expansion';
  status?: 'normal' | 'reached';
  score: number;
}

export interface DonjaraTileScannerResult {
  tiles: {
    top: DonjaraTileScannerResultItem;
    predicts: DonjaraTileScannerResultItem[];
    imageDataUrl: string;
  }[];
}

export class DonjaraTileScanner {
  // 入力映像からフレームを抽出するためのキャンバス
  private inputFrameCanvas: HTMLCanvasElement | undefined;
  private inputFrameCanvasContext: CanvasRenderingContext2D | undefined;

  // プレビュー映像
  private previewCanvas: HTMLCanvasElement | undefined;
  private previewCanvasContext: CanvasRenderingContext2D | undefined;

  // オブジェクト検出の状態変化を伝えるためのイベント
  private onDetectionStatusChanged = new Subject<number>();
  public onDetectionStatusChanged$ =
    this.onDetectionStatusChanged.asObservable();

  // 分類結果を返すためのイベント
  private onScanned = new Subject<DonjaraTileScannerResult>();
  public onScanned$ = this.onScanned.asObservable();

  // オブジェクト検出器
  private tileDetector!: TileDetector;

  // オブジェクト検出器による最近の検出結果 (検出済みであるが未分類のもの)
  private recentTileDetectorResults: TileDetectorResult[] = [];
  private readonly NUM_OF_RECENT_TILE_DETECTOR_RESULTS = 5;

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
    if (this.previewCanvas) {
      return;
    }

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
    console.log(`[DonjaraTileClassifier] model loaded`);

    // ウォームアップ
    await this.tileDetector.detect(this.inputFrameCanvas);
    await this.tileClassifier.classify(this.inputFrameCanvas);
  }

  getPreviewMediaStream() {
    return this.previewCanvas!.captureStream(30);
  }

  async onVideoFrame(videoElement: HTMLVideoElement) {
    if (
      !videoElement ||
      !this.inputFrameCanvasContext ||
      !this.inputFrameCanvas ||
      !this.previewCanvas ||
      !this.previewCanvasContext ||
      videoElement.videoWidth === 0 ||
      videoElement.videoHeight === 0 ||
      !this.tileDetector ||
      this.tileDetector.isReady() === false
    ) {
      return;
    }

    try {
      // 入力映像からフレームを抽出
      this.inputFrameCanvas.width = videoElement.videoWidth;
      this.inputFrameCanvas.height = videoElement.videoHeight;
      this.inputFrameCanvasContext.drawImage(
        videoElement,
        0,
        0,
        this.inputFrameCanvas.width,
        this.inputFrameCanvas.height
      );

      // パイを検出
      const tileDetectorResult = await this.tileDetector.detect(
        this.inputFrameCanvas
      );
      if (!tileDetectorResult) {
        this.onDetectionStatusChanged.next(0);
        return;
      }
      this.onDetectionStatusChanged.next(tileDetectorResult.tiles.length);
      let previewImage = tileDetectorResult.preview;

      // 検出結果の配列へ追加
      this.recentTileDetectorResults.push(tileDetectorResult);
      while (
        this.recentTileDetectorResults.length >
        this.NUM_OF_RECENT_TILE_DETECTOR_RESULTS
      ) {
        this.recentTileDetectorResults.shift();
      }

      // プレビュー映像を描画
      this.previewCanvas.width = tileDetectorResult.preview.width;
      this.previewCanvas.height = tileDetectorResult.preview.height;
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
  }

  async detect() {
    console.log(
      `[DonjaraTileClassifier] detect - Detecting from ${this.recentTileDetectorResults.length} frames...`
    );
    const result = await this.classify(this.recentTileDetectorResults);
    console.log(`[DonjaraTileClassifier] detect - Detected`, result);
    return result;
  }

  async detectOnce(inputFrame: HTMLImageElement) {
    throw new Error('Not implemented');
  }

  private async classify(
    detectorResults: TileDetectorResult[]
  ): Promise<DonjaraTileScannerResult | undefined> {
    if (!detectorResults) return undefined;

    // 各フレームの分類結果を初期化
    const classifiedFrames: {
      detectorResult: TileDetectorResult;
      classifiedColumns: {
        top: DonjaraTileScannerResultItem;
        predicts: DonjaraTileScannerResultItem[];
        imageDataUrl: string;
      }[];
    }[] = [];

    for (const detectorResult of detectorResults) {
      if (detectorResult.tiles.length == 0) {
        continue;
      }
      classifiedFrames.push({
        detectorResult: detectorResult,
        classifiedColumns: [],
      });
    }

    // 各フレームのパイを分類

    for (
      let frameIndex = 0;
      frameIndex < classifiedFrames.length;
      frameIndex++
    ) {
      let classifiedFrame = classifiedFrames[frameIndex];

      for (
        let tileIndex = 0;
        tileIndex < classifiedFrame.detectorResult.tiles.length;
        tileIndex++
      ) {
        const tile = classifiedFrame.detectorResult.tiles[tileIndex];

        // パイから表面領域を抽出
        let surfaceImage = this.tileSurfaceExtractor.extractSurface(tile.image);
        if (!surfaceImage) {
          console.warn(
            `[DonjaraTileClassifier] classify - Could not get surface image at tile(${tileIndex}) of frame(${frameIndex})`
          );
          continue;
        }

        // 抽出された表面領域からパイを分類
        const classifierResult = await this.tileClassifier.classify(
          surfaceImage
        );

        const predicts: DonjaraTileScannerResultItem[] = [];
        if (classifierResult.predicts.length == 0) {
          console.warn(
            `[DonjaraTileClassifier] classify - No predicts at tile(${tileIndex}) of frame(${frameIndex})`
          );
          continue;
        }

        for (const item of classifierResult.predicts) {
          let identifier = item.className;
          if (identifier.match(/^(\d+).*$/)) {
            // 先頭の数字のみにする
            identifier = RegExp.$1;
          }

          predicts.push({
            identifier: identifier,
            label: item.className,
            pack: 'initial',
            status: 'normal',
            score: item.score,
          });
        }

        // 配列へ追加
        classifiedFrame.classifiedColumns.push({
          top: predicts[0],
          predicts: predicts,
          imageDataUrl: classifierResult.image
            ? classifierResult.image.toDataURL('image/jpeg')
            : surfaceImage.toDataURL('image/jpeg'),
        });
      }

      console.log(
        `[DonjaraTileClassifier] classify - Classified frame(${frameIndex})`,
        classifiedFrame
      );
    }
    console.log(`[DonjaraTileClassifier] classify`, classifiedFrames);

    // 列ごとにパイを集計 ＆ スコアが低いものはフィルタ
    const classifiedTilesByColumns: {
      top: DonjaraTileScannerResultItem;
      predicts: DonjaraTileScannerResultItem[];
      imageDataUrl: string;
    }[][] = [];
    for (const classifiedFrame of classifiedFrames) {
      for (
        let columnIndex = 0;
        columnIndex < classifiedFrame.classifiedColumns.length;
        columnIndex++
      ) {
        const classifiedColumn = classifiedFrame.classifiedColumns[columnIndex];

        if (!classifiedTilesByColumns[columnIndex]) {
          classifiedTilesByColumns[columnIndex] = [];
        }

        if (classifiedColumn.top.score < 0.5) {
          // スコアが 0.5 未満のものは無視
          continue;
        }

        classifiedTilesByColumns[columnIndex].push(classifiedColumn);
      }
    }

    // 各列のパイを確定
    const finalResult: DonjaraTileScannerResult = {
      tiles: [],
    };
    let choosedTileIdentifier: string[] = [];
    for (const column of classifiedTilesByColumns) {
      if (column.length == 0) {
        continue;
      }

      let choosedTile:
        | {
            top: DonjaraTileScannerResultItem;
            predicts: DonjaraTileScannerResultItem[];
            imageDataUrl: string;
          }
        | undefined = undefined;

      for (let retry = 0; retry < 100; retry++) {
        // この列でもっとも出現したパイを特定
        const countsOfTiles: { [key: string]: number } = {};
        for (const classifiedTile of column) {
          if (!countsOfTiles[classifiedTile.top.identifier]) {
            countsOfTiles[classifiedTile.top.identifier] = 0;
          }
          countsOfTiles[classifiedTile.top.identifier]++;
        }
        let maxCount = 0;
        let maxCountIdentifier: string | undefined = undefined;
        for (const key in countsOfTiles) {
          if (countsOfTiles[key] > maxCount) {
            maxCount = countsOfTiles[key];
            maxCountIdentifier = key;
          }
        }

        // 特定したパイを取得
        const maxTile = classifiedTilesByColumns
          .find((column) => {
            return column.find((tile) => {
              return tile.top.identifier == maxCountIdentifier;
            });
          })
          ?.find((tile) => {
            return tile.top.identifier == maxCountIdentifier;
          });
        if (maxTile === undefined) {
          continue;
        }

        // 特定したパイが既に確定していないことを確認
        if (choosedTileIdentifier.includes(maxTile.top.identifier)) {
          // すでに確定済みのパイならば、次のパイへ
          continue;
        }

        // このパイを確定
        choosedTile = maxTile;
        break;
      }

      if (choosedTile === undefined) {
        continue;
      }

      // 確定したパイを列に追加
      finalResult.tiles.push(choosedTile);
      choosedTileIdentifier.push(choosedTile.top.identifier);
    }

    // イベントを送信
    this.onScanned.next(finalResult);

    return finalResult;
  }
}
