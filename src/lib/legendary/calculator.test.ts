import { beforeAll, describe, it, expect } from 'vitest';
import { CalculationFor } from './calculation-scenario';
import { fixtureExists } from './test-helpers';

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