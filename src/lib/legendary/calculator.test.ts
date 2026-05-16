import { describe, it, expect } from 'vitest';
import { CalculationFor } from './calculation-scenario';
import { fixtureExists } from './test-helpers';

// ─── Klobjarne Geirr (103815) ─────────────────────────────────────────────────
describe('Klobjarne Geirr (103815)', () => {
it('Shard of Lowland Shore: 0 vendorFreeUnits with empty inventory', () => {
CalculationFor('Klobjarne Geirr')
.recipeHas('Shard of Lowland Shore')
.vendorFreeUnitsAre(0, 'Shard of Lowland Shore');
});

it('Shard of Lowland Shore: 6 vendorFreeUnits with 18x Amalgamated Gemstone', () => {
// Vendor costs 3x Amalgamated Gemstone (TP-eligible) per Shard.
// Curious Lowland Honeycomb is AccountBound -- skipped in free-unit calc.
CalculationFor('Klobjarne Geirr', { inventory: { 'Amalgamated Gemstone': 18 } })
.vendorFreeUnitsAre(6, 'Shard of Lowland Shore');
});

it('Mursaat Runestone: vendor cost = 0 (paid in AccountBound currency)', () => {
// Ancient Coin (vendor currency) is AccountBound -> computeVendorGoldUnit returns 0
CalculationFor('Klobjarne Geirr')
.haveToVendor(100, 'Mursaat Runestone')
.row('Mursaat Runestone', (row) => {
expect(row.vendorBuyUnit).toBe(0);
expect(row.vendorFreeUnits).toBe(row.missing);
});
});

it('Thermocatalytic Reagent: vendor = 150 copper, TP buy wins', () => {
// Vendor gold_cost = 150 copper; TP buy price = 148 copper -> TP is cheaper
CalculationFor('Klobjarne Geirr')
.row('Thermocatalytic Reagent', (row) => {
expect(row.vendorBuyUnit).toBe(150);
expect(row.buyUnit).toBe(148);
})
.haveToBuy(1750, 'Thermocatalytic Reagent');
});
});

// ─── The Dreamer (30686) ──────────────────────────────────────────────────────
describe('The Dreamer (30686)', () => {
const SKIP = !fixtureExists('30686-the-dreamer');

it.skipIf(SKIP)('recipe is available with standard sub-ingredients', () => {
CalculationFor('The Dreamer')
.recipeIsAvailable()
.recipeHas('Gift of Battle')
.recipeHas('Mystic Coin');
});
});

// ─── Bolt (30699) ─────────────────────────────────────────────────────────────
describe('Bolt (30699)', () => {
const SKIP = !fixtureExists('30699-bolt');

it.skipIf(SKIP)('recipe is available with standard sub-ingredients', () => {
CalculationFor('Bolt')
.recipeIsAvailable()
.recipeHas('Gift of Battle')
.recipeHas('Mystic Coin');
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