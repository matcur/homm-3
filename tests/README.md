# UI Tests

This directory contains UI tests for the Heroes of Might and Magic 3 battle simulator game.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Install Playwright browsers:
   ```bash
   pnpm exec playwright install --with-deps
   ```

3. Build the game:
   ```bash
   pnpm run build
   ```

## Running Tests

- Run all tests: `pnpm test`
- Run tests in UI mode: `pnpm run test:ui`
- Run tests in headed mode (see browser): `pnpm run test:headed`
- Debug tests: `pnpm run test:debug`
- View test report: `pnpm run test:report`

## Test Structure

The tests cover:
- Game page loading and canvas elements
- Control buttons (Defence, Wait, Book, Stop)
- Spell book open/close functionality
- Battlefield interactions (clicks, mouse movements)
- Game layout and structure
- Error handling and image loading

## Configuration

Tests are configured in `playwright.config.ts`. The test server automatically starts on port 3000 before running tests.

