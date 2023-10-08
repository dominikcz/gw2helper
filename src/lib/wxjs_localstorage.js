import wxtypes from '$lib/wxjs_types';

export default {
    get: function(key, defValue){
        let val = window.localStorage.getItem(key);
        if (val === null && defValue !== undefined){
            val = defValue;
        }
        // console.log('wxls get', key, val);
        return val;
    },
    getObject: function(key, defValue){
        let val = JSON.parse(window.localStorage.getItem(key));
        if (val === null && defValue !== undefined){
            val = defValue;
        }
        // console.log('wxls getObject', key, val);
        return val;
    },
    set: function(key, value){
        if (wxtypes.isObjectOrArray(value)){
            value = JSON.stringify(value);
        }
        // console.log('wxls set', key, value);
        window.localStorage.setItem(key, value);
    },
    delete: function(key){
        window.localStorage.removeItem(key);
    }
}