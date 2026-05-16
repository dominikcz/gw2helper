// Shared types for the legendary calculator — imported by calculator.ts, display.ts and +page.ts.

export type RecipeTreeNode = {
	id: number;
	count: number;
	recipeId?: number;
	source?: 'api' | 'wiki' | 'terminal';
	cycle?: boolean;
	name?: string | null;
	icon_url?: string;
	gold_cost?: number;
	acquisition?: ItemAcquisition | null;
	children: RecipeTreeNode[];
};

export type ItemSummary = {
	id: number;
	name?: string;
	icon?: string;
	rarity?: string;
	flags?: string[];
	binding?: string;
	bound_to?: string;
};

export type IngredientRow = {
	id: number;
	required: number;
	owned: number;
	missing: number;
	buyUnit: number | null;
	sellUnit: number | null;
	craftBuyUnit: number | null;
	craftSellUnit: number | null;
	vendorBuyUnit: number | null;
	vendorSellUnit: number | null;
	vendorFreeUnits: number;
	bestBuyUnit: number | null;
	bestSellUnit: number | null;
	bestBuySource: 'tp' | 'craft' | 'vendor' | 'none';
	bestSellSource: 'tp' | 'craft' | 'vendor' | 'none';
	tpEligible: boolean;
	acquisition: ItemAcquisition | null;
};

export type CacheIngredient = {
	item_id: number | null;
	count: number;
	name?: string | null;
};

export type VendorCost = {
	amount: number;
	item_name: string;
	icon_url?: string;
	item_id?: number;
};

export type VendorAcquisition = {
	name: string;
	cost: VendorCost[];
	gold_cost?: number;
};

export type ItemAcquisition = {
	vendors: VendorAcquisition[];
};

export type CacheRecipe = {
	source: 'api' | 'wiki' | 'terminal';
	output_item_id: number;
	recipe_id: number | null;
	output_item_count?: number;
	wiki_page?: string;
	ingredients: CacheIngredient[];
	acquisition?: ItemAcquisition | null;
};

export type PriceEntry = {
	buys?: { unit_price: number };
	sells?: { unit_price: number };
};

/** Full set of inputs needed to compute ingredient rows. */
export type CalculatorContext = {
	recipeCache: Map<number, CacheRecipe>;
	itemsById: Record<number, ItemSummary>;
	priceById: Map<number, PriceEntry>;
	/** Current owned counts across all inventory sources. */
	ownedByItem: Map<number, number>;
};

export type LegendaryResult = {
	recipeTree: RecipeTreeNode;
	recipeAvailable: boolean;
	ingredients: IngredientRow[];
};
