/* This creates the save files for Sisyphus Plays Cookie Clicker III: Sisyphus Goes Gambling
 * (<https://github.com/staticvariablejames/CookieMusings/blob/master/sisyphus-plays-cookie-clicker-3-gfd.md>).
 *
 * We are only not allowed to ascend.
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 1                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Basically where we left off from part II,
 * but now with "intended" GFD usage.
 */
import { openSisyphus, exhaustPurchases, writeSaveFile } from './common.ts';

let page = await openSisyphus({
    mockedDate: 86400*1000*(1e8-1), // 24 hours before the last valid Date() object
    saveGame: {
        seed: "aaadj",
        vault: [
            'Bingo center/Research facility',
            'Birthday cookie',
            'Chocolate egg',
        ],
    },
});

await page.evaluate(() => {
    Game.Earn(2**356); // Previous best was 2**356
    window.SPCC.nineQuadrillionLumps(10);
    window.SPCC.levelUpMostBuildings();
});
await exhaustPurchases(page);
await page.waitForFunction(() => {
    return Game.isMinigameReady(Game.Objects['Farm'])
        && Game.isMinigameReady(Game.Objects['Bank'])
        && Game.isMinigameReady(Game.Objects['Temple'])
        && Game.isMinigameReady(Game.Objects['Wizard tower']);
});
await page.evaluate(() => {
    window.SPCC.seasonsGrind();
    window.SPCC.miscellaneousGrind();
    window.SPCC.nineQuadrillionStocks();
    Game.Upgrades['Birthday cookie'].earn();
    window.SPCC.grindGrandmapocalypse({maxStage: 2});

    // Planting nursetulips first triggers the "ghost nursetulips bug"
    window.SPCC.fillGardenWith({plant: 'goldenClover', plant2: 'nursetulip'});
    window.SPCC.fillGardenWith({plant: 'whiskerbloom', buds: true});

    let pantheon = Game.Objects['Temple'].minigame;
    pantheon.slotGod(pantheon.gods['mother'], 0);
    l('templeSlot0')!.appendChild(l(`templeGod${pantheon.slot[0]}`)!);
    pantheon.slotGod(pantheon.gods['asceticism'], 1);
    l('templeSlot1')!.appendChild(l(`templeGod${pantheon.slot[1]}`)!);
    // Simulates a perfectly-timed Cyclius
    Game.registerHook('cps', cps => cps * 1.15);

    Game.Objects['Temple'].minigame.slotGod(Game.Objects['Temple'].minigame.gods['mother'], 0);

    Game.Objects['Wizard tower'].amount = 321;
});

while(true) {
    await page.evaluate(() => {
        Game.killBuffs();
        window.SPCC.gainEndlessFrenzy();
        Game.gainBuff('sugar blessing', 86400, 1);
        window.SPCC.gainBuildingSpecial();
        window.SPCC.gainBuildingSpecial();
        window.SPCC.ultimateFtHoFCombo({gfd: true});
        Game.gainBuff('blood frenzy', Math.ceil(6 * window.SPCC.buffTimeModifier()), 666);

        window.SPCC.nineQuadrillionClicks(); // For the achievements
        window.SPCC.nineQuadrillionWrinklers();
        Game.elderWrath = 2;
    });
    if(!await exhaustPurchases(page, {limitTowers: true})) {
        break;
    }
}

console.log(await page.evaluate(() => {
    return "Save 1: " +
           window.Beautify(Game.cookies) +
           " - CpS is " + window.Beautify(Game.cookiesPs) +
           ", factor till next power of two: " +
           window.SPCC.factorTillNextPowerOfTwo(Game.cookiesPs);
}));
await writeSaveFile(page, './saves/sisyphus3-1.cki');
await page.pause();

await page.close();
