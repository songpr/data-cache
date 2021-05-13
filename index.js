const util = require('util');

/**
 * Data cache that do not have set method, fetch cached via fetch function 
 */
class DataCache {
    /**
     * 
     * @param {Function} fetch - function/async function to fetch all data and return as array of [key,value]/ a Iterator object that contains the [key, value] pairs 
     * @param {Object} options - options(maxAge, refreshAge ,resetOnRefresh = true,fetchMissCache,max)
     *                              maxAge - seconds before cache are expired and return undefined, default = 600s,
     *                              refreshAge - seconds before fetch new values, default = maxAge,
     *                              resetOnRefresh - true reset all cached data and replace with the new fetched data, false replace values with same keys from the new fetched data, default = true,
     *                              fetchMissCache - true fecth miss cache with fetch(key) - fetch function must support get individual data by key, where key is the key that no cache data, false do not fetch miss cache. always = false - Not implemented yet.
     *                              max - max of cache items, default = 10000.
     */
    constructor(fetch, options = { maxAge: 600, resetOnRefresh: true, fetchMissCache: false, max: 10000 }) {
        if (typeof (fetch) !== "function") throw new Error("fetch must be function/async function");
        Object.defineProperty(this, "_fetch", { value: fetch, configurable: false, enumerable: false });
        const _isAsyncFetch = util.types.isAsyncFunction(fetch);
        Object.defineProperty(this, "_isAsyncFetch", { get: () => _isAsyncFetch, configurable: false, enumerable: false });
        const maxAge = options.maxAge || 600;
        if (!Number.isInteger(maxAge)) throw new Error("Invalid maxAge");
        const refreshAge = options.refreshAge || maxAge;
        if (!Number.isInteger(refreshAge)) throw new Error("Invalid refreshAge");
        const resetOnRefresh = options.resetOnRefresh === undefined ? true : options.resetOnRefresh;
        if (typeof (resetOnRefresh) !== "boolean") throw new Error("Invalid resetOnRefresh");
        const fetchMissCache = options.fetchMissCache === undefined ? false : options.fetchMissCache;
        if (typeof (fetchMissCache) !== "boolean") throw new Error("Invalid fetchMissCache");
        const max = options.max || 10000;
        if (!Number.isInteger(max)) throw new Error("Invalid max");
        Object.defineProperty(this, "maxAge", { get: () => maxAge, configurable: false, enumerable: true });
        Object.defineProperty(this, "refreshAge", { get: () => refreshAge, configurable: false, enumerable: true });
        Object.defineProperty(this, "resetOnRefresh", { get: () => resetOnRefresh, configurable: false, enumerable: true });
        Object.defineProperty(this, "fetchMissCache", { get: () => false, configurable: false, enumerable: true });//always false. TODO
        Object.defineProperty(this, "max", { get: () => max, configurable: false, enumerable: true });
        const _lruCache = new (require("lru-cache"))({ max: max, maxAge: maxAge * 1000 })
        Object.defineProperty(this, "_cache", { get: () => _lruCache, configurable: false, enumerable: false });
        Object.defineProperty(this, "size", { get: () => _lruCache.itemCount, configurable: false, enumerable: true });
        const dataCache = this;
        Object.defineProperty(this, "_timeoutLoop", {
            value: (asyncRefresh, time) => {
                setTimeout(function () {
                    asyncRefresh().then(() => {
                        //if pass then timeoutLoop for the next refresh
                        if (dataCache.isClose === true) {
                            return;
                        }
                        //cache is not close then set timeout loop again
                        dataCache._timeoutLoop(asyncRefresh, time);
                    }).catch(err => { console.log(err.stack) });
                }, time)
            }
            , configurable: false, enumerable: false
        });
    }

    async init() {
        const data = this._isAsyncFetch ? await this._fetch() : this._fetch();
        if (!(Symbol.iterator in Object(data))) throw new Error("fetch return non iterable data");
        for (const [key, value] of data) {
            if (this.size >= this.max) break;
            this._cache.set(key, value);
        }
        const asyncRefresh = async () => {
            const data = this._isAsyncFetch ? await this._fetch() : this._fetch();
            if (this.resetOnRefresh == true) {
                this._cache.reset();//reset on each refresh
            }
            if (!(Symbol.iterator in Object(data))) throw new Error("fetch return non iterable data");
            this._cache.prune()// remove expired items before insert new fetch so left only non expired recently use cache items.
            let i = 0;
            for (const [key, value] of data) {
                if ((++i) > this.max) break; // add items do not exceed max
                this._cache.set(key, value);
            }
        }
        this._timeoutLoop(asyncRefresh, this.refreshAge * 1000);
    }


    /**
     * get cache item by key, return undefined if not found.
     * 
     * if fetchMissCache == true , this will fetch the missing cache by the key and cache it. 
     * @param {*} key 
     * @returns 
     */
    get(key) {
        return this._cache.get(key);
    }

    async close() {
        if (this.isClose === true) return;//already close
        const close = true;
        Object.defineProperty(this, "isClose", { get: () => close, configurable: false, enumerable: true });
        this._cache.reset();
    }

}

module.exports = DataCache;