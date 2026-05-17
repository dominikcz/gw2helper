import { describe, expect, it } from 'vitest';
import { hndToggleTodo } from '$lib/utils';

describe('hndToggleTodo', () => {
    it('adds achievement id when todo is enabled', async () => {
        const todoList = [1, 3];

        await hndToggleTodo({ id: 7, todo: true }, todoList);

        expect(todoList).toEqual([1, 3, 7]);
    });

    it('does not add duplicate achievement id', async () => {
        const todoList = [1, 3, 7];

        await hndToggleTodo({ id: 7, todo: true }, todoList);

        expect(todoList).toEqual([1, 3, 7]);
    });

    it('removes all occurrences of achievement id when todo is disabled', async () => {
        const todoList = [1, 7, 3, 7];

        await hndToggleTodo({ id: 7, todo: false }, todoList);

        expect(todoList).toEqual([1, 3]);
    });

    it('keeps list unchanged when disabling id not present in todo list', async () => {
        const todoList = [1, 3];

        await hndToggleTodo({ id: 999, todo: false }, todoList);

        expect(todoList).toEqual([1, 3]);
    });
});
