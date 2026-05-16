/**
 * GW2 Wiki utility functions for cache-building scripts.
 * Self-contained ESM module — no external dependencies.
 */

export const WIKI_DELAY_MS = Number(process.env.GW2W_WIKI_DELAY_MS || 200);
export const INGREDIENT_DELAY_MS = Number(process.env.GW2W_INGREDIENT_DELAY_MS || 50);
export const MAX_RETRIES = Number(process.env.GW2W_MAX_RETRIES || 2);
export const GW2_WIKI = 'https://wiki.guildwars2.com/api.php';

// ─── HTTP helpers ────────────────────────────────────────────────────────────

export let lastRequestTime = 0;

export async function sleep(ms) {
	if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}

export async function throttledFetch(url, delayMs = WIKI_DELAY_MS) {
	const elapsed = Date.now() - lastRequestTime;
	if (elapsed < delayMs) await sleep(delayMs - elapsed);

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const res = await fetch(url, {
				headers: { 'User-Agent': 'gw2helper-cache-bot/2.0', Accept: 'application/json' },
			});
			lastRequestTime = Date.now();
			if (res.status === 404) return null;
			if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
			return await res.json();
		} catch (err) {
			if (attempt === MAX_RETRIES) throw err;
			await sleep(delayMs * (attempt + 1));
		}
	}
}

// ─── Wiki helpers ────────────────────────────────────────────────────────────

export async function wikiResolvePageByGameId(itemId) {
	const query = encodeURIComponent(`[[Has game id::${itemId}]][[Has context::Item]]|?Has game id#`);
	const url = `${GW2_WIKI}?action=ask&query=${query}&format=json&origin=*`;
	const json = await throttledFetch(url);
	const results = json?.query?.results || {};
	const key = Object.keys(results)[0];
	return key || null;
}

export async function wikiResolveGameIdByPage(pageTitle, delayMs = INGREDIENT_DELAY_MS) {
	const query = encodeURIComponent(`[[${pageTitle}]]|?Has game id#`);
	const url = `${GW2_WIKI}?action=ask&query=${query}&format=json&origin=*`;
	const json = await throttledFetch(url, delayMs);
	const results = json?.query?.results || {};
	const key = Object.keys(results)[0];
	if (!key) return null;
	const values = results[key]?.printouts?.['Has game id'];
	if (!Array.isArray(values) || !values.length) return null;
	const id = Number(values[0]);
	return id > 0 && Number.isFinite(id) ? id : null;
}

export async function wikiSearchByName(itemName) {
	const url = `${GW2_WIKI}?action=query&list=search&srsearch=${encodeURIComponent(itemName)}&srnamespace=0&srlimit=5&format=json&origin=*`;
	const json = await throttledFetch(url);
	const results = json?.query?.search || [];
	const exact = results.find((r) => r.title === itemName);
	if (exact) return exact.title;
	return results.length ? results[0].title : null;
}

// ─── Acquisition parser ────────────────────────────────────────────────────

