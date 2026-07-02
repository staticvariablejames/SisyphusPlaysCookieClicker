import { openSisyphus } from './common.ts';

let page = await openSisyphus({});

await page.evaluate(() => window.SPCC.nineQuadrillionClicks());
await page.waitForFunction(() => window.SPCC.nextCheck()); // Unlocks lumps (+ achievements)
await page.evaluate(() => Game.gainLumps(2**56)); // No garden sacrifices
await page.waitForFunction(() => window.SPCC.nextCheck()); // I'll ignore lump type achievements
await page.pause();
await page.close();
