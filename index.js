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
     *                              fetchMissCache - true fecth miss cache with fetch(key) - fetch function must support get individual data by key, where key is the key that no cache data, false do not fetch miss cache. default = false.
     *                              max - max of cache items, default = 10000.
     */
    constructor(fetch, options = { maxAge: 600, resetOnRefresh: true, fetchMissCache: false, max: 10000 }) {
        if (typeof (fetch) !== "function") throw new Error("fetch must be function/async function");
        Object.defineProperty(this, "_fetch", { value: fetch, configurable: false, enumerable: false });
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
        Object.defineProperty(this, "fetchMissCache", { get: () => fetchMissCache, configurable: false, enumerable: true });
        Object.defineProperty(this, "max", { get: () => max, configurable: false, enumerable: true });
        const _map = new Map();
        Object.defineProperty(this, "_map", { get: () => _map, configurable: false, enumerable: false });
    }

    async init() {

    }
    /**
     * get cache item by key, return undefined if not found.
     * 
     * if fetchMissCache == true , this will fetch the missing cache by the key and cache it. 
     * @param {*} key 
     * @returns 
     */
    get(key) {
        return undefined;
    }

    /**
     * get cache item by key, or fetch the data using fetch(key), return undefined if not found.
     * @param {get} key 
     */
    async getOrFetch(key) {
        return undefined;
    }
}

module.exports = DataCache;