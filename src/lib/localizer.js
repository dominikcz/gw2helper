import { writable, derived } from 'svelte/store'
// import { lang } from '$lib/stores/lang';
import utils from './utils';
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
    #lang = 'en';
    lang$ = writable(this.#lang);
    _$ = derived(this.lang$, $lang => (message, values = {}) => this._(this.lang, message, values));

    constructor() {
    }

    async init(options) {
        const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray;
        if (wxjs_types.isObject(options)) {
            this.#options = deepmerge(this.#options, options, { arrayMerge: overwriteMerge });
        }
        this.#lang = utils.readLang(this.#options.defaultLocale);
        console.log('llzr.init', this.#options, this.#lang)

        await this.loadLocale(this.#lang);
    }

    get lang() {
        console.log('get lang', this.#lang)
        return this.#lang;
    }

    set lang(value) {
        if (this.#lang != value) {
            this.#lang = value;
            utils.saveLang(value);
            console.log('switching lang', this.#lang);
            if (this.lang$ !== undefined) {
                this.lang$.set(this.#lang)
            }
            // this.loadLocale();	
        }
    }

    async changeLocale(lang) {
        console.log('changing locale', lang)
        await this.loadLocale(lang);
        this.lang = lang;
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

    // registerDefaultNamespaces(namespaces) {
    //     if (!namespaces) return;
    //     if (!Array.isArray(namespaces)) {
    //         throw new Error("`namespace` should be an array of strings");
    //     }
    //     this.#options.defaultNamespaces = namespaces;
    // }

    addMessages(locale, messages) {
        let old = this.#messages.get(locale) || {};
        this.#messages.set(locale, deepmerge(old, this.#flattenObject(messages)))
    }

    // #getNestedProp(obj, path) {
    //     return path.split('.').reduce((acc, part) => acc && acc[part], obj)
    // }

    getLocalePaths(locale, path) {
        const keys = [];
        const key = this.getKeyFromPath(path);
        const test = [...this.#options.defaultNamespaces, key];

        test.forEach((key) => {
            if (!this.#namespacesCache.includes(`${locale}-${key}`)) {
                keys.push(key);
            }
        });
        return keys;
    }

    async loadLocale(locale, path = null) {
        if (browser) {
            path ??= window.location.pathname;
            const keys = this.getLocalePaths(locale, path);
            const tasks = [];

            console.log('loadLocale', locale, keys)
            keys.forEach(key => {
                if (key) {
                    // tasks.push(import(/* @vite-ignore */ key.path, { with: { type: "json" } }).then(data => {
                    const opt = this.#options;
                    if (opt.loaders[locale] == undefined) {
                        opt.loaders[locale] = {}
                    }
                    let loader = opt.loaders[locale][key];
                    let importPath = '';
                    if (!loader) {
                        importPath = `${opt.localePath}/${opt.pathMatcher}`
                            .replace('{locale}', locale)
                            .replace('{namespace}', key);
                        loader = () => import(/* @vite-ignore */ importPath);
                        opt.loaders[locale][key] = loader;
                    }
                    tasks.push(loader().then(data => {
                        const obj = {};
                        obj[key] = data;
                        this.addMessages(locale, obj);
                        this.#namespacesCache.push(key);
                        console.log('loaded locale', key, locale, importPath, obj)
                    }));
                }
            });

            await Promise.all(tasks);
            console.log('locale finished', tasks.length)
        }
    }

    _(locale, message, values = {}) {
        const opt = this.#options;
        if (!locale) {
            locale = this.#lang;
            console.log('locale not provided, using default...', locale)
        }
        let loc = this.#messages.get(locale);
        if (!loc) {
            console.log('messages not defined for', locale, message)
            if (opt.fallbackLocale != locale) {
                loc = this.#messages.get(opt.fallbackLocale);
                console.log('using fallback locale', opt.fallbackLocale)
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

    __(message, values) {
        return this._(this.#lang, message, values);
    }
}

const llzr = new Localizer();

export const _ = llzr._$;

export function __(locale, message, values = {}) {
    return llzr._(locale, message, values);
}

export default llzr;
