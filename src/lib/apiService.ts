import Logger from "./logger";

const apiUrl = "https://api.guildwars2.com";
const CACHE_TIMEOUT = 15 * 60;

interface CacheEntry {
    time: Date;
    timeout: number;
    data: object;
}

const cache = new Map<string, CacheEntry>();

let _apiKey = "";
let fetchOptions = {
    method: "GET",
    baseURL: apiUrl,
    timeout: 10000,
    expectJson: true,
    onError({ request, error, options }) {
        Logger.error(`apiClient response error ${error.code}: ${error.message} \n req: ${JSON.stringify(request)}, options: ${JSON.stringify(options)}`);
    },
    fetchFunction: fetch,
    debug: false,
};

const notifyOnError = (req, error, options) => {
    if (fetchOptions.onError) {
        fetchOptions.onError(req, error, options);
    }
};

const secondsBetween = (d1: Date, d2: Date): number => {
    const diff = Math.round(Math.abs(d1.getTime() - d2.getTime()) / 1000);
    console.log(diff);
    return diff;
};

const tryCache = (req: string): object | undefined => {
    if (cache.has(req)) {
        let info = cache.get(req);
        if (secondsBetween(info!.time, new Date()) < CACHE_TIMEOUT) {
            return info!.data;
        }
    }
    return undefined;
};

const apiClient = async (req: string | RequestInfo, query: string, options?: object) => {
    const origReq = req;
    let cachedValue = tryCache(origReq);
    Logger.log(`cached value for ${origReq}`, cachedValue);
    if (cachedValue !== undefined) {
        Logger.log("cache is valid");
        return cachedValue;
    } else {
        Logger.log("cache is INVALID, refreshing...");

        const _options = Object.assign({}, fetchOptions, options);
        if (typeof req == "string") {
            req = _options.baseURL + req;
        }

        if (_options.debug) {
            Logger.log(`req: ${req}, options: `, _options);
        }
        const response = await _options.fetchFunction(`${req}?access_token=${_apiKey}${query ? "&" : ""}${query}`, _options);
        if (!response.ok) {
            console.warn("error", response);
            notifyOnError(req, new Error(`HTTP error, status = ${response.status}`), _options);
        } else {
            let data;
            if (_options.expectJson) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            if (_options.transform) {
                data = _options.transform(data);
            }
            cachedValue = data;
            cache.set(origReq, {
                time: new Date(),
                data: cachedValue,
            });
            Logger.log(`cache for ${origReq} updated`, cachedValue);
        }
    }
    return cachedValue;
};

const characters = async () => {
    return apiClient("/v2/characters", "ids=all");
};

const items = (x: string) => {
    return apiClient("/v2/items", "ids="+x);
};

const sharedInventory = async () => {
    return apiClient("/v2/account/inventory", "");
};

const bank = async () => {
	// bank zwraca nulle w miejscach, gdzie jest pusto, a my ich nie chcemy
    const rawData = await apiClient("/v2/account/bank", "", {transform: (data) =>{
		return data.filter(x => x != null)
	}});
	const ids = rawData.map(x => x.id);
	return expandItems(ids, rawData);
};

const init = (apiKey: string, options?: object) => {
    Logger.log("init", apiKey);
    _apiKey = apiKey;
    fetchOptions = Object.assign({}, fetchOptions, options);
};

const expandItems = async (ids: Array<number>, collection) => {
	const batches = [];
	do {
		let batch = ids.splice(0, 200);	
		if (batch.length > 0) {
			batches.push(batch.join(','))
		}
	} while (ids.length > 0);
	if (batches.length) {
		const tasks = batches.map(x => items(x));
		const resp = (await Promise.all(tasks)).flat();
		return resp.map(t1 => ({...t1, ...collection.find(t2 => t2.id === t1.id)}))
	}
	return null;
}

const getItems = () => {
    return Promise.all([characters(), sharedInventory(), bank()]).then((resp) => {
        items.characters = resp[0].data.map((val) => {
            return { __name: val };
        });
        items.shared = resp[1].data;
        items.bank = resp[2].data;
        const calls = [];
        items.characters.forEach((char) => {
            console.log("checking " + char.__name);
            calls.push(getCharacterEquipment(char.__name));
            calls.push(getCharacterInventory(char.__name));
        });
        Promise.all(calls)
            .then((resp) => {
                let idx = 0;
                items.characters.forEach((char) => {
                    char["__equipment"] = resp[2 * idx].data["equipment"];
                    char["__inventory"] = resp[2 * idx + 1].data["bags"];
                    idx++;
                    console.log("char_equip", char);
                    char["__equipment"].forEach((equip) => expandItemDef(equip.id, char["__equipment"]));
                    char["__inventory"].forEach((inv) => expandItemDef(inv.id, char["__inventory"]));
                });
                items.shared.forEach((item) => expandItemDef(item.id, items.shared));
                return Promise.resolve(items);
            })
            .catch((error) => {
                console.error(error);
            });
    });
};

export default {
    init,
    characters,
	sharedInventory,
    bank,
	items,
};
