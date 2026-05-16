import { json } from '@sveltejs/kit';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../../../../');
const RECIPES_DIR = path.join(PROJECT_ROOT, 'static/data/recipies');
const RECIPES_BUCKETS_DIR = path.join(RECIPES_DIR, 'buckets');
const BUCKET_SIZE = 2000;

type RecipeBucket = {
	version: 1;
	bucketSize: number;
	bucketStart: number;
	recipesByItemId: Record<string, unknown[]>;
};

function getBucketStart(id: number): number {
	return Math.floor(id / BUCKET_SIZE) * BUCKET_SIZE;
}

function getBucketPath(id: number): string {
	return path.join(RECIPES_BUCKETS_DIR, `${getBucketStart(id)}.json`);
}

function createEmptyBucket(bucketStart: number): RecipeBucket {
	return {
		version: 1,
		bucketSize: BUCKET_SIZE,
		bucketStart,
		recipesByItemId: {},
	};
}

function readBucket(id: number): RecipeBucket {
	const bucketStart = getBucketStart(id);
	const bucketPath = getBucketPath(id);
	if (!existsSync(bucketPath)) return createEmptyBucket(bucketStart);

	try {
		const parsed = JSON.parse(readFileSync(bucketPath, 'utf-8')) as Partial<RecipeBucket>;
		if (!parsed || typeof parsed !== 'object') return createEmptyBucket(bucketStart);
		const recipesByItemId =
			parsed.recipesByItemId && typeof parsed.recipesByItemId === 'object'
				? parsed.recipesByItemId
				: {};
		return {
			version: 1,
			bucketSize: BUCKET_SIZE,
			bucketStart,
			recipesByItemId,
		};
	} catch {
		return createEmptyBucket(bucketStart);
	}
}

function writeBucket(id: number, bucket: RecipeBucket): void {
	const bucketPath = getBucketPath(id);
	mkdirSync(path.dirname(bucketPath), { recursive: true });
	writeFileSync(bucketPath, JSON.stringify(bucket), 'utf-8');
}

export async function GET({ params }: { params: { id: string } }) {
	const id = parseInt(params.id, 10);
	if (!Number.isInteger(id) || id <= 0) {
		return json({ error: 'Invalid id' }, { status: 400 });
	}

	const bucket = readBucket(id);
	const entries = bucket.recipesByItemId[String(id)];
	if (!Array.isArray(entries) || !entries.length) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	return json(entries);
}

export async function PUT({ params, request }: { params: { id: string }; request: Request }) {
	const id = parseInt(params.id, 10);
	if (!Number.isInteger(id) || id <= 0) {
		return json({ error: 'Invalid id' }, { status: 400 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	if (!Array.isArray(body)) {
		return json({ error: 'Body must be an array' }, { status: 400 });
	}

	for (const item of body) {
		if (
			typeof item !== 'object' ||
			item === null ||
			(item as Record<string, unknown>).output_item_id !== id
		) {
			return json(
				{ error: `Each element must have output_item_id === ${id}` },
				{ status: 400 }
			);
		}
	}

	const bucket = readBucket(id);
	bucket.recipesByItemId[String(id)] = body as unknown[];
	writeBucket(id, bucket);

	return json({ ok: true });
}
