const util = require('util');
const timeAtRegex = /^(2[0-3]|1[0-9]|0?[0-9]):([1-5][0-9]|0?[0-9]):([1-5][0-9]|0?[0-9])$/
const aDayInMS = 24 * 60 * 60 * 1000;
function nowMsFrom00_00() {
    const now = new Date();
    return now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000 + now.getMilliseconds();
}

/**
 * Data cache that do not have set method, fetch cached via fetch function 
 */
class DataCache {
    /**
     * 
     * @param {Function} fetch - function/async function to fetch all data and return as array of [key,value]/ a Iterator object that contains the [key, value] pairs 
     * @param {Object} options - options(maxAge, refreshAge ,resetOnRefresh = true,fetchMissCache,max)
     *                              max - The maximum size of the cache. Setting it to 0 then no data will be cached; default is 10000,
     *                              maxAge - Maximum age in second. Expired items will be removed every refreshAge; default is 600 seconds
     *                              refreshAge - refresh time in second. New data will be fetch on each refresh and expired items will be removed every refreshAge; default is maxAge,
     *                                          note if refreshAt is specified too, then to refreshAt will be use, and ignore refreshAge.                                        
     *                              refreshAt = refresh time is object in format {days,at} e.g. {days:2,at: "10:00:00"}, time of the day to refresh the data
     *                                           days:xx -- refresh every xx days 
     *                                           at:"HH:mm:ss" -- refresh at 
     *                                          
     *                              resetOnRefresh - true then reset cache on every refresh, so only the new fetch data is cached; default = true,
     *                              fetchMissCache - true fecth miss cache with fetch(key) - fetch function must support get individual data by key, where key is the key that no cache data, false do not fetch miss cache. always = false - Not implemented yet.
     */
    constructor(fetch, options = { maxAge: 600, resetOnRefresh: true, fetchMissCache: false, max: 10000 }) {
        if (typeof (fetch) !== "function") throw new Error("fetch must be function/async function");
        Object.defineProperty(this, "_fetch", { value: fetch, configurable: false, enumerable: false, writable: false });
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
        if (options.refreshAt != null) {
            const { days, at } = options.refreshAt;
            if (!Number.isInteger(days) || days < 0 || days > 14) throw new Error("Invalid refreshAt.days, support 1-14");
            const matchs = (typeof at === 'string') ? at.match(timeAtRegex) : null;
            if (matchs === null) throw new Error("Invalid refreshAt.at, must be string in format 'HH:mm:ss', in 24 hours format");
            const _refreshAt = { daysMs: days * 24 * 60 * 60 * 1000, msFrom00_00: (parseInt(matchs[1]) * 60 * 60 * 1000 + parseInt(matchs[2]) * 60 * 1000 + parseInt(matchs[3]) * 1000) }
            Object.freeze(_refreshAt);
            Object.defineProperty(this, "refreshAt", { get: () => _refreshAt, configurable: false, enumerable: true });
            //property to track next run at specific time if it have refreshAt only, just for debug only do not use to run
            Object.defineProperty(this, "_runAt", { value: undefined, configurable: false, enumerable: false, writable: true });
        }
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

        //property to track next run in ms, just for debug only do not use to run
        Object.defineProperty(this, "_runInMs", { value: undefined, configurable: false, enumerable: false, writable: true });

        const dataCache = this;
        Object.defineProperty(this, "_timeoutLoop", {
            value: (asyncRefresh, time) => {
                dataCache._runInMs = time;
                setTimeout(function () {
                    asyncRefresh().then(() => {
                        //if pass then timeoutLoop for the next refresh
                        if (dataCache.isClose === true) {
                            return;
                        }
                        //cache is not close then set timeout loop again
                        dataCache._timeoutLoop(asyncRefresh, time);
                    }).catch(err => {
                        try {
                            console.error("error when refrech cache")
                            console.error(err.stack)
                            if (dataCache.isClose === true) {
                                return;
                            }
                            //cache is not close then set timeout loop again
                            dataCache._timeoutLoop(asyncRefresh, time);
                        } catch (unexpectedError) {
                            //do nothing
                            console.error("unexpected error in set refresh time after error")
                        }
                    });
                }, time)
            }
            , configurable: false, enumerable: false, writable: false
        });

        /**
         * refreshDaysInMs = days to refresh, 0 mean run at refreshAt.msFrom00_00 today, or next day if time is pass  refreshAt.msFrom00_00.
         */
        Object.defineProperty(this, "_refreshAtLoop", {
            value: (asyncRefresh, refreshAt, refreshDaysInMs = 0) => {
                const now = Date.now();
                const nowMs = nowMsFrom00_00();
                const diffTime = refreshAt.msFrom00_00 - nowMs;
                //refreshDaysInMs == 0 then run today or tomorrow
                const daysInMsToRun = (refreshDaysInMs == 0) ? (diffTime > 0 ? 0 : aDayInMS) : refreshDaysInMs;
                const runInMS = daysInMsToRun + diffTime;
                dataCache._runInMs = runInMS;
                setTimeout(function () {
                    asyncRefresh().then(() => {
                        //if pass then timeoutLoop for the next refresh
                        if (dataCache.isClose === true) {
                            return;
                        }
                        //cache is not close then set timeout loop again
                        dataCache._refreshAtLoop(asyncRefresh, refreshAt, refreshAt.daysMs);
                    }).catch(err => {
                        try {
                            console.error("error when refrech cache")
                            console.error(err.stack)
                            if (dataCache.isClose === true) {
                                return;
                            }
                            //cache is not close then set timeout loop again
                            dataCache._refreshAtLoop(asyncRefresh, refreshAt, refreshAt.daysMs);
                        } catch (unexpectedError) {
                            //do nothing
                            console.error("unexpected error in set refresh time after error")
                        }
                    });
                }, runInMS);
                dataCache._runAt = new Date(now + runInMS);
            }
            , configurable: false, enumerable: false, writable: false
        });
    }

