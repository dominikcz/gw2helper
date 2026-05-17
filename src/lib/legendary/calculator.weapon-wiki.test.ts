import { describe, it, expect } from 'vitest';
import { fixtureExistsByItemName, loadFixtureContextByItemName } from './test-helpers';
import {
    expectCommonEconomicTemplateL3,
    expectRecipeIngredientsExactly,
    expectVendorCostsContain,
    ingredient,
    recipeIngredientNames,
} from './calculator.test.helpers';

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
