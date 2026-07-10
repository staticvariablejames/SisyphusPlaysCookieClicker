/* This creates the save file obtained in Sisyphus Plays Cookie Clicker II: Risk-Free Stocks
 * (<https://github.com/staticvariablejames/CookieMusings/blob/master/sisyphus-plays-cookie-clicker-2-stock-market.md>).
 *
 * We are not allowed to ascend, close the game, or use Gambler's Fever Dream.
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 1                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * We will get a single cursor,
 * then alternate between purchasing buildings and upgrades
 * (but not the Birthday cookie or Bingo center/research facility)
 * and just waiting.
 */
import { openSisyphus, writeSaveFile } from './common.ts';

let page = await openSisyphus({
    mockedDate: 86400*1000*(1e8-1), // 24 hours before the last valid Date() object
    saveGame: {
        vault: [
            'Bingo center/Research facility',
            'Birthday cookie',
            'Chocolate egg',
        ],
    },
});

/* Repeats the cycle of purchasing things and waiting a quadrillion ticks
 * until there are no more purchases to be made.
 * If no purchases were made in the first place,
 * return false.
 */
async function exhaustPurchases() {
    let madePurchases = false;
    while(true) {
        await page.evaluate(() => window.SPCC.nineQuadrillionTicks());
        await page.waitForFunction(() => window.SPCC.nextCheck());
        let madeNewPurchases = await page.evaluate(() => window.SPCC.roundOfPurchases());
        if(madeNewPurchases) {
            madePurchases = true;
        } else {
            break;
        }
    }
    return madePurchases;
}

await page.evaluate(() => {Game.Earn(15); Game.Objects['Cursor'].buy(1);});
await page.waitForFunction(() => window.SPCC.nextCheck());
await exhaustPurchases();
await page.pause();

console.log('Save 1: ' + await page.evaluate(() => window.Beautify(Game.cookies)));
await writeSaveFile(page, './saves/sisyphus2-1.cki');

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 2                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Now we purchase the Birthday cookie and level up all buildings
 * (except Wizard Towers).
 */
await page.evaluate(() => window.SPCC.nineQuadrillionLumps(7));
await page.evaluate(() => Game.Upgrades['Birthday cookie'].earn());
await page.evaluate(() => window.SPCC.levelUpMostBuildings());
await exhaustPurchases();
await page.pause();

console.log('Save 2: ' + await page.evaluate(() => window.Beautify(Game.cookies)));
await writeSaveFile(page, './saves/sisyphus2-2.cki');

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 3                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Grandmapocalypse and wrinklers.
 */
await page.evaluate(() => window.SPCC.grindGrandmapocalypse());
// Makes no difference here
// await page.evaluate(() => window.SPCC.fillGardenWith({plant: 'wrinklegill'}));
while(true) {
    await page.evaluate(() => window.SPCC.nineQuadrillionWrinklers());
    if(!await exhaustPurchases()) {
        break;
    }
}
await page.pause();

console.log('Save 3: ' + await page.evaluate(() => window.Beautify(Game.cookies)));
await writeSaveFile(page, './saves/sisyphus2-3.cki');

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 4                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Stock market shenanigans.
 */
await exhaustPurchases();
while(true) {
    await page.evaluate(() => window.SPCC.nineQuadrillionStocks());
    if(!await exhaustPurchases()) {
        break;
    }
}
await page.pause();

console.log('Save 4: ' + await page.evaluate(() => window.Beautify(Game.cookies)));
await writeSaveFile(page, './saves/sisyphus2-4.cki');

await page.close();
