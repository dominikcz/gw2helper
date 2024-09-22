import { writable } from 'svelte/store'
import deepmerge from 'deepmerge';
import { IntlMessageFormat } from 'intl-messageformat';
import wxjs_types from './wxjs_types';
import { browser } from '$app/environment';
import { base } from '$app/paths';

const DEF_LOCALIZER_OPTIONS = {
    defaultLocale: 'en',
    fallbackLocale: 'en',
    homeKey: 'home',
    localeFileFormat: 'json',
    localePath: './locales',
    pathMatcher: '{locale}/{namespace}.json',
    defaultNamespaces: ['layout'],
    loaders: {
    }
}

class Localizer {
    #messages = new Map();
    #namespacesCache = [];
    #options = DEF_LOCALIZER_OPTIONS;

    constructor() {
    }

    init(options) {
        if (wxjs_types.isObject(options)) {
            this.#options = deepmerge(this.#options, options);
        }
        this.loadLocale(this.#options.defaultLocale);
    }

    changeLocale(lang) {
        this.#options.defaultLocale = lang;
        this.#namespacesCache = [];
    }

    getKeyFromPath(path) {
        let key = path.replace(base, '');
        if (key.startsWith('/')) {
            key = key.slice(1);
        }
        if (key.endsWith('/')) {
            key = key.slice(0, key.length - 1)
        }
        if (key == '') {
            key = this.#options.homeKey;
        }
        return key;
    }

    #flattenObject(object) {
        const result = {}
        const returnFlatenObject = (obj, parentKey = '') => {
            for (const key in obj) {
                const newParent = parentKey + key
                const value = obj[key]
                if (typeof value === 'object') {
                    returnFlatenObject(value, newParent + '.')
                } else {
                    result[newParent] = value
                }
            }
        }
        returnFlatenObject(object)
        return result
    }

    registerDefaultNamespaces(namespaces) {
        if (!namespaces) return;
        if (!Array.isArray(namespaces)) {
            throw new Error("`namespace` should be an array of strings");
        }
        this.#options.defaultNamespaces = namespaces;
    }

    addMessages(locale, messages) {
        let old = this.#messages.get(locale) || {};
        this.#messages.set(locale, deepmerge(old, this.#flattenObject(messages)))
    }

    // #getNestedProp(obj, path) {
    //     return path.split('.').reduce((acc, part) => acc && acc[part], obj)
    // }

    getLocalePaths(path) {
        const keys = [];
        const key = this.getKeyFromPath(path);
        const test = [...this.#options.defaultNamespaces, key];

        test.forEach((key) => {
            if (!this.#namespacesCache.includes(key)) {
                keys.push(key);
            }
        });
        return keys;
    }

    async loadLocale(locale, path = null) {
        if (browser) {
            path ??= window.location.pathname;
            const keys = this.getLocalePaths(path);
            const tasks = [];

            keys.forEach(key => {
                if (key) {
                    // tasks.push(import(/* @vite-ignore */ key.path, { with: { type: "json" } }).then(data => {
                    const opt = this.#options;
                    let loader = opt.loaders[key];
                    let importPath                    ;
                    if (!loader) {
                        importPath = `${opt.localePath}/${opt.pathMatcher}`
                            .replace('{locale}', locale)
                            .replace('{namespace}', key);
                        loader = () => import(/* @vite-ignore */ importPath);
                    }
                    loader().then(data => {
                        const obj = {};
                        obj[key] = data;
                        this.addMessages(locale, obj);
                        this.#namespacesCache.push(key);
                        console.log('loaded locale', key, locale, importPath)
                    });
                }
            });

            await Promise.all(tasks);
            console.log('locale finished')
        }
    }

    _(locale, message, values = {}) {
        if (!locale) {
            locale = this.#options.defaultLocale;
            console.log('locale not provided, using default...')
        }
        let loc = this.#messages.get(locale);
        if (!loc) {
            if (this.#options.fallbackLocale != locale) {
                loc = this.#messages.get(this.#options.fallbackLocale);
            }
            if (!loc) return message;
        }
        const msg = loc[message];
        if (!msg) return message;
        let f;
        if (typeof msg == 'string') {
            f = new IntlMessageFormat(msg, locale, {}, { ignoreTag: true });
            loc[message] = f;
        } else {
            f = msg;
        }
        return f.format(values);
    }


}

const llzr = new Localizer();

export function _(locale, message, values = {}){
    return llzr._(locale, message, values);
}

export default llzr;
