export interface UIElement {
  update?(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}
