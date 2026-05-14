import fs from 'node:fs/promises';
import path from 'node:path';

const API_BASE = 'https://api.guildwars2.com/v2';
const BATCH_SIZE = 200;

async function fetchJson(url) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Request failed: ${response.status} ${response.statusText} for ${url}`);
	}
	return response.json();
}

function inBatches(items, size) {
	const out = [];
	for (let i = 0; i < items.length; i += size) {
		out.push(items.slice(i, i + size));
	}
	return out;
}

async function main() {
	const armory = await fetchJson(`${API_BASE}/legendaryarmory?ids=all`);
	if (!Array.isArray(armory)) {
		throw new Error('Unexpected /legendaryarmory response shape');
	}

	const ids = armory
		.map((x) => Number(x.id))
		.filter((id) => Number.isFinite(id) && id > 0);

	const itemDetails = [];
	for (const batch of inBatches(ids, BATCH_SIZE)) {
		const url = `${API_BASE}/items?ids=${batch.join(',')}`;
		const chunk = await fetchJson(url);
		if (Array.isArray(chunk)) {
			itemDetails.push(...chunk);
		}
	}

	const byId = new Map(itemDetails.map((x) => [Number(x.id), x]));

	const merged = armory
		.map((entry) => ({
			id: Number(entry.id),
			max_count: Number(entry.max_count),
			...(byId.get(Number(entry.id)) || {}),
		}))
		.sort((a, b) => a.id - b.id);

	const outFile = path.resolve('legendaries_all.json');
	await fs.writeFile(outFile, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

	console.log(`Saved ${merged.length} legendary entries to ${outFile}`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
