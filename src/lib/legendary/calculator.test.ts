import { beforeAll, describe, it, expect } from 'vitest';
import { CalculationFor } from './calculation-scenario';
import { fixtureExists, fixtureExistsByItemName, loadFixtureContextByItemName } from './test-helpers';
import {
    defineRepresentativeCoverage,
    expectCommonEconomicTemplateL3,
    expectCommonProwessTemplateL3,
    expectRecipeIngredientsExactly,
    expectVendorCostsContain,
    ingredient,
    recipeIngredientNames,
    REPRESENTATIVE_LEGENDARIES,
} from './calculator.test.helpers';

// ─── Klobjarne Geirr (103815) ─────────────────────────────────────────────────
describe('Klobjarne Geirr (103815)', () => {
    describe('baseline scenario (inventory = {}, priceMode = buy)', () => {
        let baseScenario: ReturnType<typeof CalculationFor>;

        beforeAll(() => {
            baseScenario = CalculationFor('Klobjarne Geirr');
        });

        it('every row has at least one control condition (invariants)', () => {
            baseScenario.rowsAreConsistent();
        });

        it('contains key ingredients from the tree', () => {
            baseScenario
                .row('Shard of Lowland Shore', (row) => expect(row.required).toBeGreaterThan(0))
                .row('Mursaat Runestone', (row) => expect(row.required).toBeGreaterThan(0))
                .row('Thermocatalytic Reagent', (row) => expect(row.required).toBeGreaterThan(0));
        });

        it('Mursaat Runestone: vendor cost = 0 (paid in AccountBound currency)', () => {
            // Ancient Coin (vendor currency) is AccountBound -> computeVendorGoldUnit returns 0
            baseScenario
                .haveToVendor(100, 'Mursaat Runestone')
                .row('Mursaat Runestone', (row) => {
                    expect(row.vendorBuyUnit).toBe(0);
                    expect(row.vendorFreeUnits).toBe(row.missing);
                });
        });

        it('Thermocatalytic Reagent: vendor = 150 copper, TP buy wins', () => {
            // Vendor gold_cost = 150 copper; TP buy price = 148 copper -> TP is cheaper
            baseScenario
                .row('Thermocatalytic Reagent', (row) => {
                    expect(row.vendorBuyUnit).toBe(150);
                    expect(row.buyUnit).toBe(148);
                })
                .haveToBuy(1750, 'Thermocatalytic Reagent');
        });

        it('Shard of Lowland Shore: 0 vendorFreeUnits with empty inventory', () => {
            baseScenario.vendorFreeUnitsAre(0, 'Shard of Lowland Shore');
        });
    });

    describe('special and edge cases: inventory', () => {
        let inventory18Scenario: ReturnType<typeof CalculationFor>;
        let inventoryHugeScenario: ReturnType<typeof CalculationFor>;

        beforeAll(() => {
            inventory18Scenario = CalculationFor('Klobjarne Geirr', { inventory: { 'Amalgamated Gemstone': 18 } });
            inventoryHugeScenario = CalculationFor('Klobjarne Geirr', { inventory: { 'Amalgamated Gemstone': 9999 } });
        });

        it('row invariants hold for inventory scenarios', () => {
            inventory18Scenario.rowsAreConsistent();
            inventoryHugeScenario.rowsAreConsistent();
        });

        it('Shard of Lowland Shore: 6 vendorFreeUnits with 18x Amalgamated Gemstone', () => {
            // Vendor costs 3x Amalgamated Gemstone (TP-eligible) per Shard.
            // Curious Lowland Honeycomb is AccountBound -- skipped in free-unit calc.
            inventory18Scenario.vendorFreeUnitsAre(6, 'Shard of Lowland Shore');
        });

        it('Shard of Lowland Shore: vendorFreeUnits are capped by missing count', () => {
            inventoryHugeScenario.row('Shard of Lowland Shore', (row) => {
                expect(row.vendorFreeUnits).toBeLessThanOrEqual(row.missing);
            });
        });
    });

    describe('special and edge cases: priceMode', () => {
        let buyScenario: ReturnType<typeof CalculationFor>;
        let sellScenario: ReturnType<typeof CalculationFor>;

        beforeAll(() => {
            buyScenario = CalculationFor('Klobjarne Geirr', { priceMode: 'buy' });
            sellScenario = CalculationFor('Klobjarne Geirr', { priceMode: 'sell' });
        });

        it('row invariants hold in both price modes', () => {
            buyScenario.rowsAreConsistent();
            sellScenario.rowsAreConsistent();
        });

        it('Mursaat Runestone: best source stays vendor in both price modes', () => {
            buyScenario.haveToVendor(100, 'Mursaat Runestone');
            sellScenario.haveToVendor(100, 'Mursaat Runestone');
        });

        it('Mursaat Runestone: unit cost stays 0 in buy and sell modes', () => {
            buyScenario.unitCostIs(0, 'Mursaat Runestone');
            sellScenario.unitCostIs(0, 'Mursaat Runestone');
        });

        it('Shard of Lowland Shore: recipe need is stable across price modes', () => {
            buyScenario.recipeNeeds(100, 'Shard of Lowland Shore');
            sellScenario.recipeNeeds(100, 'Shard of Lowland Shore');
        });
    });
});

