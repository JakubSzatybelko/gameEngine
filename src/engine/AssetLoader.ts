export class AssetLoader {
  private images = new Map<string, HTMLImageElement>();

  image(key: string, url: string): this {
    const img = new Image();
    img.src = url;
    this.images.set(key, img);
    return this;
  }

  loadAll(): Promise<void> {
    const pending = [...this.images.values()]
      .filter((img) => !img.complete)
      .map(
        (img) =>
          new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load asset: ${img.src}`));
          }),
      );
    return Promise.all(pending).then(() => {});
  }

  get(key: string): HTMLImageElement {
    const img = this.images.get(key);
    if (!img) throw new Error(`Asset not found: "${key}"`);
    return img;
  }
}
