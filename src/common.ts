import { promises as fsPromises } from 'fs';
import { firefox } from 'playwright';
import type { Page } from 'playwright';
import { openCookieClickerPage, CCSave } from 'cookie-connoisseur';

type CCPageOptions = Exclude<Parameters<typeof openCookieClickerPage>[1], undefined>;

/* Sisyphus Plays Cookie Clicker; aggregates helper functions.
 * The function initBrowserUtilities below creates an object window.SPCC with this type.
 * openSisyphus further down runs this function inside a Playwright Page.
 *
 * The documentation for what each function does is found below,
 * above each function definition.
 */
export type SPCC_t = {
    limitIEEE754: (summand: number) => number,
    setCookies: (cookies: number) => void,
    nineQuadrillionYears: () => void,
    nineQuadrillionClicks: () => void,
    nineQuadrillionTicks: () => void,
    nineQuadrillionLumps: (amount: number) => void,
    levelUpMostBuildings: () => void,
    roundOfPurchases: () => boolean,
    nextCheck: () => boolean,
    nextCheckState: 'inactive' | 'waiting' | 'check',
};

/* Initializes window.SPCC.
 * This function must be executed inside the Page object,
 * and is also why all other functions are defined inside the code of this function.
 */
function initBrowserUtilities() {
    /* Helper function.
     * Calculates limit (under IEEE754 floating-point arithmetic)
     * of adding the given number to itself over and over again.
     */
    function limitIEEE754(summand: number) {
        return 2**(53 + Math.ceil(Math.log2(summand)));
    }

    /* Helper function.
     * Sets Game.cookies to the given amount,
     * unless Game.cookies is higher than the given amount.
     */
    function setCookies(cookies: number) {
        Game.cookies = Math.max(Game.cookies, cookies);
        Game.cookiesEarned = Math.max(Game.cookiesEarned, cookies); // Prevents CCTA
    }

    /* Trigger effects that happen after waiting for a very long time.
     *
     * All other `nineQuadrillion` functions call this function,
     * so there's no need to explicitly call it yourself.
     */
    function nineQuadrillionYears() {
        Game.missedGoldenClicks = 2**53;
        Game.Win('So much to do so much to see');
        Game.Win('Just plain lucky');
    }

    // Simulates clicking the big cookie 2*53 times
    function nineQuadrillionClicks() {
        let gainedCookies = limitIEEE754(Game.computedMouseCps);
        setCookies(gainedCookies);

        // Other consequences
        Game.Win('Uncanny clicker'); // We click fast...
        nineQuadrillionYears(); // ...but it still takes a while for 2**53 clicks
        Game.cookieClicks = 2**53;
        Game.clicksThisSession = 2**53;
        Game.handmadeCookies = Math.max(Game.handmadeCookies, gainedCookies);

        // Trigger the vanilla click, just to make sure any other consequences take place
        CConnoisseur.clickBigCookie();
    };

    /* Gains cookies (and other effects)
     * corresponding 2**53 in-game ticks.
     */
    function nineQuadrillionTicks() {
        Game.CalculateGains();
        setCookies(limitIEEE754(Game.cookiesPs/Game.fps));

        for(let i in Game.Objects) {
            Game.Objects[i].totalCookies = Math.max(
                Game.Objects[i].totalCookies,
                limitIEEE754(Game.Objects[i].storedTotalCps*Game.globalCpsMult/Game.fps),
            );
        }

        nineQuadrillionYears();
    }

    /* Gains the given amount of lumps, nine quadrillion times.
     *
     * Also unlocks all lump-related achievements
     * (except harvesting a meaty sugar lump, if One mind is not purchased).
     */
    function nineQuadrillionLumps(amount: number) {
        let gainedLumps = 2**(Math.ceil(Math.log2(amount)) + 53);
        Game.lumps = Math.max(Game.lumps, gainedLumps);
        Game.lumpsTotal = Math.max(Game.lumpsTotal, gainedLumps);

        Game.Win('Hand-picked');
        Game.Win('Sugar sugar');
        Game.Win('Maillard reaction');
        Game.Win('All-natural cane sugar');

        let hasGrandmapocalypse = Game.Upgrades['One mind'].unlocked;
        if(hasGrandmapocalypse) {
            Game.Win('Sweetmeats');
        }

        Game.gainLumps(amount); // Trigger more achievements
        Game.lumpT = 2**53; // Normalize the game state
        Game.lumpCurrentType = 0;

        nineQuadrillionYears();
    }

    /* Levels up all buildings to the maximum possible level (2**53),
     * with the exception of Wizard Towers which are leveled up just to level 1.
     */
    function levelUpMostBuildings() {
        for(let i in Game.Objects) {
            if(Game.Objects[i].name != 'Wizard tower') {
                Game.Objects[i].level = 2**53;
            }
            Game.Objects[i].levelUp(); // Triggers leveling up achievements
        }
    }

    /* Purchases all purchaseable upgrades and buildings,
     * but without actually spending cookies.
     */
    function roundOfPurchases() {
        let purchasedSomething = false;

        // First we buildings, as they might unlock upgrades
        for(let i in Game.Objects) {
            let obj = Game.Objects[i];
            while(obj.getPrice(1) <= Game.cookies) {
                obj.buyFree(1);
                purchasedSomething = true;

                /* The following line unlocks upgrades and achievements.
                 * It is called by buy, but not by buyFree, for some reason.
                 */
                if(obj.buyFunction) obj.buyFunction();
            }
        }

        Game.RebuildUpgrades();
        for(let upgrade of Game.UpgradesInStore) {
            if(upgrade.isVaulted()) continue;
            if(upgrade.unlocked && upgrade.getPrice() <= Game.cookies) {
                upgrade.earn();
                purchasedSomething = true;
            }
        }
        return purchasedSomething;
    }

    Game.registerHook('check', () => {
        if(window.SPCC.nextCheckState == 'waiting') {
            window.SPCC.nextCheckState = 'check';
        }
    });
    /* Waits for the next game tick
     * where the several once-every-five-seconds checks are performed.
     * It will also wait for the minigames to load.
     *
     * This function meant to be used like
     *  page.waitForFunction(() => window.SPCC.nextCheck());
     */
    function nextCheck() {
        let buildingsWithMinigames = [
            Game.Objects['Farm'],
            Game.Objects['Bank'],
            Game.Objects['Temple'],
            Game.Objects['Wizard tower'],
        ];
        for(let building of buildingsWithMinigames) {
            if(building.level > 0 && !building.minigameLoaded) {
                return false;
            }
        }

        if(window.SPCC.nextCheckState == 'inactive') {
            window.SPCC.nextCheckState = 'waiting';
            // Rounds (Game.T+1) up to next multiple of Game.fps*5
            Game.T++;
            Game.T = Game.fps*5 * Math.ceil(Game.T/(Game.fps*5));
            return false;
        } else if(window.SPCC.nextCheckState == 'waiting') {
            return false;
        } else { // nextCheckState == 'check'
            window.SPCC.nextCheckState = 'inactive';
            return true;
        }
    }

    window.SPCC = {
        limitIEEE754,
        setCookies,
        nineQuadrillionYears,
        nineQuadrillionClicks,
        nineQuadrillionTicks,
        nineQuadrillionLumps,
        levelUpMostBuildings,
        roundOfPurchases,
        nextCheck,
        nextCheckState: 'inactive',
    };
}

