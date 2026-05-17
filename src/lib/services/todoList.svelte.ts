import utils from '$lib/utils';

type TodoToggleEvent = { id: number; todo: boolean };

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
}

const todoList = new ToDoList();

export default todoList;
