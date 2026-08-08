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
// await page.pause();

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 2                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 20 building specials.
 */
while(true) {
    await page.evaluate(() => {
        Game.killBuffs();
        window.SPCC.gainEndlessFrenzy();
        Game.gainBuff('sugar blessing', 86400, 1);
        Game.gainBuff('blood frenzy', Math.ceil(6 * window.SPCC.buffTimeModifier()), 666);
        window.SPCC.maximizeWizardTowers();
        for(let i = 0; i < 20; i++) {
            window.SPCC.gainBuildingSpecial();
        }

        window.SPCC.nineQuadrillionClicks(); // For the achievements
        window.SPCC.nineQuadrillionWrinklers();
        Game.elderWrath = 2;
    });
    if(!await exhaustPurchases(page, {limitTowers: true})) {
        break;
    }
}

console.log(await page.evaluate(() => {
    return "Save 2: " +
           window.Beautify(Game.cookies) +
           " - CpS is " + window.Beautify(Game.cookiesPs) +
           ", factor till next power of two: " +
           window.SPCC.factorTillNextPowerOfTwo(Game.cookiesPs);
}));
await writeSaveFile(page, './saves/sisyphus3-2.cki');
// await page.pause();

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 3                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 20 building specials, and a limitIEEE754 Godzamok.
 */
await page.evaluate(() => {
    // We won't use wrinklers anymore, so we may catch the last few Grandmapocalypse achievements.
    window.SPCC.grindGrandmapocalypse({maxStage: 3, pledge: true});

    // Plant nursetulips and whiskerblooms for the garden
    window.SPCC.fillGardenWith({plant: 'whiskerbloom', plant2: 'nursetulip'});
    /* Harvest the nursetulips and replace them with bud whiskerblooms
     * Will still trigger the ghost tulips bug.
     */
    window.SPCC.fillGardenWith({plant: null, plant2: 'whiskerbloom', buds: true});
});

while(true) {
    await page.evaluate(() => {
        Game.killBuffs();
        window.SPCC.gainEndlessFrenzy();
        Game.gainBuff('sugar blessing', 86400, 1);
        Game.gainBuff('click frenzy', Math.ceil(13 * window.SPCC.buffTimeModifier()), 777);
        Game.gainBuff('blood frenzy', Math.ceil(6 * window.SPCC.buffTimeModifier()), 666);
        window.SPCC.gainMaximumGodzamok();
        for(let i = 0; i < 20; i++) {
            window.SPCC.gainBuildingSpecial();
        }

        window.SPCC.nineQuadrillionClicks();
    });
    /* No need to limitTowers anymore,
     * as we will not need to use the Grimoire
     * once the buffs have been stretched for long enough.
     */
    if(!await exhaustPurchases(page)) {
        break;
    }
}

console.log(await page.evaluate(() => {
    return "Save 3: " +
           window.Beautify(Game.cookies) +
           " - CpC is " + window.Beautify(Game.computedMouseCps) +
           ", factor till next power of two: " +
           window.SPCC.factorTillNextPowerOfTwo(Game.computedMouseCps);
}));
await writeSaveFile(page, './saves/sisyphus3-3.cki');
// await page.pause();

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 4                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Buildings-as-reservoirs trick.
 */
let cpc: number;

