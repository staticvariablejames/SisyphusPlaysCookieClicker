import { promises as fsPromises } from 'fs';
import { firefox } from 'playwright';
import type { Page } from 'playwright';
import { openCookieClickerPage, CCSave } from 'cookie-connoisseur';

type CCPageOptions = Exclude<Parameters<typeof openCookieClickerPage>[1], undefined>;

type FillGardenOptions = {
    plant: string | null,
    plant2?: string | null,
    buds?: boolean,
};

type CookiesAfterSellingOptions = {
    krumblor?: boolean,
    nastyGoblins?: boolean,
};

type GainBuildingSpecialOptions = {
    useHighest: boolean,
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
    limitYous?: boolean;
};

type ReservoirTrickOptions = {
    buildingsOrder: number[],
    calculateHighest?: number[],
    reportOnlyChangeInHighest?: boolean,
    startingBank?: number,
    krumblor?: boolean,
    nastyGoblins?: boolean,
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
    earnUpgrade: (upgradeName: string) => void,
    fillGardenWith: (options: FillGardenOptions) => void,
    buffTimeModifier: () => number,
    cookiesAfterSelling: (id: number) => number,
    cookiesAfterSellingAll: (options?: CookiesAfterSellingOptions) => number,
    gainEndlessFrenzy: () => void,
    gainEndlessDragonHarvest: () => void,
    gainBuildingSpecial: (options?: GainBuildingSpecialOptions) => boolean,
    gainMaximumGodzamok: () => void,
    sellWizardTowersToAdjustMagic: () => void,
    maximizeWizardTowers: () => void,
    ultimateFtHoFCombo: (options?: UltimateFtHoFComboOptions) => number,
    nineQuadrillionYears: () => void,
    nineQuadrillionClicks: () => void,
    nineQuadrillionTicks: () => void,
    nineQuadrillionWrinklers: () => void,
    nineQuadrillionAscensions: (options?: CookiesAfterSellingOptions) => void,
    nineQuadrillionStocks: () => void,
    nineQuadrillionLumps: (amount: number) => void,
    levelUpMostBuildings: () => void,
    grindGrandmapocalypse: (options?: GrindGrandmapocalypseOptions) => void,
    seasonsGrind: () => void,
    miscellaneousGrind: () => void,
    postAscensionsMiscellaneousGrind: () => void,
    roundOfPurchases: (options?: RoundOfPurchasesOptions) => boolean,
    buildingsAsReservoirsPurchaseTrick: (options: ReservoirTrickOptions) => boolean,
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
     * Calls the given upgrade's .earn() function,
     * but only if the upgrade is not yet owned.
     *
     * This function is needed because calling .earn() increments Game.UpgradesOwned,
     * even if the upgrade is already owned.
     */
    function earnUpgrade(upgradeName: string) {
        if(!(upgradeName in Game.Upgrades)) {
            console.log(`[SPCC] Upgrade not found: ${upgradeName}`);
            return;
        }
        if(Game.Has(upgradeName)) {
            // Upgrade already owned
            return;
        }
        Game.Upgrades[upgradeName].earn();
    }

    /* Helper function.
     * Fills the garden with the specified plant,
     * sets the soil to clay,
     * and force a recalculation of effects.
     *
     * If two plants are specified,
     * plants the first and the second plant with alternated rows.
     *
     * If any plant is set to 'null',
     * then the state of those rows are not altered in the garden.
     *
     * If options.buds is set,
     * then the plants will be kept as buds (the earliest stage of maturation)
     * and gardenBoostPlot is _not_ called.
     * Otherwise,
     * the plants will be set to the ealiest age that they are considered fully mature.
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
        for(let i = 0; i < 6; i++)
        for(let j = 0; j < 3; j++) {
            if(options.plant !== null) {
                let plantId1 = garden.plants[options.plant].id;
                garden.plot[i][2*j][0] = plantId1 + 1; // Why "+1", Orteil??
                if(options.buds) {
                    garden.plot[i][2*j][1] = 0;
                } else {
                    garden.plot[i][2*j][1] = garden.plants[options.plant].mature;
                }
            }
            if(options.plant2 !== null) {
                let plantId2 = garden.plants[options.plant2].id;
                garden.plot[i][2*j+1][0] = plantId2 + 1;
                if(options.buds) {
                    garden.plot[i][2*j+1][1] = 0;
                } else {
                    garden.plot[i][2*j+1][1] = garden.plants[options.plant2].mature;
                }
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

    /* Computes how many cookies are obtained by selling all units
     * of the building with the given id.
     */
    function cookiesAfterSelling(id: number) {
        /* We cannot simply use getReverseSumPrice,
         * because that function has an off-by-one error.
         *
         * For low building counts we'd need to reimplement the function,
         * but anything beyond 263 buildings makes the beginning of the series irrelevant
         * (they become literally rounding errors),
         * so we can simply use getReverseSumPrice and multiply by 1.15.
         */
        return Game.ObjectsById[id].getReverseSumPrice(Game.ObjectsById[id].amount) * 1.15;
    }

    /* Computes how many cookies can be obtained by selling all buildings
     * and purchasing the Chocolate egg.
     * Arguments:
     *  - krumblor: If true, sets the Earth Shatterer and Reality Bending auras on the dragon.
     *  - nastyGoblins: If true, backfires a Crafty Pixies spell before selling.
     */
    function cookiesAfterSellingAll(options?: CookiesAfterSellingOptions) {
        if(!options) options = {};
        let sum = Game.cookies;
        Game.killBuffs();
        if(options.krumblor) {
            Game.dragonAura = (Game as any).dragonAurasBN['Earth Shatterer'].id;
            Game.dragonAura2 = (Game as any).dragonAurasBN['Reality Bending'].id;
        }
        if(options.nastyGoblins) {
            Game.gainBuff('pixie misery', 60*60, 2);
        }
        Game.CalculateGains();

        for(let i = 0; i < Game.ObjectsById.length; i++) {
            sum += cookiesAfterSelling(i);
        }
        if(Game.Upgrades['Chocolate egg'].unlocked) {
            sum *= 1.05;
        }
        return sum;
    }

    /* Grants an endless frenzy to the player.
     * Achievable with a maxed out garden, or with unreasonable luck.
     */
    function gainEndlessFrenzy() {
        Game.gainBuff('frenzy', Math.ceil(2**54/Game.fps), 7);
    }

    /* Grants an endless Dragon harvest to the player.
     */
    function gainEndlessDragonHarvest() {
        Game.gainBuff('dragon harvest', Math.ceil(2**54/Game.fps), 15);
        /* Game.buffTypesByName['dragon harvest'].func
         * turns that 15 into a 17 if the player owns Dragon fang.
         */
    }

    /* Adds a building special
     * for the building with the most buildings that does not yet have an active building special.
     */
    function gainBuildingSpecial(options?: GainBuildingSpecialOptions) {
        if(!options) options = {useHighest: false};
        function hasBuildingSpecial(id: number) {
            for(let i in Game.buffs) {
                if(Game.buffs[i].type.name == 'building buff' && Game.buffs[i].arg2 == id) {
                   return true;
               }
            }
            return false;
        }
        function amountOf(buildingId: number) {
            if(options!.useHighest) {
                return Game.ObjectsById[buildingId].highest;
            } else {
                return Game.ObjectsById[buildingId].amount;
            }
        }

        let m = -1;
        for(let i = 0; i < Game.ObjectsById.length; i++) {
            if(hasBuildingSpecial(i)) continue;
            if(m == -1) {
                m = i;
            } else if(amountOf(i) > amountOf(m)) {
                m = i;
            }
        }

        if(m == -1) {
            console.log('Maximum building specials reached');
            return false;
        } else {
            let buffPower = amountOf(m)/10 + 1;
            Game.gainBuff('building buff', Math.ceil(30 * buffTimeModifier()), buffPower, m);
            return true;
        }
    }

    function gainMaximumGodzamok() {
        // Presumably Cursors is the building we have the most of
        let buildings = Game.Objects['Cursor'].highest;
        let power = limitIEEE754(buildings * 0.01);
        Game.gainBuff('devastation', Math.ceil(2**54/Game.fps), power);
        // TODO: this can still be time-stretched, replace it with time cap
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
        if(!Game.isMinigameReady(Game.Objects['Wizard tower'])) return -1;
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
        let leftoverCasts = 0;
        for(let i = 0; i < totalFtHoFcasts; i++) {
            if(!gainBuildingSpecial()) {
                leftoverCasts++;
            }
        }

        if(options.verbose) {
            console.log(`[SPCC] ${logs.length} casts: ${logs.join(', ')}`);
        }
        return leftoverCasts;
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

    function nineQuadrillionAscensions(options?: CookiesAfterSellingOptions) {
        Game.resets = 2**53;
        Game.Win('Rebirth');
        Game.Win('Resurrection');
        Game.Win('Reincarnation');
        Game.Win('Endless cycle');

        let cookiesToForfeit = cookiesAfterSellingAll(options);
        Game.cookiesReset = Math.max(Game.cookiesReset, limitIEEE754(cookiesToForfeit));
        Game.prestige = Math.floor(Game.HowMuchPrestige(Game.cookiesReset));

        // Achievements from ascending. (Technically I should check if the player scored enough)
        Game.Win('Sacrifice');
        Game.Win('Oblivion');
        Game.Win('From scratch');
        Game.Win('Nihilism');
        Game.Win('Dematerialize');
        Game.Win('Nil zero zilch');
        Game.Win('Transcendence');
        Game.Win('Obliterate');
        Game.Win('Negative void');
        Game.Win('To crumbs, you say?');
        Game.Win('You get nothing');
        Game.Win('Humble rebeginnings');
        Game.Win('The end of the world');
        Game.Win('Oh, you\'re back');
        Game.Win('Lazarus');
        Game.Win('Smurf account');
        Game.Win('If at first you don\'t succeed');
        Game.Win('No more room in hell');

        // Precision limit should make purchases of heavenly upgrades not matter
        Game.heavenlyChips = Math.max(Game.heavenlyChips, Game.prestige);
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
        Game.addClass('lumpsOn');
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
        Game.Lock('Elder Pledge');

        // These upgrades can be obtained without starting the grandmapocalypse
        earnUpgrade('Bingo center/Research facility');
        earnUpgrade('Specialized chocolate chips');
        earnUpgrade('Designer cocoa beans');
        earnUpgrade('Ritual rolling pins');
        earnUpgrade('Underworld ovens');

        Game.elderWrath = 0;
        if(options.maxStage <= 0) {
            return;
        }

        // These are only achievable by starting the grandmapocalypse
        earnUpgrade('One mind');
        earnUpgrade('Exotic nuts');
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

        earnUpgrade('Communal brainsweep');
        earnUpgrade('Arcane sugar');

        Game.elderWrath = 2;
        if(options.maxStage <= 2) {
            return;
        }

        earnUpgrade('Elder Pact');
        earnUpgrade('Sacrificial rolling pins');

        Game.Win('Grandmapocalypse');
        Game.Win('Elder nap');
        Game.Win('Elder slumber');
        Game.Win('Elder calm');
        Game.pledges = 2**53;

        Game.elderWrath = 3;

        if(options.pledge) {
            earnUpgrade('Elder Pledge'); // Exits the grandmapocalypse
        }
    }

    function seasonsGrind() {
        for(let upgradeName of Game.seasonDrops) {
            Game.Upgrades[upgradeName].unlock();
        }

        earnUpgrade('A festive hat');
        Game.specialTab = 'santa';
        for(let i = 0; i < 14; i++) Game.UpgradeSanta();
        Game.reindeerClicked = 2**53;
        let reindeer = new Game.shimmer('reindeer');
        reindeer.pop();
        Game.Win('Eldeer');
        Game.Win("Baby it's old outside");

        /* Easter eggs are unlocked by the for-loop above,
         * but the check in Game.Logic only happens if the season is 'easter'.
         * (We still unlock all achievements because they are based on unlocking the eggs,
         * rather than purchasing them.)
         */
        Game.Win('The hunt is on');
        Game.Win('Egging on');
        Game.Win('Mass Easteria');
        Game.Win('Hide & seek champion');
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

    /* Like miscellaneousGrind,
     * but for things that are accessible only after ascending.
     */
    function postAscensionsMiscellaneousGrind() {
        Game.Win('Speed baking I')
        Game.Win('Speed baking II')
        Game.Win('Speed baking III')

        if(Game.Has('Reinforced membrane')) {
            Game.Win('Thick-skinned');
        }

        if(Game.Has('Wrapping paper')) {
            Game.Win('No time like the present');
        }

        if(Game.isMinigameReady(Game.Objects['Bank'])) {
            Game.Win('Debt evasion');
        }

        if(Game.Has('How to bake your dragon')) {
            earnUpgrade('A crumbly egg');
            Game.dragonLevel = Game.dragonLevels.length - 1;
            Game.Win('Here be dragon');
            Game.Upgrades['Dragon cookie'].unlock();
            if(Game.Has('Pet the dragon')) {
                for(let u of ['Dragon scale', 'Dragon claw', 'Dragon fang', 'Dragon teddy bear']) {
                    Game.Upgrades[u].unlock();
                }
            }
        }

        if(Game.Has('Fortune cookies')) {
            for(let upgrade of Game.Tiers['fortune'].upgrades) {
                upgrade.unlock();
            }
        }
    }

    /* Purchases all purchaseable upgrades and buildings,
     * but without actually spending cookies.
     *
     * If options.limitTowers is true,
     * the Wizard Towers will only be purchased if the can be obtained "for free";
     * i.e. their price rounds to 0 compared to Game.cookies, according to the IEEE754 specification.
     * The same applies for options.limitYous.
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
            if(i == 'You' && options.limitYous) {
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

    /* Purchases buildings following the very last trick
     * from Sisyphus Plays Cookie Clicker III.
     * Returns true if any building has been purchased, and false otherwise.
     * Will destructively change the building amounts.
     *
     * Arguments:
     * - buildingsOrder: order at which buildings will be purchased and sold.
     * - calculateHighest: list of building IDs whose .highest will be increased,
     *      as if they were bought all at once using all the bank from selling all buildings.
     *      "All at once" means that we buy however many we can afford,
     *      rather than using the theoretical trick of purchasing the building until we can't afford.
     *      This is most useful if the building is not in the list of buildingsOrder,
     *      but we still want to use its .highest to feed gainBuildingSpecial({useHighest: true}).
     * - reportOnlyChangeInHighest: if present, only returns "true"
     *      if this function actually increases the .highest count of a building.
     * - startingBank: How many cookies that we perform the trick with.
     *      If absent, is assumed to be `Game.cookies`.
     * - krumblor: Whether to use Krumblor or not.
     *      The dragon auras Fierce Hoarder, Earth Shatterer, and Reality Bending
     *      will be swapped in and out in this case.
     * - nastyGoblins: whether to use a backfired Crafty Pixies to increase selling price.
     *      Getting to use both a successful Crafty Pixies and its backfire
     *      is tricky once the number of spells is past 2^53.
     *      This can be done using Supreme Intellect and Reality Bending
     *      to slightly increase the chance of backfire;
     *      but doing so means that GFD's target spell will always backfire,
     *      whence GFD->FtHoF is only usable to get more on-screen golden cookies.
     */
    function buildingsAsReservoirsPurchaseTrick(options: ReservoirTrickOptions) {
        let pantheon;
        if(Game.isMinigameReady(Game.Objects['Temple'])) {
            pantheon = Game.Objects['Temple'].minigame;
        } else {
            pantheon = null;
        }
        let purchasedSomething = false;

        /* This is the amount of cookies we know for sure we can reach,
         * as many times as we need.
         */
        let reachableCookieAmount = Game.cookies;
        if(options.startingBank) {
            reachableCookieAmount = options.startingBank;
        }
        for(let i = 0; i < options.buildingsOrder.length; i++) {
            /* Invariant: we can reach `reachableCookieAmount` cookies repeatably,
             * using only buildings whose IDs are buildingsOrder[0]...buildingsOrder[i-1].
             */
            let obj = Game.ObjectsById[options.buildingsOrder[i]];

            // Maximize building discounts
            if(Game.resets > 0) {
                Game.gainBuff('everything must go', Math.ceil(8*buffTimeModifier()), 5);
            }
            if(options.krumblor) {
                Game.dragonAura = (Game as any).dragonAurasBN['Fierce Hoarder'].id;
                Game.dragonAura2 = (Game as any).dragonAurasBN['Reality Bending'].id;
            }
            Game.killBuffs();
            Game.gainBuff('pixie luck', 60, 2);
            fillGardenWith({plant: 'cheapcap', plant2: 'nursetulip'});
            fillGardenWith({plant: null, plant2: 'cheapcap', buds: true});
            if(pantheon) {
                pantheon.slotGod(pantheon.gods['creation'], 0);
            }
            Game.CalculateGains(); // Updates Game.effs, after fillGardenWith

            let previousAmount = obj.amount;
            let previousHighest = obj.highest;
            /* We can always reach that cookie amount,
             * so we purchase the current building until we can't anymore.
             *
             * First, we get rid of that building's current amount,
             * because this function could have been called before with a different order
             * and we are trying to use the current building to get more of the later buildings.
             *
             * Since we will purchase that building anyway, we start close to the limit.
             * The "- 5" in the formula below is a fudge factor to account for e.g. discounts.
             */
            obj.amount = Math.floor(Math.log(reachableCookieAmount/obj.basePrice)/Math.log(1.15) - 5);
            while(obj.getPrice(1) <= reachableCookieAmount) {
                obj.buyFree(1);
                if(options.reportOnlyChangeInHighest && obj.highest > previousHighest) {
                    purchasedSomething = true;
                }
                if(!options.reportOnlyChangeInHighest && obj.amount > previousAmount) {
                    purchasedSomething = true;
                }
                if(obj.buyFunction) obj.buyFunction();
            }

            // Now we sell it.
            Game.killBuffs();
            if(options.krumblor) {
                Game.dragonAura = (Game as any).dragonAurasBN['Earth Shatterer'].id;
                Game.dragonAura2 = (Game as any).dragonAurasBN['Reality Bending'].id;
            }
            fillGardenWith({plant: 'meddleweed'}); // Clears the garden
            if(pantheon) {
                pantheon.slotGod(pantheon.gods['creation'], -1);
            }
            if(options.nastyGoblins) {
                Game.gainBuff('pixie misery', 60*60, 2);
            }
            Game.CalculateGains();

            /* OK, we don't actually sell it, we just calculate how much we'd get by selling it.
             * But we continue onwards, and won't touch the current building again.
             */
            reachableCookieAmount += cookiesAfterSelling(obj.id);
        }

        if(options.calculateHighest) {
            for(let i = 0; i < options.calculateHighest.length; i++) {
                let obj = Game.ObjectsById[options.calculateHighest[i]];
                while(obj.getSumPrice(obj.highest-obj.amount+1) <= reachableCookieAmount) {
                    obj.highest++;
                    purchasedSomething = true;
                }
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
        earnUpgrade,
        fillGardenWith,
        buffTimeModifier,
        cookiesAfterSelling,
        cookiesAfterSellingAll,
        gainEndlessFrenzy,
        gainEndlessDragonHarvest,
        gainBuildingSpecial,
        gainMaximumGodzamok,
        sellWizardTowersToAdjustMagic,
        maximizeWizardTowers,
        ultimateFtHoFCombo,
        nineQuadrillionYears,
        nineQuadrillionClicks,
        nineQuadrillionTicks,
        nineQuadrillionWrinklers,
        nineQuadrillionAscensions,
        nineQuadrillionStocks,
        nineQuadrillionLumps,
        levelUpMostBuildings,
        grindGrandmapocalypse,
        seasonsGrind,
        miscellaneousGrind,
        postAscensionsMiscellaneousGrind,
        roundOfPurchases,
        buildingsAsReservoirsPurchaseTrick,
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
        if(Game.pledgeT > 0) {
            Game.pledgeT = Game.getPledgeDuration();
        }
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
