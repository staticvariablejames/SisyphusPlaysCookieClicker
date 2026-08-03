/* This creates the save files for Sisyphus Plays Cookie Clicker II: Sisyphus the Quindecillionaire.
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
async function exhaustPurchases(options?: Parameters<typeof window.SPCC.roundOfPurchases>[0]) {
    let madePurchases = false;
    while(true) {
        await page.evaluate(() => window.SPCC.nineQuadrillionTicks());
        await page.waitForFunction(() => window.SPCC.nextCheck());
        let madeNewPurchases = await page.evaluate(op => window.SPCC.roundOfPurchases(op), options);
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

console.log(await page.evaluate(() => {
    return "Save 4: " +
           window.Beautify(Game.cookies) +
           " - highest raw CpS is " + window.Beautify(Game.cookiesPsRawHighest) +
           ", factor till next power of two: " +
           window.SPCC.factorTillNextPowerOfTwo(Game.cookiesPsRawHighest);
}));
await writeSaveFile(page, './saves/sisyphus2-4.cki');

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 5                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Achievement grinding of several kinds,
 * and combos.
 */
await page.evaluate(() => {
    window.SPCC.seasonsGrind();
    window.SPCC.miscellaneousGrind();
    window.SPCC.nineQuadrillionLumps(10);

    window.SPCC.fillGardenWith({plant: 'goldenClover', plant2: 'nursetulip'});
    window.SPCC.fillGardenWith({plant:'whiskerbloom', buds: true});

    let pantheon = Game.Objects['Temple'].minigame;
    pantheon.slotGod(pantheon.gods['mother'], 0);
    l('templeSlot0')!.appendChild(l(`templeGod${pantheon.slot[0]}`)!);
    pantheon.slotGod(pantheon.gods['asceticism'], 1);
    l('templeSlot1')!.appendChild(l(`templeGod${pantheon.slot[1]}`)!);
    // Simulates a perfectly-timed Cyclius
    Game.registerHook('cps', cps => cps * 1.15);

    Game.Objects['Temple'].minigame.slotGod(Game.Objects['Temple'].minigame.gods['mother'], 0);

    /* Remove the latest stage of the grandmapocalypse, and its effects;
     * we do this on this save only,
     * so we have access to golden cookies and wrinklers at the same time.
     */
    Game.elderWrath = 2;
    Game.Achievements['Grandmapocalypse'].won = 0;
    Game.Achievements['Elder nap'].won = 0;
    Game.Achievements['Elder slumber'].won = 0;
    Game.Achievements['Elder calm'].won = 0;
    Game.Upgrades['Elder Pact'].bought = 0
    Game.Upgrades['Sacrificial rolling pins'].bought = 0;
    Game.Upgrades['Sacrificial rolling pins'].unlocked = 0;
    Game.UpdateGrandmapocalypse();
    Game.RebuildUpgrades();

    Game.Objects['Wizard tower'].amount = 321;

    (Game as any).takeLoan(1); // TODO fix @types/cookieclicker
    (Game as any).takeLoan(2);
    (Game as any).takeLoan(3);
});

while(true) {
    await page.evaluate(() => {
        Game.killBuffs();
        window.SPCC.gainEndlessFrenzy();
        Game.gainBuff('sugar blessing', 86400, 1);
        window.SPCC.gainBuildingSpecial();
        window.SPCC.gainBuildingSpecial();
        window.SPCC.ultimateFtHoFCombo();
        Game.gainBuff('blood frenzy', Math.ceil(6 * window.SPCC.buffTimeModifier()), 666);

        window.SPCC.nineQuadrillionWrinklers();
        Game.elderWrath = 2;
    });
    if(!await exhaustPurchases({limitTowers: true})) {
        break;
    }
}

await page.pause();
console.log(await page.evaluate(() => {
    return "Save 5: " +
           window.Beautify(Game.cookies) +
           " - CpS is " + window.Beautify(Game.cookiesPs) +
           ", factor till next power of two: " +
           window.SPCC.factorTillNextPowerOfTwo(Game.cookiesPs);
}));
await writeSaveFile(page, './saves/sisyphus2-5.cki');

await page.close();