while(true) {
    cpc = await page.evaluate(() => {
        Game.killBuffs();
        window.SPCC.fillGardenWith({plant: 'whiskerbloom', plant2: 'nursetulip'});
        window.SPCC.fillGardenWith({plant: null, plant2: 'whiskerbloom', buds: true});
        let pantheon = Game.Objects['Temple'].minigame;
        pantheon.slotGod(pantheon.gods['mother'], 0);
        window.SPCC.gainEndlessFrenzy();
        Game.gainBuff('sugar blessing', 86400, 1);
        Game.gainBuff('click frenzy', Math.ceil(13 * window.SPCC.buffTimeModifier()), 777);
        Game.gainBuff('blood frenzy', Math.ceil(6 * window.SPCC.buffTimeModifier()), 666);
        window.SPCC.gainMaximumGodzamok();
        for(let i = 0; i < 20; i++) {
            window.SPCC.gainBuildingSpecial();
        }

        window.SPCC.nineQuadrillionClicks();
        return Game.computedMouseCps;
    });
    if(!await exhaustPurchases(page)) {
        let trick = await page.evaluate(() => {
            // Must start with Wizard Towers
            let order = [7, 0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
            return window.SPCC.buildingsAsReservoirsPurchaseTrick({
                buildingsOrder: order,
            });

            // This step destroys CpC, so wwe needed to save it before
        });
        if(!trick) {
            break;
        }
    }
}

let previousGameCookies = await page.evaluate(() => {
    let previousGameCookies = Game.cookies;
    for(let i = 0; i < Game.ObjectsById.length; i++) {
        Game.ObjectsById[i].sell(Game.ObjectsById[i].amount, false as any); // TODO @types/cookieclicker
    }
    return previousGameCookies;
});

console.log(await page.evaluate(cpc => {
    return "Save 4: " +
           window.Beautify(Game.cookies) +
           " - CpC was " + window.Beautify(cpc) +
           ", factor till next power of two: " +
           window.SPCC.factorTillNextPowerOfTwo(cpc);
}, cpc));
await writeSaveFile(page, './saves/sisyphus3-4.cki');
// await page.pause();

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 5                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Using the buildings-as-reservoirs trick to get higher building specials,
 * plus purchasing the Chocolate egg.
 */

/* I have to reset Game.cookies because functions like roundOfPurchases
 * relies on it being an accurate indicative of how many cookies we can repeatedly obtain
 */
await page.evaluate(prev => Game.cookies = prev, previousGameCookies);
while(true) {
    cpc = await page.evaluate(() => {
        window.SPCC.roundOfPurchases(); // Undoes the selling from the last save
        window.SPCC.fillGardenWith({plant: 'whiskerbloom', plant2: 'nursetulip'});
        window.SPCC.fillGardenWith({plant: null, plant2: 'whiskerbloom', buds: true});
        let pantheon = Game.Objects['Temple'].minigame;
        pantheon.slotGod(pantheon.gods['mother'], 0);
        Game.killBuffs();
        window.SPCC.gainEndlessFrenzy();
        Game.gainBuff('sugar blessing', 86400, 1);
        Game.gainBuff('click frenzy', Math.ceil(13 * window.SPCC.buffTimeModifier()), 777);
        Game.gainBuff('blood frenzy', Math.ceil(6 * window.SPCC.buffTimeModifier()), 666);
        window.SPCC.gainMaximumGodzamok();
        for(let i = 0; i < 20; i++) {
            window.SPCC.gainBuildingSpecial({useHighest: true});
        }

        window.SPCC.nineQuadrillionClicks();
        return Game.computedMouseCps;
    });
    if(!await exhaustPurchases(page)) {
        let trick = await page.evaluate(() => {
            let order = [7, 0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
            let startingBank = Game.cookies;
            let hasChanged = false;
            for(let i = 1; i < order.length; i++) {
                let tmp = order[order.length-1];
                order[order.length-1] = order[i];
                order[i] = tmp;
                if(window.SPCC.buildingsAsReservoirsPurchaseTrick({
                    buildingsOrder: order,
                    reportOnlyChangeInHighest: true,
                    startingBank,
                }))
                {
                    hasChanged = true;
                }
                tmp = order[order.length-1];
                order[order.length-1] = order[i];
                order[i] = tmp;
            }
            return hasChanged;
        });
        if(!trick) {
            break;
        }
    }
}

await page.evaluate(() => {
    for(let i = 0; i < Game.ObjectsById.length; i++) {
        Game.ObjectsById[i].sell(Game.ObjectsById[i].amount, false as any); // TODO @types/cookieclicker
    }
    // Now we purchase the Chocolate egg
    Game.Upgrades['Chocolate egg'].buy(undefined as any); // TODO @types/cookieclicker
});

console.log(await page.evaluate(cpc => {
    return "Save 5: " +
           window.Beautify(Game.cookies) +
           " - CpC was " + window.Beautify(cpc) +
           ", factor till next power of two: " +
           window.SPCC.factorTillNextPowerOfTwo(cpc);
}, cpc));
await writeSaveFile(page, './saves/sisyphus3-5.cki');
// await page.pause();

await page.close();
