const { expect } = require("@jest/globals");

test("fetch empty", async (done) => {
    const fn = () => Object.entries({});
    const cache = new (require("../index"))(fn);
    await cache.init();
    expect(cache.get("d")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    expect(cache.size).toEqual(0);
    for (const entry of cache.entries()) {
        fail('it should not have any cache entry');
    }
    const findResult = cache.find((value) => value != null)
    expect(findResult).toBeFalsy();
    await cache.close();
    done();
})
test("fetch only", async (done) => {
    const fn = () => Object.entries({ a: 1, b: 2, c: 3 });
    const cache = new (require("../index"))(fn);
    await cache.init();
    expect(cache.get("a")).toEqual(1);
    expect(cache.get("b")).toEqual(2);
    expect(cache.get("c")).toEqual(3);
    expect(cache.get("d")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    const items = {}
    for (const entry of cache.entries()) {
        items[entry[0]] = entry[1]
    }
    expect(items).toEqual({ a: 1, b: 2, c: 3 });
    expect(cache.size).toEqual(3);

    expect(cache.find((value) => value > 2)).toBe(3);
    expect(cache.find((value) => value == 1)).toBe(1);
    expect(cache.find((value) => value > 3)).toBeFalsy();
    await cache.close();
    done();
})

test("test find base on recency of insert", async (done) => {
    const fn = () => Object.entries({ a: 1, b: 2, c: 3 });
    const cache = new (require("../index"))(fn);
    await cache.init();
    cache.set("a", 1);
    expect(cache.find((value) => value > 0)).toBe(1);
    cache.set("b", 2);
    expect(cache.find((value) => value > 0)).toBe(2);
    cache.set("c", 3);
    expect(cache.find((value) => value > 0)).toBe(3);
    cache.set("d", 10);
    expect(cache.find((value) => value > 3)).toBe(10);
    cache.set("e", 5);
    expect(cache.find((value) => value > 3)).toBe(5);
    cache.set("f", 11);
    expect(cache.find((value) => value > 3)).toBe(11);
    expect(cache.find((value) => value < 5)).toBe(3);
    await cache.close();
    done();
})