// ─── The Dreamer (30686) ──────────────────────────────────────────────────────
describe('The Dreamer (30686)', () => {
    const SKIP = !fixtureExists('30686-the-dreamer');

    if (SKIP) {
        it.skip('fixture is not available', () => {});
        return;
    }

    describe('baseline scenario (inventory = {}, priceMode = buy)', () => {
        let baseScenario: ReturnType<typeof CalculationFor>;

        beforeAll(() => {
            baseScenario = CalculationFor('The Dreamer');
        });

        it('every row has at least one control condition (invariants)', () => {
            baseScenario.rowsAreConsistent();
        });

        it('recipe is available with standard sub-ingredients', () => {
            baseScenario
                .recipeIsAvailable()
                .row('Gift of Battle', (row) => expect(row.required).toBeGreaterThan(0))
                .row('Mystic Coin', (row) => expect(row.required).toBeGreaterThan(0));
        });
    });

    describe('special and edge cases: priceMode', () => {
        let buyScenario: ReturnType<typeof CalculationFor>;
        let sellScenario: ReturnType<typeof CalculationFor>;

        beforeAll(() => {
            buyScenario = CalculationFor('The Dreamer', { priceMode: 'buy' });
            sellScenario = CalculationFor('The Dreamer', { priceMode: 'sell' });
        });

        it('row invariants hold in both price modes', () => {
            buyScenario.rowsAreConsistent();
            sellScenario.rowsAreConsistent();
        });

        it('required/missing counts stay stable across price modes for Mystic Coin', () => {
            let buyMissing = 0;
            buyScenario.row('Mystic Coin', (row) => {
                buyMissing = row.missing;
                expect(row.required).toBeGreaterThan(0);
            });

            sellScenario.row('Mystic Coin', (row) => {
                expect(row.required).toBeGreaterThan(0);
                expect(row.missing).toBe(buyMissing);
            });
        });
    });

    describe('special and edge cases: inventory', () => {
        let baseScenario: ReturnType<typeof CalculationFor>;
        let inventoryScenario: ReturnType<typeof CalculationFor>;

        beforeAll(() => {
            baseScenario = CalculationFor('The Dreamer');
            inventoryScenario = CalculationFor('The Dreamer', { inventory: { 'Mystic Coin': 250 } });
        });

        it('row invariants hold when inventory is injected', () => {
            inventoryScenario.rowsAreConsistent();
        });

        it('fully covered inventory item is omitted from ingredient rows', () => {
            baseScenario.recipeHas('Mystic Coin');
            inventoryScenario.recipeDoesNotHave('Mystic Coin');
        });

        it('injected inventory does not increase missing count for unaffected rows', () => {
            let baseMissing = 0;
            baseScenario.row('Gift of Battle', (row) => {
                baseMissing = row.missing;
                expect(row.required).toBeGreaterThan(0);
            });

            inventoryScenario.row('Gift of Battle', (row) => {
                expect(row.required).toBeGreaterThan(0);
                expect(row.missing).toBe(baseMissing);
            });
        });
    });
});

