/* Simple script for searching for specific seeds.
 *
 * Launch this script,
 * then run the desired function inside the Playwright browser.
 */
import { openSisyphus } from './common.ts';

let page = await openSisyphus({
    saveGame: {
        volume: 0,
        achievements: 'all',
        buildings: {
            "Wizard tower": {
                amount: 321,
                level: 1,
                minigame: {
                    spellsCast: 2**53,
                    spellsCastTotal: 2**53,
                },
            },
        },
    },
});

await page.evaluate(() => {
    let grimoire = Game.Objects['Wizard tower'].minigame;
    let fthof = grimoire.spells['hand of fate'];
    let gfd = grimoire.spells['gambler\'s fever dream'];
    let st = grimoire.spells['stretch time'];

    function* seedIterator(startSeed: string) {
        let z = 'z'.charCodeAt(0);
        let seedCharacters = Array.from(startSeed).map(s => s.charCodeAt(0));
        while(true) {
            yield seedCharacters.map(c => String.fromCharCode(c)).join('');
            let i = seedCharacters.length-1;
            for(; i >= 0; i--) {
                if(seedCharacters[i] == z) {
                    seedCharacters[i] = 'a'.charCodeAt(0);
                } else {
                    seedCharacters[i]++;
                    break;
                }
            }
            if(i < 0) {
                break;
            }
        }
    }

    /* Prints a sequence of casts and wizard tower amounts
     * that casts Stretch Time as many times in a row as possible.
     */
    function stretchTimeCastSequence(options?: {gfd?: boolean}) {
        if(!options) options = {};
        if(!Game.isMinigameReady(Game.Objects['Wizard tower'])) return;
        let logs: string[] = [];
        let grimoire = Game.Objects['Wizard tower'].minigame;

        Game.Objects['Wizard tower'].level = 1;
        Game.Objects['Wizard tower'].amount = 517; // Minimum number of towers for 100 max magic

        grimoire.computeMagicM();
        grimoire.magic = grimoire.magicM;
        while(true) {
            let spellCost;
            if(options.gfd) {
                spellCost = grimoire.getSpellCost(gfd) + grimoire.getSpellCost(st)/2;
            } else {
                spellCost = grimoire.getSpellCost(st);
            }
            if(spellCost <= grimoire.magic) {
                grimoire.magic -= spellCost;
                logs.push(
                    `${grimoire.magic + spellCost} -> ${grimoire.magic} ` +
                    `(${options.gfd ? 'GFD->' : ''}ST, ` +
                    `${Game.Objects['Wizard tower'].amount} towers)`
                );
                if(options.gfd) {
                    // Also report available candidates for GFD
                    let budget = grimoire.magic + grimoire.getSpellCost(st)/2;
                    let candidates: string[] = [];
                    for(let spell of grimoire.spellsById) {
                        if(spell.name != "Gambler's Fever Dream" &&
                           grimoire.getSpellCost(spell)*0.5 <= budget)
                        {
                            candidates.push(spell.name);
                        }
                    }
                    console.log(`[SPCC] Candidates were ${candidates.length}: ` +
                                `${candidates.join(', ')}`);
                }
                window.SPCC.sellWizardTowersToAdjustMagic();
            } else {
                break;
            }
        }

        window.SPCC.maximizeWizardTowers();
        console.log(`[SPCC] ${logs.length} casts: ${logs.join(', ')}`);
    }

    /* Finds the first seed after `startSeed`
     * such that FtHoF has a Building Special as the outcome.
     */
    function findBuildingSpecial(startSeed: string = 'aaaaa') {
        Game.Objects['Wizard tower'].amount = 21;
        grimoire.computeMagicM();
        for(let seed of seedIterator(startSeed)) {
            Game.seed = seed;
            Game.killShimmers();
            grimoire.magic = grimoire.magicM;
            grimoire.castSpell(fthof);
            if((Game.shimmers[0] as any)?.force == 'building special') {
                return seed;
            }
        }
        return 'not found';
    }

    /* Finds the first seed after `startSeed` such that,
     * for every one of the tower counts,
     * casting GFD (when starting with the given tower count and max magic)
     * yields FtHoF with building special as the outcome.
     *
     * For example,
     * `SeedSearch.findGFD([1556, 454, 121, 31, 6, 530, 137, 36, 7]) == "aaadj"`.
     */
    function findGFD(towerCounts: number[], startSeed: string = 'aaaaa') {
        let trueSetTimeout = setTimeout;
        (window as any).setTimeout = (f: () => void) => f();
    outerLoop:
        for(let seed of seedIterator(startSeed)) {
            for(let towerCount of towerCounts) {
                Game.Objects['Wizard tower'].amount = towerCount;
                grimoire.computeMagicM();
                Game.seed = seed;
                Game.killBuffs();
                Game.killShimmers();
                grimoire.magic = grimoire.magicM;
                grimoire.castSpell(gfd);
                if(Game.shimmers.length == 0) {
                    // not FtHoF
                    continue outerLoop;
                } else if((Game.shimmers[0] as any)?.force != 'building special') {
                    // not Building special
                    continue outerLoop;
                } else {
                    // GFD picks FtHoF, and is a building special. Check next towerCount
                    continue;
                }
            }
            // All tower counts passed
            (window as any).setTimeout = trueSetTimeout;
            return seed;
        }
        (window as any).setTimeout = trueSetTimeout;
        return 'not found';
    }

    /* Similar to findGFD,
     * but the spell sought after is a stretch time with a positive response.
     *
     * For example,
     * `SeedSearch.findStretchTime([517, 288, 154, 77, 38, 17, 5]) == "aaaat"`.
     */
    function findStretchTime(towerCounts: number[], startSeed: string = 'aaaaa') {
        let trueSetTimeout = setTimeout;
        (window as any).setTimeout = (f: () => void) => f();
    outerLoop:
        for(let seed of seedIterator(startSeed)) {
            for(let towerCount of towerCounts) {
                Game.Objects['Wizard tower'].amount = towerCount;
                grimoire.computeMagicM();
                grimoire.magic = grimoire.magicM;
                Game.seed = seed;
                Game.killBuffs();
                Game.killShimmers();
                Game.gainBuff('devastation', 10, 1);
                grimoire.castSpell(gfd);
                if(Game.buffs['Devastation'].maxTime > 300) {
                    // GFD picks Stretch Time, and it works. Check next towerCount
                    continue;
                } else {
                    // Either GFD does not pick Stretch Time, or it backfires
                    continue outerLoop;
                }
            }
            // All tower counts passed
            (window as any).setTimeout = trueSetTimeout;
            return seed;
        }
        (window as any).setTimeout = trueSetTimeout;
        return 'not found';
    }

    (window as any).SeedSearch = {
        seedIterator,
        stretchTimeCastSequence,
        findBuildingSpecial,
        findGFD,
        findStretchTime,
    };
});

await page.pause();

await page.close();
