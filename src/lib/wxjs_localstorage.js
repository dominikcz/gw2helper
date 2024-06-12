import wxtypes from '$lib/wxjs_types';

const ls = typeof window != 'undefined' ? window.localStorage : { getItem: (key) => { return null}, setItem: (key, value) => {return null}, removeItem: (key) => {return null} }; 

export default {
    get: function(key, defValue){
        let val = ls.getItem(key);
        if (val === null && defValue !== undefined){
            val = defValue;
        }
        // console.log('wxls get', key, val);
        return val;
    },
    getObject: function(key, defValue){
        let val = JSON.parse(ls.getItem(key));
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
        ls.setItem(key, value);
    },
    delete: function(key){
        ls.removeItem(key);
    }
}