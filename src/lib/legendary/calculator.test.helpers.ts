import { getCurrentTest } from '@vitest/runner';
import { describe, expect, it } from 'vitest';
import { CalculationFor } from './calculation-scenario';
import { fixtureExistsByItemName } from './test-helpers';
import type { CalculatorContext } from './calculator';

type LegendaryRepresentativeSpec = {
    name: string;
    category: 'weapon' | 'armor';
};

type ExpectedIngredient = {
    name: string;
    count: number;
};

export const REPRESENTATIVE_LEGENDARIES: LegendaryRepresentativeSpec[] = [
    { name: 'Kudzu', category: 'weapon' },
    { name: 'Klobjarne Geirr', category: 'weapon' },
    { name: 'Sharur', category: 'weapon' },
    { name: 'The Juggernaut', category: 'weapon' },
    { name: "Aurene's Weight", category: 'weapon' },
    { name: 'Selachimorpha', category: 'armor' },
    { name: "Sublime Mistforged Triumphant Hero's Raiment", category: 'armor' },
    { name: 'Perfected Envoy Vestments', category: 'armor' },
    { name: "Mistforged Glorious Hero's Raiment", category: 'armor' },
    { name: 'Obsidian Light Regalia', category: 'armor' },
];

export function defineRepresentativeCoverage(spec: LegendaryRepresentativeSpec): void {
    describe(`${spec.name} (${spec.category} representative)`, () => {
        const SKIP = !fixtureExistsByItemName(spec.name);

        if (SKIP) {
            it.skip('fixture is not available for this representative item', () => {});
            return;
        }

        describe('baseline scenario (inventory = {}, priceMode = buy)', () => {
            const baseScenario = CalculationFor(spec.name);

            it('recipe is available and rows are consistent', () => {
                baseScenario.recipeIsAvailable().rowsAreConsistent();
            });
        });

        describe('special and edge cases: priceMode', () => {
            const buyScenario = CalculationFor(spec.name, { priceMode: 'buy' });
            const sellScenario = CalculationFor(spec.name, { priceMode: 'sell' });

            it('row invariants hold in both price modes', () => {
                buyScenario.rowsAreConsistent();
                sellScenario.rowsAreConsistent();
            });
        });

        if (spec.category === 'weapon') {
            describe('special and edge cases: inventory', () => {
                // Use numeric key to avoid fixture-specific name lookup requirements.
                const inventoryScenario = CalculationFor(spec.name, { inventory: { 19721: 250 } });

                it('row invariants hold when inventory is injected', () => {
                    inventoryScenario.rowsAreConsistent();
                });
            });
        }
    });
}

