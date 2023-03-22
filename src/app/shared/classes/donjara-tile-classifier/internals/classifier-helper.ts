export class ClassifierHelper {
  public static cropImageOnCanvas(
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
}
