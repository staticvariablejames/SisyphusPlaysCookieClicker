import { promises as fsPromises } from 'fs';
import { firefox } from 'playwright';
import type { Page } from 'playwright';
import { openCookieClickerPage, CCSave } from 'cookie-connoisseur';

type CCPageOptions = Exclude<Parameters<typeof openCookieClickerPage>[1], undefined>;

type FillGardenOptions = {
    plant: string,
    plant2?: string,
    buds?: boolean,
};

type UltimateFtHoFComboOptions = {
    gfd?: boolean;
    startingTowers?: number;
    verbose?: number;
};

type GrindGrandmapocalypseOptions = {
    maxStage?: number;
    pledge?: boolean;
};

type RoundOfPurchasesOptions = {
    limitTowers?: boolean;
};

/* Sisyphus Plays Cookie Clicker; aggregates helper functions.
 * The function initBrowserUtilities below creates an object window.SPCC with this type.
 * openSisyphus further down runs this function inside a Playwright Page.
 *
 * The documentation for what each function does is found below,
 * above each function definition.
 */
export type SPCC_t = {
    limitIEEE754: (summand: number) => number,
    factorTillNextPowerOfTwo: (x: number) => number,
    setCookies: (cookies: number) => void,
    fillGardenWith: (options: FillGardenOptions) => void,
    buffTimeModifier: () => number,
    gainEndlessFrenzy: () => void,
    gainBuildingSpecial: () => boolean,
    sellWizardTowersToAdjustMagic: () => void,
    maximizeWizardTowers: () => void,
    ultimateFtHoFCombo: (options?: UltimateFtHoFComboOptions) => void,
    nineQuadrillionYears: () => void,
    nineQuadrillionClicks: () => void,
    nineQuadrillionTicks: () => void,
    nineQuadrillionWrinklers: () => void,
    nineQuadrillionStocks: () => void,
    nineQuadrillionLumps: (amount: number) => void,
    levelUpMostBuildings: () => void,
    grindGrandmapocalypse: (options?: GrindGrandmapocalypseOptions) => void,
    seasonsGrind: () => void,
    miscellaneousGrind: () => void,
    roundOfPurchases: (options?: RoundOfPurchasesOptions) => boolean,
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
     * Returns the smallest number `y` such that
     * `x*y` is >= the smallest power of two bigger than `y`.
     */
    function factorTillNextPowerOfTwo(x: number) {
        let nextPowerOfTwo = 2**(Math.ceil(Math.log2(x)));
        let y = nextPowerOfTwo/x; // This is the mathematically correct result
        if(x*y >= nextPowerOfTwo) {
            // The mathematically correct result was rounded to an acceptable number
            return y;
        } else {
            // The mathematically correct result was rounded down, so we need to compensate
            return y + 2**-52;
        }
    }

    /* Helper function.
     * Sets Game.cookies to the given amount,
     * unless Game.cookies is higher than the given amount.
     */
    function setCookies(cookies: number) {
        Game.cookies = Math.max(Game.cookies, cookies);
        Game.cookiesEarned = Math.max(Game.cookiesEarned, cookies); // Prevents CCTA
    }

    /* Helper function.
     * Fills the garden with the specified plant,
     * sets the soil to clay,
     * and force a recalculation of effects.
     *
     * If two plants are specified,
     * plants the first and the second plant with alternated rows.
     *
     * Assumes a 6x6 garden.
     * Silently fails if the garden minigame is not loaded.
     */
    function fillGardenWith(options: FillGardenOptions) {
        if(!options.plant2) {
            options.plant2 = options.plant;
        }
        if(!Game.isMinigameReady(Game.Objects['Farm'])) return;
        let garden = Game.Objects['Farm'].minigame;
        let plantId1 = garden.plants[options.plant].id;
        let plantId2 = garden.plants[options.plant2].id;
        for(let i = 0; i < 6; i++)
        for(let j = 0; j < 3; j++) {
            garden.plot[i][2*j  ][0] = plantId1 + 1; // Why "+1", Orteil??
            garden.plot[i][2*j+1][0] = plantId2 + 1;
            if(options.buds) {
                garden.plot[i][2*j  ][1] = 0;
                garden.plot[i][2*j+1][1] = 0;
            } else {
                garden.plot[i][2*j  ][1] = garden.plants[options.plant].mature;
                garden.plot[i][2*j+1][1] = garden.plants[options.plant2].mature;
            }
        }
        garden.soil = garden.soils['clay'].id;
        garden.freeze = 0;
        garden.computeStepT();
        garden.nextStep = Date.now() + garden.stepT * 1000;

        if(!options.buds) {
            garden.computeBoostPlot();
        }
        garden.computeEffs();

        // Visual aids
        garden.buildPlot();
        garden.buildPanel();
    }

    // Computes the `effectDurMod` variable from Game.shimmerTypes.golden.popFunc.
    function buffTimeModifier() {
        let modifier = 1;
        /* The following few lines were basically copied from the game;
         * they should really be in a separate function.
         */
        if (Game.Has('Get lucky')) modifier *= 2;
        if (Game.Has('Lasting fortune')) modifier *= 1.1;
        if (Game.Has('Lucky digit')) modifier *= 1.01;
        if (Game.Has('Lucky number')) modifier *= 1.01;
        if (Game.Has('Green yeast digestives')) modifier *= 1.01;
        if (Game.Has('Lucky payout')) modifier *= 1.01;
        modifier *= 1+Game.auraMult('Epoch Manipulator')*0.05;
        modifier *= Game.eff('goldenCookieEffDur');
        if (Game.hasGod) {
            let spiritLevel = Game.hasGod('decadence');
            if (spiritLevel==1) modifier *= 1.07;
            else if (spiritLevel==2) modifier *= 1.05;
            else if (spiritLevel==3) modifier *= 1.02;
        }

        return modifier;
    }

    /* Grants an endless frenzy to the player.
     * Achievable with a maxed out garden, or with unreasonable luck.
     */
    function gainEndlessFrenzy() {
        Game.gainBuff('frenzy', Math.ceil(2**54/Game.fps), 7);
    }

    /* Adds a building special
     * for the building with the most buildings that does not yet have an active building special.
     */
    function gainBuildingSpecial() {
        function hasBuildingSpecial(id: number) {
            for(let i in Game.buffs) {
                if(Game.buffs[i].type.name == 'building buff' && Game.buffs[i].arg2 == id) {
                   return true;
               }
            }
            return false;
        }
        let highest = -1;
        for(let i = 0; i < Game.ObjectsById.length; i++) {
            if(hasBuildingSpecial(i)) continue;
            if(highest == -1) {
                highest = i;
            } else if(Game.ObjectsById[i].amount > Game.ObjectsById[highest].amount) {
                highest = i;
            }
        }

        if(highest == -1) {
            console.log('Maximum building specials reached');
            return false;
        } else {
            let buffPower = Game.ObjectsById[highest].amount/10 + 1;

            Game.gainBuff('building buff', Math.ceil(30 * buffTimeModifier()), buffPower, highest);
            return true;
        }
    }

    /* Sets Game.Objects['Wizard tower'].amount
     * to the maximum possible amount of towers that can be bought without changing the bank.
     */
    function maximizeWizardTowers() {
        Game.Objects['Wizard tower'].sacrifice(Game.Objects['Wizard tower'].amount);
        while(Game.Objects['Wizard tower'].getPrice(1) < Game.cookies / 2**53) {
            Game.Objects['Wizard tower'].buyFree(1);
        }
        if(Game.isMinigameReady(Game.Objects['Wizard tower'])) {
            Game.Objects['Wizard tower'].minigame.computeMagicM();
        }
    }

    /* Sells wizard towers until max magic = current magic.
     * Will not sell below 1 wizard tower,
     * which would prevent casting spells.
     */
    function sellWizardTowersToAdjustMagic() {
        if(!Game.isMinigameReady(Game.Objects['Wizard tower'])) return;
        let grimoire = Game.Objects['Wizard tower'].minigame;

        while(Game.Objects['Wizard tower'].amount > 1 && grimoire.magic < grimoire.magicM) {
            Game.Objects['Wizard tower'].sacrifice(1);
            grimoire.computeMagicM();
        }
    }

    /* Adds building specials corresponding to the highest possible number of FtHoF casts
     * that can be performed with two sugar lumps and the current technology.
     *
     * Note that this function destructively changes Game.Objects['Wizard tower'].amount.
     */
    function ultimateFtHoFCombo(options?: UltimateFtHoFComboOptions) {
        if(!options) options = {};
        if(!options.verbose) options.verbose = 0;
        if(!Game.isMinigameReady(Game.Objects['Wizard tower'])) return false;
        let logs: string[] = [];
        let grimoire = Game.Objects['Wizard tower'].minigame;
        let fthof = grimoire.spells['hand of fate'];
        let gfd = grimoire.spells['gambler\'s fever dream'];

        let lumpsLeft = 2;
        if(options.startingTowers) {
            Game.Objects['Wizard tower'].amount = options.startingTowers;
            grimoire.computeMagicM();
        } else {
            maximizeWizardTowers();
        }
        grimoire.magic = grimoire.magicM;
        let totalFtHoFcasts = 0;
        while(true) {
            let spellCost;
            if(options.gfd) {
                spellCost = grimoire.getSpellCost(gfd) + grimoire.getSpellCost(fthof)/2;
            } else {
                spellCost = grimoire.getSpellCost(fthof);
            }
            if(spellCost <= grimoire.magic) {
                grimoire.magic -= spellCost;
                totalFtHoFcasts++;
                logs.push(
                    `${grimoire.magic + spellCost} -> ${grimoire.magic} ` +
                    `(${options.gfd ? 'GFD->' : ''}FtHoF, ` +
                    `${Game.Objects['Wizard tower'].amount} towers)`
                );
                if(options.gfd && options.verbose >= 2) {
                    // Also report available candidates for GFD
                    let budget = grimoire.magic + grimoire.getSpellCost(fthof)/2;
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
                sellWizardTowersToAdjustMagic();
            } else if(lumpsLeft > 0) {
                lumpsLeft--;
                maximizeWizardTowers();
                grimoire.magic = Math.min(grimoire.magic+100, grimoire.magicM);
                sellWizardTowersToAdjustMagic();
            } else {
                break;
            }
        }

        maximizeWizardTowers();
        for(let i = 0; i < totalFtHoFcasts; i++) {
            if(!gainBuildingSpecial()) {
                return false;
            }
        }

        if(options.verbose) {
            console.log(`[SPCC] ${logs.length} casts: ${logs.join(', ')}`);
        }
        return true;
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
        Game.CalculateGains();
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

        if(Game.elderWrath > 0) { // We're in the grandmapocalypse
            for(let wrinkler of Game.wrinklers) {
                if(wrinkler.phase < 2) continue;
                wrinkler.sucked = Math.max(
                    wrinkler.sucked,
                    limitIEEE754(Game.cookiesPs/Game.fps*Game.cpsSucked),
                );
                // Game.cpsSucked is also updated by Game.CalculateGains()
            }
        }

        nineQuadrillionYears();
    }

    /* Spawns wrinklers,
     * fills them to the maximum possible amount of cookies,
     * and pops them.
     * 2**53 times.
     */
    function nineQuadrillionWrinklers() {
        // Ensure we are in the grandmapocalypse
        if(Game.elderWrath == 0) {
            grindGrandmapocalypse();
            Game.elderWrath = 3;
        }

        for(let i = 0; i < Game.getWrinklersMax(); i++) {
            CConnoisseur.spawnWrinkler(i);
            Game.wrinklers[i].type = 1; // Shiny
        }
        nineQuadrillionTicks(); // Fill the wrinklers to the max

        // Swap Skruuia in
        let currentDiamondSlotSpirit: number | null = null;
        if(Game.isMinigameReady(Game.Objects['Temple'])) {
            currentDiamondSlotSpirit = Game.Objects['Temple'].minigame.slot[0];
            Game.Objects['Temple'].minigame.slot[0] =
                Game.Objects['Temple'].minigame.gods['scorn'].id;
            // Technically we might end up with two Skruuias, but that's fine
        }

        // Calculates the cookie gain per wrinkler
        let previousGameCookies = Game.cookies;
        Game.cookies = 0;
        CConnoisseur.popWrinkler(0);
        let cookieGainPerWrinkler = Game.cookies;
        Game.cookies = previousGameCookies;


        // Swap Skruuia out
        if(currentDiamondSlotSpirit != null) {
            Game.Objects['Temple'].minigame.slot[0] = currentDiamondSlotSpirit;
        }

        /* If we had started with a very large Game.cookies,
         * it might be possible that limitIEEE754(cookieGainPerWrinkler) is smaller than it,
         * so we had to do that small dance with previousGameCookies above.
         */
        setCookies(limitIEEE754(cookieGainPerWrinkler));
        Game.cookiesSucked = Math.max(Game.cookiesSucked, limitIEEE754(cookieGainPerWrinkler));
    }

    /* Fills warehouses and sells them all nine quadrillion times.
     */
    function nineQuadrillionStocks() {
        if(!Game.isMinigameReady(Game.Objects['Bank'])) return;

        // All of these achievements come from buying and selling stocks
        Game.Win('Initial public offering');
        Game.Win('Rookie numbers');
        Game.Win('No nobility in poverty');
        Game.Win('Full warehouses');
        Game.Win('Make my day');
        Game.Win('Buy buy buy');
        Game.Win('Liquid assets');
        Game.Win('Gaseous assets');

        let stockMarket = Game.Objects['Bank'].minigame;
        stockMarket.brokers = Math.min(2**53, stockMarket.getMaxBrokers());
        for(let good of stockMarket.goodsById) {
            good.stock = stockMarket.getGoodMaxStock(good);
            let profitIn$ = good.stock * stockMarket.getRestingVal(good.id);
            let profitInCookies = profitIn$ * Game.cookiesPsRawHighest;
            /* The actual maximum value of the stock is around getRestingVal + 415k,
             * but in the precision limit of the bank the 415k is a negligible amount,
             * and (most importantly) because it gets multiplied by 10 * 2**53
             * (which is the good's max stock)
             * it will not get us past the next power of two.
             * (the limitIEEE754 threshold).
             */
            stockMarket.profit = Math.max(stockMarket.profit, limitIEEE754(profitIn$));
            setCookies(limitIEEE754(profitInCookies));
        }
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
        // We get Sweetmeats (harvest a meaty lump) in grindGrandmapocalypse()

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
            Game.Objects[i].levelUp(true); // Triggers leveling up achievements
        }
    }

    // Gets all grandmapocalypse-related upgrades and achievements.
    function grindGrandmapocalypse(options?: GrindGrandmapocalypseOptions) {
        if(!options) options = {maxStage: 3, pledge: true};
        if(!options.maxStage) options.maxStage = 3;

        // These upgrades can be obtained without starting the grandmapocalypse
        Game.Upgrades['Bingo center/Research facility'].earn();
        Game.Upgrades['Specialized chocolate chips'].earn();
        Game.Upgrades['Designer cocoa beans'].earn();
        Game.Upgrades['Ritual rolling pins'].earn();
        Game.Upgrades['Underworld ovens'].earn();

        Game.elderWrath = 0;
        if(options.maxStage <= 0) {
            return;
        }

        // These are only achievable by starting the grandmapocalypse
        Game.Upgrades['One mind'].earn();
        Game.Upgrades['Exotic nuts'].earn();
        Game.Win('Wrath cookie');
        Game.Win('Wrinkler poker');
        Game.Win('Sweetmeats'); // We did not get this one in nineQuadrillionLumps
        Game.wrinklersPopped = 2**53;
        Game.Upgrades['Wrinkler ambergris'].unlock();
        CConnoisseur.spawnWrinkler(0);
        Game.wrinklers[0].type = 1; // Shiny
        CConnoisseur.popWrinkler(0);

        Game.elderWrath = 1;
        if(options.maxStage <= 1) {
            return;
        }

        Game.Upgrades['Communal brainsweep'].earn();
        Game.Upgrades['Arcane sugar'].earn();

        Game.elderWrath = 2;
        if(options.maxStage <= 2) {
            return;
        }

        Game.Upgrades['Elder Pact'].earn();
        Game.Upgrades['Sacrificial rolling pins'].earn();

        Game.Win('Grandmapocalypse');
        Game.Win('Elder nap');
        Game.Win('Elder slumber');
        Game.Win('Elder calm');
        Game.pledges = 2**53;

        Game.elderWrath = 3;

        if(options.pledge) {
            Game.Upgrades['Elder Pledge'].earn(); // Exits the grandmapocalypse
        }
    }

    function seasonsGrind() {
        for(let upgradeName of Game.seasonDrops) {
            Game.Upgrades[upgradeName].unlock();
        }

        Game.Upgrades['A festive hat'].earn();
        Game.specialTab = 'santa';
        for(let i = 0; i < 14; i++) Game.UpgradeSanta();
        Game.reindeerClicked = 2**53;
        let reindeer = new Game.shimmer('reindeer');
        reindeer.pop();
        Game.Win('Eldeer');
        Game.Win("Baby it's old outside");

        /* Easter eggs are unlocked by the for-loop above,
         * but the check in Game.Logic only happens if the season is 'easter'
         */
        Game.Win('The hunt is on');
        Game.Win('Egging on');
        Game.Win('Mass Easteria');
        if(Game.Has('Legacy')) {
            Game.Win('Hide & seek champion'); // We only purchase Chocolate egg before ascending
        }
    }

    /* Maximizes all sorts of counters and miscellanea in the game,
     * and grants related achievements.
     *
     * See also postAscensionsMiscellaneousGrind below.
     */
    function miscellaneousGrind() {
        // Easy-to-get achievements
        Game.Win('Just wrong');
        Game.Win('Early bird');
        Game.Win('Fading luck');
        Game.Win('Cookie-dunker');
        Game.Win('Tiny cookie');
        Game.Win('Here you go');
        Game.Win('Tabloid addiction');
        Game.Win('Stifling the press');
        Game.Win('Olden days');
        Game.Win('In her likeness');
        Game.Win('God complex');

        Game.goldenClicks = 2**53;
        Game.goldenClicksLocal = 2**53;
        Game.missedGoldenClicks = 2**53;
        let gc = new Game.shimmer('golden',{noWrath:true, type:'blab'});
        gc.spawnLead = 1;
        gc.pop(); // Triggers GC-related achievements

        if(Game.isMinigameReady(Game.Objects['Farm'])) {
            let garden = Game.Objects['Farm'].minigame;
            garden.harvests = 2**53;
            garden.harvestsTotal = 2**53;
            Game.Win('Botany enthusiast');
            Game.Win('Green, aching thumb');
            garden.convertTimes = 2**53;
            Game.Win('In the garden of Eden (baby)');
            Game.Win('Keeper of the conservatory');
            Game.Win('Seedless to nay');
            for(let i in garden.plants) {
                garden.unlockSeed(garden.plants[i]);
            }

            let gardenDrops = [
                'Elderwort biscuits',
                'Bakeberry cookies',
                'Duketater cookies',
                'Green yeast digestives',
                'Fern tea',
                'Ichor syrup',
                'Wheat slims',
            ];
            for(let drop of gardenDrops) {
                Game.Upgrades[drop].unlock();
            }

        }

        if(Game.isMinigameReady(Game.Objects['Bank'])) {
            nineQuadrillionStocks(); // TODO this also gains cookies, maybe refactor that portion out?
            Game.Objects['Bank'].minigame.officeLevel = 5;
            Game.Win('Pyramid scheme');
        }

        if(Game.isMinigameReady(Game.Objects['Wizard tower'])) {
            Game.Objects['Wizard tower'].minigame.spellsCast = 2**53;
            Game.Objects['Wizard tower'].minigame.spellsCastTotal = 2**53;
            Game.Win('Bibbidi-bobbidi-boo');
            Game.Win('I\'m the wiz');
            Game.Win('A wizard is you');

            // The grimoire is probably the most natural way of unlocking this achievement
            Game.Win('Four-leaf cookie');
        }
    }

    /* Purchases all purchaseable upgrades and buildings,
     * but without actually spending cookies.
     *
     * If options.limitTowers is true,
     * the Wizard Towers will only be purchased if the can be obtained "for free"
     * (i.e. their price rounds to 0 compared to Game.cookies, according to the IEEE754 specification).
     */
    function roundOfPurchases(options?: RoundOfPurchasesOptions) {
        if(!options) options = {};
        let purchasedSomething = false;

        // First we buildings, as they might unlock upgrades
        for(let i in Game.Objects) {
            let obj = Game.Objects[i];
            let bound = Game.cookies;
            if(i == 'Wizard tower' && options.limitTowers) {
                bound = Game.cookies / 2**53;
            }

            while(obj.getPrice(1) <= bound) {
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
            if(upgrade.isVaulted() || upgrade.pool == 'toggle' || upgrade.pool == 'tech') continue;
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
        factorTillNextPowerOfTwo,
        setCookies,
        fillGardenWith,
        buffTimeModifier,
        gainEndlessFrenzy,
        gainBuildingSpecial,
        sellWizardTowersToAdjustMagic,
        maximizeWizardTowers,
        ultimateFtHoFCombo,
        nineQuadrillionYears,
        nineQuadrillionClicks,
        nineQuadrillionTicks,
        nineQuadrillionWrinklers,
        nineQuadrillionStocks,
        nineQuadrillionLumps,
        levelUpMostBuildings,
        grindGrandmapocalypse,
        seasonsGrind,
        miscellaneousGrind,
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
    save.achievements.push("What's in a name");
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

/* Repeats the cycle of purchasing things and waiting a quadrillion ticks
 * until there are no more purchases to be made.
 * If no purchases were made in the first place,
 * return false.
 */
export async function exhaustPurchases(page: Page, options?: RoundOfPurchasesOptions) {
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


/* Performs some save normalization
 * (to ensure the save game stays the same across multiple runs of the script)
 * and writes it to the given file.
 */
export async function writeSaveFile(page: Page, path: string) {
    let save = await page.evaluate(() => {
        Game.lumpT = 2**53;
        Game.pledgeT = 0;
        Game.researchT = 0;

        for(let buffKey in Game.buffs) {
            Game.buffs[buffKey].time = Game.buffs[buffKey].maxTime;
        }

        if(Game.isMinigameReady(Game.Objects['Farm'])) {
            let garden = Game.Objects['Farm'].minigame;
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
                good.prev = 0;
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
        let save = Game.WriteSave(1);
        Game.time = time;
        return save;
    });
    await fsPromises.writeFile(path, save);
}
