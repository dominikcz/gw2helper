import ls from "$lib/wxjs_localstorage";

const keyName = 'dominikcz/gw2helper.apiKey';

function readApiKey(){
    return ls.get(keyName, '');
}

function saveApiKey(value){
    return ls.set(keyName, value)    
}

function deleteApiKey(){
    ls.delete(keyName)
}

export default {
    readApiKey,
    saveApiKey,
    deleteApiKey
}
