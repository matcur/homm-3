export {}

const backgroundCanvas = document.querySelector<HTMLCanvasElement>("canvas.background")!
const town = document.querySelector<HTMLDivElement>("div.town")!
const backgroundContext = backgroundCanvas.getContext("2d")!
backgroundCanvas.style.pointerEvents = "none" // Allow clicks to pass through to building canvases

// Create building canvases dynamically
function createBuildingCanvas(className: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = 0
  canvas.height = 0
  canvas.className = `${className} canvas`
  canvas.style.position = "absolute"
  canvas.style.pointerEvents = "auto" // Ensure clicks are captured
  document.querySelector(".town")!.appendChild(canvas)
  return canvas
}

// Create canvases with temporary sizes, will be updated when images load
const hallsCanvas = createBuildingCanvas("halls")
const hallsContext = hallsCanvas.getContext("2d")!
const brotherhoodCanvas = createBuildingCanvas("brotherhood")
const brotherhoodContext = brotherhoodCanvas.getContext("2d")!
const guardhouseCanvas = createBuildingCanvas("guardhouse")
const guardhouseContext = guardhouseCanvas.getContext("2d")!

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

type BuildingName =
  | "Halls"
  | "Guardhouse"
  | "Brotherhood"

function never(arg: never): never {
  throw new Error("Implement required cases" + arg)
}

interface Building {
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  image: HTMLImageElement
  x: number,
  y: number,
  width: number,
  height: number,
}

const buildingDrawing: Record<BuildingName, Building> = {
  Halls: {
    canvas: hallsCanvas,
    context: hallsContext,
    image: imageOf("halls1"),
    x: 20,
    y: 600,
    width: 389,
    height: 232,
  },
  Brotherhood: {
    canvas: brotherhoodCanvas,
    context: brotherhoodContext,
    image: imageOf("brotherhood1"),
    x: 0,
    y: 620,
    width: 189,
    height: 260,
  },
  Guardhouse: {
    canvas: guardhouseCanvas,
    context: guardhouseContext,
    image: imageOf("guardhouse"),
    x: 520,
    y: 270,
    width: 110,
    height: 153,
  }
}

const buildings: BuildingName[] = loadBuildings()

function saveBuildings() {
  return localStorage.setItem("Buildings", JSON.stringify(buildings))
}

function addBuilding(building: BuildingName) {
  buildings.push(building)
  addBuildingEventListener(building)
  saveBuildings()
}

function loadBuildings(): BuildingName[] {
  try {
    return JSON.parse(localStorage.getItem("Buildings") || "")
  } catch (e) {
    return ["Halls", "Brotherhood"]
  }
}

function getBuildingAt(x: number, y: number, canvas: HTMLCanvasElement): BuildingName | undefined {
  return buildings.find(building => {
    const drawing = buildingDrawing[building]
    if (drawing.canvas !== canvas) return false
    // Since canvas is now sized to image and positioned, check if click is within canvas bounds
    // x and y are already relative to the canvas
    return (
      x >= 0 &&
      x <= drawing.canvas.width &&
      y >= 0 &&
      y <= drawing.canvas.height
    )
  })
}

const modal = document.querySelector<HTMLDivElement>(".modal")!
const modalContent = document.querySelector<HTMLDivElement>("#modalContent")!
const modalClose = document.querySelector<HTMLButtonElement>("#modalClose")!

function showModal(building: BuildingName) {
  switch (building) {
    case "Halls": {
      modalContent.innerHTML = `
        <h2>${building}</h2>
        <img class="guardhouse" src="./img/guardhouseBuying.png" alt="Guardhouse" style="max-width: 100%; height: auto; margin-top: 20px;" />
      `
      modalContent.querySelector(".guardhouse")?.addEventListener("click", () => {
        addBuilding("Guardhouse")
        modal.classList.remove("active")
      })
      break
    }
    case "Guardhouse":
    case "Brotherhood": {
      modalContent.innerHTML = `
        <h2>${building}</h2>
        <p>Building information goes here...</p>
      `
      break
    }
    default: {
      never(building)
    }
  }
  modal.classList.add("active")
}

function hideModal() {
  modal.classList.remove("active")
}

function handleBuildingClick(building: BuildingName) {
  showModal(building)
}

// Close modal when clicking the close button
modalClose.addEventListener("click", () => {
  hideModal()
})

// Close modal when clicking outside of it
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    hideModal()
  }
})

function addBuildingEventListener(building: BuildingName) {
  const drawing = buildingDrawing[building]
  // Click event listener on building's canvas
  drawing.canvas.addEventListener("click", (e) => {
    handleBuildingClick(building)
  })

  // Hover event listener on building's canvas
  drawing.canvas.addEventListener("mousemove", (e) => {
    const rect = drawing.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const hoveredBuilding = getBuildingAt(x, y, drawing.canvas)
    if (hoveredBuilding) {
      drawing.canvas.style.cursor = "pointer"
    } else {
      drawing.canvas.style.cursor = "default"
    }
  })
}

// Setup event listeners directly on each building's canvas
buildings.forEach(addBuildingEventListener)

function clearRect(context: CanvasRenderingContext2D) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height)
}

function draw() {
  clearRect(backgroundContext)
  backgroundContext.drawImage(
    backgroundImage,
    0,
    0,
    backgroundCanvas.width,
    backgroundCanvas.height
  )

  buildings.forEach(building => {
    const scale = 1.8
    const drawing = buildingDrawing[building]
    drawing.width = drawing.image.width * scale
    drawing.height = drawing.image.height * scale

    clearRect(drawing.context)
    drawing.canvas.width = drawing.width
    drawing.canvas.height = drawing.height

    drawing.canvas.style.left = `${drawing.x}px`
    drawing.canvas.style.top = `${drawing.y}px`

    drawing.context.drawImage(
      drawing.image,
      0,
      0,
      drawing.width,
      drawing.height
    )
  })
  requestAnimationFrame(draw)
}

backgroundImage.onload = () => {
  draw()
}
