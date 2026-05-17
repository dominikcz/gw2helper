import { describe, it, expect } from 'vitest';
import { computeLegendaryIngredients } from './calculator';
import { computeTreeMetrics, rowEffectiveCost, rowHasSource, rowUnit } from './display';
import { fixtureExistsByItemName, loadFixtureContextByItemName } from './test-helpers';

type LegendaryRepresentativeSpec = {
    name: string;
    category: 'weapon' | 'armor';
};

const REPRESENTATIVE_LEGENDARIES: LegendaryRepresentativeSpec[] = [
    { name: 'Kudzu', category: 'weapon' },
    { name: 'Klobjarne Geirr', category: 'weapon' },
    { name: 'Sharur', category: 'weapon' },
    { name: 'The Juggernaut', category: 'weapon' },
    { name: "Aurene's Weight", category: 'weapon' },
    { name: 'Selachimorpha', category: 'armor' },
    { name: "Sublime Mistforged Triumphant Hero\'s Raiment", category: 'armor' },
    { name: 'Perfected Envoy Vestments', category: 'armor' },
    { name: "Mistforged Glorious Hero\'s Raiment", category: 'armor' },
    { name: 'Obsidian Light Regalia', category: 'armor' },
];

describe('legendary display behavior for generation representatives', () => {
    for (const spec of REPRESENTATIVE_LEGENDARIES) {
        describe(`${spec.name} (${spec.category} representative)`, () => {
            const SKIP = !fixtureExistsByItemName(spec.name);

            if (SKIP) {
                it.skip('fixture is not available for this representative item', () => {});
                return;
            }

            it('computes display decisions and effective costs for buy/sell modes', () => {
                const { rootItemId, ctx } = loadFixtureContextByItemName(spec.name);
                const result = computeLegendaryIngredients(rootItemId, ctx);

                expect(result.recipeAvailable).toBe(true);
                expect(result.ingredients.length).toBeGreaterThan(0);

                for (const row of result.ingredients) {
                    const buyDecisionIsKnownSource = rowHasSource(row, 'buy', 'tp') || rowHasSource(row, 'buy', 'craft') || rowHasSource(row, 'buy', 'vendor');
                    const sellDecisionIsKnownSource = rowHasSource(row, 'sell', 'tp') || rowHasSource(row, 'sell', 'craft') || rowHasSource(row, 'sell', 'vendor');

                    if (buyDecisionIsKnownSource) {
                        expect(rowUnit(row, 'buy')).not.toBeNull();
                    }
                    if (sellDecisionIsKnownSource) {
                        expect(rowUnit(row, 'sell')).not.toBeNull();
                    }

                    const buyCost = rowEffectiveCost(row, 'buy');
                    const sellCost = rowEffectiveCost(row, 'sell');

                    if (buyCost != null) expect(buyCost).toBeGreaterThanOrEqual(0);
                    if (sellCost != null) expect(sellCost).toBeGreaterThanOrEqual(0);

                    // Presentation contract: vendor-free units should never increase effective cost.
                    if (row.vendorFreeUnits > 0) {
                        const buyUnit = rowUnit(row, 'buy');
                        if (buyUnit != null) {
                            expect(buyCost).toBeLessThanOrEqual(buyUnit * row.missing);
                        }
                    }
                }
            });

            it('computes recipe tree metrics with consistent root node values', () => {
                const { rootItemId, ctx } = loadFixtureContextByItemName(spec.name);
                const result = computeLegendaryIngredients(rootItemId, ctx);

                const rowById = new Map(result.ingredients.map((row) => [row.id, row]));
                const ownedById: Record<number, number> = {};
                for (const [id, value] of ctx.ownedByItem.entries()) {
                    ownedById[id] = value;
                }

                const buyMetrics = computeTreeMetrics(result.recipeTree, rowById, ownedById, 'buy');
                const sellMetrics = computeTreeMetrics(result.recipeTree, rowById, ownedById, 'sell');

                const buyRoot = buyMetrics.get('root');
                const sellRoot = sellMetrics.get('root');

                expect(buyRoot).toBeDefined();
                expect(sellRoot).toBeDefined();
                expect(buyRoot?.missing).toBeGreaterThan(0);
                expect(sellRoot?.missing).toBeGreaterThan(0);

                if (buyRoot?.cost != null) expect(buyRoot.cost).toBeGreaterThanOrEqual(0);
                if (sellRoot?.cost != null) expect(sellRoot.cost).toBeGreaterThanOrEqual(0);
            });
        });
    }
});
