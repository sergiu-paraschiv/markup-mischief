function loadImageBitmap(
  src: string,
  onLoad: (data: ImageBitmap) => void
): void {
  const image = new Image();
  image.onload = async () => {
    const { naturalWidth: width, naturalHeight: height } = image;
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(image, 0, 0);
      const imageBitmap = await createImageBitmap(
        context.getImageData(0, 0, width, height)
      );
      onLoad(imageBitmap);
    }
  };
  image.src = src;
}

export default class Texture {
  data: CanvasImageSource = new Image();

  static empty() {
    return new Texture();
  }

  static load(src: string): Texture {
    const texture = new Texture();

    loadImageBitmap(src, (data) => {
      texture.data = data;
    });

    return texture;
  }

  static fromImageBitmap(imageBitmap: ImageBitmap): Texture {
    const texture = new Texture();
    texture.data = imageBitmap;
    return texture;
  }
}
