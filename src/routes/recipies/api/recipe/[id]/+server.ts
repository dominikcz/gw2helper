import { json } from '@sveltejs/kit';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../../../../');
const RECIPES_DIR = path.join(PROJECT_ROOT, 'static/data/recipies');

function getRecipePath(id: number, baseDir: string): string {
	const digits = String(id).split('');
	return path.join(baseDir, ...digits, `${id}.json`);
}

export async function GET({ params }: { params: { id: string } }) {
	const id = parseInt(params.id, 10);
	if (!Number.isInteger(id) || id <= 0) {
		return json({ error: 'Invalid id' }, { status: 400 });
	}

	const filePath = getRecipePath(id, RECIPES_DIR);
	if (!existsSync(filePath)) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	const content = readFileSync(filePath, 'utf-8');
	return new Response(content, { headers: { 'Content-Type': 'application/json' } });
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

	const filePath = getRecipePath(id, RECIPES_DIR);
	mkdirSync(path.dirname(filePath), { recursive: true });
	writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf-8');

	return json({ ok: true });
}
