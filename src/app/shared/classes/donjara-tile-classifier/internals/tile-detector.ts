import * as tf from '@tensorflow/tfjs';
import { ClassifierHelper } from './classifier-helper';

/**
 * ドンジャラのパイ検出器
 */
export interface TileDetectorResult {
  className: 'tile';
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
  image: HTMLCanvasElement;
}

export class TileDetector {
  static readonly MINIMUM_SCORE = 0.4;

  private modelBaseUrl?: string;
  private model?: tf.GraphModel;
  private classes?: string[];

  constructor(params: { modelBaseUrl: string }) {
    this.modelBaseUrl = params.modelBaseUrl;
  }

  async loadModel() {
    this.model = await tf.loadGraphModel(
      `${this.modelBaseUrl}/object-detection/model.json`
    );
    const req = await fetch(
      `${this.modelBaseUrl}/object-detection/classes.txt`
    );
    this.classes = (await req.text()).split('\n');
    console.log(
      `[TileDetector] loadModel - Model loaded for object detection`,
      this.classes
    );
  }

  async detect(
    inputFrame: HTMLCanvasElement
  ): Promise<{ preview: HTMLCanvasElement; tiles: TileDetectorResult[] }> {
    if (!this.model) throw new Error('Model is not loaded yet');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = inputFrame.width;
    canvas.height = inputFrame.height;
    ClassifierHelper.cropImageOnCanvas(inputFrame, canvas, ctx);

    const shape = this.model?.inputs[0].shape?.slice(1, 3);
    if (!shape) throw new Error('shape is undefined');
    const shapeWidth = shape[0];
    const shapeHeight = shape[1];

    const input = tf.tidy(() => {
      return tf.image
        .resizeBilinear(tf.browser.fromPixels(canvas), [
          shapeWidth,
          shapeHeight,
        ])
        .div(255.0)
        .expandDims(0);
    });

    const res: any = await this.model.executeAsync(input);
    const boxes = res[0].dataSync() as Float32Array;
    const scores = res[1].dataSync() as Float32Array;
    const classIndexes = res[2].dataSync() as Float32Array;
    const numOfDetections = res[3].dataSync()[0];
    tf.dispose(res);

    const detectedTiles = this.convertResultToDetectedTile(
      canvas,
      boxes,
      scores,
      classIndexes,
      numOfDetections
    );

    this.drawPreview(canvas, detectedTiles);

    return {
      preview: canvas,
      tiles: detectedTiles,
    };
  }

  private convertResultToDetectedTile(
    image: HTMLCanvasElement,
    boxes: Float32Array,
    scores: Float32Array,
    classIndexes: Float32Array,
    numOfDetections: number
  ) {
    const detectedTiles: TileDetectorResult[] = [];
    for (let i = 0; i < numOfDetections; i++) {
      let [x1, y1, x2, y2] = boxes.slice(i * 4, (i + 1) * 4);
      x1 *= image.width;
      x2 *= image.width;
      y1 *= image.height;
      y2 *= image.height;
      const width = x2 - x1;
      const height = y2 - y1;

      let className = this.classes![classIndexes[i]];
      if (className === undefined || className !== 'tile') {
        continue;
      }

      const score = scores[i];
      if (score < TileDetector.MINIMUM_SCORE) {
        continue;
      }

      const tileImage = document.createElement('canvas');
      tileImage.width = width;
      tileImage.height = height;
      const ctx = tileImage.getContext('2d')!;
      ctx.drawImage(image, x1, y1, width, height, 0, 0, width, height);

      detectedTiles.push({
        className,
        x: x1,
        y: y1,
        w: width,
        h: height,
        score,
        image: tileImage,
      });
    }

    // 左から順にソート
    detectedTiles.sort((a, b) => a.x - b.x);

    return detectedTiles;
  }

  private drawPreview(
    canvas: HTMLCanvasElement,
    detectedTiles: TileDetectorResult[]
  ) {
    const ctx = canvas.getContext('2d')!;

    ctx.font = '20px Arial';
    ctx.strokeStyle = '#18C3D9FA';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#18C3D9FA';

    for (const tile of detectedTiles) {
      ctx.strokeRect(tile.x, tile.y, tile.w, tile.h);
      ctx.fillText(
        `${tile.className} (${tile.score.toFixed(2)})`,
        tile.x,
        tile.y - 10
      );
    }
  }
}
