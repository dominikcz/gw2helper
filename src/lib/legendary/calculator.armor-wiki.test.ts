import { describe, it } from 'vitest';
import { loadFixtureContextByItemName } from './test-helpers';
import {
    expectCommonEconomicTemplateL3,
    expectCommonProwessTemplateL3,
    expectRecipeIngredientsExactly,
    expectVendorCostsContain,
    ingredient,
} from './calculator.test.helpers';

describe('Legendary armor expected structure from wiki', () => {
    describe('WvW: Sublime Mistforged Triumphant Hero\'s Raiment', () => {
        it('has full L1/L2 and expected L3 blocks matching wiki template', () => {
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
        it('has full L1/L2 and expected L3 blocks matching wiki template', () => {
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
        it('has full L1/L2 and expected L3 blocks matching wiki template', () => {
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
        it('has full L1/L2 and selected L3 blocks matching wiki template', () => {
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
        it('has Selachimorpha Container as its only ingredient', () => {
            const { ctx } = loadFixtureContextByItemName('Selachimorpha');
            expectRecipeIngredientsExactly(ctx, 'Selachimorpha', [
                ingredient('Selachimorpha Container', 1),
            ]);
        });
    });

    describe('Open world: Selachimorpha Container (wiki material table)', () => {
        const { ctx } = loadFixtureContextByItemName('Selachimorpha Container');

        expectRecipeIngredientsExactly(ctx, 'Selachimorpha Container', [
            ingredient('Gift of the Survivors', 1),
            ingredient('Gift of the People', 1),
            ingredient('Gift of Castoran Mastery', 1),
            ingredient('Agaleus', 1),
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

        expectRecipeIngredientsExactly(ctx, 'Gift of Castoran Mastery', [
            ingredient('Gift of Adventure', 1),
            ingredient('Gift of the Seas', 1),
            ingredient('Bloodstone Shard', 1),
            ingredient('Obsidian Shard', 250),
        ]);

        expectVendorCostsContain(ctx, 'Gift of Adventure', [
            'Vision Crystal',
            'Mystic Clover',
            'Tale of Adventure',
            'Unusual Coin',
        ]);

        expectVendorCostsContain(ctx, 'Gift of the Seas', [
            'Gift of the Tides',
            'Gift of Research',
            'Gift of Condensed Might',
            'Gift of Condensed Magic',
        ]);

        expectRecipeIngredientsExactly(ctx, 'Agaleus', [
            ingredient('Agaleus Container', 1),
        ]);

        expectRecipeIngredientsExactly(ctx, 'Agaleus Container', []);
    });
});
