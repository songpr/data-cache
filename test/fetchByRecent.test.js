const { expect } = require("@jest/globals");
const delay = require("delay");

test("refreshed only by fetched key.", async (done) => {
    const data = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 };
    const fn = (cache) => {
        if (cache.length > 0) {
            const recentKeys = [];
            //get recent keys to referesh thier value
            cache.forEach((value, key, cache) => {
                recentKeys.push(key);
            });
            return recentKeys.map((key) => [key, data[key]])
        }
        return Object.entries({}) //empty data
    };
    const cache = new (require("../index"))(fn, { max: 10, maxAge: 2, refreshAge: 1, fetchByKey: (key) => data[key] });
    await cache.init();
    expect(cache.get("d")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    expect(await cache.getOrFetch("d")).toBe(4);
    expect(await cache.getOrFetch("e")).toBe(5);
    expect(cache.size).toEqual(2);
    await delay(1100);//refreshed only by fetched key.
    expect(await cache.get("d")).toBe(4);
    expect(await cache.get("e")).toBe(5);
    expect(await cache.get("a")).toBe(undefined);
    expect(cache.size).toEqual(2);
    await cache.close();
    done();
})


test("refreshed only by fetched key, only non expired cached are in next fetch", async (done) => {
    const data = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 };
    const fn = (cache) => {
        if (cache.length > 0) {
            const recentKeys = [];
            //get recent keys to referesh thier value
            cache.forEach((value, key, cache) => {
                console.log(key);
                recentKeys.push(key);
            });
            return recentKeys.map((key) => [key, data[key]])
        }
        return Object.entries({}) //empty data
    };
    const cache = new (require("../index"))(fn, { max: 10, maxAge: 1, refreshAge: 2, fetchByKey: (key) => data[key] });
    await cache.init();
    expect(cache.get("d")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    expect(await cache.getOrFetch("d")).toBe(4);
    expect(await cache.getOrFetch("e")).toBe(5);
    await delay(1100);//d,e expired by now
    expect(cache.size).toEqual(2);
    expect(await cache.getOrFetch("a")).toBe(1);
    expect(cache.size).toEqual(3);
    await delay(1000);//refreshed only by non expired fetched key.
    expect(await cache.get("d")).toBe(undefined);
    expect(await cache.get("e")).toBe(undefined);
    expect(await cache.get("a")).toBe(1);
    expect(cache.size).toEqual(1);
    await cache.close();
    done();
})