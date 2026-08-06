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

    (window as any).SeedSearch = {
        seedIterator,
        findBuildingSpecial,
        findGFD,
    };
});

await page.pause();

await page.close();
