export {}

const backgroundCanvas = document.querySelector<HTMLCanvasElement>("canvas.castle")!
const backgroundContext = backgroundCanvas.getContext("2d")!

const backgroundImage = imageOf("castleBackground")

function imageOf(name: string) {
  const image = new Image();
  image.src = `/img/${name}.png`;
  //@ts-expect-error
  if (!window.__allImages) {
    //@ts-expect-error
    window.__allImages = []
  }
  //@ts-expect-error
  window.__allImages.push(image);

  //@ts-expect-error
  window.__imagesLoaded = Promise.all(
    //@ts-expect-error
    window.__allImages.map(img =>
      img.complete
        ? Promise.resolve()
        : new Promise(res => {
          img.onload = res;
        })
    )
  );

  return image;
}

backgroundImage.onload = () => {
  const canvas = backgroundContext.canvas
  backgroundContext.drawImage(
    backgroundImage,
    0,
    0,
    canvas.width,
    canvas.height
  )
}