import ls from "$lib/wxjs_localstorage";
import {KEY_NAME} from "$lib/consts";

function readApiKey(){
    return ls.get(KEY_NAME, '');
}

function saveApiKey(value){
    return ls.set(KEY_NAME, value)    
}

function deleteApiKey(){
    ls.delete(KEY_NAME)
}

export default {
    readApiKey,
    saveApiKey,
    deleteApiKey,
}
