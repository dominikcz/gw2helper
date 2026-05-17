import { beforeEach, describe, expect, it, vi } from 'vitest';

const readAchievementsToDo = vi.fn<() => Promise<number[]>>();
const saveAchievementsToDo = vi.fn<(list: number[]) => Promise<void>>();

vi.mock('$lib/utils', () => ({
	default: {
		readAchievementsToDo,
		saveAchievementsToDo,
	},
}));

async function loadTodoList() {
	const mod = await import('$lib/services/todoList.svelte');
	return mod.default;
}

describe('todoList service', () => {
	beforeEach(() => {
		vi.resetModules();
		readAchievementsToDo.mockReset();
		saveAchievementsToDo.mockReset();
		readAchievementsToDo.mockResolvedValue([]);
		saveAchievementsToDo.mockResolvedValue();
	});

	it('initializes from storage and normalizes ids', async () => {
		readAchievementsToDo.mockResolvedValue([3, 1, 3, 0, -1, Number.NaN, 2]);
		const todoList = await loadTodoList();

		await todoList.init();

		expect(readAchievementsToDo).toHaveBeenCalledTimes(1);
		expect(todoList.loaded).toBe(true);
		expect(todoList.todos).toEqual([3, 1, 2]);
	});

	it('uses provided seed and skips storage read', async () => {
		const todoList = await loadTodoList();

		await todoList.init(Promise.resolve([7, 7, 9]));

		expect(readAchievementsToDo).not.toHaveBeenCalled();
		expect(todoList.todos).toEqual([7, 9]);
	});

	it('does not reinitialize after first init', async () => {
		const todoList = await loadTodoList();

		await todoList.init([1, 2]);
		await todoList.init([9, 10]);

		expect(todoList.todos).toEqual([1, 2]);
	});

	it('adds todo id without duplicates and persists changes', async () => {
		const todoList = await loadTodoList();
		await todoList.init([1]);

		await todoList.toggle({ id: 2, todo: true });
		await todoList.toggle({ id: 2, todo: true });

		expect(todoList.todos).toEqual([1, 2]);
		expect(saveAchievementsToDo).toHaveBeenNthCalledWith(1, [1, 2]);
		expect(saveAchievementsToDo).toHaveBeenNthCalledWith(2, [1, 2]);
	});

	it('removes todo id and persists updated list', async () => {
		const todoList = await loadTodoList();
		await todoList.init([1, 2, 3]);

		await todoList.toggle({ id: 2, todo: false });

		expect(todoList.todos).toEqual([1, 3]);
		expect(saveAchievementsToDo).toHaveBeenCalledWith([1, 3]);
	});

	it('ignores invalid ids and does not persist', async () => {
		const todoList = await loadTodoList();
		await todoList.init([1]);

		await todoList.toggle({ id: 0, todo: true });
		await todoList.toggle({ id: Number.NaN, todo: true });

		expect(todoList.todos).toEqual([1]);
		expect(saveAchievementsToDo).not.toHaveBeenCalled();
	});

	it('reports todo presence via has()', async () => {
		const todoList = await loadTodoList();
		await todoList.init([4, 5]);

		expect(todoList.has(4)).toBe(true);
		expect(todoList.has(99)).toBe(false);
	});
});
