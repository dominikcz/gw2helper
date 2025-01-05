import utils from '$lib/utils';

const DEF_SOUND = 'trumpet';
const DEF_IN_ADVANCE = 5;

export default class ReminderSettings {
    private _inAdvance: number = $state(DEF_IN_ADVANCE);
    private _sound: string = $state(DEF_SOUND);
    private autoSave: boolean;

    constructor(autoSave: boolean = false) {
        utils.readRemindersSettings().then(v => {
            this._inAdvance = v.inAdvance || DEF_IN_ADVANCE;
            this._sound = v.sound || DEF_SOUND;
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