export async function fetchWikiAcquisition(pageTitle) {
	const basePage = pageTitle.replace(/#.*$/, '');
	const sectionsUrl = `${GW2_WIKI}?action=parse&page=${encodeURIComponent(basePage)}&prop=sections&format=json&origin=*`;
	const sectionsJson = await throttledFetch(sectionsUrl, WIKI_DELAY_MS).catch(() => null);
	if (!sectionsJson) return null;

	const sections = sectionsJson?.parse?.sections || [];
	const acqSection = sections.find((s) => /acquisition/i.test(String(s?.line || '')));
	if (!acqSection?.index) return null;

	const url = `${GW2_WIKI}?action=parse&page=${encodeURIComponent(basePage)}&prop=text&section=${acqSection.index}&format=json&origin=*`;
	const json = await throttledFetch(url, WIKI_DELAY_MS).catch(() => null);
	if (!json) return null;

	const html = json?.parse?.text?.['*'] || '';
	if (!html) return null;

	const vendors = parseVendorTableHtml(html);

	// Fallback: parse plain-text "Vendor — price per N" format (e.g. Thermocatalytic Reagent)
	if (vendors.length === 0) vendors.push(...parseVendorListHtml(html));

	const salvaged = parseSalvagedFromHtml(html);

	// "Contained in" items are acquisition sources just like vendors:
	// treat each container as a vendor entry with cost = 1× that container.
	if (salvaged?.length) {
		for (const containerName of salvaged) {
			// Only add if not already present by name
			if (!vendors.some(v => v.name === containerName)) {
				vendors.push({ name: containerName, cost: [{ amount: 1, item_name: containerName }] });
			}
		}
	}

	if (vendors.length === 0) return null;
	return { vendors };
}

/**
 * Parses plain-text vendor list format used on pages like Thermocatalytic Reagent:
 *   <ul><li><a>Vendor Name</a> — <span class="price" data-sort-value="1496">...</span> per 10</li></ul>
 * Returns an array of vendor objects with gold_cost set as per-unit copper cost.
 */
export function parseVendorListHtml(html) {
	const vendors = [];
	const liRx = /<li>((?!<table)[\s\S]*?)<\/li>/gi;
	let liMatch;
	while ((liMatch = liRx.exec(html)) !== null) {
		const content = liMatch[1];
		// Must have a vendor link AND a price span with data-sort-value
		const vendorMatch = content.match(/title="([^"]+)"[^>]*>(?:[^<]*)<\/a>/);
		const priceMatch = content.match(/data-sort-value="(\d+)"/);
		if (!vendorMatch || !priceMatch) continue;
		// Skip if it looks like a recipe ingredient list (has many sub-items or is a recipe table row)
		if ((content.match(/<li>/g) || []).length > 2) continue;
		const vendorName = vendorMatch[1].replace(/&#160;|&nbsp;/g, ' ').trim();
		const totalCopper = parseInt(priceMatch[1], 10);
		if (!vendorName || !Number.isFinite(totalCopper) || totalCopper <= 0) continue;
		// Extract "per N" quantity (e.g. "per 10")
		const perMatch = content.match(/per\s+(\d+)/i);
		const qty = perMatch ? parseInt(perMatch[1], 10) : 1;
		const goldCostPerUnit = Math.ceil(totalCopper / qty);
		vendors.push({ name: vendorName, cost: [], gold_cost: goldCostPerUnit });
	}
	return vendors;
}

/**
 * Parses SMW UL list ({{Salvaged from}} / {{Contained in}} etc.) from Acquisition HTML.
 * Returns array of item names, or null if not present.
 */
export function parseSalvagedFromHtml(html) {
	// Look for the smw-ul-columns / smw-format ul-format pattern
	const ulMatch = html.match(/<ul\s[^>]*class="[^"]*smw-format[^"]*"[^>]*>([\s\S]*?)<\/ul>/i);
	if (!ulMatch) return null;

	const items = [];
	const liRx = /<li[^>]*>([\s\S]*?)<\/li>/gi;
	let liMatch;
	while ((liMatch = liRx.exec(ulMatch[1])) !== null) {
		// Prefer title attribute, fallback to link text
		const titleMatch = liMatch[1].match(/title="([^"]+)"/);
		const textMatch = liMatch[1].match(/<a[^>]*>([^<]+)<\/a>/);
		const name = (titleMatch?.[1] || textMatch?.[1] || '').replace(/&#160;|&nbsp;/g, ' ').trim();
		if (name) items.push(name);
	}
	return items.length ? items : null;
}

export function parseVendorTableHtml(html) {
	const vendors = [];

	const trPattern = /<tr>([\s\S]*?)<\/tr>/gi;
	let trMatch;
	let isHeader = true;

	while ((trMatch = trPattern.exec(html)) !== null) {
		const row = trMatch[1];
		if (/<th/i.test(row)) { isHeader = false; continue; }
		if (isHeader) continue;

		const cells = [];
		const tdPattern = /<td[\s\S]*?>([\s\S]*?)<\/td>/gi;
		let tdMatch;
		while ((tdMatch = tdPattern.exec(row)) !== null) {
			cells.push(tdMatch[1]);
		}
		if (cells.length < 4) continue;

		const vendorTitleMatch = cells[0].match(/title="([^"]+)"/);
		const vendorLinkMatch = cells[0].match(/>([^<]+)<\/a>/);
		const vendorName = (vendorTitleMatch?.[1] || vendorLinkMatch?.[1] || '').replace(/&#160;/g, ' ').trim();
		if (!vendorName) continue;

		const costCell = cells[3];
		const imgMatches = [...costCell.matchAll(/<img\s([^>]*)>/gi)];
		if (!imgMatches.length) continue;

		// Use data-sort-value when present — wiki stores the FULL coin cost in copper there.
		// But ONLY apply it when coin images are actually present in the cell;
		// for item-only costs data-sort-value may be a sort key unrelated to coin amount.
		const sortValMatch = costCell.match(/data-sort-value="(\d+)"/);
		const sortValCopper = sortValMatch ? parseInt(sortValMatch[1], 10) : null;

		let goldCopper = 0;
		let sortValUsed = false;
		const cost = [];
		for (let mi = 0; mi < imgMatches.length; mi++) {
			const imgMatch = imgMatches[mi];
			const attrs = imgMatch[1];
			const altMatch = attrs.match(/alt="([^"]+)"/i);
			const srcMatch = attrs.match(/src="([^"]+)"/i);
			if (!altMatch) continue;
			const item_name = altMatch[1].trim();
			const isGold = /\bgold\s*coin\b/i.test(item_name);
			const isSilver = /\bsilver\s*coin\b/i.test(item_name);
			const isCopper = /\bcopper\s*coin\b/i.test(item_name);
			// Strip HTML tags (with all their attributes) from preceding text, keeping only visible text.
			// This prevents URL-encoded chars like %27 in href attributes from matching as digits.
			const precedingRaw = costCell.slice(0, imgMatch.index);
			const precedingText = precedingRaw.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, ' ');
			if (isGold || isSilver || isCopper) {
				if (sortValCopper != null && !sortValUsed) {
					// sortValCopper already holds the full coin cost — use it once
					goldCopper = sortValCopper;
					sortValUsed = true;
				} else if (!sortValUsed) {
					const nums = (precedingText.match(/(\d[\d,]*)/g) || []);
					if (!nums.length) continue;
					const amount = parseInt(nums[nums.length - 1].replace(/,/g, ''), 10);
					if (!Number.isFinite(amount) || amount <= 0) continue;
					if (isGold) goldCopper += amount * 10000;
					else if (isSilver) goldCopper += amount * 100;
					else goldCopper += amount;
				}
				continue;
			}
			// For item costs: check visible text before the image, then text after.
			// Wiki format: "250&#160;<img>" (number before) or "<img>&#160;250" (number after).
			const numsBefore = (precedingText.match(/(\d[\d,]*)/g) || []);

			// Text after this image up to next image or end of cell (also strip tags)
			const afterStart = imgMatch.index + imgMatch[0].length;
			const afterEnd = mi + 1 < imgMatches.length ? imgMatches[mi + 1].index : costCell.length;
			const afterText = costCell.slice(afterStart, afterEnd)
				.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, ' ');
			const numsAfter = (afterText.match(/(\d[\d,]*)/g) || []);

			// Use last number before image if available, otherwise first number after
			const rawAmount = numsBefore.length > 0
				? numsBefore[numsBefore.length - 1]
				: (numsAfter.length > 0 ? numsAfter[0] : null);
			if (!rawAmount) continue;
			const amount = parseInt(rawAmount.replace(/,/g, ''), 10);
			if (!Number.isFinite(amount) || amount <= 0) continue;
			let icon_url = srcMatch ? srcMatch[1] : '';
			if (icon_url.startsWith('//')) icon_url = 'https:' + icon_url;
			else if (icon_url.startsWith('/')) icon_url = 'https://wiki.guildwars2.com' + icon_url;
			cost.push(icon_url ? { amount, item_name, icon_url } : { amount, item_name });
		}
		if (!cost.length && goldCopper === 0) continue;
		vendors.push({ name: vendorName, cost, ...(goldCopper > 0 ? { gold_cost: goldCopper } : {}) });
	}

	// Deduplicate by content (name + costs + gold_cost).
	// Do NOT filter to gold-only: some vendors offer items as currency (e.g. Elder Wood Log),
	// and we want all cost tiers preserved so the UI can pick the cheapest one.
	const seen = new Set();
	return vendors.filter(v => {
		const costKey = (v.cost ?? []).map(c => `${c.item_name ?? ''}:${c.amount ?? 0}`).sort().join('|');
		const key = `${v.name}\x00${v.gold_cost ?? 0}\x00${costKey}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

// ─── Recipe parsers ──────────────────────────────────────────────────────────

export function parseRecipeBlocks(wikitext) {
	const lines = wikitext.split('\n');
	const blocks = [];
	let current = null;
	let currentIsMysticForge = false;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (/^\{\{\s*recipe\b/i.test(line)) {
			current = [rawLine];
			currentIsMysticForge = false;
		} else if (/^\{\{\s*mystic\s*forge\b/i.test(line)) {
			current = [rawLine];
			currentIsMysticForge = true;
		} else if (current) {
			current.push(rawLine);
			if (/^\}\}\s*$/.test(line)) {
				const block = parseSingleBlock(current);
				if (currentIsMysticForge && !block.disciplines.includes('Mystic Forge')) {
					block.disciplines = ['Mystic Forge'];
				}
				blocks.push(block);
				current = null;
				currentIsMysticForge = false;
			}
		}
	}

	if (!blocks.length) {
		const fallback = parseSingleBlock(lines);
		if (fallback.ingredients.length) blocks.push(fallback);
	}

	return blocks;
}

export function parseSingleBlock(lines) {
	const ingredients = [];
	const disciplines = [];
	let outputCount = 1;
	let outputItemId = null;
	let baseIngredientsCalculation = false;

	for (const rawLine of lines) {
		const line = (typeof rawLine === 'string' ? rawLine : '').trim();

		const outputIdMatch = line.match(/^\|\s*output\s*item\s*id\s*=\s*(\d+)/i);
		if (outputIdMatch) {
			outputItemId = Number(outputIdMatch[1]) || null;
			continue;
		}

		// quantity / output quantity / output_count — supports decimals (e.g. 0.31 for probabilistic recipes)
		const outputQtyMatch = line.match(
			/^\|\s*(?:quantity|output\s*quantity|output\s*qty|output_count|output-count)\s*=\s*([\d.]+)/i
		);
		if (outputQtyMatch) {
			const parsed = parseFloat(outputQtyMatch[1]);
			if (parsed > 0) outputCount = parsed;
			continue;
		}

		// base ingredients calculation = y/n — marks this block as the "expected average" recipe
		const baseCalcMatch = line.match(/^\|\s*base\s*ingredients?\s*calculation\s*=\s*(\S+)/i);
		if (baseCalcMatch) {
			baseIngredientsCalculation = /^y(es)?$/i.test(baseCalcMatch[1].trim());
			continue;
		}

		// discipline / discipline2 / disciplines fields
		const discMatch = line.match(/^\|\s*disciplines?\d*\s*=\s*(.+)$/i);
		if (discMatch) {
			const val = discMatch[1].trim();
			if (val) disciplines.push(val);
			continue;
		}

		// source field (e.g. | source = Mystic Forge)
		const sourceMatch = line.match(/^\|\s*source\s*=\s*(.+)$/i);
		if (sourceMatch) {
			const val = sourceMatch[1].trim();
			if (/mystic\s*forge/i.test(val)) disciplines.push('Mystic Forge');
			else if (val) disciplines.push(val);
			continue;
		}

		const ingMatch = line.match(/^\|\s*ingredient\d+\s*=\s*(\d+)\s+(.+)$/i);
		if (ingMatch) {
			const count = Number(ingMatch[1]);
			const name = ingMatch[2].trim();
			if (count > 0 && name) ingredients.push({ name, count });
		}
	}

	return { ingredients, outputCount, outputItemId, disciplines, baseIngredientsCalculation };
}

/**
 * Maps wiki infobox item types to GW2 API recipe types.
 * Item types that don't correspond to a recipe type are omitted.
 */
const INFOBOX_TYPE_TO_RECIPE_TYPE = {
	// Weapons (wiki type = lowercase weapon name)
	'Axe': 'Axe', 'Dagger': 'Dagger', 'Focus': 'Focus', 'Greatsword': 'Greatsword',
	'Hammer': 'Hammer', 'Harpoon': 'Harpoon', 'Longbow': 'LongBow', 'Mace': 'Mace',
	'Pistol': 'Pistol', 'Rifle': 'Rifle', 'Scepter': 'Scepter', 'Shield': 'Shield',
	'Shortbow': 'ShortBow', 'Speargun': 'Speargun', 'Staff': 'Staff', 'Sword': 'Sword',
	'Torch': 'Torch', 'Trident': 'Trident', 'Warhorn': 'Warhorn',
	// Armor
	'Boots': 'Boots', 'Coat': 'Coat', 'Gloves': 'Gloves', 'Helm': 'Helm',
	'Leggings': 'Leggings', 'Shoulders': 'Shoulders',
	// Trinkets
	'Amulet': 'Amulet', 'Earring': 'Earring', 'Ring': 'Ring',
	// Back
	'Backpack': 'Backpack', 'BackItem': 'Backpack',
	// Trophy
	'Trophy': 'Trophy',
	// Consumables
	'Consumable': 'Consumable',
	// Upgrade
	'UpgradeComponent': 'UpgradeComponent',
	// Bag
	'Bag': 'Bag',
};

/**
 * Parses {{Item infobox}}, {{Weapon infobox}}, etc. from section 0 wikitext.
 * Returns { type, gameIds } where type is the GW2 API recipe type (or null) and gameIds is an array of numbers.
 */
export function parseInfobox(wikitext) {
	const lines = wikitext.split('\n');
	let inInfobox = false;
	let rawType = null;
	const gameIds = [];

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (/^\{\{.+infobox/i.test(line)) { inInfobox = true; continue; }
		if (!inInfobox) continue;
		if (/^\}\}/.test(line)) break;

		const typeMatch = line.match(/^\|\s*type\s*=\s*(.+)$/i);
		if (typeMatch) {
			rawType = typeMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, '');
			continue;
		}

		const idMatch = line.match(/^\|\s*id\s*=\s*(.+)$/i);
		if (idMatch) {
			for (const part of idMatch[1].split(',')) {
				const n = parseInt(part.trim(), 10);
				if (n > 0) gameIds.push(n);
			}
		}
	}

	const type = rawType ? (INFOBOX_TYPE_TO_RECIPE_TYPE[rawType] ?? null) : null;
	return { type, gameIds };
}

export async function fetchWikiRecipe(pageTitle, expectedItemId) {
	// Also fetch infobox from lead section (section 0) for type and id
	const leadUrl = `${GW2_WIKI}?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&section=0&format=json&origin=*`;
	const leadJson = await throttledFetch(leadUrl).catch(() => null);
	const leadText = leadJson?.parse?.wikitext?.['*'] || '';
	const infobox = parseInfobox(leadText);

	const sectionsUrl = `${GW2_WIKI}?action=parse&page=${encodeURIComponent(pageTitle)}&prop=sections&format=json&origin=*`;
	const sectionsJson = await throttledFetch(sectionsUrl);
	const sections = sectionsJson?.parse?.sections || [];

	const recipeSection = sections.find((s) => {
		const line = String(s?.line || '').toLowerCase();
		return line.includes('recipe') || line.includes('acquisition');
	});

	if (recipeSection?.index) {
		const url = `${GW2_WIKI}?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&section=${recipeSection.index}&format=json&origin=*`;
		const json = await throttledFetch(url);
		const text = json?.parse?.wikitext?.['*'] || '';
		const blocks = parseRecipeBlocks(text);
		const match = selectRecipeBlock(blocks, expectedItemId);
		if (match && match.ingredients.length) {
			if (!match.disciplines.length) {
				const htmlMatch = await fetchRecipeSourceFromSection(pageTitle, recipeSection.index);
				if (htmlMatch) match.disciplines = htmlMatch;
			}
			if (!match.recipeType && infobox.type) match.recipeType = infobox.type;
			return match;
		}
		// No wikitext recipe found — try HTML table for source/discipline
		if (!match || !match.ingredients.length) {
			const htmlDiscs = await fetchRecipeSourceFromSection(pageTitle, recipeSection.index);
			if (htmlDiscs?.length) {
				// Return minimal recipe shell with disciplines so caller can set them
				return { ingredients: [], outputCount: 1, outputItemId: null, disciplines: htmlDiscs, recipeType: infobox.type ?? null };
			}
		}
	}

	const fullUrl = `${GW2_WIKI}?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&format=json&origin=*`;
	const fullJson = await throttledFetch(fullUrl);
	const fullText = fullJson?.parse?.wikitext?.['*'] || '';
	const blocks = parseRecipeBlocks(fullText);
	const match = selectRecipeBlock(blocks, expectedItemId);
	if (match && match.ingredients.length) {
		if (!match.disciplines.length) {
			const htmlDiscs = await fetchRecipeSourceFromSection(pageTitle, null);
			if (htmlDiscs) match.disciplines = htmlDiscs;
		}
		if (!match.recipeType && infobox.type) match.recipeType = infobox.type;
		return match;
	}

	return null;
}

/**
 * Fetches the HTML of a wiki page section (or full page if sectionIndex is null)
 * and extracts discipline/source info from the recipe table.
 * Returns an array of discipline strings (e.g. ['Mystic Forge']) or null.
 */
async function fetchRecipeSourceFromSection(pageTitle, sectionIndex) {
	const sectionParam = sectionIndex != null ? `&section=${sectionIndex}` : '';
	const url = `${GW2_WIKI}?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text${sectionParam}&format=json&origin=*`;
	const json = await throttledFetch(url).catch(() => null);
	if (!json) return null;
	const html = json?.parse?.text?.['*'] || '';
	return parseRecipeSourceFromHtml(html);
}

/**
 * Parses an HTML string for a recipe table that has "Source" or "Discipline" column headers.
 * Returns an array of discipline strings or null.
 */
export function parseRecipeSourceFromHtml(html) {
	const tableRx = /<table[\s\S]*?<\/table>/gi;
	let tMatch;
	while ((tMatch = tableRx.exec(html)) !== null) {
		const tableHtml = tMatch[0];

		// Find first header row
		const headerRowMatch = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
		if (!headerRowMatch) continue;

		const headers = [];
		const thRx = /<th[^>]*>([\s\S]*?)<\/th>/gi;
		let thm;
		while ((thm = thRx.exec(headerRowMatch[1])) !== null) {
			headers.push(
				thm[1].replace(/<[^>]+>/g, '').replace(/&#160;|&nbsp;/g, ' ').trim().toLowerCase()
			);
		}

		const sourceIdx = headers.findIndex((h) => /^source$/i.test(h));
		const discIdx = headers.findIndex((h) => /^discipline/i.test(h));
		if (sourceIdx === -1 && discIdx === -1) continue;

		const disciplines = new Set();
		const trRx = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
		let trm;
		let firstRow = true;
		while ((trm = trRx.exec(tableHtml)) !== null) {
			const row = trm[1];
			if (firstRow) { firstRow = false; continue; } // skip header row
			if (/<th/i.test(row)) continue;

			const cells = [];
			const tdRx = /<td[^>]*>([\s\S]*?)<\/td>/gi;
			let tdm;
			while ((tdm = tdRx.exec(row)) !== null) {
				cells.push(tdm[1].replace(/<[^>]+>/g, '').replace(/&#160;|&nbsp;/g, ' ').trim());
			}

			const source = sourceIdx >= 0 ? (cells[sourceIdx] ?? '') : '';
			const discipline = discIdx >= 0 ? (cells[discIdx] ?? '') : '';

			if (/mystic\s*forge/i.test(source)) {
				disciplines.add('Mystic Forge');
			} else if (discipline) {
				disciplines.add(discipline);
			} else if (source) {
				disciplines.add(source);
			}
		}

		if (disciplines.size) return [...disciplines];
	}
	return null;
}

export function selectRecipeBlock(blocks, expectedItemId) {
	if (!blocks.length) return null;

	const id = Number(expectedItemId);

	// Among blocks with matching (or unspecified) output item id, prefer
	// the one marked with | base ingredients calculation = y, as it represents
	// the true expected cost (e.g. probabilistic Mystic Forge recipes).
	const candidates = id > 0
		? blocks.filter((b) => b.outputItemId == null || Number(b.outputItemId) === id)
		: blocks;

	if (id > 0 && candidates.length === 0) {
		// All blocks have a different explicit id — no match
		if (blocks.every((b) => b.outputItemId != null && Number(b.outputItemId) !== id)) return null;
		return blocks.sort((a, b) => b.ingredients.length - a.ingredients.length)[0];
	}

	const preferred = candidates.find((b) => b.baseIngredientsCalculation);
	if (preferred) return preferred;

	if (candidates.length === 1) return candidates[0];

	return candidates.sort((a, b) => b.ingredients.length - a.ingredients.length)[0];
}