    async init() {
        const data = this._isAsyncFetch ? await this._fetch() : this._fetch();

        if (!(Symbol.iterator in Object(data)) && !(Symbol.asyncIterator in Object(data))) throw new Error("fetch return non iterable data");
        for await (const [key, value] of data) {
            if (this.size >= this.max) break;
            this._cache.set(key, value);
        }
        const asyncRefresh = async () => {
            if (this.max <= 0) return;// max <=0 then do not refresh since it cannot cache
            const dataIterator = this._isAsyncFetch ? await this._fetch() : this._fetch();
            const isIterator = Symbol.iterator in Object(dataIterator);
            const isAsyncIterator = Symbol.asyncIterator in Object(dataIterator)
            if (!isIterator && !isAsyncIterator) throw new Error("fetch return non iterable data");
            const nextIterator = isAsyncIterator ? dataIterator[Symbol.asyncIterator]() : dataIterator[Symbol.iterator]();
            const firstItdata = isAsyncIterator ? await nextIterator.next() : nextIterator.next();
            const firstItem = { key: firstItdata.value[0], value: firstItdata.value[1] };
            //reset after check data is valid, and can get first key,value
            if (this.resetOnRefresh == true) {
                //no need to prune since it all
                this._cache.reset();//reset on each refresh
            } else {
                this._cache.prune()// remove expired items before insert new fetch so left only non expired recently use cache items.
            }
            this._cache.set(firstItem.key, firstItem.value);
            if (firstItdata.done == true) return; //no more data
            let i = 1; //start from 1 since we already read 1
            //async iterator
            for await (const [key, value] of nextIterator) {
                if ((++i) > this.max) break; // add items do not exceed max
                this._cache.set(key, value);
            }
        }
        if (this.refreshAt) {
            //not init data because it will run at the specific time
            await this._refreshAtLoop(asyncRefresh, this.refreshAt, this.refreshAt.daysMs);
        } else {
            await this._timeoutLoop(asyncRefresh, this.refreshAge * 1000);
        }
    }


    /**
     * get cache item by key, return undefined if not found.
     * 
     * This method will update recently used.
     * 
     * if fetchMissCache == true , this will fetch the missing cache by the key and cache it. 
     * @param {*} key 
     * @returns 
     */
    get(key) {
        return this._cache.get(key);
    }

    /**
     * check key is cached, without update recently used
     * @param {*} key 
     * @returns 
     */
    has(key) {
        return this._cache.has(key);
    }
    async close() {
        if (this.isClose === true) return;//already close
        const close = true;
        Object.defineProperty(this, "isClose", { get: () => close, configurable: false, enumerable: true });
        this._cache.reset();
    }

}

module.exports = DataCache;