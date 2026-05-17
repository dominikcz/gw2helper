import { describe, expect, it } from 'vitest';

import {
    fixtureExistsByItemName,
    loadFixtureContextByItemName,
    resolveFixtureSlugByItemName,
    resetFixtureIndexCache,
} from './test-helpers';

describe('test-helpers fixture resolver', () => {
    it('prefers exact slug match over substring match', () => {
        resetFixtureIndexCache();
        const slug = resolveFixtureSlugByItemName('Selachimorpha');
        expect(slug).toBe('105921-selachimorpha');
    });

    it('resolves similar standalone fixture names correctly', () => {
        resetFixtureIndexCache();
        const slug = resolveFixtureSlugByItemName('Selachimorpha Container');
        expect(slug).toBe('105743-selachimorpha-container');
    });

    it('returns false for unknown item names', () => {
        resetFixtureIndexCache();
        expect(fixtureExistsByItemName('Definitely Not A Legendary Item')).toBe(false);
    });

    it('loads fixture context by item name and returns matching metadata', () => {
        resetFixtureIndexCache();
        const loaded = loadFixtureContextByItemName('The Juggernaut');

        expect(loaded.slug).toBe('30690-the-juggernaut');
        expect(loaded.rootItemId).toBe(30690);
        expect(loaded.ctx.recipeCache.has(30690)).toBe(true);
    });
});
