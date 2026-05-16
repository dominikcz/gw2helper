import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const RECIPE_BUCKET_SIZE = 2000;

function bucketStartForId(itemId) {
	return Math.floor(Number(itemId) / RECIPE_BUCKET_SIZE) * RECIPE_BUCKET_SIZE;
}

function bucketPath(recipesDir, bucketStart) {
	return path.join(recipesDir, 'buckets', `${bucketStart}.json`);
}

function createEmptyBucket(bucketStart) {
	return {
		version: 1,
		bucketSize: RECIPE_BUCKET_SIZE,
		bucketStart,
		recipesByItemId: {},
	};
}

const bucketCache = new Map();

/**
 * Reads a bucket for itemId and returns mutable object.
 * Cached in-memory per process to avoid repeated disk reads.
 */
export async function readRecipeBucket(recipesDir, itemId) {
	const bucketStart = bucketStartForId(itemId);
	const p = bucketPath(recipesDir, bucketStart);
	if (bucketCache.has(p)) return bucketCache.get(p);

	if (!existsSync(p)) {
		const empty = createEmptyBucket(bucketStart);
		bucketCache.set(p, empty);
		return empty;
	}

	try {
		const parsed = JSON.parse(await fs.readFile(p, 'utf-8'));
		const normalized = {
			version: 1,
			bucketSize: RECIPE_BUCKET_SIZE,
			bucketStart,
			recipesByItemId:
				parsed && typeof parsed === 'object' && parsed.recipesByItemId && typeof parsed.recipesByItemId === 'object'
					? parsed.recipesByItemId
					: {},
		};
		bucketCache.set(p, normalized);
		return normalized;
	} catch {
		const empty = createEmptyBucket(bucketStart);
		bucketCache.set(p, empty);
		return empty;
	}
}

export async function readRecipeEntries(recipesDir, itemId) {
	const bucket = await readRecipeBucket(recipesDir, itemId);
	const entries = bucket.recipesByItemId[String(itemId)];
	return Array.isArray(entries) ? entries : [];
}

export async function writeRecipeEntries(recipesDir, itemId, entries) {
	const bucketStart = bucketStartForId(itemId);
	const p = bucketPath(recipesDir, bucketStart);
	const bucket = await readRecipeBucket(recipesDir, itemId);
	bucket.recipesByItemId[String(itemId)] = entries;
	await fs.mkdir(path.dirname(p), { recursive: true });
	await fs.writeFile(p, JSON.stringify(bucket), 'utf-8');
}

export async function listRecipeBucketFiles(recipesDir) {
	const dir = path.join(recipesDir, 'buckets');
	if (!existsSync(dir)) return [];
	const files = await fs.readdir(dir);
	return files
		.filter((name) => name.endsWith('.json'))
		.map((name) => path.join(dir, name));
}
