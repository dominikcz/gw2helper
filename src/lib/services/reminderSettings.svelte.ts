import utils from '$lib/utils';

const DEF_SOUND = 'trumpet';
const DEF_IN_ADVANCE = 5;
const DEF_SORT_BY = 'time';

export default class ReminderSettings {
    private _inAdvance: number = $state(DEF_IN_ADVANCE);
    private _sound: string = $state(DEF_SOUND);
    private _sortBy: string = $state(DEF_SORT_BY);
    private autoSave: boolean;

    constructor(autoSave: boolean = false) {
        utils.readRemindersSettings().then(v => {
            this._inAdvance = v.inAdvance || DEF_IN_ADVANCE;
            this._sound = v.sound || DEF_SOUND;
            this._sortBy = v.sortBy || DEF_SORT_BY;
        });
        this.autoSave = autoSave;
    }

    private save(){
        utils.saveRemindersSettings({
            inAdvance: this.inAdvance,
            sound: this.sound,
        });
    }

    get inAdvance() {
        return this._inAdvance;
    }

    set inAdvance(value) {
        this._inAdvance = value;
        if (this.autoSave) {
            this.save();
        }
    }

    get sortBy() {
        return this._sortBy;
    }

    set sortBy(value) {
        this._sortBy = value;
        if (this.autoSave) {
            this.save();
        }
    }

    get sound() {
        return this._sound;
    }

    set sound(value) {
        this._sound = value;
        if (this.autoSave) {
            this.save();
        }
    }

}