// ─── Bolt (30699) ─────────────────────────────────────────────────────────────
describe('Bolt (30699)', () => {
    const SKIP = !fixtureExists('30699-bolt');

    if (SKIP) {
        it.skip('fixture is not available', () => {});
        return;
    }

    describe('baseline scenario (inventory = {}, priceMode = buy)', () => {
        let baseScenario: ReturnType<typeof CalculationFor>;

        beforeAll(() => {
            baseScenario = CalculationFor('Bolt');
        });

        it('every row has at least one control condition (invariants)', () => {
            baseScenario.rowsAreConsistent();
        });

        it('recipe is available with standard sub-ingredients', () => {
            baseScenario
                .recipeIsAvailable()
                .row('Gift of Battle', (row) => expect(row.required).toBeGreaterThan(0))
                .row('Mystic Coin', (row) => expect(row.required).toBeGreaterThan(0));
        });
    });

    describe('special and edge cases: priceMode', () => {
        let buyScenario: ReturnType<typeof CalculationFor>;
        let sellScenario: ReturnType<typeof CalculationFor>;

        beforeAll(() => {
            buyScenario = CalculationFor('Bolt', { priceMode: 'buy' });
            sellScenario = CalculationFor('Bolt', { priceMode: 'sell' });
        });

        it('row invariants hold in both price modes', () => {
            buyScenario.rowsAreConsistent();
            sellScenario.rowsAreConsistent();
        });

        it('required/missing counts stay stable across price modes for Mystic Coin', () => {
            let buyMissing = 0;
            buyScenario.row('Mystic Coin', (row) => {
                buyMissing = row.missing;
                expect(row.required).toBeGreaterThan(0);
            });

            sellScenario.row('Mystic Coin', (row) => {
                expect(row.required).toBeGreaterThan(0);
                expect(row.missing).toBe(buyMissing);
            });
        });
    });

    describe('special and edge cases: inventory', () => {
        let baseScenario: ReturnType<typeof CalculationFor>;
        let inventoryScenario: ReturnType<typeof CalculationFor>;

        beforeAll(() => {
            baseScenario = CalculationFor('Bolt');
            inventoryScenario = CalculationFor('Bolt', { inventory: { 'Mystic Coin': 250 } });
        });

        it('row invariants hold when inventory is injected', () => {
            inventoryScenario.rowsAreConsistent();
        });

        it('fully covered inventory item is omitted from ingredient rows', () => {
            baseScenario.recipeHas('Mystic Coin');
            inventoryScenario.recipeDoesNotHave('Mystic Coin');
        });

        it('injected inventory does not increase missing count for unaffected rows', () => {
            let baseMissing = 0;
            baseScenario.row('Gift of Battle', (row) => {
                baseMissing = row.missing;
                expect(row.required).toBeGreaterThan(0);
            });

            inventoryScenario.row('Gift of Battle', (row) => {
                expect(row.required).toBeGreaterThan(0);
                expect(row.missing).toBe(baseMissing);
            });
        });
    });
});

// ─── Pure functions ───────────────────────────────────────────────────────────
describe('pickBestUnit', () => {
    it('picks the lowest price', async () => {
        const { pickBestUnit } = await import('./calculator');

        expect(pickBestUnit(100, 80, 120)).toEqual({ unit: 80, source: 'craft' });
        expect(pickBestUnit(50, null, null)).toEqual({ unit: 50, source: 'tp' });
        expect(pickBestUnit(null, null, null)).toEqual({ unit: null, source: 'none' });
        expect(pickBestUnit(null, null, 0)).toEqual({ unit: 0, source: 'vendor' });
    });
});

describe('isTradingPostEligible', () => {
    it('returns false for AccountBound items', async () => {
        const { isTradingPostEligible } = await import('./calculator');

        expect(isTradingPostEligible({ id: 1, flags: ['AccountBound'] })).toBe(false);
        expect(isTradingPostEligible({ id: 1, flags: ['SoulbindOnAcquire'] })).toBe(false);
        expect(isTradingPostEligible({ id: 1, binding: 'Account' })).toBe(false);
    });

    it('returns true for NoSell/NoSalvage items (not blocked in our logic)', async () => {
        const { isTradingPostEligible } = await import('./calculator');

        expect(isTradingPostEligible({ id: 1, flags: ['NoSell', 'NoSalvage'] })).toBe(true);
    });

    it('returns false for undefined item', async () => {
        const { isTradingPostEligible } = await import('./calculator');

        expect(isTradingPostEligible(undefined)).toBe(false);
    });
});

// ─── Requested generation representatives coverage ────────────────────────────
describe('Legendary generation representatives coverage', () => {
    for (const spec of REPRESENTATIVE_LEGENDARIES) {
        defineRepresentativeCoverage(spec);
    }
});

