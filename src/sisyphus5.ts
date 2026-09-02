/* This creates the save files for Sisyphus Plays Cookie Clicker V: Reach for the Heavens
 * (<https://github.com/staticvariablejames/CookieMusings/blob/master/sisyphus-plays-cookie-clicker-5-ascension>).
 *
 * Ascension is permitted,
 * but with heavely limited GFD usage, and no idling.
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 1                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Revert back to overfeeding wrinklers and the buildings-as-reservoirs trick
 * (due to GFD restrictions),
 * but with heavenly upgrades and prestige levels.
 */
import { openSisyphus, exhaustPurchases, writeSaveFile } from './common.ts';

let page = await openSisyphus({
    mockedDate: 86400*1000*(1e8-1), // 24 hours before the last valid Date() object
    saveGame: {
        seed: "aaadj",
        permanentUpgrades: [
            'Dragon scale', 'Dragon claw', 'Dragon fang', 'Dragon teddy bear', '',
        ],
        vault: [
            'Bingo center/Research facility',
            'Birthday cookie',
            'Chocolate egg',
        ],
    },
    querySteamPlayers: 10000, // AKA 100 * heralds
});

await page.evaluate(() => {
    /* The previous best was 2.3166211683437614e+152, but we lost most of GFD's power,
     * so we start again with just the best from part II.
     */
    Game.Earn(2**355);
    window.SPCC.nineQuadrillionLumps(10);
    window.SPCC.levelUpMostBuildings();
    for(let u of Game.UpgradesByPool['prestige']) {
        /* Technically we should deduct the heavenly chips for each upgrade,
         * but we will have so many heavenly chips it will be literally a rounding error.
         */
        u.earn(); 
    }
    Game.Win('All the stars in heaven');
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
    window.SPCC.postAscensionsMiscellaneousGrind();
    window.SPCC.nineQuadrillionStocks();
    window.SPCC.earnUpgrade('Birthday cookie');

    window.SPCC.grindGrandmapocalypse({maxStage: 2});
    /* Additionally, we get the following achievements
     * from having gone through the grandmapocalypse in earlier ascensions.
     */
    Game.Win('Grandmapocalypse');
    Game.Win('Elder nap');
    Game.Win('Elder slumber');
    Game.Win('Elder calm');
    Game.pledges = 2**53;

    let pantheon = Game.Objects['Temple'].minigame;
    pantheon.slotGod(pantheon.gods['mother'], 0);
    l('templeSlot0')!.appendChild(l(`templeGod${pantheon.slot[0]}`)!);
    pantheon.slotGod(pantheon.gods['asceticism'], 1);
    l('templeSlot1')!.appendChild(l(`templeGod${pantheon.slot[1]}`)!);
    // Simulates a perfectly-timed Cyclius
    Game.registerHook('cps', cps => cps * 1.15);

    Game.Objects['Wizard tower'].amount = 321;
});

let cps: number;

while(true) {
    cps = await page.evaluate(() => {
        Game.killBuffs();
        window.SPCC.grindGrandmapocalypse({maxStage: 2});
        window.SPCC.gainEndlessFrenzy();
        Game.gainBuff('sugar blessing', 86400, 1);
        window.SPCC.gainBuildingSpecial();
        window.SPCC.gainBuildingSpecial();
        Game.gainBuff('blood frenzy', Math.ceil(6 * window.SPCC.buffTimeModifier()), 666);

        window.SPCC.fillGardenWith({plant: 'goldenClover', plant2: 'nursetulip'});
        window.SPCC.fillGardenWith({plant: 'whiskerbloom', buds: true});
        /* Updates Game.effs, which matters to maximizeWizardTowers in ultimateFtHoFCombo.
         */
        Game.CalculateGains();
        window.SPCC.ultimateFtHoFCombo({gfd: true});
        let pantheon = Game.Objects['Temple'].minigame;
        pantheon.slotGod(pantheon.gods['mother'], 0);

        window.SPCC.nineQuadrillionClicks(); // For the achievements
        window.SPCC.nineQuadrillionWrinklers();
        window.SPCC.nineQuadrillionAscensions();
        Game.elderWrath = 2;

        return Game.cookiesPs;
    });

    if(!await exhaustPurchases(page, {limitTowers: true})) {
        let trick = await page.evaluate(() => {
            // Must skip Wizard towers, as we need to sell them to get the buffs
            let order = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
            let out = window.SPCC.buildingsAsReservoirsPurchaseTrick({
                buildingsOrder: order,
            });
            return out;
        });
        if(!trick) {
            break;
        }
    }
}

