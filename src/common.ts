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
    setCookies: (cookies: number) => void,
    nineQuadrillionClicks: () => void,
    nineQuadrillionLumps: (amount: number) => void,
    nextCheck: () => boolean,
    nextCheckState: 'inactive' | 'waiting' | 'check',
};

/* Initializes window.SPCC.
 * This function must be executed inside the Page object,
 * and is also why all other functions are defined inside the code of this function.
 */
function initBrowserUtilities() {
    /* Helper function.
     * Sets Game.cookies to the given amount,
     * unless Game.cookies is higher than the given amount.
     */
    function setCookies(cookies: number) {
        Game.cookies = Math.max(Game.cookies, cookies);
        Game.cookiesEarned = Math.max(Game.cookiesEarned, cookies); // Prevents CCTA
    }

    // Simulates clicking the big cookie 2*53 times
    function nineQuadrillionClicks() {
        // The fundamental behavior of nine quadrillion clicks
        let gainedCookies = 2**(Math.ceil(Math.log2(Game.computedMouseCps)) + 53);
        window.SPCC.setCookies(gainedCookies);

        // Other consequences
        Game.Win('Uncanny clicker'); // We click fast...
        Game.Win('So much to do so much to see');
        Game.Win('Just plain lucky'); // ...but it still takes a while for 2**53 clicks
        Game.cookieClicks = 2**53;
        Game.clicksThisSession = 2**53;
        Game.handmadeCookies = Math.max(Game.handmadeCookies, gainedCookies);

        // Trigger the vanilla click, just to make sure any other consequences take place
        CConnoisseur.clickBigCookie();
    };

    /* Unlocks sugar lumps and gains the given amount of lumps,
     * nine quadrillion times.
     *
     * Also unlocks all lump-related achievements
     * (except harvesting a meaty sugar lump, if no grandmapocalypse technology is owned).
     */
    function nineQuadrillionLumps(amount: number) {
        window.SPCC.setCookies(1e9);
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
    }

    Game.registerHook('check', () => {
        if(window.SPCC.nextCheckState == 'waiting') {
            window.SPCC.nextCheckState = 'check';
        }
    });
    /* Waits for the next game tick
     * where the several once-every-five-seconds checks are performed.
     * This is meant to be used like
     *  page.waitForFunction(() => window.SPCC.nextCheck());
     */
    function nextCheck() {
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
        setCookies,
        nineQuadrillionClicks,
        nineQuadrillionLumps,
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

export async function writeSaveFile(page: Page, path: string) {
    let save = await page.evaluate(() => {
        let time = Game.time;
        Game.time = 2**53; // This becomes Game.lastDate inside Game.WriteSave
        return Game.WriteSave(1);
        Game.time = time;
    });
    await fsPromises.writeFile(path, save);
}
