export async function getCroppedImageBlob(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number },
  rotation: number = 0): Promise<Blob> {
  const image: HTMLImageElement = await createImage(imageSrc);
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');

  if (!ctx) throw new Error('Couldn\'t get canvas context');

  const { width: bWidth, height: bHeight } = croppedAreaPixels;
  canvas.width = bWidth;
  canvas.height = bHeight;

  // Translate canvas context to center to rotate around the crop center
  ctx.translate(-croppedAreaPixels.x, -croppedAreaPixels.y);

  // Move to center of image before rotating
  ctx.translate(image.width / 2, image.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  return new Promise<Blob>((resolve): void => {
    canvas.toBlob((blob: Blob | null): void => {
      if (!blob) throw new Error('Canvas is empty');
      resolve(blob);
    }, 'image/jpeg');
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject): void => {
    const image: HTMLImageElement = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (err: ErrorEvent) => reject(err));
    image.setAttribute('crossOrigin', 'anonymous'); // for external images
    image.src = url;
  });
}