console.log(await page.evaluate(cps => {
    return "Save 1: " +
           window.Beautify(window.SPCC.cookiesAfterSelling()) + ' cookies, ' +
           window.Beautify(Game.cookiesReset) + ' cookies sacrificed' +
           " - CpS is " + window.Beautify(cps) +
           ", factor till next power of two: " +
           window.SPCC.factorTillNextPowerOfTwo(cps);
}, cps));
await writeSaveFile(page, './saves/sisyphus5-1.cki');
// await page.pause();

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 2                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * More multipliers from Sugar Frenzy, Golden Switch, Shimmering Veil;
 * six additional GC (from DEoRL + longer BS + faster GCs),
 * and Krumblor's auras: Supreme Intellect + Reality Bending for casting GFD,
 * Dragon's Fortune and Radiant Appetite for getting more cookies,
 * and Earth Shatterer to power the buildings-as-reservoirs trick.
 */
while(true) {
    cps = await page.evaluate(() => {
        Game.killBuffs();
        Game.killShimmers();
        window.SPCC.grindGrandmapocalypse({maxStage: 2});
        window.SPCC.gainEndlessFrenzy();
        window.SPCC.gainEndlessDragonHarvest();
        Game.gainBuff('sugar blessing', 86400, 1);
        Game.gainBuff('sugar frenzy', 3600, 3);
        Game.Upgrades['Golden switch [off]'].buy(0); // TODO: fix @types/cookieclicker
        Game.Upgrades['Shimmering veil [off]'].buy(0);

        window.SPCC.fillGardenWith({plant: 'goldenClover', plant2: 'nursetulip'});
        window.SPCC.fillGardenWith({plant: 'whiskerbloom', buds: true});
        Game.CalculateGains();
        for(let i = 0; i < 7; i++) {
            window.SPCC.gainBuildingSpecial();
        }
        Game.dragonAura = (Game as any).dragonAurasBN['Supreme Intellect'].id; // TODO @types/cookieclicker
        Game.dragonAura2 = (Game as any).dragonAurasBN['Reality Bending'].id;
        let leftoverCasts = window.SPCC.ultimateFtHoFCombo({gfd: true});
        Game.gainBuff('blood frenzy', Math.ceil(6 * window.SPCC.buffTimeModifier()), 666);

        let pantheon = Game.Objects['Temple'].minigame;
        pantheon.slotGod(pantheon.gods['mother'], 0);

        Game.dragonAura = (Game as any).dragonAurasBN['Radiant Appetite'].id;
        Game.dragonAura2 = (Game as any).dragonAurasBN["Dragon's Fortune"].id;
        console.log(`${leftoverCasts} on-screen golden cookies`);
        for(let i = 0; i < leftoverCasts; i++) {
            new Game.shimmer('golden');
        }

        window.SPCC.nineQuadrillionClicks();
        window.SPCC.nineQuadrillionWrinklers();
        window.SPCC.nineQuadrillionAscensions();
        Game.elderWrath = 2;

        return Game.cookiesPs;
    });

    // Now also must limit "You"s to keep changing dragon auras
    if(!await exhaustPurchases(page, {limitTowers: true, limitYous: true})) {
        let trick = await page.evaluate(() => {
            Game.dragonAura = (Game as any).dragonAurasBN['Earth Shatterer'].id;
            Game.dragonAura2 = (Game as any).dragonAurasBN['Reality Bending'].id;
            // Must also skip Yous
            let order = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
            let out = window.SPCC.buildingsAsReservoirsPurchaseTrick({
                buildingsOrder: order,
            });
            return out;
        });
        if(!trick) {
            break;
        }
    }
}

