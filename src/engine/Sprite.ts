export interface SpriteFrame {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export class Sprite {
  private img: HTMLImageElement;
  readonly frameWidth: number;
  readonly frameHeight: number;

  constructor(img: HTMLImageElement, frameWidth?: number, frameHeight?: number) {
    this.img = img;
    this.frameWidth = frameWidth ?? img.width;
    this.frameHeight = frameHeight ?? img.height;
  }

  /** Draw the full image or a specific spritesheet frame (0-indexed col/row) */
  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    col = 0,
    row = 0,
    destW = this.frameWidth,
    destH = this.frameHeight,
  ): void {
    ctx.drawImage(
      this.img,
      col * this.frameWidth,
      row * this.frameHeight,
      this.frameWidth,
      this.frameHeight,
      Math.round(x),
      Math.round(y),
      destW,
      destH,
    );
  }

  /** Draw a custom source rect */
  drawRect(
    ctx: CanvasRenderingContext2D,
    frame: SpriteFrame,
    x: number,
    y: number,
    destW = frame.sw,
    destH = frame.sh,
  ): void {
    ctx.drawImage(this.img, frame.sx, frame.sy, frame.sw, frame.sh, Math.round(x), Math.round(y), destW, destH);
  }
}
