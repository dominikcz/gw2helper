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

	it('moves item up/down and persists ordered list', async () => {
		const todoList = await loadTodoList();
		await todoList.init([10, 20, 30]);

		await todoList.move({ id: 20, direction: -1 });
		expect(todoList.todos).toEqual([20, 10, 30]);
		expect(saveAchievementsToDo).toHaveBeenNthCalledWith(1, [20, 10, 30]);

		await todoList.move({ id: 20, direction: 1 });
		expect(todoList.todos).toEqual([10, 20, 30]);
		expect(saveAchievementsToDo).toHaveBeenNthCalledWith(2, [10, 20, 30]);
	});

	it('ignores move when item is missing or out of bounds', async () => {
		const todoList = await loadTodoList();
		await todoList.init([10, 20]);

		await todoList.move({ id: 10, direction: -1 });
		await todoList.move({ id: 20, direction: 1 });
		await todoList.move({ id: 999, direction: 1 });

		expect(todoList.todos).toEqual([10, 20]);
		expect(saveAchievementsToDo).not.toHaveBeenCalled();
	});

	it('reorders items by source and target id and persists', async () => {
		const todoList = await loadTodoList();
		await todoList.init([10, 20, 30, 40]);

		await todoList.reorder({ sourceId: 40, targetId: 20 });

		expect(todoList.todos).toEqual([10, 40, 20, 30]);
		expect(saveAchievementsToDo).toHaveBeenCalledWith([10, 40, 20, 30]);
	});

	it('ignores invalid reorder operations', async () => {
		const todoList = await loadTodoList();
		await todoList.init([10, 20, 30]);

		await todoList.reorder({ sourceId: 10, targetId: 10 });
		await todoList.reorder({ sourceId: 999, targetId: 20 });
		await todoList.reorder({ sourceId: 10, targetId: 999 });

		expect(todoList.todos).toEqual([10, 20, 30]);
		expect(saveAchievementsToDo).not.toHaveBeenCalled();
	});

	it('reorders only visible subset via reorderByList while preserving hidden positions', async () => {
		const todoList = await loadTodoList();
		await todoList.init([10, 20, 30, 40, 50]);

		await todoList.reorderByList([40, 10, 50]);

		expect(todoList.todos).toEqual([40, 20, 30, 10, 50]);
		expect(saveAchievementsToDo).toHaveBeenCalledWith([40, 20, 30, 10, 50]);
	});

	it('ignores reorderByList when some ids are outside todo list', async () => {
		const todoList = await loadTodoList();
		await todoList.init([10, 20, 30]);

		await todoList.reorderByList([30, 999, 10]);

		expect(todoList.todos).toEqual([10, 20, 30]);
		expect(saveAchievementsToDo).not.toHaveBeenCalled();
	});
});
