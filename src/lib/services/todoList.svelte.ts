import utils from '$lib/utils';

type TodoToggleEvent = { id: number; todo: boolean };
type TodoMoveEvent = { id: number; direction: -1 | 1 };
type TodoReorderEvent = { sourceId: number; targetId: number };

class ToDoList {
    private _todos = $state<number[]>([]);
    private _loaded = $state(false);
    private _loadingPromise: Promise<void> | null = null;

    async init(seed?: number[] | Promise<number[]>): Promise<void> {
        if (this._loaded) {
            return;
        }
        if (this._loadingPromise) {
            return this._loadingPromise;
        }

        this._loadingPromise = (async () => {
            const list = seed ? await seed : await utils.readAchievementsToDo();
            this._todos = [...new Set((list || []).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0))];
            this._loaded = true;
        })();

        try {
            await this._loadingPromise;
        } finally {
            this._loadingPromise = null;
        }
    }

    get todos() {
        return this._todos;
    }

    get loaded() {
        return this._loaded;
    }

    has(id: number): boolean {
        return this._todos.includes(id);
    }

    async toggle(event: TodoToggleEvent): Promise<void> {
        const id = Number(event.id);
        if (!Number.isFinite(id) || id <= 0) {
            return;
        }

        if (event.todo) {
            if (!this._todos.includes(id)) {
                this._todos.push(id);
            }
        } else {
            this._todos = this._todos.filter((x) => x !== id);
        }

        await utils.saveAchievementsToDo([...this._todos]);
    }

    async move(event: TodoMoveEvent): Promise<void> {
        const id = Number(event.id);
        if (!Number.isFinite(id) || id <= 0 || ![-1, 1].includes(event.direction)) {
            return;
        }

        const index = this._todos.indexOf(id);
        if (index === -1) {
            return;
        }

        const nextIndex = index + event.direction;
        if (nextIndex < 0 || nextIndex >= this._todos.length) {
            return;
        }

        const next = [...this._todos];
        [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
        this._todos = next;
        await utils.saveAchievementsToDo([...this._todos]);
    }

    async reorder(event: TodoReorderEvent): Promise<void> {
        const sourceId = Number(event.sourceId);
        const targetId = Number(event.targetId);
        if (!Number.isFinite(sourceId) || !Number.isFinite(targetId) || sourceId <= 0 || targetId <= 0 || sourceId === targetId) {
            return;
        }

        const sourceIndex = this._todos.indexOf(sourceId);
        const targetIndex = this._todos.indexOf(targetId);
        if (sourceIndex === -1 || targetIndex === -1) {
            return;
        }

        const next = [...this._todos];
        next.splice(sourceIndex, 1);
        const insertAt = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        next.splice(insertAt, 0, sourceId);
        this._todos = next;
        await utils.saveAchievementsToDo([...this._todos]);
    }

    async reorderByList(order: number[]): Promise<void> {
        const requested = [...new Set((order || []).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0))];
        if (!requested.length) {
            return;
        }

        const requestedSet = new Set(requested);
        const positions = this._todos
            .map((id, index) => (requestedSet.has(id) ? index : -1))
            .filter((index) => index >= 0);

        if (positions.length !== requested.length) {
            return;
        }

        const next = [...this._todos];
        positions.forEach((position, index) => {
            next[position] = requested[index];
        });

        this._todos = next;
        await utils.saveAchievementsToDo([...this._todos]);
    }
}

const todoList = new ToDoList();

export default todoList;