function normalizeName(name: string): string {
    return name.toLowerCase().replace(/#item\d+/g, '').replace(/\s+/g, ' ').trim();
}

function findItemIdByName(ctx: CalculatorContext, name: string): number {
    const target = normalizeName(name);
    const candidates = Object.values(ctx.itemsById).filter((item) => normalizeName(item.name ?? '') === target);
    if (!candidates.length) throw new Error(`Item not found in fixture by exact name: "${name}"`);

    const withIngredients = candidates.find((item) => {
        const recipe = ctx.recipeCache.get(item.id);
        return Boolean(recipe?.ingredients?.length);
    });
    if (withIngredients) return withIngredients.id;

    const withRecipe = candidates.find((item) => ctx.recipeCache.has(item.id));
    if (withRecipe) return withRecipe.id;

    return candidates[0].id;
}

export function recipeIngredientNames(ctx: CalculatorContext, parentName: string): string[] {
    const id = findItemIdByName(ctx, parentName);
    const recipe = ctx.recipeCache.get(id);
    if (!recipe) return [];

    return (recipe.ingredients ?? [])
        .map((ing) => ctx.itemsById[Number(ing.item_id)]?.name)
        .filter((name): name is string => Boolean(name));
}

function assertIngredientsExact(ctx: CalculatorContext, parentName: string, expected: ExpectedIngredient[]): void {
    const id = findItemIdByName(ctx, parentName);
    const recipe = ctx.recipeCache.get(id);

    const actual = (recipe?.ingredients ?? [])
        .map((ing) => ({
            name: normalizeName(ctx.itemsById[Number(ing.item_id)]?.name ?? ''),
            count: Number(ing.count ?? 0),
        }))
        .filter((ing) => Boolean(ing.name))
        .sort((a, b) => a.name.localeCompare(b.name) || a.count - b.count);

    const normalizedExpected = expected
        .map((ing) => ({ name: normalizeName(ing.name), count: ing.count }))
        .sort((a, b) => a.name.localeCompare(b.name) || a.count - b.count);

    expect(actual, `${parentName} ingredients with counts`).toEqual(normalizedExpected);
}

export function expectRecipeIngredientsExactly(ctx: CalculatorContext, parentName: string, expected: ExpectedIngredient[]): void {
    if (getCurrentTest()) {
        assertIngredientsExact(ctx, parentName, expected);
        return;
    }
    describe(parentName, () => {
        if (expected.length === 0) {
            it('has no crafting ingredients', () => assertIngredientsExact(ctx, parentName, expected));
        } else {
            for (const ing of expected) {
                it(`${ing.count}× ${ing.name}`, () => assertIngredientsExact(ctx, parentName, expected));
            }
        }
    });
}

export const ingredient = (name: string, count: number): ExpectedIngredient => ({ name, count });

export function expectCommonEconomicTemplateL3(
    ctx: CalculatorContext,
    options: { includeCondensedMight?: boolean; includeCondensedMagic?: boolean } = {}
): void {
    const includeCondensedMight = options.includeCondensedMight ?? true;
    const includeCondensedMagic = options.includeCondensedMagic ?? true;

    expectRecipeIngredientsExactly(ctx, 'Mystic Clover', [
        ingredient('Obsidian Shard', 1),
        ingredient('Mystic Coin', 1),
        ingredient('Glob of Ectoplasm', 1),
        ingredient("Philosopher's Stone", 6),
    ]);

    if (includeCondensedMight) {
        expectRecipeIngredientsExactly(ctx, 'Gift of Condensed Might', [
            ingredient('Gift of Claws', 1),
            ingredient('Gift of Scales', 1),
            ingredient('Gift of Bones', 1),
            ingredient('Gift of Fangs', 1),
        ]);
    }

    if (includeCondensedMagic) {
        expectRecipeIngredientsExactly(ctx, 'Gift of Condensed Magic', [
            ingredient('Gift of Blood', 1),
            ingredient('Gift of Venom', 1),
            ingredient('Gift of Totems', 1),
            ingredient('Gift of Dust', 1),
        ]);
    }

    expectRecipeIngredientsExactly(ctx, 'Cube of Stabilized Dark Energy', [
        ingredient('Ball of Dark Energy', 1),
        ingredient('Stabilizing Matrix', 75),
    ]);
}

export function expectCommonProwessTemplateL3(ctx: CalculatorContext): void {
    expectRecipeIngredientsExactly(ctx, 'Obsidian Shard', [
        ingredient('Obsidian Shard', 1),
        ingredient('Mystic Coin', 1),
        ingredient('Pile of Putrid Essence', 1),
        ingredient('Mini Risen Priest of Balthazar', 1),
    ]);
}

function assertVendorCostContains(ctx: CalculatorContext, parentName: string, expectedCostNames: string[]): void {
    const id = findItemIdByName(ctx, parentName);
    const recipe = ctx.recipeCache.get(id);
    const costNames = (recipe?.acquisition?.vendors ?? [])
        .flatMap((vendor) => vendor.cost ?? [])
        .map((cost) => cost.item_name)
        .filter((name): name is string => Boolean(name))
        .map(normalizeName);

    for (const expected of expectedCostNames.map(normalizeName)) {
        expect(costNames, `${parentName} vendor cost names`).toContain(expected);
    }
}

export function expectVendorCostsContain(ctx: CalculatorContext, parentName: string, expectedCostNames: string[]): void {
    if (getCurrentTest()) {
        assertVendorCostContains(ctx, parentName, expectedCostNames);
        return;
    }
    describe(`${parentName} vendor`, () => {
        for (const costName of expectedCostNames) {
            it(`contains ${costName}`, () => assertVendorCostContains(ctx, parentName, [costName]));
        }
    });
}
