import * as tf from '@tensorflow/tfjs';

/**
 * ドンジャラのパイ検出器
 */
export interface DetectedTile {
  className: 'tile';
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
}

export class TileDetector {
  static readonly OBJECT_DETECTION_MODEL_URL =
    '/assets/models/object-detection';
  static readonly MINIMUM_SCORE = 0.4;

  private model?: tf.GraphModel;
  private classes?: string[];

  constructor() {}

  async loadModel() {
    this.model = await tf.loadGraphModel(
      `${TileDetector.OBJECT_DETECTION_MODEL_URL}/model.json`
    );
    const req = await fetch(
      `${TileDetector.OBJECT_DETECTION_MODEL_URL}/classes.txt`
    );
    this.classes = (await req.text()).split('\n');
    console.log(
      `[TileDetector] loadModel - Model loaded for object detection`,
      this.classes
    );
  }

  async detect(
    inputFrame: HTMLCanvasElement
  ): Promise<{ preview: HTMLCanvasElement }> {
    if (!this.model) throw new Error('Model is not loaded yet');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = inputFrame.width;
    canvas.height = inputFrame.height;
    this.cropImageOnCanvas(inputFrame, canvas, ctx);

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
    };
  }

  private convertResultToDetectedTile(
    image: HTMLCanvasElement,
    boxes: Float32Array,
    scores: Float32Array,
    classIndexes: Float32Array,
    numOfDetections: number
  ) {
    const detectedTiles: DetectedTile[] = [];
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

      detectedTiles.push({
        className,
        x: x1,
        y: y1,
        w: width,
        h: height,
        score,
      });
    }

    return detectedTiles;
  }

  private cropImageOnCanvas(
    src: HTMLCanvasElement,
    dst: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) {
    const imageWidth = src.width;
    const imageHeight = src.height;
    const imageAspect = imageWidth / imageHeight;

    const canvasWidth = dst.width;
    const canvasHeight = dst.height;
    const canvasAspect = canvasWidth / canvasHeight;

    if (imageAspect > canvasAspect) {
      const scaledHeight = canvasWidth / imageAspect;
      const scaledWidth = canvasWidth;
      const scaledX = 0;
      const scaledY = (canvasHeight - scaledHeight) / 2;
      ctx.drawImage(src, scaledX, scaledY, scaledWidth, scaledHeight);
    } else {
      const scaledHeight = canvasHeight;
      const scaledWidth = canvasHeight * imageAspect;
      const scaledX = (canvasWidth - scaledWidth) / 2;
      const scaledY = 0;
      ctx.drawImage(src, scaledX, scaledY, scaledWidth, scaledHeight);
    }
  }

  private drawPreview(
    canvas: HTMLCanvasElement,
    detectedTiles: DetectedTile[]
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
