type AccountGuilds = {
    guild_leader?: string[];
    guilds?: string[];
};

export function collectUniqueGuildIds(account: AccountGuilds): string[] {
    return [...new Set([...(account.guild_leader || []), ...(account.guilds || [])])];
}

type CharacterCrafting = {
    crafting?: Array<{ discipline?: string } | null>;
};

export function mapCharactersWithCrafting<T extends CharacterCrafting>(characters: T[]): Array<T & { crafting_discipline: string }> {
    return characters.map((character) => ({
        ...character,
        crafting_discipline: (character.crafting || []).map((c) => c?.discipline).flat().join(', '),
    }));
}

type AccountDates = {
    created?: string;
    last_modified?: string;
};

export function withLocalAccountDates<T extends AccountDates>(account: T): T & { created_local: string; last_modified_local: string } {
    return {
        ...account,
        created_local: account.created ? new Date(account.created).toLocaleString() : '',
        last_modified_local: account.last_modified ? new Date(account.last_modified).toLocaleString() : '',
    };
}