/* Opens a Cookie Clicker page and install the utility functions listed above.
 *
 * The bakery name is forced to be "Sisyphus' bakery".
 *
 * The underlying browser will be automatically closed upon page.close().
 */
export async function openSisyphus(options: CCPageOptions) {
    // Force the bakery name to be "Sisyphus' bakery"
    let save = new CCSave();
    if(typeof options.saveGame == 'string') {
        save = CCSave.fromNativeSave(options.saveGame);
    } else if(typeof options.saveGame == 'object') {
        save = CCSave.fromObject(options.saveGame);
    }
    save.bakeryName = 'Sisyphus';
    options.saveGame = save;

    let browser = await firefox.launch({headless: false});
    let page = await openCookieClickerPage(browser, options);
    await page.setViewportSize({ width: 1600, height: 900 });

    await page.evaluate(initBrowserUtilities);
    page.on('close', async () => {
        await browser.close();
    });
    return page;
}

/* Performs some save normalization
 * (to ensure the save game stays the same across multiple runs of the script)
 * and writes it to the given file.
 */
export async function writeSaveFile(page: Page, path: string) {
    let save = await page.evaluate(() => {
        Game.lumpT = 2**53;
        if(Game.isMinigameReady(Game.Objects['Farm'])) {
            let garden = Game.Objects['Farm'].minigame;
            garden.harvestAll();
            garden.nextStep = 2**53;
            garden.nextSoil = 2**53;
            garden.nextFreeze = 2**53;
        }

        if(Game.isMinigameReady(Game.Objects['Bank'])) {
            let stockMarket = Game.Objects['Bank'].minigame;
            for(let i = 0; i < stockMarket.goodsById.length; i++) {
                let good = stockMarket.goodsById[i];
                good.val = stockMarket.getRestingVal(i);
                good.mode = 0;
                good.d = 0;
                good.dur = 10;
                good.stock = 0;
                good.last = 0;
                (good as any).prev = 0; // TODO: fix @types/cookieclicker
            }
        }

        if(Game.isMinigameReady(Game.Objects['Temple'])) {
            Game.Objects['Temple'].minigame.swapT = 2**53;
        }

        if(Game.isMinigameReady(Game.Objects['Wizard tower'])) {
            Game.Objects['Wizard tower'].minigame.magic = 0;
        }

        let time = Game.time;
        Game.time = 2**53; // This becomes Game.lastDate inside Game.WriteSave
        return Game.WriteSave(1);
        Game.time = time;
    });
    await fsPromises.writeFile(path, save);
}
