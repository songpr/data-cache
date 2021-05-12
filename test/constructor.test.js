const { expect } = require("@jest/globals");

test("fetch only", () => {
    expect(() => {
        new (require("../index"))();
    }).toThrow("fetch must be function/async function");
    const fn = () => { };
    const dataCache = new (require("../index"))(fn);
    expect(dataCache._fetch).toBe(fn);
})
/**
    maxAge - seconds before cache are expired and return undefined, default = 600s,
    refreshAge - seconds before fetch new values, default = maxAge,
    resetOnRefresh - true reset all cached data and replace with the new fetched data, false replace values with same keys from the new fetched data, default = true,
    fetchMissCache - true fecth miss cache with fetch(key) - fetch function must support get individual data by key, where key is the key that no cache data, false do not fetch miss cache. default = false.
    max - max of cache items, default = 10000.
*/
test("maxAge,refreshAge,resetOnRefresh,fetchMissCache,max initiate", () => {
    const fn = () => { };
    const dataCache = new (require("../index"))(fn);
    expect(dataCache.maxAge).toBe(600);
    expect(dataCache.refreshAge).toBe(600);
    expect(dataCache.resetOnRefresh).toBe(true);
    expect(dataCache.fetchMissCache).toBe(false);
    expect(dataCache.max).toBe(10000);
    dataCache.maxAge = 10000;
    dataCache.refreshAge = 10000;
    dataCache.resetOnRefresh = false;
    dataCache.fetchMissCache = true;
    dataCache.max = 20000;
    //options can not change after instantiated
    expect(dataCache.maxAge).toBe(600);
    expect(dataCache.refreshAge).toBe(600);
    expect(dataCache.resetOnRefresh).toBe(true);
    expect(dataCache.fetchMissCache).toBe(false);
    expect(dataCache.max).toBe(10000);
})

test("check maxAge,refreshAge,resetOnRefresh,fetchMissCache,max initiate", () => {
    const fn = () => { };
    expect(() => {
        new (require("../index"))(fn, { maxAge: "100" });
    }).toThrow("Invalid maxAge");
    expect(() => {
        new (require("../index"))(fn, { refreshAge: {} });
    }).toThrow("Invalid refreshAge");
    expect(() => {
        new (require("../index"))(fn, { resetOnRefresh: 500 });
    }).toThrow("Invalid resetOnRefresh");
    expect(() => {
        new (require("../index"))(fn, { fetchMissCache: [] });
    }).toThrow("Invalid fetchMissCache");
    expect(() => {
        new (require("../index"))(fn, { max: (new Date()) });
    }).toThrow("Invalid max");
})
