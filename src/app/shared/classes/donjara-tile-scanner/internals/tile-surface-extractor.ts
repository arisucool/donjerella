import cv, { Mat, MatVector } from 'opencv-ts';

interface FilteredArea {
  // すべての輪郭におけるインデックス
  index: number;
  // 輪郭
  contour: Mat;
  // 近似
  approx: Mat;
  // 領域の面積
  areaSize: number;
}

export class TileSurfaceExtractor {
  private isDebug: boolean;

  constructor(params = { isDebug: false }) {
    this.isDebug = params.isDebug ?? false;
  }

  public extractSurface(image: HTMLCanvasElement) {
    const mat = this.getMatByCanvas(image);

    // 画像をグレイスケール化
    const grayMat = new cv.Mat();
    cv.cvtColor(mat, grayMat, cv.COLOR_RGBA2GRAY);
    this.showImage(grayMat);

    // 輪郭抽出の用意
    const areaSizeThreshold = image.width * image.height * 0.3;
    let filteredAreas: FilteredArea[] = [];
    let allContours: MatVector;

    // 二値化で処理して輪郭抽出
    for (let binThreshold = 180; binThreshold > 80; binThreshold -= 5) {
      // 二値化
      let binalizedMat = new cv.Mat();
      cv.threshold(grayMat, binalizedMat, binThreshold, 255, cv.THRESH_BINARY);
      //TileSurfaceExtractor.showImage(binalizedMat);
      let res = this.getAreas(binalizedMat, areaSizeThreshold);
      allContours = res.allContours;
      filteredAreas = res.filteredAreas;
      binalizedMat.delete();

      if (filteredAreas.length > 0) {
        break;
      }
    }

    if (filteredAreas.length == 0) {
      // アダプティブ二値化で処理して輪郭抽出
      let binalizedMat = new cv.Mat();
      cv.adaptiveThreshold(
        grayMat,
        binalizedMat,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        11,
        2
      );
      let res = this.getAreas(binalizedMat, areaSizeThreshold);
      allContours = res.allContours;
      filteredAreas = res.filteredAreas;
      binalizedMat.delete();
    }

    if (filteredAreas.length == 0) {
      // Canny法で処理して輪郭抽出
      const edgeMat = new cv.Mat();
      cv.Canny(grayMat, edgeMat, 100, 200);
      this.showImage(edgeMat);
      let res = this.getAreas(edgeMat, areaSizeThreshold);
      allContours = res.allContours;
      filteredAreas = res.filteredAreas;
      edgeMat.delete();
    }

    if (filteredAreas.length == 0) {
      return null;
    }

    // 抽出した領域の中から内側を取得
    filteredAreas.sort((a, b) => b.areaSize - a.areaSize);
    const targetArea = filteredAreas[filteredAreas.length - 1];

    // 輪郭を描画
    /*const previewMat = new cv.Mat(mat);
    cv.drawContours(
      previewMat,
      allContours!,
      targetArea.index,
      new cv.Scalar(0, 0, 255, 255)
    );
    this.showImage(previewMat);
    previewMat.delete();*/

    // 射影変換および回転
    const expectedWidth = 240;
    const expectedHeight = 300;
    const expectedSize = new cv.Size(expectedWidth, expectedHeight);
    const srcPoints = new cv.Mat(4, 1, cv.CV_32FC2);
    this.log('targetArea.approx.data32S', targetArea.approx.data32S);
    // 左上の点を求める
    let topLeftIndex = 0;
    for (let i = 2; i < 8; i += 2) {
      if (
        targetArea.approx.data32S[i] * targetArea.approx.data32S[i + 1] <
        targetArea.approx.data32S[topLeftIndex] *
          targetArea.approx.data32S[topLeftIndex + 1]
      ) {
        topLeftIndex = i;
      }
    }
    // 右下の点を求める
    let bottomRightIndex = 0;
    for (let i = 2; i < 8; i += 2) {
      if (
        targetArea.approx.data32S[bottomRightIndex] *
          targetArea.approx.data32S[bottomRightIndex + 1] <
        targetArea.approx.data32S[i] * targetArea.approx.data32S[i + 1]
      ) {
        bottomRightIndex = i;
      }
    }

    // 残りの点を求める
    const remainingIndexes = [0, 2, 4, 6].filter(
      (i) => i !== topLeftIndex && i !== bottomRightIndex
    );
    this.log('remainingIndexes', remainingIndexes);
    let topRightIndex = remainingIndexes[0];
    let bottomLeftIndex = remainingIndexes[1];
    if (
      targetArea.approx.data32S[remainingIndexes[0]] <
        targetArea.approx.data32S[remainingIndexes[1]] ||
      targetArea.approx.data32S[remainingIndexes[0] + 1] >
        targetArea.approx.data32S[remainingIndexes[1] + 1]
    ) {
      topRightIndex = remainingIndexes[1];
      bottomLeftIndex = remainingIndexes[0];
    }
    srcPoints.data32F.set([
      targetArea.approx.data32S[topLeftIndex], // 左上X
      targetArea.approx.data32S[topLeftIndex + 1], // 左上Y
      targetArea.approx.data32S[topRightIndex], // 右上X
      targetArea.approx.data32S[topRightIndex + 1], // 右上Y
      targetArea.approx.data32S[bottomRightIndex], // 右下X
      targetArea.approx.data32S[bottomRightIndex + 1], // 右下Y
      targetArea.approx.data32S[bottomLeftIndex], // 左下X
      targetArea.approx.data32S[bottomLeftIndex + 1], // 左下Y
    ]);
    const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0,
      0,
      expectedWidth,
      0,
      expectedWidth,
      expectedHeight,
      0,
      expectedHeight,
    ]);
    const M = cv.getPerspectiveTransform(srcPoints, dstPoints);

    const dst = new cv.Mat();
    cv.warpPerspective(mat, dst, M, expectedSize);

    // 画像をCanvasに変換
    const result = this.getCanvasByMat(dst);
    this.showImage(result);

    // 後処理
    mat.delete();
    grayMat.delete();
    dst.delete();
    srcPoints.delete();
    dstPoints.delete();
    for (let i = 0; i < filteredAreas.length; i++) {
      filteredAreas[i].contour.delete();
      filteredAreas[i].approx.delete();
    }

    return result;
  }

  private getAreas(mat: Mat, areaSizeThreshold: number) {
    // 輪郭を抽出
    let filteredAreas: FilteredArea[] = [];
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(
      mat,
      contours,
      hierarchy,
      cv.RETR_TREE,
      cv.CHAIN_APPROX_SIMPLE
    );

    // 条件を満たす輪郭を抽出
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const areaSize = cv.contourArea(contour);
      if (areaSize < areaSizeThreshold) {
        contour.delete();
        continue;
      }

      // 輪郭を近似
      const epsilon = 0.1 * cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, epsilon, true);
      if (approx.rows != 4) {
        // 四角形でない場合はスキップ
        contour.delete();
        approx.delete();
        continue;
      }

      let maxCosine = 0;
      for (let j = 2; j < 5; j++) {
        const cosine =
          Math.abs(
            this.getCosineOfAngle(
              approx.row(j % 4),
              approx.row(j - 2),
              approx.row(j - 1)
            )
          ) / 90;
        maxCosine = Math.max(maxCosine, cosine);
      }

      if (maxCosine >= 0.3) {
        // 角度が大きい場合はスキップ
        contour.delete();
        approx.delete();
        continue;
      }

      filteredAreas.push({
        // すべての輪郭におけるインデックス
        index: i,
        // 輪郭
        contour: contour,
        // 近似
        approx: approx,
        // 領域の面積
        areaSize: areaSize,
      });
    }

    // 後処理
    hierarchy.delete();
    if (filteredAreas.length === 0) {
      contours.delete();
    }

    return {
      filteredAreas: filteredAreas,
      allContours: contours,
    };
  }

  private getCosineOfAngle(pt1: any, pt2: any, pt3: any): number {
    const d1 = Math.sqrt(
      Math.pow(pt1.data32F[0] - pt2.data32F[0], 2) +
        Math.pow(pt1.data32F[1] - pt2.data32F[1], 2)
    );
    const d2 = Math.sqrt(
      Math.pow(pt3.data32F[0] - pt2.data32F[0], 2) +
        Math.pow(pt3.data32F[1] - pt2.data32F[1], 2)
    );
    const dot =
      pt1.data32F[0] * pt2.data32F[0] + pt1.data32F[1] * pt2.data32F[1];
    const angle = Math.acos(dot / (d1 * d2));
    return angle;
  }

  private getCanvasByMat(mat: Mat) {
    const canvas = document.createElement('canvas');
    canvas.width = mat.cols;
    canvas.height = mat.rows;
    cv.imshow(canvas, mat);
    return canvas;
  }

  private getMatByCanvas(canvas: HTMLCanvasElement) {
    const imageData = canvas
      .getContext('2d')!
      .getImageData(0, 0, canvas.width, canvas.height);
    const mat = cv.matFromImageData(imageData);
    return mat;
  }

  private log(...object: any[]) {
    if (!this.isDebug) return;

    console.log(`[TileSurfaceExtractor]`, ...object);
  }

  private showImage(src: HTMLCanvasElement | Mat) {
    if (!this.isDebug) return;

    try {
      const image = new Image();
      if (src instanceof HTMLCanvasElement === false) {
        let canvas = this.getCanvasByMat(src as Mat);
        image.width = canvas.width;
        image.height = canvas.height;
        image.src = canvas.toDataURL('image/jpeg');
      } else {
        image.width = (src as HTMLCanvasElement).width;
        image.height = (src as HTMLCanvasElement).height;
        image.src = (src as HTMLCanvasElement).toDataURL('image/jpeg');
      }
      document.querySelector('#app')!.appendChild(image);
    } catch (e) {
      console.error(e);
    }
  }
}