console.log(await page.evaluate(cps => {
    return "Save 2: " +
           window.Beautify(window.SPCC.cookiesAfterSelling()) + ' cookies, ' +
           window.Beautify(Game.cookiesReset) + ' cookies sacrificed' +
           " - CpS is " + window.Beautify(cps) +
           ", factor till next power of two: " +
           window.SPCC.factorTillNextPowerOfTwo(cps);
}, cps));
await writeSaveFile(page, './saves/sisyphus5-2.cki');
// await page.pause();

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                Save File 3                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Endless Godzamok; Dragonflight; 16 on-screen golden cookies.
 * But we lose the Birthday cookie.
 */
await page.evaluate(() => Game.Upgrades['Birthday cookie'].unearn());
while(true) {
    cps = await page.evaluate(() => {
        Game.killBuffs();
        Game.killShimmers();
        window.SPCC.grindGrandmapocalypse({maxStage: 3, pledge: true});
        window.SPCC.gainEndlessFrenzy();
        window.SPCC.gainEndlessDragonHarvest();
        Game.gainBuff('dragonflight', Math.ceil(10 * window.SPCC.buffTimeModifier()), 1111);
        Game.gainBuff('click frenzy', Math.ceil(13 * window.SPCC.buffTimeModifier()), 777);
        Game.gainBuff('sugar blessing', 86400, 1);
        Game.gainBuff('sugar frenzy', 3600, 3);
        Game.Upgrades['Golden switch [off]'].buy(0); // TODO: fix @types/cookieclicker
        Game.Upgrades['Shimmering veil [off]'].buy(0);

        Game.takeLoan!(1);
        Game.takeLoan!(2);
        Game.takeLoan!(3);

        window.SPCC.gainMaximumGodzamok();
        for(let i = 0; i < 20; i++) {
            window.SPCC.gainBuildingSpecial();
        }
        Game.gainBuff('blood frenzy', Math.ceil(6 * window.SPCC.buffTimeModifier()), 666);

        window.SPCC.fillGardenWith({plant: 'whiskerbloom', plant2: 'nursetulip'});
        window.SPCC.fillGardenWith({plant: null, plant2: 'whiskerbloom', buds: true});
        Game.CalculateGains();
        let pantheon = Game.Objects['Temple'].minigame;
        pantheon.slotGod(pantheon.gods['mother'], 0);

        Game.dragonAura = (Game as any).dragonAurasBN["Dragon's Fortune"].id;
        Game.dragonAura2 = (Game as any).dragonAurasBN['Reality Bending'].id;
        for(let i = 0; i < 16; i++) {
            new Game.shimmer('golden');
        }

        window.SPCC.nineQuadrillionClicks();
        window.SPCC.nineQuadrillionAscensions({krumblor: true, nastyGoblins: true});
        return Game.cookiesPs;
    });

    if(!await exhaustPurchases(page, {limitTowers: true, limitYous: true})) {
        let trick = await page.evaluate(() => {
            Game.dragonAura = (Game as any).dragonAurasBN['Earth Shatterer'].id;
            Game.dragonAura2 = (Game as any).dragonAurasBN['Reality Bending'].id;
            let order = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
            let out = window.SPCC.buildingsAsReservoirsPurchaseTrick({
                buildingsOrder: order,
            });
            return out;
        });
        if(!trick) {
            break;
        }
    }
}

console.log(await page.evaluate(cps => {
    let cookies = window.SPCC.cookiesAfterSelling({krumblor: true, nastyGoblins: true});
    return "Save 3: " +
           window.Beautify(cookies) + ' cookies, ' +
           window.Beautify(Game.cookiesReset) + ' cookies sacrificed' +
           " - CpS is " + window.Beautify(cps) +
           ", factor till next power of two: " +
           window.SPCC.factorTillNextPowerOfTwo(cps);
}, cps));
await writeSaveFile(page, './saves/sisyphus5-3.cki');
// await page.pause();

