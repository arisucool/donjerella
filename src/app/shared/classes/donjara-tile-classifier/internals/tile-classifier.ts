import * as tf from '@tensorflow/tfjs';
import { ClassifierHelper } from './classifier-helper';

export interface TileClassifierResultItem {
  className: string;
  score: number;
}
export interface TileClassifierResult {
  image: HTMLCanvasElement;
  predicts: TileClassifierResultItem[];
}

export class TileClassifier {
  private modelBaseUrl?: string;
  private model?: any;
  private classes?: string[];

  constructor(params: { modelBaseUrl: string }) {
    this.modelBaseUrl = params.modelBaseUrl;
  }

  async loadModel() {
    this.model = await tf.loadGraphModel(
      `${this.modelBaseUrl}/classification/model.json`
    );
    const req = await fetch(`${this.modelBaseUrl}/classification/classes.txt`);
    this.classes = (await req.text()).split('\n');
    console.log(
      `[TileClassifier] loadModel - Model loaded for classification`,
      this.classes
    );
  }

  async classify(inputFrame: HTMLCanvasElement): Promise<TileClassifierResult> {
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

    const res: any = await this.model.predict(input);
    let predScores = res.dataSync().map((value: number) => {
      return value * 100;
    });
    let predArgMax = tf.argMax(predScores).dataSync<'int32'>();
    tf.dispose(res);

    const classIndex = predArgMax[0];
    if (!this.classes)
      return {
        image: canvas,
        predicts: [],
      };

    const className = this.classes[classIndex];

    const resultItems: TileClassifierResultItem[] = [];
    resultItems.push({
      className,
      score: predScores[classIndex] / 100,
    });
    resultItems;

    return {
      image: canvas,
      predicts: resultItems,
    };
  }
}
