//for future use?
import utils from '$lib/utils';

export default class ToDoList {
    private _todos = $state<number[]>([]);

    constructor() {
        utils.readAchievementsToDo().then(v => {
            this._todos = v;
        });
    }

    get todos(){
        return this._todos;
    } 
}
