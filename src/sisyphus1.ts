/* This creates the save file obtained in Sisyphus Plays Cookie Clicker I: Fighting Against IEEE754
 * (<https://github.com/staticvariablejames/CookieMusings/blob/master/sisyphus-plays-cookie-clicker-1-ieee754.md>).
 *
 * Here we just click the big cookie and coalescing sugar lumps.
 */
import { openSisyphus, writeSaveFile } from './common.ts';

let page = await openSisyphus({
    mockedDate: 1.6e12 + 35*60*1000, // Sidesteps Speed baking I, II, III
});

await page.evaluate(() => window.SPCC.nineQuadrillionClicks());
await page.waitForFunction(() => window.SPCC.nextCheck()); // Unlocks lumps (+ achievements)
await page.evaluate(() => window.SPCC.nineQuadrillionLumps(7)); // No garden sacrifices
await page.pause();

await writeSaveFile(page, './saves/sisyphus1.cki');

await page.close();
