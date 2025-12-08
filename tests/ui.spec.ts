import { test, expect, Page } from '@playwright/test';

async function wait(page: Page) {
  // Wait for __imagesLoaded promise to exist and resolve
  await page.waitForFunction(() => {
    // @ts-expect-error
    return typeof window.__imagesLoaded !== 'undefined';
  }, { timeout: 100 });
  
  // Wait for the promise to resolve (all images loaded)
  await page.evaluate(async () => {
    // @ts-expect-error
    if (window.__imagesLoaded && typeof window.__imagesLoaded.then === 'function') {
      // @ts-expect-error
      await window.__imagesLoaded;
    }
  });
}

async function waitAction(page: Page) {
  // Reset action flag before clicking
  await page.evaluate(() => {
    // @ts-expect-error
    window.__actionExecuted = false;
  });
    // @ts-expect-error
  return page.waitForFunction(() => window.__actionExecuted === true);
}

async function clickAt(page: Page, row: number, column: number) {
  const battlefield = page.locator('canvas.hexes');
  if (!battlefield) {
    throw new Error("Fuck")
  }

  const hexCoordinates = await page.evaluate(({ row, column }: { row: number, column: number }) => {
    // @ts-ignore
    return {x: rowX(row, column), y: rowY(row)}
  }, {row, column});

  // Get battlefield bounding box to adjust coordinates
  const battlefieldBox = await battlefield.boundingBox();

  if (!battlefieldBox) {
    throw new Error("Fuck")
  }
  const clickX = battlefieldBox.x + hexCoordinates.x;
  const clickY = battlefieldBox.y + hexCoordinates.y;

  await page.mouse.click(clickX, clickY);
}

interface Position {
  row: number
  column: number
}

async function stackAt(page: Page, row: number, column: number) {
  const stack = await page.evaluate((position: Position) => {
    return stackAtPosition(position);
  }, {row, column})
  if (!stack) {
    throw new Error("Fuck")
  }
  return stack
}

test.describe('Game UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/game.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.battlefield', { timeout: 15000 });
    await wait(page);
  });

  test('should click on hex at row 5, column 6', async ({ page }) => {
    const stack1 = await stackAt(page, 0, 0)
    await clickAt(page, 5, 6)
    await waitAction(page);
    const stack2 = await stackAt(page, 5, 6)
    
    expect(stack1.id).toBe(stack2.id)
  });
});