describe('Legendary armor expected structure from wiki', () => {
    describe('WvW: Sublime Mistforged Triumphant Hero\'s Raiment', () => {
        const SKIP = !fixtureExistsByItemName("Sublime Mistforged Triumphant Hero's Raiment");

        it.skipIf(SKIP)('has full L1/L2/L3 breakdown matching wiki template', () => {
            const { ctx } = loadFixtureContextByItemName("Sublime Mistforged Triumphant Hero's Raiment");

            expectRecipeIngredientsExactly(ctx, "Sublime Mistforged Triumphant Hero's Raiment", [
                ingredient("Sublime Mistforged Triumphant Hero's Raiment", 1),
                ingredient('Gift of War Prosperity', 1),
                ingredient('Gift of War Prowess', 1),
                ingredient('Gift of War Dedication', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of War Prosperity', [
                ingredient('Gift of Battle', 1),
                ingredient('Mystic Clover', 15),
                ingredient('Gift of Condensed Might', 1),
                ingredient('Gift of Condensed Magic', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of War Prowess', [
                ingredient('Legendary War Insight', 1),
                ingredient('Eldritch Scroll', 1),
                ingredient('Obsidian Shard', 50),
                ingredient('Cube of Stabilized Dark Energy', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of War Dedication', [
                ingredient('Certificate of Honor', 1),
                ingredient('Certificate of Heroics', 1),
                ingredient('Glob of Condensed Spirit Energy', 1),
                ingredient('Memory of Battle', 250),
            ]);

            expectCommonEconomicTemplateL3(ctx);
            expectCommonProwessTemplateL3(ctx);
        });
    });

    describe('PvP: Mistforged Glorious Hero\'s Raiment', () => {
        const SKIP = !fixtureExistsByItemName("Mistforged Glorious Hero's Raiment");

        it.skipIf(SKIP)('has full L1/L2/L3 breakdown matching wiki template', () => {
            const { ctx } = loadFixtureContextByItemName("Mistforged Glorious Hero's Raiment");

            expectRecipeIngredientsExactly(ctx, "Mistforged Glorious Hero's Raiment", [
                ingredient("Mistforged Glorious Hero's Raiment", 1),
                ingredient('Gift of Competitive Prosperity', 1),
                ingredient('Gift of Competitive Prowess', 1),
                ingredient('Gift of Competitive Dedication', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Competitive Prosperity', [
                ingredient('Mist Core Fragment', 1),
                ingredient('Mystic Clover', 15),
                ingredient('Gift of Condensed Might', 1),
                ingredient('Gift of Condensed Magic', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Competitive Prowess', [
                ingredient('Record of League Victories', 1),
                ingredient('Eldritch Scroll', 1),
                ingredient('Obsidian Shard', 50),
                ingredient('Cube of Stabilized Dark Energy', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Competitive Dedication', [
                ingredient('Record of League Participation', 1),
                ingredient('Star of Glory', 1),
                ingredient('Glob of Condensed Spirit Energy', 1),
                ingredient('Jar of Distilled Glory', 1),
            ]);

            expectCommonEconomicTemplateL3(ctx);
            expectCommonProwessTemplateL3(ctx);
        });
    });

    describe('Raid: Perfected Envoy Vestments', () => {
        const SKIP = !fixtureExistsByItemName('Perfected Envoy Vestments');

        it.skipIf(SKIP)('has full L1/L2/L3 breakdown matching wiki template', () => {
            const { ctx } = loadFixtureContextByItemName('Perfected Envoy Vestments');

            expectRecipeIngredientsExactly(ctx, 'Perfected Envoy Vestments', [
                ingredient('Refined Envoy Vestments', 1),
                ingredient('Gift of Prosperity', 1),
                ingredient('Gift of Prowess', 1),
                ingredient('Gift of Dedication', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Prosperity', [
                ingredient('Gift of Craftsmanship', 1),
                ingredient('Mystic Clover', 15),
                ingredient('Gift of Condensed Magic', 1),
                ingredient('Gift of Condensed Might', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Prowess', [
                ingredient('Legendary Insight', 25),
                ingredient('Eldritch Scroll', 1),
                ingredient('Obsidian Shard', 50),
                ingredient('Cube of Stabilized Dark Energy', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Dedication', [
                ingredient('Chak Egg', 5),
                ingredient('Auric Ingot', 5),
                ingredient('Reclaimed Metal Plate', 5),
                ingredient('Gift of the Pact', 1),
            ]);

            expectCommonEconomicTemplateL3(ctx);
            expectCommonProwessTemplateL3(ctx);
        });
    });

    describe('Open world: Obsidian Light Regalia', () => {
        const SKIP = !fixtureExistsByItemName('Obsidian Light Regalia');

        it.skipIf(SKIP)('has full L1/L2/L3 breakdown matching wiki template', () => {
            const { ctx } = loadFixtureContextByItemName('Obsidian Light Regalia');

            expectRecipeIngredientsExactly(ctx, 'Obsidian Light Regalia', [
                ingredient('Arcanum of Astral Heartbeat', 1),
                ingredient('Gift of Expertise', 1),
                ingredient('Gift of Stormy Skies', 1),
                ingredient('Gift of Magical Prosperity', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Expertise', [
                ingredient('Amalgamated Rift Essence', 12),
                ingredient('Eldritch Scroll', 1),
                ingredient('Obsidian Shard', 50),
                ingredient('Cube of Stabilized Dark Energy', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Stormy Skies', [
                ingredient('Gift of the Astral Ward', 1),
                ingredient('Case of Captured Lightning', 5),
                ingredient('Clot of Congealed Screams', 5),
                ingredient('Pouch of Stardust', 5),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Magical Prosperity', [
                ingredient('Gift of Craftsmanship', 1),
                ingredient('Mystic Clover', 9),
                ingredient('Gift of Condensed Magic', 1),
                ingredient('Gift of Research', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of the Astral Ward', [
                ingredient('Gift of Skywatch Archipelago', 1),
                ingredient('Gift of Amnytas', 1),
                ingredient('Gift of Inner Nayos', 1),
                ingredient('Gift of Persistence', 1),
            ]);

            expectCommonEconomicTemplateL3(ctx, { includeCondensedMight: false, includeCondensedMagic: true });
            expectCommonProwessTemplateL3(ctx);
        });
    });

    describe('Open world: Selachimorpha (aquabreather)', () => {
        const SKIP = !fixtureExistsByItemName('Selachimorpha');

        it.skipIf(SKIP)('is represented as terminal acquisition (no crafted sub-levels)', () => {
            const { ctx } = loadFixtureContextByItemName('Selachimorpha');
            const directIngredients = recipeIngredientNames(ctx, 'Selachimorpha');
            expect(directIngredients, 'Selachimorpha direct recipe ingredients').toEqual([]);
        });
    });

    describe('Open world: Selachimorpha Container (wiki material table)', () => {
        const SKIP = !fixtureExistsByItemName('Selachimorpha Container');

        it.skipIf(SKIP)('matches the container-level wiki template blocks available in cache', () => {
            const { ctx } = loadFixtureContextByItemName('Selachimorpha Container');

            expectRecipeIngredientsExactly(ctx, 'Selachimorpha Container', [
                ingredient('Gift of the Survivors', 1),
                ingredient('Gift of the People', 1),
                ingredient('Gift of Castoran Mastery', 1),
            ]);

            expectVendorCostsContain(ctx, 'Gift of the Survivors', [
                'Concentrated Chromatic Sap',
                'Gift of Shipwreck Strand Exploration',
            ]);

            expectVendorCostsContain(ctx, 'Gift of the People', [
                'Gift of Starlit Weald Exploration',
                'Patron of the Magical Arts Plaque',
                'Seer Wreath of Service',
            ]);
        });
    });
});

describe('Legendary weapon expected structure from wiki', () => {
    describe('Generation 1: The Juggernaut', () => {
        const SKIP = !fixtureExistsByItemName('The Juggernaut');

        it.skipIf(SKIP)('has full L1/L2 breakdown matching wiki template', () => {
            const { ctx } = loadFixtureContextByItemName('The Juggernaut');

            expectRecipeIngredientsExactly(ctx, 'The Juggernaut', [
                ingredient('The Colossus', 1),
                ingredient('Gift of The Juggernaut', 1),
                ingredient('Gift of Fortune', 1),
                ingredient('Gift of Mastery', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Fortune', [
                ingredient('Mystic Clover', 77),
                ingredient('Glob of Ectoplasm', 250),
                ingredient('Gift of Magic', 1),
                ingredient('Gift of Might', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Mastery', [
                ingredient('Bloodstone Shard', 1),
                ingredient('Obsidian Shard', 250),
                ingredient('Gift of Exploration', 1),
                ingredient('Gift of Battle', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of The Juggernaut', [
                ingredient('Gift of Metal', 1),
                ingredient('Vial of Quicksilver', 1),
                ingredient('Icy Runestone', 100),
                ingredient('Superior Sigil of Benevolence', 1),
            ]);
        });
    });

    describe('Generation 2: Sharur', () => {
        const SKIP = !fixtureExistsByItemName('Sharur');

        it.skipIf(SKIP)('has full L1/L2 breakdown and shared L3 economic block matching wiki template', () => {
            const { ctx } = loadFixtureContextByItemName('Sharur');

            expectRecipeIngredientsExactly(ctx, 'Sharur', [
                ingredient('Might of Arah', 1),
                ingredient('Gift of Arah', 1),
                ingredient('Mystic Tribute', 1),
                ingredient('Gift of Maguuma Mastery', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Arah', [
                ingredient('Gift of the Mists', 1),
                ingredient('Mystic Runestone', 100),
                ingredient('Shard of Arah', 100),
                ingredient('Gift of Metal', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Mystic Tribute', [
                ingredient('Gift of Condensed Magic', 2),
                ingredient('Gift of Condensed Might', 2),
                ingredient('Mystic Clover', 77),
                ingredient('Mystic Coin', 250),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Maguuma Mastery', [
                ingredient('Gift of Maguuma', 1),
                ingredient('Gift of Insights', 1),
                ingredient('Bloodstone Shard', 1),
                ingredient('Crystalline Ingot', 250),
            ]);

            expectCommonEconomicTemplateL3(ctx);
        });
    });

    describe('Generation 3: Aurene\'s Weight', () => {
        const SKIP = !fixtureExistsByItemName("Aurene's Weight");

        it.skipIf(SKIP)('has full L1/L2 breakdown and shared L3 economic block matching wiki template', () => {
            const { ctx } = loadFixtureContextByItemName("Aurene's Weight");

            expectRecipeIngredientsExactly(ctx, "Aurene's Weight", [
                ingredient("Gift of Aurene's Weight", 1),
                ingredient("Dragon's Weight", 1),
                ingredient('Gift of Jade Mastery', 1),
                ingredient('Draconic Tribute', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, "Gift of Aurene's Weight", [
                ingredient('Poem on Hammers', 1),
                ingredient('Mystic Runestone', 100),
                ingredient('Gift of Research', 1),
                ingredient('Gift of the Mists', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Jade Mastery', [
                ingredient('Gift of the Dragon Empire', 1),
                ingredient('Bloodstone Shard', 1),
                ingredient('Gift of Cantha', 1),
                ingredient('Antique Summoning Stone', 100),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Draconic Tribute', [
                ingredient('Gift of Condensed Might', 1),
                ingredient('Gift of Condensed Magic', 1),
                ingredient('Mystic Clover', 38),
                ingredient('Amalgamated Draconic Lodestone', 5),
            ]);

            expectCommonEconomicTemplateL3(ctx);
        });
    });

    describe('Standalone: Klobjarne Geirr', () => {
        const SKIP = !fixtureExistsByItemName('Klobjarne Geirr');

        it.skipIf(SKIP)('has full L1/L2 breakdown and shared L3 economic block matching wiki template', () => {
            const { ctx } = loadFixtureContextByItemName('Klobjarne Geirr');

            expectRecipeIngredientsExactly(ctx, 'Klobjarne Geirr', [
                ingredient('Gift of Janthir Wilds', 1),
                ingredient('Gift of the Homesteader', 1),
                ingredient('Gift of Klobjarne Geirr', 1),
                ingredient('Nyr Hrammr', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Janthir Wilds', [
                ingredient('Gift of Gatherer of the Hunt', 1),
                ingredient('Gift of Uncovered Grounds', 1),
                ingredient('Gift of Expertise', 1),
                ingredient('Bloodstone Shard', 1),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of the Homesteader', [
                ingredient('Gift of Embracing Refuge', 1),
                ingredient('Gift of Condensed Might', 1),
                ingredient('Gift of Condensed Magic', 1),
                ingredient('Mystic Clover', 38),
            ]);

            expectRecipeIngredientsExactly(ctx, 'Gift of Klobjarne Geirr', [
                ingredient('Gift of Recollector of Memories', 1),
                ingredient('Mystic Runestone', 100),
                ingredient('Gift of the Mists', 1),
                ingredient('Gift of Research', 1),
            ]);

            expectCommonEconomicTemplateL3(ctx);
        });
    });

    describe('Standalone: Ancora Pax', () => {
        const SKIP = !fixtureExistsByItemName('Ancora Pax');

        it.skipIf(SKIP)('matches standalone wiki block available in cache', () => {
            const { ctx } = loadFixtureContextByItemName('Ancora Pax');
            const directIngredients = recipeIngredientNames(ctx, 'Ancora Pax');

            expect(directIngredients, 'Ancora Pax direct recipe ingredients').toEqual([]);
            expectVendorCostsContain(ctx, 'Ancora Pax', ['Aetheric Anchor']);
        });
    });
});