for(let i = 4; i <= 5; i++) {
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     *                            Save Files 4 and 5                             *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Same as before, but with 19 on-screen golden cookies,
     * and the more elaborate version of the buildings-as-reservoirs trick.
     *
     * Additionally, for save file 5,
     * we add back the Birthday cookie.
     */
    if(i == 5) {
        await page.evaluate(() => Game.Upgrades['Birthday cookie'].earn());
    }

    while(true) {
        cps = await page.evaluate(() => {
            Game.killBuffs();
            Game.killShimmers();
            window.SPCC.grindGrandmapocalypse({maxStage: 3, pledge: true});
            window.SPCC.gainEndlessFrenzy();
            window.SPCC.gainEndlessDragonHarvest();
            Game.gainBuff('dragonflight', Math.ceil(10 * window.SPCC.buffTimeModifier()), 1111);
            Game.gainBuff('click frenzy', Math.ceil(13 * window.SPCC.buffTimeModifier()), 777);
            Game.gainBuff('sugar blessing', 86400, 1);
            Game.gainBuff('sugar frenzy', 3600, 3);
            Game.Upgrades['Golden switch [off]'].buy(0); // TODO: fix @types/cookieclicker
            Game.Upgrades['Shimmering veil [off]'].buy(0);

            Game.takeLoan!(1);
            Game.takeLoan!(2);
            Game.takeLoan!(3);

            window.SPCC.gainMaximumGodzamok();
            for(let i = 0; i < 20; i++) {
                window.SPCC.gainBuildingSpecial({useHighest: true});
            }
            Game.gainBuff('blood frenzy', Math.ceil(6 * window.SPCC.buffTimeModifier()), 666);

            /* Needs golden clovers to get more on-screen GCs,
             * but I can replace the nursetulips with bud whiskerblooms afterwards.
             */
            window.SPCC.fillGardenWith({plant: 'goldenClover', plant2: 'nursetulip'});
            window.SPCC.fillGardenWith({plant: 'whiskerbloom', buds: true});
            Game.CalculateGains();
            let pantheon = Game.Objects['Temple'].minigame;
            pantheon.slotGod(pantheon.gods['mother'], 0);

            Game.dragonAura = (Game as any).dragonAurasBN["Dragon's Fortune"].id;
            Game.dragonAura2 = (Game as any).dragonAurasBN['Reality Bending'].id;
            for(let i = 0; i < 18; i++) {
                new Game.shimmer('golden');
            }

            window.SPCC.nineQuadrillionClicks();
            window.SPCC.nineQuadrillionAscensions({krumblor: true, nastyGoblins: true});
            return Game.cookiesPs;
        });

        if(!await exhaustPurchases(page, {limitTowers: true, limitYous: true})) {
            let trick = await page.evaluate(() => {
                let order = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
                let startingBank = Game.cookies;
                let hasChanged = false;
                for(let i = 1; i < order.length; i++) {
                    let tmp = order[order.length-1];
                    order[order.length-1] = order[i];
                    order[i] = tmp;
                    if(window.SPCC.buildingsAsReservoirsPurchaseTrick({
                        buildingsOrder: order,
                        calculateHighest: [7, 19],
                        reportOnlyChangeInHighest: true,
                        startingBank,
                        krumblor: true,
                        nastyGoblins: true,
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

    console.log(await page.evaluate(([cps, i]) => {
        let cookies = window.SPCC.cookiesAfterSelling({krumblor: true, nastyGoblins: true});
        return `Save ${i}: ` +
               window.Beautify(cookies) + ' cookies ' +
               `(${cookies} = 2^${Math.log2(cookies)}); ` +
               window.Beautify(Game.cookiesReset) + ' cookies sacrificed ' +
               `(${Game.cookiesReset} = 2^${Math.log2(Game.cookiesReset)})` +
               " - CpS is " + window.Beautify(cps) +
               ", factor till next power of two: " +
               window.SPCC.factorTillNextPowerOfTwo(cps);
    }, [cps, i]));
    await writeSaveFile(page, `./saves/sisyphus5-${i}.cki`);
}
// await page.pause();

await page.close();
